/**
 * GET  /api/workspaces           — list workspaces I belong to
 * POST /api/workspaces           — create a new workspace (becomes owner)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import Workspace from '../../../database/models/workspace';
import WorkspaceMember from '../../../database/models/workspace_member';
import User from '../../../database/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        const memberships = await WorkspaceMember.findAll({
            where: { user_id: auth.userId, status: 'active' },
            include: [{ model: Workspace }]
        });
        const me: any = await User.findByPk(auth.userId);
        return res.status(200).json({
            workspaces: memberships.map((m: any) => ({
                id: m.workspace.id,
                name: m.workspace.name,
                slug: m.workspace.slug,
                plan: m.workspace.plan,
                logo_url: m.workspace.logo_url,
                is_personal: m.workspace.is_personal,
                role: m.role,
                is_current: m.workspace.id === me?.current_workspace_id
            })),
            current_workspace_id: me?.current_workspace_id || null
        });
    }

    if (req.method === 'PATCH') {
        const id = parseInt(String(req.query.id || req.body?.id || ''));
        const { name } = req.body || {};
        if (!id || !name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'id and name are required' });
        }
        // Only owner/admin can rename
        const member = await WorkspaceMember.findOne({
            where: { workspace_id: id, user_id: auth.userId, status: 'active' }
        });
        if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
            return res.status(403).json({ error: 'Only owners or admins can rename the workspace' });
        }
        const ws: any = await Workspace.findByPk(id);
        if (!ws) return res.status(404).json({ error: 'Not found' });
        await ws.update({ name: name.trim() });
        return res.status(200).json({ ok: true, workspace: ws.toJSON() });
    }

    if (req.method === 'POST') {
        const { name } = req.body || {};
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Workspace name is required' });
        }
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)}-${Date.now().toString(36)}`;

        const ws = await Workspace.create({
            name,
            slug,
            owner_user_id: auth.userId,
            is_personal: false
        });

        await WorkspaceMember.create({
            workspace_id: ws.id,
            user_id: auth.userId,
            role: 'owner',
            status: 'active',
            joined_at: new Date()
        });

        return res.status(201).json({ workspace: ws.toJSON() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
