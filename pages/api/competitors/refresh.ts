import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../../database/database';
import Keyword from '../../../database/models/keyword';
import Domain from '../../../database/models/domain';
import { getAppSettings } from '../settings';
import verifyUser from '../../../utils/verifyUser';
import { scrapeKeywordFromGoogle } from '../../../utils/scraper';

type CompetitorsRefreshRes = {
    success?: boolean;
    error?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<CompetitorsRefreshRes>) {
    await db.sync();
    const verifyResult = verifyUser(req, res);

    if (!verifyResult.authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { domain: domainName, keywordId } = req.body;
    const userId = verifyResult.userId;

    if (!domainName) {
        return res.status(400).json({ error: 'Domain name is required' });
    }

    try {
        // Get domain and competitors
        const domain = await Domain.findOne({
            where: { domain: domainName, user_id: userId }
        });

        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        const competitors = domain.competitors || [];

        if (competitors.length === 0) {
            return res.status(400).json({ error: 'No competitors added yet' });
        }

        // Get keywords - either single keyword or all keywords
        const whereClause: any = { domain: domainName, user_id: userId };
        if (keywordId) {
            whereClause.ID = keywordId;
        }

        const keywords = await Keyword.findAll({ where: whereClause });

        if (keywords.length === 0) {
            return res.status(400).json({ error: 'No keywords found for this domain' });
        }

        // Get settings
        const settings = await getAppSettings(userId);

        if (!settings || settings.scraper_type === 'never') {
            return res.status(400).json({ error: 'Scraper settings not configured' });
        }

        // Set updating_competitors flag for selected keywords
        await Keyword.update(
            { updating_competitors: true },
            { where: whereClause }
        );

        // Process in background - don't wait
        processCompetitorRefresh(keywords, competitors, settings);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Refresh Competitors Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function processCompetitorRefresh(
    keywords: Keyword[],
    competitors: string[],
    settings: SettingsType
) {
    // Ensure all flags are reset even if process crashes
    const keywordIds = keywords.map(k => k.ID);

    try {
        for (const keyword of keywords) {
            const competitorPositions: Record<string, number> = {};

            try {
                console.log(`\n[COMPETITOR SCRAPE] Keyword: "${keyword.keyword}" - Checking ${competitors.length} competitors`);

                // Use original keyword (don't change domain) to get all search results
                const keywordData: KeywordType = keyword.get({ plain: true });

                // ✅ Scrape ONCE per keyword (not once per competitor!)
                const result = await scrapeKeywordFromGoogle(keywordData, settings);

                // Log all scraped URLs
                if (result && result.result && Array.isArray(result.result) && result.result.length > 0) {
                    console.log(`[SCRAPED RESULTS] Found ${result.result.length} results for "${keyword.keyword}":`);
                    result.result.forEach((r: any, idx: number) => {
                        console.log(`  ${idx + 1}. ${r.url}`);
                    });

                    // ✅ Check ALL competitors in the SAME results
                    for (const competitor of competitors) {
                        try {
                            const cleanCompetitor = competitor.replace(/^https?:\/\//, '').replace(/\/$/, '');

                            console.log(`\n[CHECKING COMPETITOR] "${cleanCompetitor}"`);

                            // Find competitor position in results
                            const competitorIndex = result.result.findIndex((r: any) => {
                                try {
                                    // Clean the result URL
                                    let resultUrl = r.url || '';
                                    resultUrl = resultUrl.replace(/^https?:\/\//, '');
                                    resultUrl = resultUrl.replace(/\/$/, '');
                                    resultUrl = resultUrl.replace(/^www\./, '');
                                    const resultHost = resultUrl.split('/')[0];

                                    // Clean competitor
                                    const competitorHost = cleanCompetitor.replace(/^www\./, '');

                                    console.log(`  Comparing: "${resultHost}" === "${competitorHost}"`);

                                    return resultHost === competitorHost;
                                } catch (error) {
                                    console.error(`  Error comparing URL: ${r.url}`, error);
                                    return false;
                                }
                            });

                            const position = competitorIndex >= 0 ? competitorIndex + 1 : 0;
                            competitorPositions[cleanCompetitor] = position;
                            console.log(`[COMPETITOR RESULT] Keyword: "${keyword.keyword}" | Competitor: "${cleanCompetitor}" | Position: ${position}`);
                        } catch (error) {
                            console.error(`Error checking competitor ${competitor}:`, error);
                            const cleanCompetitor = competitor.replace(/^https?:\/\//, '').replace(/\/$/, '');
                            competitorPositions[cleanCompetitor] = 0;
                        }
                    }
                } else {
                    console.log(`[SCRAPED RESULTS] No results found for "${keyword.keyword}"`);
                    // Set all competitors to position 0
                    competitors.forEach(competitor => {
                        const cleanCompetitor = competitor.replace(/^https?:\/\//, '').replace(/\/$/, '');
                        competitorPositions[cleanCompetitor] = 0;
                        console.log(`[COMPETITOR RESULT] Keyword: "${keyword.keyword}" | Competitor: "${cleanCompetitor}" | Position: 0`);
                    });
                }

                // Update keyword with competitor positions
                await keyword.update({
                    competitor_positions: competitorPositions,
                    lastUpdated: new Date().toISOString(),
                });
                console.log(`[SAVED] Keyword "${keyword.keyword}" competitor positions:`, competitorPositions);
            } catch (error) {
                console.error(`Error updating keyword ${keyword.ID}:`, error);
            } finally {
                // Always set updating_competitors to false, even on error
                try {
                    await keyword.update({ updating_competitors: false });
                    console.log(`[UPDATED] Set updating_competitors=false for keyword "${keyword.keyword}"`);
                } catch (err) {
                    console.error(`Error setting updating_competitors to false for keyword ${keyword.ID}:`, err);
                }
            }
        }

        console.log('\n✅ Competitor refresh completed\n');
    } catch (error) {
        console.error('Fatal error in processCompetitorRefresh:', error);
    } finally {
        // Final safety net: reset all flags for these keywords
        try {
            await Keyword.update(
                { updating_competitors: false },
                { where: { ID: keywordIds } }
            );
            console.log('[SAFETY NET] Reset all updating_competitors flags');
        } catch (err) {
            console.error('[SAFETY NET] Failed to reset flags:', err);
        }
    }
}
