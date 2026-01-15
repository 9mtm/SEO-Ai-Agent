import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';
import verifyUser from '../../../utils/verifyUser';
import { verifyWordPressConnection, publishToWordPress, getWordPressCategories } from '../../../utils/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const { authorized, userId, isLegacy } = verifyUser(req, res);
    if (!authorized) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    const { action, domain } = req.body;

    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    // 1. Fetch Domain Settings
    const whereClause: any = { domain };
    if (userId && !isLegacy) {
        whereClause.user_id = userId;
    }

    try {
        const domainData = await Domain.findOne({ where: whereClause });
        if (!domainData) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        const settings = domainData.integration_settings;

        // If action is explicit verification using provided credentials (not saved ones yet)
        if (action === 'verify_credentials') {
            const { url, username, app_password } = req.body;
            const result = await verifyWordPressConnection({ url, username, app_password });
            if (result.success) {
                return res.status(200).json({ success: true, user: result.user });
            } else {
                return res.status(400).json({ success: false, error: result.error });
            }
        }

        // For other actions, use stored settings
        if (!settings || settings.type !== 'wordpress') {
            return res.status(400).json({ error: 'WordPress integration not configured for this domain' });
        }

        const wpSettings = {
            url: settings.url,
            username: settings.username,
            app_password: settings.app_password
        };

        // 2. Handle Actions
        if (action === 'test_connection') {
            const result = await verifyWordPressConnection(wpSettings);
            if (result.success) {
                return res.status(200).json({ success: true, user: result.user });
            } else {
                return res.status(400).json({ success: false, error: result.error });
            }
        }

        if (action === 'get_categories') {
            const result = await getWordPressCategories(wpSettings);
            if (result.success) {
                return res.status(200).json({ success: true, categories: result.data });
            } else {
                return res.status(400).json({ success: false, error: result.error });
            }
        }

        if (action === 'publish') {
            const { post_data } = req.body;
            if (!post_data) return res.status(400).json({ error: 'No post data provided' });

            const result = await publishToWordPress(wpSettings, post_data);
            if (result.success) {
                return res.status(200).json({ success: true, post: result.data });
            } else {
                return res.status(400).json({ success: false, error: result.error });
            }
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error: any) {
        console.error('CMS API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
