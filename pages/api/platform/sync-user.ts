import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlatformAdapter } from '../../../utils/platformAdapters';
import User from '../../../database/models/user';
import PlatformIntegration from '../../../database/models/platformIntegration';
import connection from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // 1. Authenticate Request using VerifyUser (checks for valid Bearer token or Cookie)
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) {
        // Alternatively, check for Platform Secret if this is a server-to-server sync
        const platformType = req.headers['x-platform-type'] as string;
        const adapter = getPlatformAdapter(platformType);
        if (adapter) {
            const isValid = await adapter.validateRequest(req);
            if (!isValid) return res.status(401).json({ success: false, error: 'Unauthorized' });
        } else {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
    }

    const platformType = req.headers['x-platform-type'] as string;
    const adapter = getPlatformAdapter(platformType);

    if (!adapter) {
        return res.status(400).json({ success: false, error: 'Invalid platform type' });
    }

    try {
        const userData = adapter.normalizeUser(req.body);

        await connection.sync();

        // Find integration
        const integration = await PlatformIntegration.findOne({
            where: {
                platform_type: platformType,
                platform_user_id: userData.platform_user_id,
                platform_domain: req.headers['x-platform-domain'] || req.headers['origin'] || null
            },
            include: [User]
        });

        if (!integration || !integration.user) {
            return res.status(404).json({ success: false, error: 'Integration not found' });
        }

        const user = integration.user;

        // Update User Data if changed
        if (user.email !== userData.email || user.name !== userData.name) {
            await user.update({
                email: userData.email,
                name: userData.name,
                platform_metadata: {
                    ...user.platform_metadata,
                    ...userData.metadata
                }
            });
        }

        // Update Integration Metadata
        await integration.update({
            platform_metadata: userData.metadata,
            last_login: new Date()
        });

        return res.status(200).json({ success: true, message: 'User synchronized' });

    } catch (error) {
        console.error('Sync Error:', error);
        return res.status(500).json({ success: false, error: 'Sync failed' });
    }
}
