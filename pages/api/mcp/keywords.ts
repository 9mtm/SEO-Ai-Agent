import type { NextApiResponse } from 'next';
import { Op } from 'sequelize';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Keyword from '../../../database/models/keyword';
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
        // GET - List keywords
        if (req.method === 'GET') {
            if (!hasPermission(auth.permissions || [], 'read:keywords')) {
                await logApiAction(auth.apiKeyId, 'list_keywords', 'keywords', false, null, 'Insufficient permissions', req);
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { domain_id } = req.query;

            let whereClause: any = { user_id: auth.userId };

            if (domain_id) {
                // Verify domain belongs to user
                const domain = await Domain.findOne({
                    where: { ID: domain_id, user_id: auth.userId }
                });
                if (!domain) {
                    return res.status(404).json({ error: 'Domain not found' });
                }
                // Support both domain name and domain ID in the database
                // Old keywords use domain name, new ones use domain ID
                const domainObj = domain.get({ plain: true });
                whereClause.domain = {
                    [Op.in]: [domainObj.domain, domain_id.toString()]
                };
            }

            const keywords = await Keyword.findAll({
                where: whereClause,
                attributes: [
                    'ID',
                    'keyword',
                    'domain',
                    'position',
                    'country',
                    'device',
                    'city',
                    'url',
                    'lastUpdated',
                    'added',
                    'history',
                    'volume',
                    'tags',
                    'sticky',
                    'updating',
                    'lastUpdateError',
                    'competitor_positions',
                    'updating_competitors'
                ],
                order: [['position', 'ASC'], ['added', 'DESC']],
                limit: 1000,
            });

            // Process keywords to parse JSON fields and calculate stats
            const processedKeywords = keywords.map((kw: any) => {
                const kwData = kw.get({ plain: true });

                // Parse JSON fields safely
                let history: any = {};
                let tags: string[] = [];
                let url: any = [];
                let competitorPositions: any = {};

                try {
                    history = kwData.history ? JSON.parse(kwData.history) : {};
                } catch (e) {
                    history = {};
                }

                try {
                    tags = kwData.tags ? JSON.parse(kwData.tags) : [];
                } catch (e) {
                    tags = [];
                }

                try {
                    // url might be a string (URL) or JSON array
                    if (kwData.url) {
                        if (kwData.url.startsWith('[') || kwData.url.startsWith('{')) {
                            url = JSON.parse(kwData.url);
                        } else {
                            url = kwData.url; // Keep as string if it's a URL
                        }
                    }
                } catch (e) {
                    url = kwData.url || [];
                }

                // Parse competitor_positions if it exists
                if (kwData.competitor_positions) {
                    try {
                        if (typeof kwData.competitor_positions === 'string') {
                            competitorPositions = JSON.parse(kwData.competitor_positions);
                        } else {
                            competitorPositions = kwData.competitor_positions;
                        }
                    } catch (e) {
                        competitorPositions = {};
                    }
                }

                // Calculate position change from history
                const historyArray = Object.keys(history).map((dateKey: string) => ({
                    date: new Date(dateKey).getTime(),
                    position: history[dateKey]
                }));
                const historySorted = historyArray.sort((a, b) => b.date - a.date);
                const lastPos = historySorted.length > 1 ? historySorted[1].position : kwData.position;
                const positionChange = lastPos > 0 ? lastPos - kwData.position : 0;

                return {
                    ...kwData,
                    history,
                    tags,
                    url,
                    positionChange,
                    historyArray: historySorted,
                    competitor_positions: competitorPositions,
                    updating_competitors: kwData.updating_competitors || false
                };
            });

            await logApiAction(auth.apiKeyId, 'list_keywords', 'keywords', true, { count: keywords.length }, undefined, req);
            return res.status(200).json({
                keywords: processedKeywords,
                total: processedKeywords.length
            });
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
                where: { ID: domain_id, user_id: auth.userId }
            });

            if (!domain) {
                return res.status(404).json({ error: 'Domain not found' });
            }

            // Create keyword
            const newKeyword = await Keyword.create({
                user_id: auth.userId,
                keyword,
                domain: domain_id.toString(),
                country: location || 'United States',
                device: 'desktop',
                tags: JSON.stringify([]),
                added: new Date().toISOString(),
            });

            await logApiAction(
                auth.apiKeyId,
                'add_keyword',
                `keyword_${newKeyword.ID}`,
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
