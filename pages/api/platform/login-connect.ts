import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';
import User from '../../../database/models/user';
import PlatformIntegration from '../../../database/models/platformIntegration';
import PlatformIntegrationLog from '../../../database/models/platformIntegrationLog';
import connection from '../../../database/database';

interface DecodedToken {
    userId?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { platform_type, platform_domain, platform_user_id } = req.body;

    if (!platform_type || !platform_domain) {
        return res.status(400).json({ success: false, error: 'Missing platform details' });
    }

    try {
        await connection.sync();

        // 1. Authenticate using Session Cookie (created by Google Login)
        const cookies = new Cookies(req, res);
        const token = cookies.get('token');

        if (!token || !process.env.SECRET) {
            return res.status(401).json({ success: false, error: 'Unauthorized. Please log in first.' });
        }

        let userId: number;
        try {
            const decoded = jwt.verify(token, process.env.SECRET) as DecodedToken;
            if (!decoded.userId) throw new Error('Invalid Token');
            userId = decoded.userId;
        } catch (e) {
            return res.status(401).json({ success: false, error: 'Session expired. Please log in.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        // 2. Generate/Get API Key (Shared Secret)
        let integration = await PlatformIntegration.findOne({
            where: {
                user_id: user.id,
                platform_type: platform_type,
                platform_domain: platform_domain
            }
        });

        let secret;

        if (integration) {
            secret = integration.shared_secret;
            await integration.update({
                platform_user_id: platform_user_id || integration.platform_user_id,
                is_active: true
            });
        } else {
            secret = crypto.randomBytes(32).toString('hex');
            integration = await PlatformIntegration.create({
                user_id: user.id,
                platform_type: platform_type,
                platform_domain: platform_domain,
                platform_user_id: platform_user_id || 'admin',
                shared_secret: secret,
                is_active: true
            });
        }

        // Log SSO Connect
        try {
            await PlatformIntegrationLog.create({
                integration_id: integration.id,
                action: 'connect_sso',
                status: 'success',
                ip_address: req.socket.remoteAddress || 'unknown',
                details: { user_id: userId, platform_user: platform_user_id || 'admin' }
            });
        } catch (e) { console.error('Log Error', e); }

        // 3. Return the Secret to the Plugin
        return res.status(200).json({
            success: true,
            api_key: secret,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error: any) {
        console.error('Login-Connect Error:', error);
        return res.status(500).json({ success: false, error: 'Connection failed', details: error.message });
    }
}
