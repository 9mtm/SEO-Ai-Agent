import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import sequelize from '../../../database/database';
import User from '../../../database/models/user';
import { adminGetOverviewStats, adminGetAllReferrals, adminGetPayoutRequests } from '../../../services/referralService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findByPk(auth.userId);
        if (!user?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

        const view = (req.query.view as string) || 'stats';
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

        if (view === 'stats') {
            const stats = await adminGetOverviewStats();
            return res.status(200).json(stats);
        }

        if (view === 'referrals') {
            const search = (req.query.search as string) || '';
            const data = await adminGetAllReferrals(page, limit, search);
            return res.status(200).json(data);
        }

        if (view === 'payouts') {
            const status = (req.query.status as string) || 'all';
            const data = await adminGetPayoutRequests(page, limit, status);
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: 'Invalid view parameter' });
    } catch (error: any) {
        console.error('[Admin Referrals] Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
