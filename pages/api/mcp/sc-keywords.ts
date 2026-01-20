import type { NextApiResponse } from 'next';
import { validateMcpApiKey, hasPermission, logApiAction, AuthenticatedRequest } from '../../../utils/mcpAuth';
import Domain from '../../../database/models/domain';
import { fetchDomainSCData, getSearchConsoleApiInfo } from '../../../utils/searchConsole';
import connection from '../../../database/database';

type MCPSCKeywordsRes = {
    keywords: SearchAnalyticsItem[] | null;
    summary?: {
        total: number;
        byDevice: {
            desktop: number;
            mobile: number;
            tablet: number;
        };
        byCountry: { [country: string]: number };
        avgPosition: number;
        totalClicks: number;
        totalImpressions: number;
        avgCTR: number;
    };
    domain?: {
        id: number;
        domain: string;
    };
    error?: string;
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse<MCPSCKeywordsRes>) {
    // Initialize database connection
    await connection.sync();
    // Validate API Key
    const auth = await validateMcpApiKey(req, res);
    if (!auth.valid || !auth.userId || !auth.apiKeyId) {
        return res.status(401).json({ keywords: null, error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ keywords: null, error: 'Method not allowed' });
    }

    try {
        // Check permission
        if (!hasPermission(auth.permissions || [], 'read:gsc')) {
            await logApiAction(auth.apiKeyId, 'get_gsc_keywords', 'gsc', false, null, 'Insufficient permissions', req);
            return res.status(403).json({ keywords: null, error: 'Insufficient permissions' });
        }

        const { domain_id, device, country } = req.query;

        if (!domain_id) {
            return res.status(400).json({ keywords: null, error: 'Missing domain_id parameter' });
        }

        // Verify domain belongs to user
        const domain = await Domain.findOne({
            where: {
                ID: domain_id,
                user_id: auth.userId,
            },
        });

        if (!domain) {
            return res.status(404).json({ keywords: null, error: 'Domain not found' });
        }

        const domainObj: DomainType = domain.get({ plain: true });
        const scDomainAPI = await getSearchConsoleApiInfo(domainObj);

        // Check for OAuth connection
        const { hasGoogleConnection } = await import('../../../utils/googleOAuth');
        const isConnected = domainObj.user_id ? await hasGoogleConnection(domainObj.user_id) : false;

        if (!isConnected && !(scDomainAPI.client_email && scDomainAPI.private_key)) {
            return res.status(400).json({
                keywords: null,
                error: 'Google Search Console not connected',
            });
        }

        // Fetch GSC data
        const scData = await fetchDomainSCData(domainObj, scDomainAPI);

        // Get keywords from thirtyDays data (same as Console page)
        let keywords = scData.thirtyDays || [];

        // Apply device filter if provided
        if (device && typeof device === 'string') {
            keywords = keywords.filter((k: SearchAnalyticsItem) => k.device === device.toLowerCase());
        }

        // Apply country filter if provided
        if (country && typeof country === 'string') {
            keywords = keywords.filter((k: SearchAnalyticsItem) => k.country === country);
        }

        // Group keywords by device-country-keyword (same logic as Console page)
        const keywordsCount = new Map<string, number>();
        keywords.forEach((k: SearchAnalyticsItem) => {
            const key = `${k.device}-${k.country}-${k.keyword}`;
            keywordsCount.set(key, (keywordsCount.get(key) || 0) + 1);
        });

        // Reduce keywords (aggregate by device-country-keyword)
        const keywordsMap = new Map<string, SearchAnalyticsItem>();
        keywords.forEach((k: SearchAnalyticsItem) => {
            const key = `${k.device}-${k.country}-${k.keyword}`;
            const existing = keywordsMap.get(key);
            if (existing) {
                existing.clicks += k.clicks;
                existing.impressions += k.impressions;
                existing.ctr += k.ctr;
                existing.position += k.position;
            } else {
                keywordsMap.set(key, {
                    ...k,
                    uid: key,
                });
            }
        });

        // Calculate averages
        const keywordsReduced = Array.from(keywordsMap.values()).map((k: SearchAnalyticsItem) => {
            const key = `${k.device}-${k.country}-${k.keyword}`;
            const count = keywordsCount.get(key) || 1;
            return {
                ...k,
                ctr: Math.round((k.ctr / count) * 100) / 100,
                position: Math.round(k.position / count),
            };
        });

        // Calculate summary statistics
        const byDevice = {
            desktop: keywordsReduced.filter(k => k.device === 'desktop').length,
            mobile: keywordsReduced.filter(k => k.device === 'mobile').length,
            tablet: keywordsReduced.filter(k => k.device === 'tablet').length,
        };

        const byCountry: { [country: string]: number } = {};
        keywordsReduced.forEach(k => {
            byCountry[k.country] = (byCountry[k.country] || 0) + 1;
        });

        const totalClicks = keywordsReduced.reduce((sum, k) => sum + k.clicks, 0);
        const totalImpressions = keywordsReduced.reduce((sum, k) => sum + k.impressions, 0);
        const totalPosition = keywordsReduced.reduce((sum, k) => sum + k.position, 0);
        const totalCTR = keywordsReduced.reduce((sum, k) => sum + k.ctr, 0);

        const summary = {
            total: keywordsReduced.length,
            byDevice,
            byCountry,
            avgPosition: keywordsReduced.length > 0 ? Math.round(totalPosition / keywordsReduced.length) : 0,
            totalClicks,
            totalImpressions,
            avgCTR: keywordsReduced.length > 0 ? totalCTR / keywordsReduced.length : 0,
        };

        await logApiAction(
            auth.apiKeyId,
            'get_gsc_keywords',
            `domain_${domain_id}`,
            true,
            { domain_id, count: keywordsReduced.length },
            undefined,
            req
        );

        return res.status(200).json({
            keywords: keywordsReduced,
            summary,
            domain: {
                id: domainObj.ID,
                domain: domainObj.domain,
            },
        });

    } catch (error: any) {
        console.error('MCP SC Keywords error:', error);
        await logApiAction(auth.apiKeyId, 'get_gsc_keywords', 'gsc', false, null, error.message, req);
        return res.status(500).json({
            keywords: null,
            error: error.message || 'Internal server error'
        });
    }
}
