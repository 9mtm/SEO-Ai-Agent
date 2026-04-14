import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import sequelize from '../../../database/database';
import { getPayoutSettings, updatePayoutSettings } from '../../../services/referralService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'PUT') {
        res.setHeader('Allow', 'GET, PUT');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

        if (req.method === 'GET') {
            const settings = await getPayoutSettings(auth.userId);
            return res.status(200).json({ settings });
        }

        if (req.method === 'PUT') {
            const { paypal_email, name, address, city, zip, country, company_name, vat_id, is_business } = req.body;
            const settings = await updatePayoutSettings(auth.userId, {
                paypal_email, name, address, city, zip, country, company_name, vat_id, is_business: !!is_business,
            });
            return res.status(200).json({ settings });
        }
    } catch (error: any) {
        console.error('[API Payout Settings] Error:', error);
        return res.status(400).json({ error: error.message || 'Failed to update settings' });
    }
}
