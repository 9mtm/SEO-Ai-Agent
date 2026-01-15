import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        await logApiAction(
            auth.apiKeyId || 0,
            'list_domains',
            'domains',
            false,
            null,
            'Unauthorized',
            req
        );
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
            // Get all domains for this user
            const domains = await Domain.findAll({
                where: { user_id: auth.userId },
                attributes: ['id', 'domain', 'slug', 'created_at'],
                order: [['created_at', 'DESC']],
            });

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
