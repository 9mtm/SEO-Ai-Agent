import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import User from '../../../database/models/user';
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import Workspace from '../../../database/models/workspace';
import verifyUser from '../../../utils/verifyUser';
import { getWorkspaceContext } from '../../../utils/workspaceContext';
import { getPlanLimits } from '../../../utils/planLimits';

/**
 * GET /api/user/usage
 * --------------------
 * Returns the current plan limits and actual usage for the *active workspace*.
 * Falls back to the raw user_id-scoped counts if no workspace context exists
 * (legacy / API-key callers). Plan is always the workspace owner's plan.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const { authorized, userId } = verifyUser(req, res);

    if (!authorized || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const ctx = await getWorkspaceContext(req, res);

        let planUserId = userId;
        let domainWhere: any = { user_id: userId };
        let keywordWhere: any = { user_id: userId };
        let workspaceId: number | null = null;

        if (ctx) {
            workspaceId = ctx.workspaceId;
            domainWhere = { workspace_id: ctx.workspaceId };
            keywordWhere = { workspace_id: ctx.workspaceId };
            const ws: any = await Workspace.findByPk(ctx.workspaceId);
            if (ws) planUserId = ws.owner_user_id;
        }

        const user = await User.findByPk(planUserId);
        const plan = user?.subscription_plan || 'free';
        const limits = getPlanLimits(plan);

        const domainCount = await Domain.count({ where: domainWhere });
        const keywordCount = await Keyword.count({ where: keywordWhere });

        return res.status(200).json({
            plan,
            limits,
            workspace_id: workspaceId,
            role: ctx?.role || null,
            usage: {
                domains: domainCount,
                keywords: keywordCount
            }
        });
    } catch (error) {
        console.error('Usage API Error:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
}
