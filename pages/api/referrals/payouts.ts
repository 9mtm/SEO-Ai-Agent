import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import sequelize from '../../../database/database';
import { getPayoutHistory, requestPayout } from '../../../services/referralService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

        if (req.method === 'GET') {
            const payouts = await getPayoutHistory(auth.userId);
            return res.status(200).json({ payouts });
        }

        if (req.method === 'POST') {
            const payoutId = parseInt(req.body.payoutId);
            if (!payoutId || payoutId <= 0 || !Number.isInteger(payoutId)) return res.status(400).json({ error: 'Valid payoutId required' });
            const payout = await requestPayout(auth.userId, payoutId);
            return res.status(200).json({ payout });
        }
    } catch (error: any) {
        console.error('[API Payouts] Error:', error);
        return res.status(400).json({ error: error.message || 'Failed' });
    }
}
