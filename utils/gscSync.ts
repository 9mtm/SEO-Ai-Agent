import moment from 'moment';
import SearchAnalytics from '../database/models/search_analytics';
import { getSearchConsoleApiInfo, fetchSearchConsoleData } from './searchConsole';

/**
 * Sync GSC data for a specific domain
 * @param domainObj Domain object from database
 * @param daysBack Number of days to look back and sync (default 3)
 */
export async function syncDomainGSCData(domainObj: any, daysBack: number = 3) {
    try {
        console.log(`[GSC Sync] Starting sync for ${domainObj.domain}...`);

        // 1. Get API Credentials
        const scDomainAPI = await getSearchConsoleApiInfo(domainObj);

        // 2. Define date range
        const endDate = moment().format('YYYY-MM-DD');
        const startDate = moment().subtract(daysBack, 'days').format('YYYY-MM-DD');

        // 3. Fetch Data from Google
        // We need to fetch with dimensions to store granular data
        // Dimensions: ['date', 'query', 'country', 'device', 'page']
        const data: any = await fetchSearchConsoleData(domainObj, {
            api: scDomainAPI,
            startDate,
            endDate,
            dimensions: ['date', 'query', 'country', 'device'],
            raw: true
        });

        if (!data || !data.rows) {
            console.log(`[GSC Sync] No data found for ${domainObj.domain}`);
            return { success: true, count: 0 };
        }

        console.log(`[GSC Sync] Fetched ${data.rows.length} rows from Google.`);

        // 4. Prepare data for Bulk Upsert
        const records = data.rows.map((row: any) => ({
            domain_id: domainObj.ID || domainObj.id,
            date: row.keys[0],
            keyword: row.keys[1],
            country: row.keys[2],
            device: row.keys[3],
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position
        }));

        // 5. Bulk Create / Update
        // Batch processing to avoid memory issues
        const batchSize = 500;
        let processed = 0;

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            // Using bulkCreate with updateOnDuplicate for upsert
            await SearchAnalytics.bulkCreate(batch, {
                updateOnDuplicate: ['clicks', 'impressions', 'ctr', 'position', 'updatedAt']
            });
            processed += batch.length;
        }

        console.log(`[GSC Sync] Successfully synced ${processed} records.`);
        return { success: true, count: processed };

    } catch (error: any) {
        console.error(`[GSC Sync] Error syncing ${domainObj.domain}:`, error);
        return { success: false, error: error.message };
    }
}

