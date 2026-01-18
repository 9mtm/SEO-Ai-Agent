
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';
import User from '../../../database/models/user';
import Domain from '../../../database/models/domain';
import PlatformIntegration from '../../../database/models/platformIntegration';
import ApiKey from '../../../database/models/apiKey';

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

        const domainCount = await Domain.count({ where: { user_id: userId } });
        const platformCount = await PlatformIntegration.count({ where: { user_id: userId } });
        const apiKeyCount = await ApiKey.count({ where: { user_id: userId, revoked: false } });

        const hasGsc = !!(user.google_refresh_token || user.google_access_token);
        const hasScraper = user.scraper_type && user.scraper_type !== 'none';
        const hasDomain = domainCount > 0;
        const hasPlatform = platformCount > 0;
        const hasMcp = apiKeyCount > 0;

        // Calculate progress
        // Total steps: 4 (GSC+Domain is Step 1, Scraper Step 2, Platform Step 3, MCP Step 4)
        // Step 1: 25% (Requires GSC AND Domain?) Or GSC is one, Domain is part of it.
        // User said: "Step 1: Connect account... Step 2: Connect GSC and Add Site".
        // Let's split into atomic checks.

        let completedSteps = 0;
        const totalSteps = 4;

        if (hasGsc && hasDomain) completedSteps++;
        if (hasScraper) completedSteps++;
        if (hasPlatform) completedSteps++;
        if (hasMcp) completedSteps++;

        const percentage = Math.round((completedSteps / totalSteps) * 100);

        return res.status(200).json({
            percentage,
            steps: {
                gsc_domain: hasGsc && hasDomain,
                scraper: hasScraper,
                platform: hasPlatform,
                mcp: hasMcp,
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
