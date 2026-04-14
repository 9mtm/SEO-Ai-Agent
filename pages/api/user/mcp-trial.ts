import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from '../../../utils/verifyUser';
import sequelize from '../../../database/database';
import User from '../../../database/models/user';

const MCP_TRIAL_DAYS = 60;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        await sequelize.sync();
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

        const user: any = await User.findByPk(auth.userId, { attributes: ['subscription_plan', 'createdAt'] });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const plan = (user.subscription_plan || 'free').toLowerCase();

        // Paid users → unlimited
        if (plan !== 'free') {
            return res.status(200).json({ plan, trial: false, mcpAllowed: true, daysLeft: -1 });
        }

        // Free users → check trial
        const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, MCP_TRIAL_DAYS - accountAgeDays);

        return res.status(200).json({
            plan,
            trial: true,
            mcpAllowed: daysLeft > 0,
            daysLeft,
            totalTrialDays: MCP_TRIAL_DAYS,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
