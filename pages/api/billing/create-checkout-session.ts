import type { NextApiRequest, NextApiResponse } from 'next';
import stripe from '../../../utils/stripe';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
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

        const { priceId, planId, successUrl, cancelUrl } = req.body;

        const user = await User.findByPk(verifyResult.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 1. Get or create Stripe Customer
        let customerId = user.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: user.id.toString(),
                },
            });
            customerId = customer.id;

            // Save customer ID to user
            user.stripe_customer_id = customerId;
            await user.save();
        }

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl || `${req.headers.origin}/profile/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin}/profile/billing?canceled=true`,
            metadata: {
                userId: user.id.toString(),
                planId: planId,
            },
            subscription_data: {
                metadata: {
                    userId: user.id.toString(),
                    planId: planId,
                }
            },
            allow_promotion_codes: true,
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
