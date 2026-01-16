import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';
import { getCountryInsight, getKeywordsInsight, getPagesInsight } from '../../../utils/insight';
import { fetchDomainSCData, getSearchConsoleApiInfo } from '../../../utils/searchConsole';
import verifyUser from '../../../utils/verifyUser';

type MCPInsightRes = {
    insight: InsightDataType | null;
    domain?: {
        id: number;
        domain: string;
    };
    error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MCPInsightRes>) {
    if (req.method !== 'GET') {
        return res.status(405).json({ insight: null, error: 'Method not allowed' });
    }

    try {
        await db.sync();
        const auth = await verifyUser(req, res);
        if (!auth.userId) {
            return res.status(401).json({ insight: null, error: 'Unauthorized' });
        }

        const { domain_id } = req.query;

        if (!domain_id) {
            return res.status(400).json({ insight: null, error: 'Missing domain_id parameter' });
        }

        // Find domain
        const domain = await Domain.findOne({
            where: {
                id: domain_id,
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

        return res.status(200).json({
            insight: insightData,
            domain: {
                id: domainObj.id,
                domain: domainObj.domain,
            },
        });

    } catch (error: any) {
        console.error('MCP Insight error:', error);
        return res.status(500).json({
            insight: null,
            error: error.message || 'Internal server error'
        });
    }
}
