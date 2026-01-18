import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'stream/consumers';
import stripe from '../../../utils/stripe';
import User from '../../../database/models/user';
import InvoiceDetail from '../../../database/models/invoiceDetail';
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
                        const [invoiceDetail] = await InvoiceDetail.findOrCreate({
                            where: { user_id: user.id },
                            defaults: { user_id: user.id }
                        });

                        invoiceDetail.stripe_customer_id = session.customer;
                        invoiceDetail.stripe_subscription_id = subscriptionId;

                        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
                        invoiceDetail.stripe_current_period_end = new Date(subscription.current_period_end * 1000);

                        if (subscription.items.data[0]?.price?.recurring?.interval) {
                            invoiceDetail.stripe_billing_interval = subscription.items.data[0].price.recurring.interval;
                        }

                        const planId = session.metadata?.planId;
                        if (planId) {
                            user.subscription_plan = planId;
                        }

                        await invoiceDetail.save();
                        await user.save();
                        console.log(`User ${userId} subscription updated to ${subscriptionId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                const invoiceDetail = await InvoiceDetail.findOne({
                    where: { stripe_customer_id: subscription.customer }
                });

                if (invoiceDetail) {
                    invoiceDetail.stripe_current_period_end = new Date(subscription.current_period_end * 1000);

                    if (subscription.items.data[0]?.price?.recurring?.interval) {
                        invoiceDetail.stripe_billing_interval = subscription.items.data[0].price.recurring.interval;
                    }

                    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                        // User model might need update too if we want to change plan name
                        const user = await User.findByPk(invoiceDetail.user_id);
                        if (user) {
                            // user.subscription_plan = 'free';
                            // await user.save();
                        }
                    }
                    await invoiceDetail.save();
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
