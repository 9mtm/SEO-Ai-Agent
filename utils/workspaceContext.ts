/**
 * Workspace Context Helper
 * =========================
 * Resolves the *active workspace* for any incoming request.
 *
 * Resolution order:
 *   1. Explicit `?workspace_id=` query string or `x-workspace-id` header
 *   2. The user's `current_workspace_id` column
 *   3. The user's first workspace membership (fallback)
 *
 * Always verifies the requesting user is an active member of that workspace
 * before returning. Returns `null` if no valid workspace can be resolved.
 *
 * Usage in API handlers:
 *
 *   const ctx = await getWorkspaceContext(req, res);
 *   if (!ctx) return res.status(403).json({ error: 'No workspace access' });
 *   const domains = await Domain.findAll({ where: { workspace_id: ctx.workspaceId } });
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import verifyUser from './verifyUser';
import WorkspaceMember, { WorkspaceRole } from '../database/models/workspace_member';
import User from '../database/models/user';

export interface WorkspaceContext {
    userId: number;
    workspaceId: number;
    role: WorkspaceRole;
    /** Capabilities derived from role */
    can: {
        manageMembers: boolean;
        manageBilling: boolean;
        write: boolean;
        read: boolean;
    };
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1
};

export const hasMinRole = (role: WorkspaceRole, min: WorkspaceRole) =>
    ROLE_RANK[role] >= ROLE_RANK[min];

export async function getWorkspaceContext(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<WorkspaceContext | null> {
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) return null;

    // 1. Explicit override
    let requestedWsId: number | null = null;
    const headerWs = req.headers['x-workspace-id'];
    if (headerWs && typeof headerWs === 'string') requestedWsId = parseInt(headerWs);
    if (req.query.workspace_id) requestedWsId = parseInt(String(req.query.workspace_id));

    // 2. Fallback to user's current_workspace_id
    if (!requestedWsId) {
        const u: any = await User.findByPk(auth.userId);
        if (u?.current_workspace_id) requestedWsId = u.current_workspace_id;
    }

    // 3. Fallback to first membership
    if (!requestedWsId) {
        const first = await WorkspaceMember.findOne({
            where: { user_id: auth.userId, status: 'active' }
        });
        if (first) requestedWsId = first.workspace_id;
    }

    if (!requestedWsId) return null;

    // Verify membership
    const member = await WorkspaceMember.findOne({
        where: { user_id: auth.userId, workspace_id: requestedWsId, status: 'active' }
    });
    if (!member) return null;

    return {
        userId: auth.userId,
        workspaceId: requestedWsId,
        role: member.role,
        can: {
            manageMembers: hasMinRole(member.role, 'admin'),
            manageBilling: member.role === 'owner',
            write: hasMinRole(member.role, 'editor'),
            read: hasMinRole(member.role, 'viewer')
        }
    };
}

/**
 * Convenience guard: returns the context or sends a 403 and returns null.
 */
export async function requireWorkspace(
    req: NextApiRequest,
    res: NextApiResponse,
    minRole: WorkspaceRole = 'viewer'
): Promise<WorkspaceContext | null> {
    const ctx = await getWorkspaceContext(req, res);
    if (!ctx) {
        res.status(403).json({ error: 'No workspace access' });
        return null;
    }
    if (!hasMinRole(ctx.role, minRole)) {
        res.status(403).json({ error: `Requires ${minRole} role or higher` });
        return null;
    }
    return ctx;
}
