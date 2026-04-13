import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });
    const admin: any = await User.findByPk(auth.userId);
    if (!admin?.is_super_admin) return res.status(403).json({ error: 'Forbidden' });

    const [[users]]: any = await db.query('SELECT COUNT(*) n FROM users');
    const [[domains]]: any = await db.query('SELECT COUNT(*) n FROM domain');
    const [[keywords]]: any = await db.query('SELECT COUNT(*) n FROM keyword');
    const [[workspaces]]: any = await db.query('SELECT COUNT(*) n FROM workspaces');
    const [[posts]]: any = await db.query("SELECT COUNT(*) n FROM blog_posts WHERE status='published'");
    const [[recentUsers]]: any = await db.query('SELECT COUNT(*) n FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)');

    const planCounts: any = {};
    const [plans]: any = await db.query('SELECT subscription_plan, COUNT(*) n FROM users GROUP BY subscription_plan');
    plans.forEach((p: any) => { planCounts[p.subscription_plan] = Number(p.n); });

    return res.status(200).json({
        total_users: Number(users?.n) || 0,
        total_domains: Number(domains?.n) || 0,
        total_keywords: Number(keywords?.n) || 0,
        total_workspaces: Number(workspaces?.n) || 0,
        total_blog_posts: Number(posts?.n) || 0,
        new_users_7d: Number(recentUsers?.n) || 0,
        plan_breakdown: planCounts
    });
}
