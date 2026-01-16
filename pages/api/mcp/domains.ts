import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import connection from '../../../database/database';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Initialize database connection
    await connection.sync();
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Check permission
        if (!hasPermission(auth.permissions || [], 'read:domains')) {
            await logApiAction(
                auth.apiKeyId,
                'list_domains',
                'domains',
                false,
                null,
                'Insufficient permissions',
                req
            );
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (req.method === 'GET') {
            console.log('Getting domains for user_id:', auth.userId);
            // Get all domains for this user
            const domains = await Domain.findAll({
                where: { user_id: auth.userId },
                attributes: ['ID', 'domain', 'slug', 'added', 'business_name', 'niche'],
                order: [['added', 'DESC']],
            });
            console.log('Found domains:', domains.length);

            await logApiAction(
                auth.apiKeyId,
                'list_domains',
                'domains',
                true,
                { count: domains.length },
                undefined,
                req
            );

            return res.status(200).json({ domains });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('MCP Domains error:', error);
        await logApiAction(
            auth.apiKeyId,
            'list_domains',
            'domains',
            false,
            null,
            error.message,
            req
        );
        return res.status(500).json({ error: 'Internal server error' });
    }
}
