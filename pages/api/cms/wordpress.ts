import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';
import { verifyRequest, requireScope } from '../../../utils/verifyRequest';
import { verifyWordPressConnection, publishToWordPress, getWordPressCategories } from '../../../utils/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await db.sync();
    const auth = await verifyRequest(req, res);
    if (!auth.authorized) {
        return res.status(401).json({ error: 'Not authorized' });
    }
    const { userId, isLegacy } = auth;

    const { action, domain } = req.body;

    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    // Scope enforcement for OAuth callers. auto_configure + verify_credentials
    // are credential-write operations; publish is a content-write; the rest are reads.
    if (auth.source === 'oauth') {
        const writeActions = ['auto_configure', 'verify_credentials', 'publish'];
        const needed = writeActions.includes(String(action)) ? 'write:integrations' : 'read:domains';
        if (!requireScope(auth, needed)) {
            return res.status(403).json({ error: 'insufficient_scope', required: needed });
        }
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

        // Auto-configure: the WordPress plugin just created an Application Password
        // on its side and is sending it to us so we can publish back without the
        // user ever touching credentials. Test the connection, then persist.
        if (action === 'auto_configure') {
            const { url, username, app_password } = req.body;
            if (!url || !username || !app_password) {
                return res.status(400).json({ error: 'url, username and app_password are required' });
            }
            const test = await verifyWordPressConnection({ url, username, app_password });
            if (!test.success) {
                return res.status(400).json({ success: false, error: test.error || 'Could not reach WordPress REST API' });
            }
            await domainData.update({
                integration_settings: {
                    type: 'wordpress',
                    mode: 'plugin',             // upgraded flow — see docs/auto-bind.md §C
                    url,
                    username,
                    app_password,
                    configured_at: new Date().toISOString(),
                },
            });
            return res.status(200).json({ success: true, user: test.user });
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
