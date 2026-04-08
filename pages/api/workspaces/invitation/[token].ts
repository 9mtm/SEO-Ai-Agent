/**
 * GET    /api/workspaces/invitation/[token] — view invitation details (no auth required)
 * POST   /api/workspaces/invitation/[token] — accept invitation (auth required, email must match)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../database/database';
import verifyUser from '../../../../utils/verifyUser';
import WorkspaceInvitation from '../../../../database/models/workspace_invitation';
import WorkspaceMember from '../../../../database/models/workspace_member';
import Workspace from '../../../../database/models/workspace';
import User from '../../../../database/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'Token required' });

    const invite = await WorkspaceInvitation.findOne({
        where: { token },
        include: [{ model: Workspace }]
    });
    if (!invite) return res.status(404).json({ error: 'Invitation not found' });

    if (invite.status !== 'pending') {
        return res.status(410).json({ error: `Invitation ${invite.status}` });
    }
    if (new Date(invite.expires_at) < new Date()) {
        await invite.update({ status: 'expired' });
        return res.status(410).json({ error: 'Invitation expired' });
    }

    if (req.method === 'GET') {
        const ws: any = (invite as any).workspace;
        return res.status(200).json({
            invitation: {
                email: invite.email,
                role: invite.role,
                expires_at: invite.expires_at,
                workspace: ws ? { id: ws.id, name: ws.name, slug: ws.slug } : null
            }
        });
    }

    if (req.method === 'POST') {
        const auth = verifyUser(req, res);
        if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Login required' });

        const me: any = await User.findByPk(auth.userId);
        if (!me) return res.status(404).json({ error: 'User not found' });

        if (me.email.toLowerCase() !== invite.email.toLowerCase()) {
            return res.status(403).json({ error: 'Invitation belongs to a different email address' });
        }

        // Already a member?
        const existing = await WorkspaceMember.findOne({
            where: { workspace_id: invite.workspace_id, user_id: auth.userId }
        });
        if (!existing) {
            await WorkspaceMember.create({
                workspace_id: invite.workspace_id,
                user_id: auth.userId,
                role: invite.role,
                status: 'active',
                joined_at: new Date()
            });
        }

        await invite.update({ status: 'accepted', accepted_at: new Date() });
        // Switch user's current workspace to the joined one
        await User.update({ current_workspace_id: invite.workspace_id } as any, { where: { id: auth.userId } });

        return res.status(200).json({ ok: true, workspace_id: invite.workspace_id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
