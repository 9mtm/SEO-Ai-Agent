import type { NextApiRequest, NextApiResponse } from 'next';
import stripe from '../../../utils/stripe';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import sequelize from '../../../database/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const verifyResult = verifyUser(req, res);

        if (!verifyResult.authorized || !verifyResult.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findByPk(verifyResult.userId);
        if (!user || !user.stripe_customer_id) {
            return res.status(200).json({ invoices: [] });
        }

        const invoices = await stripe.invoices.list({
            customer: user.stripe_customer_id,
            limit: 10,
        });

        // Format for frontend
        const formattedInvoices = invoices.data.map(inv => ({
            id: inv.id,
            number: inv.number,
            date: new Date(inv.created * 1000).toLocaleDateString(),
            amount: `$${(inv.total / 100).toFixed(2)}`,
            status: inv.status,
            download_url: inv.invoice_pdf,
        }));

        return res.status(200).json({ invoices: formattedInvoices });

    } catch (error: any) {
        console.error('Stripe Invoices Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
