/**
 * POST /api/workspaces/switch
 * body: { workspace_id }
 *
 * Sets users.current_workspace_id after verifying membership.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import WorkspaceMember from '../../../database/models/workspace_member';
import User from '../../../database/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { workspace_id } = req.body || {};
    if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

    const member = await WorkspaceMember.findOne({
        where: { user_id: auth.userId, workspace_id, status: 'active' }
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

    await User.update({ current_workspace_id: workspace_id } as any, { where: { id: auth.userId } });

    return res.status(200).json({ ok: true, workspace_id });
}
