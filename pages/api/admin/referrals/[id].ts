import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../../utils/verifyUser';
import sequelize from '../../../../database/database';
import User from '../../../../database/models/user';
import { adminUpdatePayoutStatus } from '../../../../services/referralService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        res.setHeader('Allow', 'PUT');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findByPk(auth.userId);
        if (!user?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

        const payoutId = parseInt(req.query.id as string);
        if (!payoutId) return res.status(400).json({ error: 'Invalid payout ID' });

        const { status, admin_note } = req.body;
        if (!status || !['approved', 'rejected', 'paid'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, or paid' });
        }

        const payout = await adminUpdatePayoutStatus(payoutId, status, admin_note);
        return res.status(200).json({ payout });
    } catch (error: any) {
        console.error('[Admin Payout Update] Error:', error);
        return res.status(400).json({ error: error.message || 'Failed' });
    }
}
