import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import { getCountryInsight, getKeywordsInsight, getPagesInsight } from '../../../utils/insight';
import { fetchDomainSCData, getSearchConsoleApiInfo } from '../../../utils/searchConsole';
import connection from '../../../database/database';

type MCPInsightRes = {
    insight: InsightDataType | null;
    domain?: {
        id: number;
        domain: string;
    };
    error?: string;
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse<MCPInsightRes>) {
    // Initialize database connection
    await connection.sync();
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ insight: null, error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ insight: null, error: 'Method not allowed' });
    }

    try {
        // Check permission
        if (!hasPermission(auth.permissions || [], 'read:gsc')) {
            await logApiAction(auth.apiKeyId, 'get_gsc_insight', 'gsc', false, null, 'Insufficient permissions', req);
            return res.status(403).json({ insight: null, error: 'Insufficient permissions' });
        }

        const { domain_id } = req.query;

        if (!domain_id) {
            return res.status(400).json({ insight: null, error: 'Missing domain_id parameter' });
        }

        // Verify domain belongs to user
        const domain = await Domain.findOne({
            where: {
                ID: domain_id,
                user_id: auth.userId,
            },
        });

        if (!domain) {
            return res.status(404).json({ insight: null, error: 'Domain not found' });
        }

        const domainObj: DomainType = domain.get({ plain: true });
        const scDomainAPI = await getSearchConsoleApiInfo(domainObj);

        // Check for OAuth connection
        const { hasGoogleConnection } = await import('../../../utils/googleOAuth');
        const isConnected = domainObj.user_id ? await hasGoogleConnection(domainObj.user_id) : false;

        if (!isConnected && !(scDomainAPI.client_email && scDomainAPI.private_key)) {
            return res.status(400).json({
                insight: null,
                error: 'Google Search Console not connected',
            });
        }

        // Fetch GSC data
        const scData = await fetchDomainSCData(domainObj, scDomainAPI);

        // Process insight data (same as /api/insight)
        const { stats = [] } = scData;
        const countries = getCountryInsight(scData);
        const keywords = getKeywordsInsight(scData);
        const pages = getPagesInsight(scData);

        const insightData: InsightDataType = {
            stats,
            countries,
            keywords,
            pages,
        };

        await logApiAction(
            auth.apiKeyId,
            'get_gsc_insight',
            `domain_${domain_id}`,
            true,
            { domain_id },
            undefined,
            req
        );

        return res.status(200).json({
            insight: insightData,
            domain: {
                id: domainObj.ID,
                domain: domainObj.domain,
            },
        });

    } catch (error: any) {
        console.error('MCP Insight error:', error);
        await logApiAction(auth.apiKeyId, 'get_gsc_insight', 'gsc', false, null, error.message, req);
        return res.status(500).json({
            insight: null,
            error: error.message || 'Internal server error'
        });
    }
}
