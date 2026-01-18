import type { NextApiRequest, NextApiResponse } from 'next';
import stripe from '../../../utils/stripe';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import InvoiceDetail from '../../../database/models/invoiceDetail';
import sequelize from '../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const verifyResult = verifyUser(req, res);

        if (!verifyResult.authorized || !verifyResult.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Missing sessionId' });
        }

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
            return res.status(400).json({ status: session.payment_status, error: 'Session not paid' });
        }

        const user = await User.findByPk(verifyResult.userId, {
            include: [InvoiceDetail]
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subscriptionId = session.subscription as string;
        const planId = session.metadata?.planId;

        if (subscriptionId) {
            const [invoiceDetail] = await InvoiceDetail.findOrCreate({
                where: { user_id: user.id },
                defaults: { user_id: user.id }
            });

            invoiceDetail.stripe_customer_id = session.customer as string;
            invoiceDetail.stripe_subscription_id = subscriptionId;

            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            invoiceDetail.stripe_current_period_end = new Date(subscription.current_period_end * 1000);

            if (planId) {
                user.subscription_plan = planId;
            }

            // Get billing interval from subscription and save to InvoiceDetail
            if (subscription.items.data[0]?.price?.recurring?.interval) {
                invoiceDetail.stripe_billing_interval = subscription.items.data[0].price.recurring.interval;
            }

            await invoiceDetail.save();
            await user.save();
            return res.status(200).json({ success: true, plan: planId });
        }

        return res.status(400).json({ error: 'No subscription found in session' });

    } catch (error: any) {
        console.error('Session Verification Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
