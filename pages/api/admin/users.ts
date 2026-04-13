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

    if (req.method === 'GET') {
        const search = req.query.search ? `%${req.query.search}%` : '%';
        const [rows]: any = await db.query(
            `SELECT u.id, u.email, u.name, u.picture, u.subscription_plan, u.is_active, u.is_super_admin,
                    u.last_login, u.createdAt,
                    (SELECT COUNT(*) FROM domain WHERE user_id=u.id) as domain_count,
                    (SELECT COUNT(*) FROM keyword WHERE user_id=u.id) as keyword_count
             FROM users u WHERE u.email LIKE ? OR u.name LIKE ? ORDER BY u.id DESC LIMIT 100`,
            { replacements: [search, search] }
        );
        return res.status(200).json({ users: rows });
    }

    if (req.method === 'PATCH') {
        const { id, subscription_plan, is_active } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const updates: any = {};
        if (subscription_plan !== undefined) updates.subscription_plan = subscription_plan;
        if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
        await User.update(updates, { where: { id } });
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
