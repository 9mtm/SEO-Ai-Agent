/**
 * createPersonalWorkspace
 * ------------------------
 * Ensures every user has exactly one personal workspace and is its owner.
 * Idempotent — safe to call multiple times.
 *
 * Returns the workspace id (existing or newly created) and also sets
 * `users.current_workspace_id` if it was null.
 *
 * Call this from:
 *   - /api/auth/register (email/password signup)
 *   - /api/auth/google/callback (Google OAuth signup)
 *   - anywhere else a new user can be created
 */
import Workspace from '../database/models/workspace';
import WorkspaceMember from '../database/models/workspace_member';
import User from '../database/models/user';

export async function ensurePersonalWorkspace(userId: number, fallbackName?: string): Promise<number> {
    // Does this user already have a personal workspace they own?
    const existing: any = await Workspace.findOne({
        where: { owner_user_id: userId, is_personal: true }
    });
    if (existing) {
        // Make sure current_workspace_id is set
        const u: any = await User.findByPk(userId);
        if (u && !u.current_workspace_id) {
            await User.update({ current_workspace_id: existing.id } as any, { where: { id: userId } });
        }
        return existing.id;
    }

    const user: any = await User.findByPk(userId);
    const name =
        (fallbackName && `${fallbackName}'s Workspace`) ||
        (user?.name && `${user.name}'s Workspace`) ||
        'My Workspace';

    const baseSlug = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'workspace';
    const slug = `${baseSlug}-${userId}`;

    const ws: any = await Workspace.create({
        name,
        slug,
        owner_user_id: userId,
        is_personal: true,
        plan: user?.subscription_plan || 'free'
    } as any);

    await WorkspaceMember.create({
        workspace_id: ws.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date()
    } as any);

    await User.update({ current_workspace_id: ws.id } as any, { where: { id: userId } });

    return ws.id;
}
