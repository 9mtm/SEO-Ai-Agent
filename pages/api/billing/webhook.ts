import { NextApiRequest, NextApiResponse } from 'next';
import stripe from '../../../utils/stripe';
import User from '../../../database/models/user';
import InvoiceDetail from '../../../database/models/invoiceDetail';
import sequelize from '../../../database/database';
import { createInvoice } from '../../../services/invoiceService';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper to read buffer
const getRawBody = async (req: NextApiRequest): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
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
        const buf = await getRawBody(req);
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
                        const workspaceIdRaw = session.metadata?.workspaceId;
                        if (planId) {
                            user.subscription_plan = planId;
                            // Apply the plan to the specific workspace if we captured it at checkout.
                            // This lets each workspace carry its own plan instead of inheriting from the owner.
                            if (workspaceIdRaw) {
                                try {
                                    const Workspace = (await import('../../../database/models/workspace')).default;
                                    const ws: any = await Workspace.findByPk(parseInt(workspaceIdRaw));
                                    if (ws) { await ws.update({ plan: planId }); }
                                } catch (e) { console.error('Failed to update workspace plan', e); }
                            }
                        }

                        await invoiceDetail.save();
                        await user.save();
                        console.log(`User ${userId} subscription updated to ${subscriptionId} (workspace=${workspaceIdRaw || 'n/a'})`);

                        // --- Generate invoice PDF ---
                        try {
                            const price = subscription.items.data[0]?.price;
                            const amountNet = price ? (price.unit_amount / 100) : 0;
                            const billingInterval = price?.recurring?.interval || 'year';

                            await createInvoice({
                                userId: user.id,
                                workspaceId: workspaceIdRaw ? parseInt(workspaceIdRaw) : null,
                                amountNet,
                                currency: (price?.currency || 'eur').toUpperCase(),
                                planId: planId || 'subscription',
                                billingInterval,
                                stripeInvoiceId: session.invoice || null,
                                stripePaymentIntentId: session.payment_intent || null,
                                stripeSubscriptionId: subscriptionId,
                            });
                            console.log(`Invoice generated for user ${userId}`);
                        } catch (invoiceErr) {
                            console.error('Failed to generate invoice:', invoiceErr);
                        }

                        // Activate referral commission
                        try {
                            if (planId && planId !== 'free') {
                                const { activateCommission } = await import('../../../services/referralService');
                                await activateCommission(user.id, planId);
                                console.log(`Referral commission checked for user ${userId} (plan: ${planId})`);
                            }
                        } catch (refErr) {
                            console.error('Failed to process referral commission:', refErr);
                        }
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
                        const user = await User.findByPk(invoiceDetail.user_id);
                        if (user) {
                            // Cancel referral commission
                            try {
                                const { cancelCommission } = await import('../../../services/referralService');
                                await cancelCommission(user.id);
                            } catch (refErr) {
                                console.error('Failed to cancel referral commission:', refErr);
                            }
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
