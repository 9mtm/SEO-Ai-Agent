import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'stream/consumers';
import stripe from '../../../utils/stripe';
import User from '../../../database/models/user';
import sequelize from '../../../database/database';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (!sig || !webhookSecret) {
            throw new Error('Missing Stripe signature or webhook secret');
        }

        // Read the raw body
        const buf = await buffer(req);
        const rawBody = buf.toString('utf8'); // or simply use buf directly for verify

        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        await sequelize.sync();

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription;

                console.log(`Processing checkout.session.completed for user ${userId}`);

                if (userId && subscriptionId) {
                    const user = await User.findByPk(userId);
                    if (user) {
                        user.stripe_customer_id = session.customer;
                        user.stripe_subscription_id = subscriptionId;

                        // Retrieve subscription to get status and end date
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
                        user.stripe_current_period_end = new Date(subscription.current_period_end * 1000);

                        // Update plan based on price ID or product
                        // This logic maps the Price ID back to our internal plan name
                        // Ideally we store the Plan ID in metadata during checkout

                        // For simplicity, we can just mark them as 'pro' or check metadata from subscription
                        // We rely on the fact that we sent metadata in checkout session creation?
                        // Actually in step 3534 we did send metadata: { userId }

                        // We can deduce the plan from the price associated with the line item or subscription
                        // But for now, let's just save the technical details. 
                        // To update 'subscription_plan' (enum), we need to map the price.

                        const planId = session.metadata?.planId;
                        if (planId) {
                            user.subscription_plan = planId;
                        }

                        await user.save();
                        console.log(`User ${userId} subscription updated to ${subscriptionId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                // Find user by stripe_subscription_id or customer
                const user = await User.findOne({ where: { stripe_customer_id: subscription.customer } });

                if (user) {
                    user.stripe_current_period_end = new Date(subscription.current_period_end * 1000);

                    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                        // Downgrade to free?
                        // user.subscription_plan = 'free';
                    }
                    await user.save();
                }
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
