import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import Post from '../../../database/models/post';
import { Op } from 'sequelize';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check permissions
        const canReadDomains = hasPermission(auth.permissions || [], 'read:domains');
        const canReadKeywords = hasPermission(auth.permissions || [], 'read:keywords');
        const canReadPosts = hasPermission(auth.permissions || [], 'read:posts');

        if (!canReadDomains && !canReadKeywords && !canReadPosts) {
            await logApiAction(auth.apiKeyId, 'get_stats', 'stats', false, null, 'Insufficient permissions', req);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { domain_id } = req.query;

        // Verify domain if specified
        let targetDomainId: number | null = null;
        if (domain_id) {
            const domain = await Domain.findOne({
                where: { id: domain_id, user_id: auth.userId }
            });
            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }
            targetDomainId = domain.id;
        }

        // Get user's domains
        const userDomains = await Domain.findAll({
            where: targetDomainId ? { id: targetDomainId } : { user_id: auth.userId },
            attributes: ['id']
        });
        const domainIds = userDomains.map(d => d.id);

        const stats: any = {};

        // Domain stats
        if (canReadDomains) {
            stats.domains = {
                total: userDomains.length,
            };
        }

        // Keyword stats
        if (canReadKeywords) {
            const allKeywords = await Keyword.findAll({
                where: { domain: domainIds },
                attributes: ['id', 'position', 'lastResult_position']
            });

            const topPositions = allKeywords.filter(k => k.position && k.position <= 10).length;
            const improved = allKeywords.filter(k =>
                k.position && k.lastResult_position && k.position < k.lastResult_position
            ).length;

            stats.keywords = {
                total: allKeywords.length,
                top_10: topPositions,
                improved_recently: improved,
            };
        }

        // Post stats
        if (canReadPosts) {
            const allPosts = await Post.findAll({
                where: { domain_id: domainIds },
                attributes: ['id', 'status']
            });

            stats.posts = {
                total: allPosts.length,
                published: allPosts.filter(p => p.status === 'published').length,
                draft: allPosts.filter(p => p.status === 'draft').length,
            };
        }

        await logApiAction(
            auth.apiKeyId,
            'get_stats',
            targetDomainId ? `domain_${targetDomainId}` : 'all_domains',
            true,
            { domain_id: targetDomainId },
            undefined,
            req
        );

        return res.status(200).json({ stats });

    } catch (error: any) {
        console.error('MCP Stats error:', error);
        await logApiAction(auth.apiKeyId, 'get_stats', 'stats', false, null, error.message, req);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
