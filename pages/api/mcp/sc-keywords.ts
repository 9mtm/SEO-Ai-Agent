import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import Domain from '../../../database/models/domain';
import { fetchDomainSCData, getSearchConsoleApiInfo } from '../../../utils/searchConsole';
import verifyUser from '../../../utils/verifyUser';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<MCPSCKeywordsRes>) {
    if (req.method !== 'GET') {
        return res.status(405).json({ keywords: null, error: 'Method not allowed' });
    }

    try {
        await db.sync();
        const auth = await verifyUser(req, res);
        if (!auth.userId) {
            return res.status(401).json({ keywords: null, error: 'Unauthorized' });
        }

        const { domain_id, device, country } = req.query;

        if (!domain_id) {
            return res.status(400).json({ keywords: null, error: 'Missing domain_id parameter' });
        }

        // Find domain
        const domain = await Domain.findOne({
            where: {
                id: domain_id,
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
        return res.status(500).json({
            keywords: null,
            error: error.message || 'Internal server error'
        });
    }
}
