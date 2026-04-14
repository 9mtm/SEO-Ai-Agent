/**
 * Bing Webmaster Storage Service
 * --------------------------------
 * Same pattern as gscStorage.ts but for Bing Webmaster Tools.
 * Smart incremental sync: first visit backfills, subsequent visits fetch new data only.
 *
 * Tables:
 *   - bwt_daily_stats          : daily totals (clicks, impressions)
 *   - bwt_query_stats          : keyword breakdown (query, page, clicks, impressions, position)
 *   - bwt_sync_log             : audit log
 *   - domain.bwt_last_sync     : when sync last ran
 *   - domain.bwt_last_synced_date : latest date we have data for
 *   - domain.bwt_sync_in_progress : concurrent-sync lock
 */

import db from '../database/database';
import Domain from '../database/models/domain';
import { getBingQueryStats, getBingPageStats, getBingTrafficStats } from './bingWebmaster';

export const BWT_SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
export const BWT_INITIAL_BACKFILL_DAYS = 90;

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
 * Parse .NET JSON date format: "/Date(1713052800000-0800)/" → Date object
 * Handles timezone offset suffix. Also handles ISO strings.
 */
const parseBingDate = (d: any): Date | null => {
    if (!d) return null;
    if (typeof d === 'string') {
        // .NET JSON format: /Date(1234567890000)/ or /Date(1234567890000-0800)/
        const match = d.match(/\/Date\((\d+)([+-]\d+)?\)\//);
        if (match) return new Date(parseInt(match[1]));
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
};

// ---------------------------------------------------------------------------
// Sync orchestration
// ---------------------------------------------------------------------------

export async function ensureBingDomainSynced(
    domain: DomainType,
    userId: number,
    options: { source?: SyncSource; force?: boolean } = {}
): Promise<SyncResult> {
    const { source = 'web', force = false } = options;

    if (!domain || !domain.ID) {
        return { ok: false, error: 'Invalid domain' };
    }

    const domainRow = await Domain.findByPk(domain.ID);
    if (!domainRow) return { ok: false, error: 'Domain not found' };

    const plain = domainRow.get({ plain: true }) as any;

    // 1. Cooldown check
    if (!force && plain.bwt_last_sync) {
        const elapsed = Date.now() - new Date(plain.bwt_last_sync).getTime();
        if (elapsed < BWT_SYNC_COOLDOWN_MS) {
            return { ok: true, skipped: true, reason: 'cooldown' };
        }
    }

    // 2. Concurrency lock
    if (plain.bwt_sync_in_progress) {
        return { ok: true, skipped: true, reason: 'in_progress' };
    }

    // 3. Date range
    const endDate = ymd(today());
    let startDate: string;
    if (plain.bwt_last_synced_date) {
        const next = addDays(new Date(plain.bwt_last_synced_date), 1);
        startDate = ymd(next);
        if (startDate > endDate) {
            await Domain.update({ bwt_last_sync: new Date() } as any, { where: { ID: domain.ID } });
            return { ok: true, skipped: true, reason: 'up_to_date' };
        }
    } else {
        startDate = ymd(addDays(today(), -BWT_INITIAL_BACKFILL_DAYS));
    }

    // 4. Lock + sync log
    await Domain.update({ bwt_sync_in_progress: true } as any, { where: { ID: domain.ID } });
    const logId = await createBwtSyncLog(domain.ID, userId, source, startDate, endDate);
    const startedAt = Date.now();

    try {
        const siteUrl = domain.domain.startsWith('http') ? domain.domain : `https://${domain.domain}`;
        const result = await runBingSync(userId, domain.ID, siteUrl, endDate);
        const duration = Date.now() - startedAt;

        await Domain.update(
            {
                bwt_sync_in_progress: false,
                bwt_last_sync: new Date(),
                bwt_last_synced_date: endDate,
            } as any,
            { where: { ID: domain.ID } }
        );

        await finishBwtSyncLog(logId, 'success', result.rowsInserted, 0, duration, null);
        return { ok: true, rowsInserted: result.rowsInserted, fromDate: startDate, toDate: endDate };
    } catch (err: any) {
        const duration = Date.now() - startedAt;
        await Domain.update({ bwt_sync_in_progress: false } as any, { where: { ID: domain.ID } });
        await finishBwtSyncLog(logId, 'failed', 0, 0, duration, err?.message || String(err));
        console.error('[BWT SYNC] Failed for', plain.domain, err);
        return { ok: false, error: err?.message || String(err) };
    }
}

// ---------------------------------------------------------------------------
// Sync execution
// ---------------------------------------------------------------------------

async function runBingSync(userId: number, domainId: number, siteUrl: string, endDate: string) {
    let rowsInserted = 0;

    // 1. Daily traffic stats (GetRankAndTrafficStats)
    try {
        const traffic = await getBingTrafficStats(userId, siteUrl);
        if (traffic && traffic.length > 0) {
            console.log('[BWT SYNC] Traffic sample:', JSON.stringify(traffic[0]));
        }
        if (Array.isArray(traffic)) {
            for (const row of traffic) {
                const parsed = parseBingDate(row.Date);
                const date = parsed ? ymd(parsed) : endDate;
                await db.query(
                    `INSERT INTO bwt_daily_stats (domain_id, date, clicks, impressions, ctr, position, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, 0, 0, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions), updatedAt=NOW()`,
                    { replacements: [domainId, date, row.Clicks || 0, row.Impressions || 0] }
                );
                rowsInserted++;
            }
        }
    } catch (err: any) {
        console.error('[BWT SYNC] Traffic stats failed:', err.message);
    }

    // 2. Keyword/query stats (GetQueryStats) — returns per-day per-keyword rows
    try {
        const keywords = await getBingQueryStats(userId, siteUrl);
        if (Array.isArray(keywords)) {
            for (const k of keywords) {
                const keyword = k.Query || '';
                const clicks = k.Clicks || 0;
                const impressions = k.Impressions || 0;
                const position = k.AvgImpressionPosition || 0;
                const ctr = impressions > 0 ? clicks / impressions : 0;
                const parsedDate = parseBingDate((k as any).Date);
                const kwDate = parsedDate ? ymd(parsedDate) : endDate;

                await db.query(
                    `INSERT INTO bwt_query_stats (domain_id, date, keyword, clicks, impressions, ctr, position, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions),
                        ctr=VALUES(ctr), position=VALUES(position), updatedAt=NOW()`,
                    { replacements: [domainId, kwDate, keyword, clicks, impressions, ctr, position] }
                );
                rowsInserted++;
            }
        }
    } catch (err: any) {
        console.error('[BWT SYNC] Query stats failed:', err.message);
    }

    // 3. Page stats (GetPageStats) — store as keywords with page URL
    try {
        const pages = await getBingPageStats(userId, siteUrl);
        if (Array.isArray(pages)) {
            for (const p of pages) {
                const page = p.Url || '';
                const clicks = p.Clicks || 0;
                const impressions = p.Impressions || 0;
                const position = p.AvgImpressionPosition || 0;

                await db.query(
                    `UPDATE bwt_query_stats SET page = ?
                     WHERE domain_id = ? AND date = ? AND keyword IN (
                         SELECT keyword FROM (SELECT keyword FROM bwt_query_stats WHERE domain_id = ? AND date = ? LIMIT 1) tmp
                     )`,
                    { replacements: [page, domainId, endDate, domainId, endDate] }
                );
            }
        }
    } catch (err: any) {
        console.error('[BWT SYNC] Page stats failed:', err.message);
    }

    return { rowsInserted };
}

// ---------------------------------------------------------------------------
// Sync log helpers
// ---------------------------------------------------------------------------

async function createBwtSyncLog(
    domainId: number,
    userId: number | null,
    source: SyncSource,
    dateFrom: string,
    dateTo: string
): Promise<number> {
    const [result]: any = await db.query(
        `INSERT INTO bwt_sync_log (domain_id, user_id, trigger_source, date_from, date_to, status, started_at)
         VALUES (?, ?, ?, ?, ?, 'running', NOW())`,
        { replacements: [domainId, userId, source, dateFrom, dateTo] }
    );
    return result;
}

async function finishBwtSyncLog(
    id: number,
    status: 'success' | 'failed',
    rowsInserted: number,
    rowsUpdated: number,
    durationMs: number,
    error: string | null
) {
    await db.query(
        `UPDATE bwt_sync_log
         SET status=?, rows_inserted=?, rows_updated=?, duration_ms=?, error_message=?, finished_at=NOW()
         WHERE id=?`,
        { replacements: [status, rowsInserted, rowsUpdated, durationMs, error, id] }
    );
}

// ---------------------------------------------------------------------------
// Read APIs
// ---------------------------------------------------------------------------

export async function readBingInsightData(domainId: number, days: number) {
    const since = ymd(addDays(today(), -days));

    // Daily stats (for chart)
    const [statsRaw]: any = await db.query(
        `SELECT date, clicks, impressions, ctr, position
         FROM bwt_daily_stats
         WHERE domain_id = ? AND date >= ?
         ORDER BY date ASC`,
        { replacements: [domainId, since] }
    );

    const stats = (statsRaw || []).map((r: any) => ({
        date: typeof r.date === 'string' ? r.date : ymd(new Date(r.date)),
        clicks: Number(r.clicks) || 0,
        impressions: Number(r.impressions) || 0,
        ctr: Number(r.ctr) || 0,
        position: Number(r.position) || 0,
    }));

    // Keywords
    const [keywordsRaw]: any = await db.query(
        `SELECT keyword AS value, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
                AVG(ctr) AS ctr, AVG(position) AS position, MAX(page) AS page
         FROM bwt_query_stats
         WHERE domain_id = ? AND date >= ?
         GROUP BY keyword
         ORDER BY clicks DESC
         LIMIT 500`,
        { replacements: [domainId, since] }
    );

    const keywords = (keywordsRaw || []).map((r: any) => ({
        keyword: r.value,
        clicks: Number(r.clicks) || 0,
        impressions: Number(r.impressions) || 0,
        ctr: Number(r.ctr) || 0,
        position: Number(r.position) || 0,
        page: r.page || '',
    }));

    // Totals — always calculate from keywords (Bing daily stats are sparse)
    const totalClicks = keywords.reduce((s: number, k: any) => s + k.clicks, 0);
    const totalImpressions = keywords.reduce((s: number, k: any) => s + k.impressions, 0);
    const avgPosition = keywords.length > 0
        ? keywords.reduce((s: number, k: any) => s + k.position, 0) / keywords.length
        : 0;

    return {
        stats: {
            totalClicks,
            totalImpressions,
            ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
            avgPosition: Math.round(avgPosition * 10) / 10,
        },
        chart: stats,
        keywords,
        pages: [], // Bing API doesn't give per-page stats with keyword correlation
        countries: [],
    };
}
