
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import Domain from '../../../database/models/domain';
import Workspace from '../../../database/models/workspace';
import WorkspaceMember from '../../../database/models/workspace_member';
import { getWorkspaceContext } from '../../../utils/workspaceContext';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const { authorized, userId } = verifyUser(req, res);

    if (!authorized || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If the user is NOT the owner of their current workspace, they are a
        // team member. Team members inherit an already-configured workspace and
        // don't need to set anything up — report 100% progress so the setup
        // guide UI doesn't nag them.
        const ctx = await getWorkspaceContext(req, res);
        if (ctx && ctx.role !== 'owner') {
            const ws: any = await Workspace.findByPk(ctx.workspaceId);
            const owner: any = ws ? await User.findByPk(ws.owner_user_id) : null;
            const ownerHasGsc = !!(owner?.google_refresh_token || owner?.google_access_token);
            return res.status(200).json({
                percentage: 100,
                is_team_member: true,
                role: ctx.role,
                steps: {
                    gsc_domain: ownerHasGsc,
                    scraper: true,
                    ai_connected: true,
                    details: { has_gsc: ownerHasGsc, domain_count: 0 }
                }
            });
        }

        const domainCount = await Domain.count({ where: { user_id: userId } });

        const hasGsc = !!(user.google_refresh_token || user.google_access_token);
        const hasScraper = user.scraper_type && user.scraper_type !== 'none';
        const hasDomain = domainCount > 0;

        // Detect whether the user has successfully connected an external AI
        // (Claude Desktop / Cursor / ChatGPT) via MCP/OAuth. A successful
        // connection means at least ONE active (non-revoked, non-expired)
        // OAuth access token exists for this user.
        const [[mcpRow]]: any = await db.query(
            `SELECT COUNT(*) n FROM oauth_access_tokens
             WHERE user_id = ? AND revoked = 0 AND expires_at > NOW()`,
            { replacements: [userId] }
        );
        const hasMcpConnected = Number(mcpRow?.n) > 0;

        // 3-step setup: GSC+Domain, Scraper, Connect AI (MCP)
        let completedSteps = 0;
        const totalSteps = 3;
        if (hasGsc && hasDomain) completedSteps++;
        if (hasScraper) completedSteps++;
        if (hasMcpConnected) completedSteps++;

        const percentage = Math.round((completedSteps / totalSteps) * 100);

        return res.status(200).json({
            percentage,
            steps: {
                gsc_domain: hasGsc && hasDomain,
                scraper: hasScraper,
                ai_connected: hasMcpConnected,
                details: {
                    has_gsc: hasGsc,
                    domain_count: domainCount
                }
            }
        });

    } catch (error) {
        console.error('Setup Status Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
