import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import Invoice from '../../../database/models/invoice';
import sequelize from '../../../database/database';
import { createInvoice } from '../../../services/invoiceService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        await sequelize.sync();
        const verifyResult = verifyUser(req, res);
        if (!verifyResult.authorized || !verifyResult.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const admin: any = await User.findByPk(verifyResult.userId);
        if (!admin?.is_super_admin) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (req.method === 'GET') {
            const invoices = await Invoice.findAll({
                order: [['invoice_date', 'DESC']],
                limit: 100,
                include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            });

            return res.status(200).json({
                invoices: invoices.map(inv => ({
                    id: inv.id,
                    invoice_number: inv.invoice_number,
                    date: inv.invoice_date,
                    amount_net: Number(inv.amount_net),
                    tax_rate: Number(inv.tax_rate),
                    tax_amount: Number(inv.tax_amount),
                    amount_gross: Number(inv.amount_gross),
                    currency: inv.currency,
                    plan_name: inv.plan_name,
                    customer_name: inv.customer_name,
                    customer_email: inv.customer_email,
                    status: inv.status,
                    pdf_url: inv.pdf_path,
                    user: inv.user ? { id: inv.user.id, name: inv.user.name, email: inv.user.email } : null,
                })),
            });
        }

        if (req.method === 'POST') {
            const { userId, amountNet, planId, currency } = req.body;
            if (!userId || !amountNet || !planId) {
                return res.status(422).json({ error: 'userId, amountNet, planId required' });
            }

            const invoice = await createInvoice({
                userId,
                amountNet: parseFloat(amountNet),
                planId,
                currency: currency || 'EUR',
            });

            return res.status(201).json({ invoice });
        }

        res.setHeader('Allow', 'GET, POST');
        return res.status(405).end('Method Not Allowed');
    } catch (error: any) {
        console.error('Admin Invoices Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
