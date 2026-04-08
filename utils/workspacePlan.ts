/**
 * Resolve the effective subscription plan for a workspace.
 *
 * Resolution order (first match wins):
 *   1. workspaces.plan       — set by Stripe webhook when subscription is bound to workspace
 *   2. owner user.subscription_plan — fallback for legacy accounts & personal workspaces
 *   3. 'free'                — ultimate fallback
 *
 * This is the single source of truth for plan checks across the codebase.
 * Always use this instead of reading `user.subscription_plan` directly when
 * enforcing limits on workspace-scoped resources.
 */
import Workspace from '../database/models/workspace';
import User from '../database/models/user';
import { getPlanLimits } from './planLimits';

export async function getWorkspacePlan(workspaceId: number): Promise<string> {
    const ws: any = await Workspace.findByPk(workspaceId);
    if (!ws) return 'free';
    if (ws.plan && ws.plan !== 'free') return ws.plan;
    const owner: any = await User.findByPk(ws.owner_user_id);
    return owner?.subscription_plan || ws.plan || 'free';
}

export async function getWorkspaceLimits(workspaceId: number) {
    const plan = await getWorkspacePlan(workspaceId);
    return { plan, ...getPlanLimits(plan) };
}
