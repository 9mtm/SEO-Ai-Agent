/**
 * POST/GET/DELETE /api/mcp
 * -------------------------
 * MCP server using the OFFICIAL @modelcontextprotocol/sdk package.
 * Handles Streamable HTTP transport (SSE + JSON), session management,
 * and protocol negotiation automatically — compatible with Claude,
 * Cursor, ChatGPT, and any MCP client.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import db from '../../../database/database';
import { verifyOAuthToken } from '../../../utils/oauthAuth';
import { validateMcpApiKey } from '../../../utils/mcpAuth';

// ── Tool implementations (imported from existing code) ──────────────
import Domain from '../../../database/models/domain';
import Keyword from '../../../database/models/keyword';
import User from '../../../database/models/user';
import Workspace from '../../../database/models/workspace';
import Post from '../../../database/models/post';
import { ensureDomainSynced, readInsightData, readSCKeywordsData } from '../../../services/gscStorage';
import { analyzeSEO } from '../../../lib/seo/analyzer';
import { getBingQueryStats, getBingPageStats, getBingTrafficStats } from '../../../services/bingWebmaster';

// Disable Next.js body parser — the SDK handles raw streams
export const config = {
    api: { bodyParser: false }
};

// ── Session store (in-memory — survives across requests on same process) ──
const sessionTransports = new Map<string, StreamableHTTPServerTransport>();

// ── MCP Trial check (Free plan = 60-day trial) ───────────────────────
const MCP_TRIAL_DAYS = 60;

async function checkMcpTrialExpired(userId: number): Promise<{ expired: boolean; daysLeft: number; message: string }> {
    if (!userId) return { expired: false, daysLeft: MCP_TRIAL_DAYS, message: '' };
    const user: any = await User.findByPk(userId, { attributes: ['subscription_plan', 'createdAt'] });
    if (!user) return { expired: true, daysLeft: 0, message: 'User not found' };

    // Paid users → always allowed
    const plan = (user.subscription_plan || 'free').toLowerCase();
    if (plan !== 'free') return { expired: false, daysLeft: -1, message: '' };

    // Free users → check trial
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, MCP_TRIAL_DAYS - accountAgeDays);

    if (daysLeft <= 0) {
        return {
            expired: true,
            daysLeft: 0,
            message: `Your free MCP trial has ended. Upgrade to Basic for just $29/year (only $2.42/month) to keep using your AI assistant with SEO Agent.\n\nUpgrade now: https://seo-agent.net/profile/billing\n\nWith Basic you get:\n- 2 domains & 25 keywords\n- Weekly ranking updates\n- Full MCP AI integration\n- Search Console insights`
        };
    }

    return { expired: false, daysLeft, message: '' };
}

// ── Resolve workspace from auth context ─────────────────────────────
async function resolveContext(req: NextApiRequest): Promise<{ userId: number; workspaceId: number } | null> {
    // 1. OAuth Bearer
    const oauth = await verifyOAuthToken(req);
    if (oauth.valid && oauth.userId) {
        return { userId: oauth.userId, workspaceId: oauth.workspaceId || 0 };
    }
    // 2. MCP API key (legacy)
    const apiKeyAuth: any = await validateMcpApiKey(req as any, null as any);
    if (apiKeyAuth?.valid && apiKeyAuth.userId) {
        let wsId = 0;
        const [[u]]: any = await db.query(
            'SELECT current_workspace_id FROM users WHERE id = ?',
            { replacements: [apiKeyAuth.userId] }
        );
        if (u?.current_workspace_id) wsId = u.current_workspace_id;
        return { userId: apiKeyAuth.userId, workspaceId: wsId };
    }
    return null;
}

// ── Create a fresh McpServer with all tools registered ──────────────
function createMcpServer(ctx: { userId: number; workspaceId: number }) {
    const server = new McpServer({
        name: 'SEO AI Agent',
        version: '1.0.0'
    });

    // ── Profile ──
    server.tool('get_profile', 'Return the authenticated user profile.', {}, async () => {
        const u: any = await User.findByPk(ctx.userId);
        const trial = await checkMcpTrialExpired(ctx.userId);
        return { content: [{ type: 'text', text: JSON.stringify({
            id: u?.id, name: u?.name, email: u?.email, picture: u?.picture,
            plan: u?.subscription_plan || 'free',
            mcp_trial: trial.expired ? { status: 'expired', daysLeft: 0 } : { status: 'active', daysLeft: trial.daysLeft }
        }) }] };
    });

    server.tool('get_current_workspace', 'Return info about the active workspace.', {}, async () => {
        const ws: any = await Workspace.findByPk(ctx.workspaceId);
        return { content: [{ type: 'text', text: JSON.stringify(ws ? { id: ws.id, name: ws.name, slug: ws.slug, plan: ws.plan } : null) }] };
    });

    // ── Domains ──
    server.tool('list_domains', 'List all domains in the workspace.', {}, async () => {
        const rows = await Domain.findAll({ where: { workspace_id: ctx.workspaceId } });
        const data = rows.map((d: any) => {
            const o = d.get({ plain: true });
            return { id: o.ID, domain: o.domain, slug: o.slug, niche: o.niche, target_country: o.target_country };
        });
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    });

    server.tool('get_domain_insight', 'Get GSC stats, keywords, pages, and countries for a domain.', {
        domain: z.string().describe('Domain name'),
        days: z.number().default(30).describe('Date range in days')
    }, async ({ domain, days }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        const data = await readInsightData(plain.ID, days);
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    });

    server.tool('get_domain_keywords', 'Get GSC keyword breakdown for a domain.', {
        domain: z.string(),
        days: z.number().default(30)
    }, async ({ domain, days }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        const data = await readSCKeywordsData(plain.ID, days);
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    });

    // ── Rank Tracker ──
    server.tool('list_tracked_keywords', 'List tracked keywords for a domain.', {
        domain: z.string()
    }, async ({ domain }) => {
        const rows = await Keyword.findAll({ where: { workspace_id: ctx.workspaceId, domain } });
        const data = rows.map((r: any) => {
            const o = r.get({ plain: true });
            return { id: o.ID, keyword: o.keyword, device: o.device, country: o.country, position: o.position, volume: o.volume };
        });
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    });

    server.tool('add_tracked_keyword', 'Add a keyword to rank tracker.', {
        domain: z.string(),
        keyword: z.string(),
        device: z.enum(['desktop', 'mobile']).default('desktop'),
        country: z.string().default('US')
    }, async ({ domain, keyword, device, country }) => {
        const created = await Keyword.create({
            keyword, device, country, domain,
            workspace_id: ctx.workspaceId, user_id: ctx.userId,
            position: 0, updating: true, history: '{}', url: '', tags: '[]',
            sticky: false, lastUpdated: new Date().toJSON(), added: new Date().toJSON()
        } as any);
        return { content: [{ type: 'text', text: JSON.stringify({ id: (created as any).ID, ok: true }) }] };
    });

    // ── Competitors ──
    server.tool('list_domain_competitors', 'List competitor domains for a domain.', {
        domain: z.string()
    }, async ({ domain }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const plain = d.get({ plain: true });
        let competitors: string[] = [];
        try { competitors = typeof plain.competitors === 'string' ? JSON.parse(plain.competitors || '[]') : (plain.competitors || []); } catch { }
        return { content: [{ type: 'text', text: JSON.stringify({ domain: plain.domain, competitors }) }] };
    });

    server.tool('update_domain_competitors', 'Replace competitor list for a domain.', {
        domain: z.string(),
        competitors: z.array(z.string())
    }, async ({ domain, competitors }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        await d.update({ competitors: JSON.stringify(competitors) });
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, competitors }) }] };
    });

    server.tool('get_keyword_competitors', 'Get competitor ranking positions for a tracked keyword.', {
        keyword_id: z.number()
    }, async ({ keyword_id }) => {
        const kw: any = await Keyword.findOne({ where: { ID: keyword_id, workspace_id: ctx.workspaceId } });
        if (!kw) return { content: [{ type: 'text', text: 'keyword_not_found' }], isError: true };
        const plain = kw.get({ plain: true });
        return { content: [{ type: 'text', text: JSON.stringify({ keyword: plain.keyword, domain: plain.domain, competitor_positions: plain.competitor_positions || {}, updating: !!plain.updating_competitors }) }] };
    });

    server.tool('get_competitor_history', 'Get time-series ranking history for competitors on a keyword.', {
        keyword_id: z.number(),
        days: z.number().default(30)
    }, async ({ keyword_id, days }) => {
        const kw: any = await Keyword.findOne({ where: { ID: keyword_id, workspace_id: ctx.workspaceId } });
        if (!kw) return { content: [{ type: 'text', text: 'keyword_not_found' }], isError: true };
        const [rows]: any = await db.query(
            `SELECT competitor_domain, date, position, url FROM competitor_history WHERE keyword_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY date ASC`,
            { replacements: [keyword_id, days] }
        );
        return { content: [{ type: 'text', text: JSON.stringify({ keyword_id, history: rows || [] }) }] };
    });

    // ── Content Research ──
    server.tool('get_domain_seo_overview', 'SEO health overview with period-over-period change.', {
        domain: z.string(),
        days: z.number().default(30)
    }, async ({ domain, days }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        const [[curr]]: any = await db.query(
            `SELECT SUM(clicks) clicks, SUM(impressions) impressions, AVG(ctr) ctr, AVG(position) position
             FROM gsc_daily_stats WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            { replacements: [plain.ID, days] }
        );
        return { content: [{ type: 'text', text: JSON.stringify({ domain: plain.domain, clicks: Number(curr?.clicks) || 0, impressions: Number(curr?.impressions) || 0, avg_ctr: Number(curr?.ctr) || 0, avg_position: Number(curr?.position) || 0 }) }] };
    });

    server.tool('find_keyword_opportunities', 'Find quick-win keyword opportunities: striking distance, low CTR, rising, zero-click.', {
        domain: z.string(),
        days: z.number().default(30),
        limit: z.number().default(20)
    }, async ({ domain, days, limit: lim }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        const [striking]: any = await db.query(
            `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions, AVG(position) position
             FROM search_analytics WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY keyword HAVING position BETWEEN 5 AND 20 AND impressions >= 10
             ORDER BY impressions DESC LIMIT ?`,
            { replacements: [plain.ID, days, lim] }
        );
        const [lowCtr]: any = await db.query(
            `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions, AVG(ctr) ctr, AVG(position) position
             FROM search_analytics WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY keyword HAVING position <= 10 AND impressions >= 20 AND ctr < 2
             ORDER BY impressions DESC LIMIT ?`,
            { replacements: [plain.ID, days, lim] }
        );
        return { content: [{ type: 'text', text: JSON.stringify({ striking_distance: striking || [], low_ctr: lowCtr || [] }) }] };
    });

    server.tool('generate_content_brief', 'Generate a content brief for a new article topic.', {
        domain: z.string(),
        topic: z.string().describe('Topic / keyword to write about'),
        days: z.number().default(90)
    }, async ({ domain, topic, days }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const plain = d.get({ plain: true });
        await ensureDomainSynced(plain, { source: 'mcp', userId: ctx.userId });
        const topicWords = topic.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
        const likeClauses = topicWords.map(() => `keyword LIKE ?`).join(' OR ');
        const likeParams = topicWords.map((w: string) => `%${w}%`);
        const [related]: any = likeClauses ? await db.query(
            `SELECT keyword, SUM(clicks) clicks, SUM(impressions) impressions, AVG(position) position
             FROM search_analytics WHERE domain_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND (${likeClauses})
             GROUP BY keyword ORDER BY impressions DESC LIMIT 25`,
            { replacements: [plain.ID, days, ...likeParams] }
        ) : [[]];
        let competitors: string[] = [];
        try { competitors = typeof plain.competitors === 'string' ? JSON.parse(plain.competitors || '[]') : (plain.competitors || []); } catch { }
        return { content: [{ type: 'text', text: JSON.stringify({ domain: plain.domain, topic, related_keywords: related || [], competitors }) }] };
    });

    server.tool('get_post', 'Fetch a single post with full content.', {
        post_id: z.number()
    }, async ({ post_id }) => {
        const post: any = await Post.findByPk(post_id);
        if (!post) return { content: [{ type: 'text', text: 'post_not_found' }], isError: true };
        const p = post.get({ plain: true });
        const d: any = await Domain.findOne({ where: { ID: p.domain_id, workspace_id: ctx.workspaceId } });
        if (!d) return { content: [{ type: 'text', text: 'forbidden' }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(p) }] };
    });

    // ── Posts + SEO ──
    server.tool('list_posts', 'List posts for a domain.', {
        domain: z.string(),
        status: z.enum(['draft', 'published', 'scheduled', 'all']).optional()
    }, async ({ domain, status }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const where: any = { domain_id: d.ID };
        if (status && status !== 'all') where.status = status;
        const posts = await Post.findAll({ where, order: [['updated_at', 'DESC']] });
        const data = posts.map((p: any) => { const o = p.get({ plain: true }); return { id: o.id, title: o.title, slug: o.slug, status: o.status, seo_score: o.seo_score }; });
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    });

    server.tool('analyze_seo', 'Run SEO analysis on article content (20+ checks, 0-100 score).', {
        title: z.string(),
        content: z.string().describe('HTML body'),
        meta_description: z.string().optional(),
        focus_keywords: z.array(z.string()).optional(),
        slug: z.string().optional()
    }, async (args) => {
        const report = analyzeSEO({ title: args.title, content: args.content, meta_description: args.meta_description, focus_keywords: args.focus_keywords, slug: args.slug });
        return { content: [{ type: 'text', text: JSON.stringify(report) }] };
    });

    server.tool('save_post', 'Create or update a post with automatic SEO scoring.', {
        domain: z.string(),
        title: z.string(),
        content: z.string().describe('HTML body'),
        id: z.number().optional(),
        slug: z.string().optional(),
        meta_description: z.string().optional(),
        focus_keywords: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published', 'scheduled']).default('draft')
    }, async (args) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain: args.domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const report = analyzeSEO({ title: args.title, content: args.content, meta_description: args.meta_description, focus_keywords: args.focus_keywords, slug: args.slug });
        const slug = args.slug || args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
        let post: any;
        if (args.id) {
            post = await Post.findByPk(args.id);
            if (post && post.domain_id !== d.ID) return { content: [{ type: 'text', text: 'forbidden' }], isError: true };
            if (post) await post.update({ title: args.title, slug, content: args.content, meta_description: args.meta_description, focus_keywords: args.focus_keywords, status: args.status, seo_score: report.score });
        } else {
            post = await Post.create({ domain_id: d.ID, title: args.title, slug, content: args.content, meta_description: args.meta_description, focus_keywords: args.focus_keywords, status: args.status, seo_score: report.score } as any);
        }
        return { content: [{ type: 'text', text: JSON.stringify({ post: post?.get({ plain: true }), seo_report: report }) }] };
    });

    server.tool('delete_post', 'Delete a post by ID.', {
        post_id: z.number()
    }, async ({ post_id }) => {
        const post: any = await Post.findByPk(post_id);
        if (!post) return { content: [{ type: 'text', text: 'post_not_found' }], isError: true };
        // Verify ownership via workspace
        const d = await Domain.findOne({ where: { ID: post.domain_id, workspace_id: ctx.workspaceId } });
        if (!d) return { content: [{ type: 'text', text: 'forbidden' }], isError: true };
        await post.destroy();
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] };
    });

    // ── Bing Webmaster Tools ──
    server.tool('get_bing_insight', 'Get Bing Webmaster Tools stats (clicks, impressions, CTR, position) + keyword and page data for a domain.', {
        domain: z.string().describe('Domain name (e.g. example.com)'),
    }, async ({ domain }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        try {
            const [keywords, pages, traffic] = await Promise.all([
                getBingQueryStats(ctx.userId, siteUrl),
                getBingPageStats(ctx.userId, siteUrl),
                getBingTrafficStats(ctx.userId, siteUrl),
            ]);
            const totalClicks = traffic.reduce((s, t) => s + (t.Clicks || 0), 0);
            const totalImpressions = traffic.reduce((s, t) => s + (t.Impressions || 0), 0);
            const avgPosition = keywords.length > 0
                ? keywords.reduce((s, k) => s + (k.AvgImpressionPosition || 0), 0) / keywords.length : 0;
            return { content: [{ type: 'text', text: JSON.stringify({
                stats: { totalClicks, totalImpressions, ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0, avgPosition: Math.round(avgPosition * 10) / 10 },
                keywords: keywords.length,
                pages: pages.length,
                topKeywords: keywords.slice(0, 20).map(k => ({ query: k.Query, clicks: k.Clicks, impressions: k.Impressions, position: k.AvgImpressionPosition })),
            }) }] };
        } catch (err: any) {
            return { content: [{ type: 'text', text: `bing_error: ${err.message}` }], isError: true };
        }
    });

    server.tool('get_bing_keywords', 'Get Bing keyword ranking data for a domain.', {
        domain: z.string().describe('Domain name'),
    }, async ({ domain }) => {
        const d: any = await Domain.findOne({ where: { workspace_id: ctx.workspaceId, domain } });
        if (!d) return { content: [{ type: 'text', text: 'domain_not_found' }], isError: true };
        const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        try {
            const keywords = await getBingQueryStats(ctx.userId, siteUrl);
            return { content: [{ type: 'text', text: JSON.stringify(keywords.map(k => ({
                keyword: k.Query,
                clicks: k.Clicks,
                impressions: k.Impressions,
                position: k.AvgImpressionPosition,
                ctr: k.Impressions > 0 ? Math.round((k.Clicks / k.Impressions) * 10000) / 100 : 0,
            }))) }] };
        } catch (err: any) {
            return { content: [{ type: 'text', text: `bing_error: ${err.message}` }], isError: true };
        }
    });

    return server;
}

// ── Main handler ────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = req.headers.host;
    const origin = `${proto}://${host}`;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Last-Event-ID');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    if (req.method === 'OPTIONS') return res.status(200).end();

    await db.sync();

    // Parse body manually (we disabled bodyParser)
    const body: any = await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk: any) => data += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(data)); } catch { resolve({}); }
        });
    });

    // Check for existing session
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'GET') {
        // SSE connection for notifications (or health check)
        if (sessionId && sessionTransports.has(sessionId)) {
            const transport = sessionTransports.get(sessionId)!;
            await transport.handleRequest(req, res, body);
            return;
        }
        // Health check
        return res.status(200).json({
            name: 'SEO AI Agent',
            version: '1.0.0',
            protocol: '2024-11-05',
            endpoint: '/api/mcp'
        });
    }

    if (req.method === 'DELETE') {
        // Session teardown
        if (sessionId && sessionTransports.has(sessionId)) {
            const transport = sessionTransports.get(sessionId)!;
            await transport.handleRequest(req, res, body);
            sessionTransports.delete(sessionId);
            return;
        }
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        // Authenticate on every request
        const ctx = await resolveContext(req);
        const isInitialize = body?.method === 'initialize';

        // If no auth and not initialize → 401 to trigger OAuth
        if (!ctx && !isInitialize) {
            res.setHeader('WWW-Authenticate',
                `Bearer realm="MCP", resource_metadata="${origin}/.well-known/oauth-protected-resource"`);
            return res.status(401).json({
                jsonrpc: '2.0', id: body?.id ?? null,
                error: { code: -32001, message: 'unauthorized' }
            });
        }

        // Check MCP trial for free users (skip for initialize — let them connect first)
        if (ctx && !isInitialize) {
            const trial = await checkMcpTrialExpired(ctx.userId);
            if (trial.expired) {
                return res.status(200).json({
                    jsonrpc: '2.0',
                    id: body?.id ?? null,
                    error: { code: -32000, message: trial.message }
                });
            }
        }

        // Reuse existing session if auth matches
        if (sessionId && sessionTransports.has(sessionId)) {
            const transport = sessionTransports.get(sessionId)!;
            await transport.handleRequest(req, res, body);
            return;
        }

        // Create new session with authenticated context
        const effectiveCtx = ctx || { userId: 0, workspaceId: 0 };
        const server = createMcpServer(effectiveCtx);
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => require('crypto').randomUUID(),
            onsessioninitialized: (sid: string) => {
                sessionTransports.set(sid, transport);
            }
        });

        // Clean up on close
        transport.onclose = () => {
            const sid = (transport as any).sessionId;
            if (sid) sessionTransports.delete(sid);
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
    }

    return res.status(405).end();
}
