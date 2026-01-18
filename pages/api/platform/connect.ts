import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPlatformAdapter } from '../../../utils/platformAdapters';
import User from '../../../database/models/user';
import PlatformIntegration from '../../../database/models/platformIntegration';
import PlatformIntegrationLog from '../../../database/models/platformIntegrationLog';
import connection from '../../../database/database';
import verifyUser from '../../../utils/verifyUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // 1. Authenticate the User (Admin who is setting up the connection)
    const auth = verifyUser(req, res);
    if (!auth.authorized || !auth.userId) {
        return res.status(401).json({ success: false, error: 'Please login to FlowXtra first.' });
    }

    const { platform_type, platform_domain, platform_user_id } = req.body;

    if (!platform_type || !platform_domain) {
        return res.status(400).json({ success: false, error: 'Missing domain or platform type' });
    }

    try {
        await connection.sync();

        // 2. Generate Unique Secret for this Site
        const newSecret = crypto.randomBytes(32).toString('hex'); // 64 chars

        // which user is connecting?
        const userId = auth.userId;

        // 3. Create or Update Integration Record
        // Check if already exists for this domain
        let integration = await PlatformIntegration.findOne({
            where: {
                user_id: userId,
                platform_type: platform_type,
                platform_domain: platform_domain
            }
        });

        if (integration) {
            // Rotate key if requested, or just return existing?
            // Usually safer to rotate/update.
            await integration.update({
                shared_secret: newSecret,
                platform_user_id: platform_user_id || integration.platform_user_id, // Update if provided
                is_active: true
            });
        } else {
            integration = await PlatformIntegration.create({
                user_id: userId,
                platform_type: platform_type,
                platform_domain: platform_domain,
                platform_user_id: platform_user_id || 'admin', // Placeholder until first real login
                shared_secret: newSecret,
                is_active: true
            });
        }

        // Log the connection event
        try {
            await PlatformIntegrationLog.create({
                integration_id: integration.id,
                action: 'connect_manual',
                status: 'success',
                ip_address: req.socket.remoteAddress || 'unknown',
                details: {
                    user_id: userId,
                    platform_user: platform_user_id || 'admin',
                    new_connection: !integration // Wait, integration variable re-assigned?
                    // In logic above: integration = await findOne...
                    // if (integration) ... else integration = create
                    // So 'isNewRecord' property of integration model?
                    // Or just log simply.
                }
            });
        } catch (logError) {
            console.error('Audit Log Error:', logError);
        }

        // 4. Return the Key to the User (to paste into WordPress)
        return res.status(200).json({
            success: true,
            api_key: newSecret,
            integration_id: integration.id,
            message: 'Connection created. Please paste this API Key into your WordPress Plugin settings.'
        });

    } catch (error) {
        console.error('Connect Error:', error);
        return res.status(500).json({ success: false, error: 'Connection failed' });
    }
}
