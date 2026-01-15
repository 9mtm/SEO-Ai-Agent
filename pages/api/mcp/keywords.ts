import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Keyword from '../../../database/models/keyword';
import Domain from '../../../database/models/domain';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // GET - List keywords
        if (req.method === 'GET') {
            if (!hasPermission(auth.permissions || [], 'read:keywords')) {
                await logApiAction(auth.apiKeyId, 'list_keywords', 'keywords', false, null, 'Insufficient permissions', req);
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { domain_id } = req.query;

            let whereClause: any = {};

            if (domain_id) {
                // Verify domain belongs to user
                const domain = await Domain.findOne({
                    where: { id: domain_id, user_id: auth.userId }
                });
                if (!domain) {
                    return res.status(404).json({ error: 'Domain not found' });
                }
                whereClause.domain = domain_id;
            } else {
                // Get all domains for user
                const userDomains = await Domain.findAll({
                    where: { user_id: auth.userId },
                    attributes: ['id']
                });
                const domainIds = userDomains.map(d => d.id);
                whereClause.domain = domainIds;
            }

            const keywords = await Keyword.findAll({
                where: whereClause,
                attributes: ['id', 'keyword', 'domain', 'position', 'country', 'device', 'lastResult_position', 'created_at'],
                order: [['created_at', 'DESC']],
                limit: 100,
            });

            await logApiAction(auth.apiKeyId, 'list_keywords', 'keywords', true, { count: keywords.length }, undefined, req);
            return res.status(200).json({ keywords });
        }

        // POST - Add keyword
        if (req.method === 'POST') {
            if (!hasPermission(auth.permissions || [], 'write:keywords')) {
                await logApiAction(auth.apiKeyId, 'add_keyword', 'keywords', false, null, 'Insufficient permissions', req);
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { domain_id, keyword, location } = req.body;

            if (!domain_id || !keyword) {
                return res.status(400).json({ error: 'Missing required fields: domain_id, keyword' });
            }

            // Verify domain belongs to user
            const domain = await Domain.findOne({
                where: { id: domain_id, user_id: auth.userId }
            });

            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }

            // Create keyword
            const newKeyword = await Keyword.create({
                keyword,
                domain: domain_id,
                country: location || 'United States',
                device: 'desktop',
                tags: [],
            });

            await logApiAction(
                auth.apiKeyId,
                'add_keyword',
                `keyword_${newKeyword.id}`,
                true,
                { keyword, domain_id },
                undefined,
                req
            );

            return res.status(201).json({
                message: 'Keyword added successfully',
                keyword: newKeyword,
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('MCP Keywords error:', error);
        await logApiAction(auth.apiKeyId, req.method === 'POST' ? 'add_keyword' : 'list_keywords', 'keywords', false, null, error.message, req);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
