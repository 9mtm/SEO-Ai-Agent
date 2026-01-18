import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlatformAdapter } from '../../../utils/platformAdapters';
import User from '../../../database/models/user';
import PlatformIntegration from '../../../database/models/platformIntegration';
import connection from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // 1. Authenticate (Platform Secret or User Token)
    const platformType = req.headers['x-platform-type'] as string;
    const adapter = getPlatformAdapter(platformType);
    const auth = verifyUser(req, res);

    let isAuthenticated = false;

    // Check Platform Secret
    if (adapter) {
        const isValid = await adapter.validateRequest(req);
        if (isValid) isAuthenticated = true;
    }

    // Check User Token
    if (!isAuthenticated && auth.authorized) {
        isAuthenticated = true;
    }

    if (!isAuthenticated) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        await connection.sync();

        // Platform-specific stats
        //  const integrationsCount = await PlatformIntegration.count({
        //     where: { platform_type: platformType }
        //  });

        // You could add logic here to fetch stats specific to this platform instance
        // For now, return a placeholder or global stats if admin

        return res.status(200).json({
            success: true,
            stats: {
                status: 'active',
                version: process.env.npm_package_version,
                platform: platformType
            }
        });

    } catch (error) {
        console.error('Stats Error:', error);
        return res.status(500).json({ success: false, error: 'Stats failed' });
    }
}
