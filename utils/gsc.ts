import { google } from 'googleapis';

/**
 * Fetch Google Search Console data for a specific site
 */
export async function getGSCData(
    siteUrl: string,
    refreshToken: string,
    startDate: string,
    endDate: string
) {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        const searchconsole = google.searchconsole({
            version: 'v1',
            auth: oauth2Client,
        });

        const res = await searchconsole.searchanalytics.query({
            siteUrl: siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ['page', 'query'],
                rowLimit: 50,
            },
        });

        const rows = res.data.rows || [];

        // Calculate aggregates
        const totalClicks = rows.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0);
        const totalImpressions = rows.reduce((sum: number, row: any) => sum + (row.impressions || 0), 0);
        const weightedPosition = rows.reduce((sum: number, row: any) => sum + (row.position || 0) * (row.impressions || 0), 0);
        const avgPosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0;
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        // Process top pages and queries
        const pagesMap = new Map();
        const queriesMap = new Map();

        rows.forEach((row: any) => {
            const page = row.keys[0];
            const query = row.keys[1];

            // Aggregating pages
            if (!pagesMap.has(page)) {
                pagesMap.set(page, { clicks: 0, impressions: 0 });
            }
            const p = pagesMap.get(page);
            p.clicks += row.clicks;
            p.impressions += row.impressions;

            // Aggregating queries
            if (!queriesMap.has(query)) {
                queriesMap.set(query, { clicks: 0, impressions: 0, position: 0, count: 0 });
            }
            const q = queriesMap.get(query);
            q.clicks += row.clicks;
            q.impressions += row.impressions;
            q.position += row.position;
            q.count += 1;
        });

        const topPages = Array.from(pagesMap.entries())
            .map(([page, data]: any) => ({ page, ...data }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10);

        const topQueries = Array.from(queriesMap.entries())
            .map(([query, data]: any) => ({
                query,
                clicks: data.clicks,
                impressions: data.impressions,
                position: data.position / data.count
            }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 20);

        return {
            clicks: totalClicks,
            impressions: totalImpressions,
            ctr: parseFloat(ctr.toFixed(2)),
            position: parseFloat(avgPosition.toFixed(1)),
            top_pages: topPages,
            top_queries: topQueries
        };

    } catch (error) {
        console.error('Error fetching GSC data:', error);
        throw error;
    }
}
