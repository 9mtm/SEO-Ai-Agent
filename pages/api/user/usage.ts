import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import User from '../../../database/models/user';
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import verifyUser from '../../../utils/verifyUser';
import { getPlanLimits } from '../../../utils/planLimits';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const { authorized, userId } = verifyUser(req, res);

    if (!authorized || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findByPk(userId);
        const plan = user?.subscription_plan || 'free';
        const limits = getPlanLimits(plan);

        const domainCount = await Domain.count({ where: { user_id: userId } });
        const keywordCount = await Keyword.count({ where: { user_id: userId } });

        return res.status(200).json({
            plan,
            limits,
            usage: {
                domains: domainCount,
                keywords: keywordCount
            }
        });
    } catch (error) {
        console.error('Usage API Error:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
}
