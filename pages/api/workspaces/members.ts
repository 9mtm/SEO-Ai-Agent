/**
 * GET  /api/workspaces/members     — list members of current workspace
 * POST /api/workspaces/members     — invite a new member by email
 *   body: { email, role: 'admin' | 'editor' | 'viewer' }
 * DELETE /api/workspaces/members?member_id=  — remove member (admin+ only)
 * PATCH  /api/workspaces/members?member_id=  — change role
 *   body: { role }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import db from '../../../database/database';
import { requireWorkspace } from '../../../utils/workspaceContext';
import WorkspaceMember from '../../../database/models/workspace_member';
import WorkspaceInvitation from '../../../database/models/workspace_invitation';
import Workspace from '../../../database/models/workspace';
import User from '../../../database/models/user';
import { sendMail } from '../../../utils/mailer';
import { buildInvitationEmail } from '../../../utils/emails/invitationEmail';

const ALLOWED_ROLES = ['admin', 'editor', 'viewer'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();

    if (req.method === 'GET') {
        const ctx = await requireWorkspace(req, res, 'viewer');
        if (!ctx) return;
        const members = await WorkspaceMember.findAll({
            where: { workspace_id: ctx.workspaceId },
            include: [{ model: User }]
        });
        // Also return pending invitations so the team page can show them
        const pending: any = await WorkspaceInvitation.findAll({
            where: { workspace_id: ctx.workspaceId, status: 'pending' },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            members: members.map((m: any) => ({
                id: m.id,
                user_id: m.user_id,
                role: m.role,
                status: m.status,
                joined_at: m.joined_at,
                user: m.user ? { id: m.user.id, name: m.user.name, email: m.user.email, picture: m.user.picture } : null
            })),
            pending: pending.map((p: any) => {
                const o = p.get({ plain: true });
                return {
                    id: o.id,
                    email: o.email,
                    role: o.role,
                    expires_at: o.expires_at,
                    created_at: o.createdAt,
                    accept_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/workspace/invitation/${o.token}`
                };
            })
        });
    }

    if (req.method === 'POST') {
        const ctx = await requireWorkspace(req, res, 'admin');
        if (!ctx) return;
        const { email, role } = req.body || {};
        if (!email || !ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ error: 'email and valid role required' });
        }
        // If user already a member, error
        const existingUser: any = await User.findOne({ where: { email } });
        if (existingUser) {
            const dup = await WorkspaceMember.findOne({
                where: { workspace_id: ctx.workspaceId, user_id: existingUser.id }
            });
            if (dup) return res.status(409).json({ error: 'User is already a member' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);

        const invite = await WorkspaceInvitation.create({
            workspace_id: ctx.workspaceId,
            invited_by_user_id: ctx.userId,
            email,
            role,
            token,
            status: 'pending',
            expires_at: expires
        });

        const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/workspace/invitation/${token}`;

        // Fire-and-forget email send (don't block the API response on SMTP)
        let emailSent = false;
        let emailError: string | null = null;
        try {
            const inviter: any = await User.findByPk(ctx.userId);
            const ws: any = await Workspace.findByPk(ctx.workspaceId);
            const { subject, html, text } = await buildInvitationEmail({
                inviteeEmail: email,
                inviterName: inviter?.name || 'A teammate',
                workspaceName: ws?.name || 'SEO AI Agent Workspace',
                role,
                acceptUrl
            });
            await sendMail({ to: email, subject, html, text });
            emailSent = true;
        } catch (err: any) {
            console.error('[Invitation Email] failed:', err?.message || err);
            emailError = err?.message || 'Failed to send email';
        }

        return res.status(201).json({
            invitation: { id: invite.id, email, role, expires_at: expires, token },
            accept_url: acceptUrl,
            email_sent: emailSent,
            email_error: emailError
        });
    }

    if (req.method === 'PATCH') {
        const ctx = await requireWorkspace(req, res, 'admin');
        if (!ctx) return;
        const memberId = parseInt(String(req.query.member_id || ''));
        const { role } = req.body || {};
        if (!memberId || !ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ error: 'member_id and valid role required' });
        }
        const m = await WorkspaceMember.findOne({ where: { id: memberId, workspace_id: ctx.workspaceId } });
        if (!m) return res.status(404).json({ error: 'Member not found' });
        if (m.role === 'owner') return res.status(403).json({ error: 'Cannot change owner role' });
        await m.update({ role });
        return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
        const ctx = await requireWorkspace(req, res, 'admin');
        if (!ctx) return;
        const memberId = parseInt(String(req.query.member_id || ''));
        if (!memberId) return res.status(400).json({ error: 'member_id required' });
        const m = await WorkspaceMember.findOne({ where: { id: memberId, workspace_id: ctx.workspaceId } });
        if (!m) return res.status(404).json({ error: 'Member not found' });
        if (m.role === 'owner') return res.status(403).json({ error: 'Cannot remove owner' });
        await m.destroy();
        return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
