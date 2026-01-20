import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import Post from '../../../database/models/post';
import { Op } from 'sequelize';
import connection from '../../../database/database';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    // Initialize database connection
    await connection.sync();
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
                where: { ID: domain_id, user_id: auth.userId }
            });
            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }
            targetDomainId = domain.ID;
        }

        // Get user's domains
        const userDomains = await Domain.findAll({
            where: targetDomainId ? { ID: targetDomainId } : { user_id: auth.userId },
            attributes: ['ID']
        });
        const domainIds = userDomains.map(d => d.ID);

        const stats: any = {};

        // Domain stats
        if (canReadDomains) {
            stats.domains = {
                total: userDomains.length,
            };
        }

        // Keyword stats
        if (canReadKeywords) {
            // Keywords use domain as string (domain slug), not domain_id
            const allKeywords = await Keyword.findAll({
                where: { user_id: auth.userId },
                attributes: ['ID', 'position', 'domain']
            });

            // Filter by domain if specified
            let filteredKeywords = allKeywords;
            if (targetDomainId) {
                // Get the domain slug for filtering
                const targetDomain = await Domain.findOne({
                    where: { ID: targetDomainId },
                    attributes: ['slug']
                });

                if (targetDomain) {
                    filteredKeywords = allKeywords.filter((k: any) => {
                        // domain field is a string like "flowxtra.com" or "dpro.at"
                        return k.domain === targetDomain.slug || k.domain === targetDomain.slug.replace('_', '.');
                    });
                }
            }

            const topPositions = filteredKeywords.filter((k: any) => k.position && k.position <= 10).length;
            const improved = 0; // lastResult_position not available

            stats.keywords = {
                total: filteredKeywords.length,
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
