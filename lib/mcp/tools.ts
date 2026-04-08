/**
 * MCP Tool Definitions
 * --------------------
 * Each tool has a JSON-Schema for its inputs and an `execute` function that
 * receives the parsed arguments + caller context (user/workspace/scopes).
 *
 * Tools are scoped: they enforce that the caller has the right OAuth scope
 * (when called via OAuth) or workspace role (when called via session).
 */

import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import User from '../../database/models/user';
import Workspace from '../../database/models/workspace';
import Post from '../../database/models/post';
import { ensureDomainSynced, readInsightData, readSCKeywordsData } from '../../services/gscStorage';
import { analyzeSEO } from '../seo/analyzer';

export interface ToolContext {
    userId: number;
    workspaceId: number;
    scopes?: string[]; // OAuth scopes (empty for session/api-key auth)
    role?: string;
    source: 'web' | 'api' | 'mcp' | 'oauth';
}

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    requiredScope?: string;
    execute: (args: any, ctx: ToolContext) => Promise<any>;
}

const requireScope = (ctx: ToolContext, scope: string) => {
    if (ctx.source === 'oauth' && !(ctx.scopes || []).includes(scope)) {
        throw new Error(`insufficient_scope: ${scope}`);
    }
};

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

const listDomainsTool: ToolDefinition = {
    name: 'list_domains',
    description: 'List all domains in the active workspace.',
    inputSchema: {
        type: 'object',
        properties: {},
    },
    requiredScope: 'read:domains',
    async execute(_args, ctx) {
        requireScope(ctx, 'read:domains');
        const rows = await Domain.findAll({ where: { workspace_id: ctx.workspaceId } });
        return rows.map((d: any) => {
            const o = d.get({ plain: true });
            return {
                id: o.ID,
                domain: o.domain,
                slug: o.slug,
                added: o.added,
                niche: o.niche,
                target_country: o.target_country,
                gsc_last_synced_date: o.gsc_last_synced_date
            };
        });
    }
};

const getDomainInsightTool: ToolDefinition = {
    name: 'get_domain_insight',
    description:
        'Get aggregated GSC stats (clicks, impressions, ctr, position), top keywords, top pages and top countries for a domain. Triggers an incremental sync if needed.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string', description: 'Domain name (e.g. "example.com")' },
            days: { type: 'number', description: 'Date range in days', default: 30 }
        },
        required: ['domain']
    },
    requiredScope: 'read:gsc',
    async execute(args, ctx) {
        requireScope(ctx, 'read:gsc');
        const d: any = await Domain.findOne({
            where: { workspace_id: ctx.workspaceId, domain: args.domain }
        });
        if (!d) throw new Error('domain_not_found');
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        return await readInsightData(plain.ID, args.days || 30);
    }
};

const getDomainKeywordsTool: ToolDefinition = {
    name: 'get_domain_keywords',
    description: 'Get GSC keyword breakdown (by query/device/country) for a domain over the last N days.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            days: { type: 'number', default: 30 }
        },
        required: ['domain']
    },
    requiredScope: 'read:gsc',
    async execute(args, ctx) {
        requireScope(ctx, 'read:gsc');
        const d: any = await Domain.findOne({
            where: { workspace_id: ctx.workspaceId, domain: args.domain }
        });
        if (!d) throw new Error('domain_not_found');
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        return await readSCKeywordsData(plain.ID, args.days || 30);
    }
};

const listTrackedKeywordsTool: ToolDefinition = {
    name: 'list_tracked_keywords',
    description: 'List manually-tracked rank keywords for a domain (rank tracker).',
    inputSchema: {
        type: 'object',
        properties: { domain: { type: 'string' } },
        required: ['domain']
    },
    requiredScope: 'read:keywords',
    async execute(args, ctx) {
        requireScope(ctx, 'read:keywords');
        const rows = await Keyword.findAll({
            where: { workspace_id: ctx.workspaceId, domain: args.domain }
        });
        return rows.map((r: any) => {
            const o = r.get({ plain: true });
            return {
                id: o.ID,
                keyword: o.keyword,
                device: o.device,
                country: o.country,
                position: o.position,
                volume: o.volume,
                lastUpdated: o.lastUpdated
            };
        });
    }
};

const addTrackedKeywordTool: ToolDefinition = {
    name: 'add_tracked_keyword',
    description: 'Add a keyword to the rank tracker for a domain.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            keyword: { type: 'string' },
            device: { type: 'string', enum: ['desktop', 'mobile'], default: 'desktop' },
            country: { type: 'string', default: 'US' }
        },
        required: ['domain', 'keyword']
    },
    requiredScope: 'write:keywords',
    async execute(args, ctx) {
        requireScope(ctx, 'write:keywords');
        const created = await Keyword.create({
            keyword: args.keyword,
            device: args.device || 'desktop',
            country: args.country || 'US',
            domain: args.domain,
            workspace_id: ctx.workspaceId,
            user_id: ctx.userId,
            position: 0,
            updating: true,
            history: '{}',
            url: '',
            tags: '[]',
            sticky: false,
            lastUpdated: new Date().toJSON(),
            added: new Date().toJSON()
        } as any);
        return { id: (created as any).ID, ok: true };
    }
};

const getCurrentWorkspaceTool: ToolDefinition = {
    name: 'get_current_workspace',
    description: 'Return information about the workspace the current credentials are bound to.',
    inputSchema: { type: 'object', properties: {} },
    requiredScope: 'read:profile',
    async execute(_args, ctx) {
        requireScope(ctx, 'read:profile');
        const ws: any = await Workspace.findByPk(ctx.workspaceId);
        if (!ws) throw new Error('workspace_not_found');
        const o = ws.get({ plain: true });
        return {
            id: o.id,
            name: o.name,
            slug: o.slug,
            plan: o.plan,
            role: ctx.role
        };
    }
};

const listDomainCompetitorsTool: ToolDefinition = {
    name: 'list_domain_competitors',
    description: 'List the competitor domains configured for a given domain.',
    inputSchema: {
        type: 'object',
        properties: { domain: { type: 'string' } },
        required: ['domain']
    },
    requiredScope: 'read:domains',
    async execute(args, ctx) {
        requireScope(ctx, 'read:domains');
        const d: any = await Domain.findOne({
            where: { workspace_id: ctx.workspaceId, domain: args.domain }
        });
        if (!d) throw new Error('domain_not_found');
        const plain = d.get({ plain: true });
        let competitors: string[] = [];
        try {
            competitors = typeof plain.competitors === 'string'
                ? JSON.parse(plain.competitors || '[]')
                : (plain.competitors || []);
        } catch { }
        return { domain: plain.domain, competitors };
    }
};

const updateDomainCompetitorsTool: ToolDefinition = {
    name: 'update_domain_competitors',
    description: 'Replace the full list of competitor domains for a domain.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            competitors: { type: 'array', items: { type: 'string' } }
        },
        required: ['domain', 'competitors']
    },
    requiredScope: 'write:domains',
    async execute(args, ctx) {
        requireScope(ctx, 'write:domains');
        const d: any = await Domain.findOne({
            where: { workspace_id: ctx.workspaceId, domain: args.domain }
        });
        if (!d) throw new Error('domain_not_found');
        await d.update({ competitors: JSON.stringify(args.competitors || []) });
        return { ok: true, competitors: args.competitors || [] };
    }
};

const getKeywordCompetitorsTool: ToolDefinition = {
    name: 'get_keyword_competitors',
    description: 'Get current competitor ranking positions for a specific tracked keyword.',
    inputSchema: {
        type: 'object',
        properties: {
            keyword_id: { type: 'number' }
        },
        required: ['keyword_id']
    },
    requiredScope: 'read:keywords',
    async execute(args, ctx) {
        requireScope(ctx, 'read:keywords');
        const kw: any = await Keyword.findOne({
            where: { ID: args.keyword_id, workspace_id: ctx.workspaceId }
        });
        if (!kw) throw new Error('keyword_not_found');
        const plain = kw.get({ plain: true });
        return {
            keyword: plain.keyword,
            domain: plain.domain,
            competitor_positions: plain.competitor_positions || {},
            updating: !!plain.updating_competitors
        };
    }
};

const getCompetitorHistoryTool: ToolDefinition = {
    name: 'get_competitor_history',
    description: 'Get time-series ranking history for competitors on a tracked keyword.',
    inputSchema: {
        type: 'object',
        properties: {
            keyword_id: { type: 'number' },
            days: { type: 'number', default: 30 }
        },
        required: ['keyword_id']
    },
    requiredScope: 'read:keywords',
    async execute(args, ctx) {
        requireScope(ctx, 'read:keywords');
        // Verify keyword belongs to workspace
        const kw: any = await Keyword.findOne({
            where: { ID: args.keyword_id, workspace_id: ctx.workspaceId }
        });
        if (!kw) throw new Error('keyword_not_found');

        const days = args.days || 30;
        const [rows]: any = await (await import('../../database/database')).default.query(
            `SELECT competitor_domain, date, position, url
             FROM competitor_history
             WHERE keyword_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             ORDER BY date ASC`,
            { replacements: [args.keyword_id, days] }
        );
        return { keyword_id: args.keyword_id, history: rows || [] };
    }
};

// ---------------------------------------------------------------------------
// Content Research tools — use BEFORE writing an article
// ---------------------------------------------------------------------------

const getDomainSeoOverviewTool: ToolDefinition = {
    name: 'get_domain_seo_overview',
    description:
        'High-level SEO health overview for a domain: total clicks, impressions, average position, average CTR over the last N days plus period-over-period change. Use this FIRST when starting content research to understand the site\'s current performance.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            days: { type: 'number', default: 30 }
        },
        required: ['domain']
    },
    requiredScope: 'read:gsc',
    async execute(args, ctx) {
        requireScope(ctx, 'read:gsc');
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain: args.domain } });
        if (!d) throw new Error('domain_not_found');
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });

        const db = (await import('../../database/database')).default;
        const days = args.days || 30;

        const [[curr]]: any = await db.query(
            `SELECT SUM(clicks) clicks, SUM(impressions) impressions,
                    AVG(ctr) ctr, AVG(position) position, COUNT(*) days_with_data
             FROM gsc_daily_stats
             WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            { replacements: [plain.ID, days] }
        );
        const [[prev]]: any = await db.query(
            `SELECT SUM(clicks) clicks, SUM(impressions) impressions,
                    AVG(ctr) ctr, AVG(position) position
             FROM gsc_daily_stats
             WHERE domain_id = ?
               AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
               AND date <  DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            { replacements: [plain.ID, days * 2, days] }
        );

        const pctChange = (a: number, b: number) =>
            !b ? (a ? 100 : 0) : Math.round(((a - b) / b) * 1000) / 10;

        return {
            domain: plain.domain,
            period_days: days,
            current: {
                clicks: Number(curr?.clicks) || 0,
                impressions: Number(curr?.impressions) || 0,
                avg_ctr: Number(curr?.ctr) || 0,
                avg_position: Math.round((Number(curr?.position) || 0) * 10) / 10,
                days_with_data: Number(curr?.days_with_data) || 0
            },
            previous: {
                clicks: Number(prev?.clicks) || 0,
                impressions: Number(prev?.impressions) || 0,
                avg_ctr: Number(prev?.ctr) || 0,
                avg_position: Math.round((Number(prev?.position) || 0) * 10) / 10
            },
            change_pct: {
                clicks: pctChange(Number(curr?.clicks) || 0, Number(prev?.clicks) || 0),
                impressions: pctChange(Number(curr?.impressions) || 0, Number(prev?.impressions) || 0),
                ctr: pctChange(Number(curr?.ctr) || 0, Number(prev?.ctr) || 0),
                position: pctChange(Number(curr?.position) || 0, Number(prev?.position) || 0)
            }
        };
    }
};

const findKeywordOpportunitiesTool: ToolDefinition = {
    name: 'find_keyword_opportunities',
    description:
        'Find "quick win" keyword opportunities for a domain — keywords where the site already ranks but not well enough. Returns four buckets: (1) striking_distance = position 5-20 with decent impressions (easiest to push to page 1), (2) low_ctr = top 10 positions but CTR below expected (title/meta rewrite), (3) rising = positive trend vs previous period, (4) high_impression_no_click = lots of impressions but zero clicks (content mismatch). Use this to decide WHICH keywords to target before writing new content.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            days: { type: 'number', default: 30 },
            limit: { type: 'number', default: 20, description: 'Max results per bucket' }
        },
        required: ['domain']
    },
    requiredScope: 'read:gsc',
    async execute(args, ctx) {
        requireScope(ctx, 'read:gsc');
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain: args.domain } });
        if (!d) throw new Error('domain_not_found');
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });

        const db = (await import('../../database/database')).default;
        const days = args.days || 30;
        const limit = args.limit || 20;
        const domainId = plain.ID;

        // 1. Striking distance: position 5-20, impressions >= 10
        const [striking]: any = await db.query(
            `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions,
                    AVG(ctr) ctr, AVG(position) position
             FROM search_analytics
             WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY keyword
             HAVING position BETWEEN 5 AND 20 AND impressions >= 10
             ORDER BY impressions DESC
             LIMIT ?`,
            { replacements: [domainId, days, limit] }
        );

        // 2. Low CTR: position 1-10, but CTR below 2%
        const [lowCtr]: any = await db.query(
            `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions,
                    AVG(ctr) ctr, AVG(position) position
             FROM search_analytics
             WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY keyword
             HAVING position <= 10 AND impressions >= 20 AND ctr < 2
             ORDER BY impressions DESC
             LIMIT ?`,
            { replacements: [domainId, days, limit] }
        );

        // 3. High impressions, zero clicks (content mismatch)
        const [zeroClicks]: any = await db.query(
            `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions, AVG(position) position
             FROM search_analytics
             WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY keyword
             HAVING clicks = 0 AND impressions >= 15
             ORDER BY impressions DESC
             LIMIT ?`,
            { replacements: [domainId, days, limit] }
        );

        // 4. Rising: clicks this period > clicks previous period
        const [rising]: any = await db.query(
            `SELECT k, curr_clicks, prev_clicks, curr_impr, prev_impr, curr_pos
             FROM (
               SELECT keyword k,
                      SUM(CASE WHEN date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) THEN clicks ELSE 0 END) curr_clicks,
                      SUM(CASE WHEN date <  DATE_SUB(CURDATE(), INTERVAL ? DAY)
                              AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) THEN clicks ELSE 0 END) prev_clicks,
                      SUM(CASE WHEN date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) THEN impressions ELSE 0 END) curr_impr,
                      SUM(CASE WHEN date <  DATE_SUB(CURDATE(), INTERVAL ? DAY)
                              AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) THEN impressions ELSE 0 END) prev_impr,
                      AVG(CASE WHEN date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) THEN position ELSE NULL END) curr_pos
               FROM search_analytics
               WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
               GROUP BY keyword
             ) x
             WHERE curr_clicks > prev_clicks AND curr_clicks > 0
             ORDER BY (curr_clicks - prev_clicks) DESC
             LIMIT ?`,
            { replacements: [days, days, days * 2, days, days, days * 2, days, domainId, days * 2, limit] }
        );

        const fmt = (r: any) => ({
            keyword: r.keyword || r.k,
            clicks: Number(r.clicks || r.curr_clicks) || 0,
            impressions: Number(r.impressions || r.curr_impr) || 0,
            ctr: Math.round((Number(r.ctr) || 0) * 100) / 100,
            position: Math.round((Number(r.position || r.curr_pos) || 0) * 10) / 10
        });

        return {
            domain: plain.domain,
            period_days: days,
            striking_distance: (striking || []).map(fmt),
            low_ctr: (lowCtr || []).map(fmt),
            high_impression_no_click: (zeroClicks || []).map(fmt),
            rising: (rising || []).map((r: any) => ({
                keyword: r.k,
                current_clicks: Number(r.curr_clicks) || 0,
                previous_clicks: Number(r.prev_clicks) || 0,
                gain: (Number(r.curr_clicks) || 0) - (Number(r.prev_clicks) || 0),
                current_impressions: Number(r.curr_impr) || 0,
                current_position: Math.round((Number(r.curr_pos) || 0) * 10) / 10
            })),
            recommendations: [
                '🎯 Striking distance keywords are the fastest wins — write focused sections targeting them.',
                '✏️  Low-CTR keywords need better titles/meta descriptions (rewrite, don\'t rebuild).',
                '🔍 Zero-click high-impression keywords signal content/intent mismatch — check the top-ranking pages.',
                '📈 Rising keywords reveal audience demand — double down on these topics.'
            ]
        };
    }
};

const generateContentBriefTool: ToolDefinition = {
    name: 'generate_content_brief',
    description:
        'Generate a complete content brief for writing a new article on a given topic. Combines: (1) current domain SEO performance, (2) related keywords already tracked, (3) striking-distance opportunities, (4) top-performing pages to link from, (5) competitor insight, and (6) recommended primary/secondary keywords + target word count. This is the FIRST thing to call when planning any new article.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            topic: { type: 'string', description: 'Topic / keyword the author wants to write about' },
            days: { type: 'number', default: 90 }
        },
        required: ['domain', 'topic']
    },
    requiredScope: 'read:gsc',
    async execute(args, ctx) {
        requireScope(ctx, 'read:gsc');
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain: args.domain } });
        if (!d) throw new Error('domain_not_found');
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });

        const db = (await import('../../database/database')).default;
        const days = args.days || 90;
        const domainId = plain.ID;
        const topic = String(args.topic).toLowerCase().trim();

        // 1. Overall domain snapshot
        const [[snap]]: any = await db.query(
            `SELECT SUM(clicks) clicks, SUM(impressions) impressions,
                    AVG(ctr) ctr, AVG(position) position
             FROM gsc_daily_stats
             WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            { replacements: [domainId, days] }
        );

        // 2. Related GSC keywords containing the topic words
        const topicWords = topic.split(/\s+/).filter((w) => w.length > 2);
        const likeClauses = topicWords.map(() => `keyword LIKE ?`).join(' OR ');
        const likeParams = topicWords.map((w) => `%${w}%`);

        const [related]: any = likeClauses
            ? await db.query(
                `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions,
                        AVG(ctr) ctr, AVG(position) position
                 FROM search_analytics
                 WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                   AND (${likeClauses})
                 GROUP BY keyword
                 ORDER BY impressions DESC
                 LIMIT 25`,
                { replacements: [domainId, days, ...likeParams] }
            )
            : [[]];

        // 3. Top pages for this topic — good internal linking targets
        const [topPages]: any = likeClauses
            ? await db.query(
                `SELECT page, SUM(clicks) clicks, SUM(impressions) impressions, AVG(position) position
                 FROM search_analytics
                 WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                   AND (${likeClauses})
                 GROUP BY page
                 HAVING clicks > 0
                 ORDER BY clicks DESC
                 LIMIT 10`,
                { replacements: [domainId, days, ...likeParams] }
            )
            : [[]];

        // 4. Competitors configured for this domain
        let competitors: string[] = [];
        try {
            competitors = typeof plain.competitors === 'string'
                ? JSON.parse(plain.competitors || '[]')
                : (plain.competitors || []);
        } catch { }

        // 5. Pick primary + secondary keywords from related
        const relatedArr = (related || []).map((r: any) => ({
            keyword: r.keyword,
            clicks: Number(r.clicks) || 0,
            impressions: Number(r.impressions) || 0,
            ctr: Math.round((Number(r.ctr) || 0) * 100) / 100,
            position: Math.round((Number(r.position) || 0) * 10) / 10
        }));

        // Primary = highest-impression keyword where we DON'T already rank well (opportunity)
        // Fallback = highest impressions overall
        const sorted = [...relatedArr].sort((a, b) => b.impressions - a.impressions);
        const primary =
            sorted.find((k) => k.position >= 5 && k.position <= 30 && k.impressions >= 10) ||
            sorted[0];
        const secondary = sorted
            .filter((k) => k.keyword !== primary?.keyword)
            .slice(0, 4);

        // 6. Target word count based on competition (simple heuristic)
        const targetWords =
            primary && primary.impressions > 500 ? 1500 :
            primary && primary.impressions > 100 ? 1200 : 900;

        const brief = {
            domain: plain.domain,
            topic: args.topic,
            period_days: days,
            domain_snapshot: {
                total_clicks: Number(snap?.clicks) || 0,
                total_impressions: Number(snap?.impressions) || 0,
                avg_ctr: Number(snap?.ctr) || 0,
                avg_position: Math.round((Number(snap?.position) || 0) * 10) / 10
            },
            related_keywords: relatedArr,
            recommended: {
                primary_keyword: primary?.keyword || null,
                primary_reason: primary
                    ? `Position ${primary.position} with ${primary.impressions} impressions — clear opportunity to push higher.`
                    : 'No existing GSC data for this topic — you will be building rankings from scratch.',
                secondary_keywords: secondary.map((s) => s.keyword),
                target_word_count: targetWords,
                suggested_structure: [
                    `H1: Article title containing "${primary?.keyword || args.topic}"`,
                    'Intro (100-150 words) — mention primary keyword in first sentence',
                    ...secondary.slice(0, 3).map((s, i) => `H2 #${i + 1}: Section targeting "${s.keyword}"`),
                    'H2: Examples / data / case studies',
                    'H2: FAQ (use "People also ask" queries)',
                    'Conclusion + internal links to related articles'
                ]
            },
            internal_link_candidates: (topPages || []).map((p: any) => ({
                page: p.page,
                clicks: Number(p.clicks) || 0,
                impressions: Number(p.impressions) || 0,
                position: Math.round((Number(p.position) || 0) * 10) / 10
            })),
            competitors,
            next_steps: [
                '1. Review the primary + secondary keywords and adjust if you know the intent better.',
                '2. Scan the internal_link_candidates to plan where you will link from and to.',
                '3. Draft the article using save_post (status="draft") — SEO score runs automatically.',
                '4. Iterate using analyze_seo until score ≥ 85, then publish.'
            ]
        };

        return brief;
    }
};

// ---------------------------------------------------------------------------
// Posts / SEO content tools
// ---------------------------------------------------------------------------

const listPostsTool: ToolDefinition = {
    name: 'list_posts',
    description: 'List articles/posts belonging to a domain in the active workspace.',
    inputSchema: {
        type: 'object',
        properties: {
            domain: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published', 'scheduled', 'all'] }
        },
        required: ['domain']
    },
    requiredScope: 'read:domains',
    async execute(args, ctx) {
        requireScope(ctx, 'read:domains');
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain: args.domain } });
        if (!d) throw new Error('domain_not_found');
        const where: any = { domain_id: d.ID };
        if (args.status && args.status !== 'all') where.status = args.status;
        const posts = await Post.findAll({ where, order: [['updated_at', 'DESC']] });
        return posts.map((p: any) => {
            const o = p.get({ plain: true });
            return {
                id: o.id,
                title: o.title,
                slug: o.slug,
                status: o.status,
                seo_score: o.seo_score,
                updated_at: o.updated_at
            };
        });
    }
};

const getPostTool: ToolDefinition = {
    name: 'get_post',
    description: 'Fetch a single post with its full HTML content and metadata.',
    inputSchema: {
        type: 'object',
        properties: { post_id: { type: 'number' } },
        required: ['post_id']
    },
    requiredScope: 'read:domains',
    async execute(args, ctx) {
        requireScope(ctx, 'read:domains');
        const post: any = await Post.findByPk(args.post_id);
        if (!post) throw new Error('post_not_found');
        const p = post.get({ plain: true });
        // Verify the post's domain belongs to the workspace
        const d: any = await Domain.findOne({ where: { ID: p.domain_id, workspace_id: ctx.workspaceId } });
        if (!d) throw new Error('forbidden');
        return p;
    }
};

const analyzeSeoTool: ToolDefinition = {
    name: 'analyze_seo',
    description:
        'Run a professional SEO analysis on article content (title + meta + HTML body + focus keywords). Returns a 0-100 score, grade, statistics (word count, keyword density, headings, links, images) and a list of actionable checks covering 20+ on-page SEO factors. Use this BEFORE publishing any content and to improve existing posts.',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            meta_description: { type: 'string' },
            content: { type: 'string', description: 'HTML body of the article' },
            focus_keywords: { type: 'array', items: { type: 'string' }, description: 'Up to 3 focus keywords, first one is primary' },
            slug: { type: 'string' },
            language: { type: 'string' }
        },
        required: ['title', 'content']
    },
    requiredScope: 'read:profile',
    async execute(args, ctx) {
        requireScope(ctx, 'read:profile');
        return analyzeSEO({
            title: args.title,
            meta_description: args.meta_description,
            content: args.content,
            focus_keywords: args.focus_keywords,
            slug: args.slug,
            language: args.language
        });
    }
};

const createOrUpdatePostTool: ToolDefinition = {
    name: 'save_post',
    description:
        'Create or update an article. The SEO score is automatically computed by the built-in analyzer and stored with the post. If an `id` is provided, the post is updated; otherwise a new draft is created. Returns the saved post plus the full SEO analysis report so you can show the author what to improve.',
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'number', description: 'Post ID to update. Omit to create a new post.' },
            domain: { type: 'string', description: 'Domain the post belongs to' },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string', description: 'HTML body' },
            meta_description: { type: 'string' },
            featured_image: { type: 'string' },
            focus_keywords: { type: 'array', items: { type: 'string' }, maxItems: 3 },
            status: { type: 'string', enum: ['draft', 'published', 'scheduled'], default: 'draft' }
        },
        required: ['domain', 'title', 'content']
    },
    requiredScope: 'write:domains',
    async execute(args, ctx) {
        requireScope(ctx, 'write:domains');
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain: args.domain } });
        if (!d) throw new Error('domain_not_found');

        // Run SEO analysis first
        const report = analyzeSEO({
            title: args.title,
            meta_description: args.meta_description,
            content: args.content,
            focus_keywords: args.focus_keywords,
            slug: args.slug
        });

        const slug =
            args.slug ||
            args.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 80);

        let post: any;
        if (args.id) {
            post = await Post.findByPk(args.id);
            if (!post) throw new Error('post_not_found');
            // Verify domain match
            const po = post.get({ plain: true });
            if (po.domain_id !== d.ID) throw new Error('forbidden');
            await post.update({
                title: args.title,
                slug,
                content: args.content,
                meta_description: args.meta_description || null,
                featured_image: args.featured_image || null,
                focus_keywords: args.focus_keywords || [],
                status: args.status || po.status || 'draft',
                seo_score: report.score
            });
        } else {
            post = await Post.create({
                domain_id: d.ID,
                title: args.title,
                slug,
                content: args.content,
                meta_description: args.meta_description || null,
                featured_image: args.featured_image || null,
                focus_keywords: args.focus_keywords || [],
                status: args.status || 'draft',
                seo_score: report.score
            } as any);
        }

        const saved = post.get({ plain: true });
        return { post: saved, seo_report: report };
    }
};

const deletePostTool: ToolDefinition = {
    name: 'delete_post',
    description: 'Delete a post by ID.',
    inputSchema: {
        type: 'object',
        properties: { post_id: { type: 'number' } },
        required: ['post_id']
    },
    requiredScope: 'write:domains',
    async execute(args, ctx) {
        requireScope(ctx, 'write:domains');
        const post: any = await Post.findByPk(args.post_id);
        if (!post) throw new Error('post_not_found');
        const p = post.get({ plain: true });
        const d: any = await Domain.findOne({ where: { ID: p.domain_id, workspace_id: ctx.workspaceId } });
        if (!d) throw new Error('forbidden');
        await post.destroy();
        return { ok: true };
    }
};

const getProfileTool: ToolDefinition = {
    name: 'get_profile',
    description: 'Return the authenticated user profile.',
    inputSchema: { type: 'object', properties: {} },
    requiredScope: 'read:profile',
    async execute(_args, ctx) {
        requireScope(ctx, 'read:profile');
        const u: any = await User.findByPk(ctx.userId);
        if (!u) throw new Error('user_not_found');
        return { id: u.id, name: u.name, email: u.email, picture: u.picture };
    }
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const TOOLS: ToolDefinition[] = [
    getProfileTool,
    getCurrentWorkspaceTool,
    listDomainsTool,
    getDomainInsightTool,
    getDomainKeywordsTool,
    listTrackedKeywordsTool,
    addTrackedKeywordTool,
    listDomainCompetitorsTool,
    updateDomainCompetitorsTool,
    getKeywordCompetitorsTool,
    getCompetitorHistoryTool,
    getDomainSeoOverviewTool,
    findKeywordOpportunitiesTool,
    generateContentBriefTool,
    listPostsTool,
    getPostTool,
    analyzeSeoTool,
    createOrUpdatePostTool,
    deletePostTool
];

export function getTool(name: string): ToolDefinition | undefined {
    return TOOLS.find((t) => t.name === name);
}

export function listTools() {
    return TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
    }));
}
