import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import sequelize from '../../../database/database';
import { ensureReferralCode, getReferralStats, getReferredUsers } from '../../../services/referralService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seo-agent.net';
        const referralCode = await ensureReferralCode(auth.userId);
        const stats = await getReferralStats(auth.userId);
        const referrals = await getReferredUsers(auth.userId);

        return res.status(200).json({
            referral_code: referralCode,
            referral_link: `${appUrl}/register?ref=${referralCode}`,
            stats,
            referrals,
        });
    } catch (error: any) {
        console.error('[API Referrals] Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
