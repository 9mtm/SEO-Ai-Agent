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

    const [rows]: any = await db.query(`
        SELECT w.id, w.name, w.slug, w.is_personal, w.plan, w.createdAt,
               u.email as owner_email, u.name as owner_name,
               (SELECT COUNT(*) FROM workspace_members WHERE workspace_id=w.id) as member_count,
               (SELECT COUNT(*) FROM domain WHERE workspace_id=w.id) as domain_count
        FROM workspaces w
        LEFT JOIN users u ON u.id = w.owner_user_id
        ORDER BY w.id DESC LIMIT 200
    `);

    return res.status(200).json({ workspaces: rows || [] });
}
