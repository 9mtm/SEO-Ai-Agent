import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import Invoice from '../../../database/models/invoice';
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

        const invoices = await Invoice.findAll({
            where: { user_id: verifyResult.userId },
            order: [['invoice_date', 'DESC']],
            limit: 50,
        });

        const formatted = invoices.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            date: inv.invoice_date,
            amount_net: Number(inv.amount_net),
            tax_rate: Number(inv.tax_rate),
            tax_amount: Number(inv.tax_amount),
            amount_gross: Number(inv.amount_gross),
            currency: inv.currency,
            plan_name: inv.plan_name,
            status: inv.status,
            pdf_url: inv.pdf_path,
        }));

        return res.status(200).json({ invoices: formatted });
    } catch (error: any) {
        console.error('User Invoices Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
