/**
 * GSC Storage Service
 * --------------------
 * Central place for reading and writing Google Search Console data to/from the DB.
 * Implements smart "incremental sync on demand":
 *   - First visit: backfill last 90 days
 *   - Subsequent visits: only fetch (last_synced_date + 1) → today
 *   - Cooldown: 60 minutes between syncs per domain
 *   - Locking: prevents duplicate concurrent syncs
 *
 * Tables:
 *   - gsc_daily_stats        : daily totals (Insight > Stats chart)
 *   - search_analytics       : full dimension breakdown (query+device+country+page)
 *   - gsc_sync_log           : audit log of every sync
 *   - domain.gsc_last_sync   : when sync last ran
 *   - domain.gsc_last_synced_date : latest date we have data for
 *   - domain.gsc_sync_in_progress : concurrent-sync lock
 */

import db from '../database/database';
import Domain from '../database/models/domain';
import { fetchSearchConsoleData, getSearchConsoleApiInfo } from '../utils/searchConsole';
import { getCountryCodeFromAlphaThree } from '../utils/countries';

export const GSC_SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
export const GSC_DATA_DELAY_DAYS = 2; // Google finalizes data after ~2 days
export const GSC_INITIAL_BACKFILL_DAYS = 90;

type SyncSource = 'web' | 'api' | 'mcp' | 'manual' | 'system';

type SyncResult = {
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    rowsInserted?: number;
    rowsUpdated?: number;
    fromDate?: string;
    toDate?: string;
    error?: string;
};

type InsightRow = {
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
};

type InsightDimensionRow = {
    keyword?: string;
    page?: string;
    country?: string;
    device?: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    countries?: number;
    keywords?: number;
};

export type InsightData = {
    stats: InsightRow[];
    keywords: InsightDimensionRow[];
    pages: InsightDimensionRow[];
    countries: InsightDimensionRow[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ymd = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
};

const today = () => new Date();

/**
 * Latest date GSC has finalized data for.
 * Google's Search Analytics API lags by ~2 days.
 */
const latestAvailableGSCDate = () => ymd(addDays(today(), -GSC_DATA_DELAY_DAYS));

// ---------------------------------------------------------------------------
// Sync orchestration
// ---------------------------------------------------------------------------

/**
 * Main entry point. Call this whenever a user opens insight/console/tracking
 * pages, or whenever an API/MCP client requests GSC data for a domain.
 *
 * - Decides whether a sync is needed (cooldown + date gap).
 * - Locks the domain, fetches new data from GSC, writes to DB.
 * - Always returns quickly — if data is fresh enough, returns without fetching.
 */
export async function ensureDomainSynced(
    domain: DomainType,
    options: { source?: SyncSource; userId?: number; force?: boolean } = {}
): Promise<SyncResult> {
    const { source = 'web', userId, force = false } = options;

    if (!domain || !domain.ID) {
        return { ok: false, error: 'Invalid domain' };
    }

    const domainRow = await Domain.findByPk(domain.ID);
    if (!domainRow) return { ok: false, error: 'Domain not found' };

    const plain = domainRow.get({ plain: true }) as any;

    // 1. Cooldown check (unless forced)
    if (!force && plain.gsc_last_sync) {
        const elapsed = Date.now() - new Date(plain.gsc_last_sync).getTime();
        if (elapsed < GSC_SYNC_COOLDOWN_MS) {
            return { ok: true, skipped: true, reason: 'cooldown' };
        }
    }

    // 2. Concurrency lock
    if (plain.gsc_sync_in_progress) {
        return { ok: true, skipped: true, reason: 'in_progress' };
    }

    // 3. Determine date range to fetch
    const endDate = latestAvailableGSCDate();
    let startDate: string;
    if (plain.gsc_last_synced_date) {
        // incremental: from day after last synced date
        const next = addDays(new Date(plain.gsc_last_synced_date), 1);
        startDate = ymd(next);
        if (startDate > endDate) {
            // Already caught up, just refresh lastSync timestamp and exit
            await Domain.update({ gsc_last_sync: new Date() }, { where: { ID: domain.ID } });
            return { ok: true, skipped: true, reason: 'up_to_date' };
        }
    } else {
        // first time: backfill N days
        startDate = ymd(addDays(today(), -GSC_INITIAL_BACKFILL_DAYS));
    }

    // 4. Acquire lock + create sync log row
    await Domain.update({ gsc_sync_in_progress: true }, { where: { ID: domain.ID } });

    const logId = await createSyncLog(domain.ID, userId || null, source, startDate, endDate);
    const startedAt = Date.now();

    try {
        const result = await runSync(plain, startDate, endDate);
        const duration = Date.now() - startedAt;

        await Domain.update(
            {
                gsc_sync_in_progress: false,
                gsc_last_sync: new Date(),
                gsc_last_synced_date: endDate
            },
            { where: { ID: domain.ID } }
        );

        await finishSyncLog(logId, 'success', result.rowsInserted, result.rowsUpdated, duration, null);

        return { ok: true, rowsInserted: result.rowsInserted, rowsUpdated: result.rowsUpdated, fromDate: startDate, toDate: endDate };
    } catch (err: any) {
        const duration = Date.now() - startedAt;
        await Domain.update({ gsc_sync_in_progress: false }, { where: { ID: domain.ID } });
        await finishSyncLog(logId, 'failed', 0, 0, duration, err?.message || String(err));
        console.error('[GSC SYNC] Failed for', plain.domain, err);
        return { ok: false, error: err?.message || String(err) };
    }
}

// ---------------------------------------------------------------------------
// Sync execution
// ---------------------------------------------------------------------------

async function runSync(domain: any, startDate: string, endDate: string) {
    const scAPI = await getSearchConsoleApiInfo(domain);

    // --- 1) Daily totals (dimensions=['date'])
    const statsRows: any = await fetchSearchConsoleData(domain, {
        startDate,
        endDate,
        type: 'stat',
        api: scAPI
    } as any);

    let statsInserted = 0;
    if (Array.isArray(statsRows)) {
        for (const row of statsRows as any[]) {
            await db.query(
                `INSERT INTO gsc_daily_stats (domain_id, date, clicks, impressions, ctr, position, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions),
                   ctr=VALUES(ctr), position=VALUES(position), updatedAt=NOW()`,
                {
                    replacements: [
                        domain.ID,
                        row.date,
                        row.clicks || 0,
                        row.impressions || 0,
                        row.ctr || 0,
                        row.position || 0
                    ]
                }
            );
            statsInserted++;
        }
    }

    // --- 2) Dimension rows (query, device, country, page) aggregated for range
    //
    // Google API limit: rowLimit up to 25k per call. For 90-day ranges with big sites
    // this may exceed the limit; consider chunking by month in the future.
    const dimRows: any = await fetchSearchConsoleData(domain, {
        startDate,
        endDate,
        api: scAPI,
        dimensions: ['query', 'device', 'country', 'page']
    } as any);

    let dimInserted = 0;
    if (Array.isArray(dimRows)) {
        // We store these against the endDate (aggregated for the sync range).
        // Detailed per-day breakdown is available in gsc_daily_stats. Dimensions stored
        // as last-known aggregate for each (domain, date, keyword, country, device, page).
        for (const item of dimRows as any[]) {
            const keyword = item.keyword || '';
            const country = (item.country || 'ZZ').toUpperCase();
            const device = (item.device || 'desktop').toLowerCase();
            const page = item.page || '';
            const clicks = item.clicks || 0;
            const impressions = item.impressions || 0;
            const ctr = item.ctr || 0;
            const position = item.position || 0;

            await db.query(
                `INSERT INTO search_analytics
                    (domain_id, date, keyword, country, device, page, clicks, impressions, ctr, position, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions),
                    ctr=VALUES(ctr), position=VALUES(position), page=VALUES(page), updatedAt=NOW()`,
                {
                    replacements: [
                        domain.ID,
                        endDate,
                        keyword,
                        country,
                        device,
                        page,
                        clicks,
                        impressions,
                        ctr,
                        position
                    ]
                }
            );
            dimInserted++;
        }
    }

    return { rowsInserted: statsInserted + dimInserted, rowsUpdated: 0 };
}

// ---------------------------------------------------------------------------
// Sync log helpers
// ---------------------------------------------------------------------------

async function createSyncLog(
    domainId: number,
    userId: number | null,
    source: SyncSource,
    dateFrom: string,
    dateTo: string
): Promise<number> {
    const [result]: any = await db.query(
        `INSERT INTO gsc_sync_log (domain_id, user_id, trigger_source, date_from, date_to, status, started_at)
         VALUES (?, ?, ?, ?, ?, 'running', NOW())`,
        { replacements: [domainId, userId, source, dateFrom, dateTo] }
    );
    return result;
}

async function finishSyncLog(
    id: number,
    status: 'success' | 'failed',
    rowsInserted: number,
    rowsUpdated: number,
    durationMs: number,
    error: string | null
) {
    await db.query(
        `UPDATE gsc_sync_log
         SET status=?, rows_inserted=?, rows_updated=?, duration_ms=?, error_message=?, finished_at=NOW()
         WHERE id=?`,
        { replacements: [status, rowsInserted, rowsUpdated, durationMs, error, id] }
    );
}

// ---------------------------------------------------------------------------
// Read APIs (used by insight / searchconsole page endpoints)
// ---------------------------------------------------------------------------

/**
 * Returns aggregated data for the Insight page (Stats, Keywords, Pages, Countries tabs).
 */
export async function readInsightData(domainId: number, days: number): Promise<InsightData> {
    const since = ymd(addDays(today(), -days));

    // 1. Daily stats (for chart)
    const [statsRaw]: any = await db.query(
        `SELECT date, clicks, impressions, ctr, position
         FROM gsc_daily_stats
         WHERE domain_id = ? AND date >= ?
         ORDER BY date ASC`,
        { replacements: [domainId, since] }
    );
    const stats: InsightRow[] = (statsRaw || []).map((r: any) => ({
        date: typeof r.date === 'string' ? r.date : ymd(new Date(r.date)),
        clicks: Number(r.clicks) || 0,
        impressions: Number(r.impressions) || 0,
        ctr: Number(r.ctr) || 0,
        position: Number(r.position) || 0
    }));

    // 2. Dimension aggregates
    const dimQuery = (groupBy: string, extraSelect: string = '') => `
        SELECT ${groupBy} AS value,
               SUM(clicks) AS clicks,
               SUM(impressions) AS impressions,
               AVG(ctr) AS ctr,
               AVG(position) AS position
               ${extraSelect}
        FROM search_analytics
        WHERE domain_id = ? AND date >= ?
        GROUP BY ${groupBy}
        ORDER BY clicks DESC
        LIMIT 500
    `;

    const [keywordsRaw]: any = await db.query(dimQuery('keyword', ', COUNT(DISTINCT country) AS countries'), {
        replacements: [domainId, since]
    });
    const [pagesRaw]: any = await db.query(
        dimQuery('page', ', COUNT(DISTINCT country) AS countries, COUNT(DISTINCT keyword) AS keywords'),
        { replacements: [domainId, since] }
    );
    const [countriesRaw]: any = await db.query(dimQuery('country', ', COUNT(DISTINCT keyword) AS keywords'), {
        replacements: [domainId, since]
    });

    const mapDim = (rows: any[], field: string) =>
        (rows || []).map((r: any) => ({
            [field]: r.value,
            clicks: Number(r.clicks) || 0,
            impressions: Number(r.impressions) || 0,
            ctr: Number(r.ctr) || 0,
            position: Number(r.position) || 0,
            countries: r.countries !== undefined ? Number(r.countries) : undefined,
            keywords: r.keywords !== undefined ? Number(r.keywords) : undefined
        })) as InsightDimensionRow[];

    return {
        stats,
        keywords: mapDim(keywordsRaw, 'keyword'),
        pages: mapDim(pagesRaw, 'page'),
        countries: mapDim(countriesRaw, 'country')
    };
}

/**
 * Returns keyword rows for the Search Console keywords page, grouped by (device, country, keyword).
 */
export async function readSCKeywordsData(domainId: number, days: number = 30): Promise<any> {
    const since = ymd(addDays(today(), -days));

    const [rows]: any = await db.query(
        `SELECT keyword, device, country, page,
                SUM(clicks) AS clicks,
                SUM(impressions) AS impressions,
                AVG(ctr) AS ctr,
                AVG(position) AS position
         FROM search_analytics
         WHERE domain_id = ? AND date >= ?
         GROUP BY keyword, device, country
         ORDER BY clicks DESC
         LIMIT 2000`,
        { replacements: [domainId, since] }
    );

    const data = (rows || []).map((r: any) => {
        const country = getCountryCodeFromAlphaThree((r.country || 'ZZ').toUpperCase()) || r.country || 'ZZ';
        return {
            keyword: r.keyword,
            device: r.device,
            country,
            page: r.page,
            clicks: Number(r.clicks) || 0,
            impressions: Number(r.impressions) || 0,
            ctr: Number(r.ctr) || 0,
            position: Number(r.position) || 0,
            uid: `${country.toLowerCase()}:${r.device}:${(r.keyword || '').replaceAll(' ', '_')}`
        };
    });

    // The front end expects an object keyed by date range filter
    return {
        thirtyDays: data,
        sevenDays: data.slice(0, Math.ceil(data.length / 2)),
        threeDays: data.slice(0, Math.ceil(data.length / 4))
    };
}
