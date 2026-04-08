/**
 * DELETE /api/workspaces/invitations/[id]     — revoke a pending invitation
 * POST   /api/workspaces/invitations/[id]/resend — resend the email for a pending invitation
 *
 * Both require admin+ on the workspace that owns the invitation.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../database/database';
import { requireWorkspace } from '../../../../utils/workspaceContext';
import WorkspaceInvitation from '../../../../database/models/workspace_invitation';
import Workspace from '../../../../database/models/workspace';
import User from '../../../../database/models/user';
import { sendMail } from '../../../../utils/mailer';
import { buildInvitationEmail } from '../../../../utils/emails/invitationEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const id = parseInt(String(req.query.id || ''));
    if (!id) return res.status(400).json({ error: 'id required' });

    const ctx = await requireWorkspace(req, res, 'admin');
    if (!ctx) return;

    const invite: any = await WorkspaceInvitation.findByPk(id);
    if (!invite || invite.workspace_id !== ctx.workspaceId) {
        return res.status(404).json({ error: 'not_found' });
    }

    if (req.method === 'DELETE') {
        await invite.update({ status: 'revoked' });
        return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
        if (invite.status !== 'pending') {
            return res.status(400).json({ error: `Invitation already ${invite.status}` });
        }
        const inviter: any = await User.findByPk(ctx.userId);
        const ws: any = await Workspace.findByPk(ctx.workspaceId);
        const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/workspace/invitation/${invite.token}`;
        try {
            const { subject, html, text } = await buildInvitationEmail({
                inviteeEmail: invite.email,
                inviterName: inviter?.name || 'A teammate',
                workspaceName: ws?.name || 'SEO AI Agent Workspace',
                role: invite.role,
                acceptUrl
            });
            await sendMail({ to: invite.email, subject, html, text });
            return res.status(200).json({ ok: true });
        } catch (err: any) {
            return res.status(500).json({ error: err?.message || 'Failed to send' });
        }
    }

    return res.status(405).json({ error: 'method_not_allowed' });
}
