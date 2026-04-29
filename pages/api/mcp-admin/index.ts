/**
 * POST/GET/DELETE /api/mcp-admin
 * --------------------------------
 * OWNER-ONLY MCP server for blog management.
 *
 * Auth: ONLY the static `ADMIN_MCP_TOKEN` env var works here. Personal user
 * tokens, OAuth tokens, and `is_super_admin` users on the regular MCP cannot
 * touch these tools — this endpoint refuses everything else.
 *
 * This is intentionally separate from /api/mcp (the public per-user MCP) so
 * blog/admin tools can never leak into a normal user's tool list.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import db from '../../../database/database';
import User from '../../../database/models/user';
import BlogPost from '../../../database/models/blogPost';
import BlogPostTranslation from '../../../database/models/blogPostTranslation';

export const config = { api: { bodyParser: false } };

const sessionTransports = new Map<string, StreamableHTTPServerTransport>();

function authorizeAdmin(req: NextApiRequest): boolean {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7);
    const expected = process.env.ADMIN_MCP_TOKEN;
    return Boolean(expected) && token === expected;
}

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}

function createAdminMcpServer() {
    const adminName = process.env.ADMIN_MCP_NAME || 'Admin';
    const adminEmail = process.env.ADMIN_MCP_EMAIL || '';
    const server = new McpServer({ name: 'SEO Agent Admin', version: '1.0.0' });

    // Resolve the admin User record (used as author on posts)
    const getAdmin = async () => {
        if (adminEmail) {
            const u: any = await User.findOne({ where: { email: adminEmail }, attributes: ['id', 'name', 'picture'] });
            if (u) return u.get({ plain: true });
        }
        return { id: null, name: adminName, picture: null };
    };

    // ── Blog list / read ──
    server.tool('list_blog_posts', 'List all public marketing blog posts at /blog (drafts, scheduled, and published).', {
        status: z.enum(['draft', 'published', 'scheduled', 'all']).default('all').describe('Filter by status'),
        limit: z.number().default(50),
    }, async ({ status, limit }) => {
        const where: any = {};
        if (status !== 'all') where.status = status;
        const rows = await BlogPost.findAll({ where, order: [['createdAt', 'DESC']], limit });
        const data = rows.map((p: any) => {
            const o = p.get({ plain: true });
            return { id: o.id, title: o.title, slug: o.slug, status: o.status, scheduled_for: o.scheduled_for, published_at: o.published_at, category: o.category, createdAt: o.createdAt };
        });
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    });

    server.tool('get_blog_post', 'Fetch a public blog post (with all translations) by ID or slug.', {
        id: z.number().optional(),
        slug: z.string().optional(),
    }, async ({ id, slug }) => {
        if (!id && !slug) return { content: [{ type: 'text', text: 'id or slug required' }], isError: true };
        const post: any = id
            ? await BlogPost.findByPk(id, { include: [{ model: BlogPostTranslation, as: 'translations' }] })
            : await BlogPost.findOne({ where: { slug }, include: [{ model: BlogPostTranslation, as: 'translations' }] });
        if (!post) return { content: [{ type: 'text', text: 'not_found' }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(post.get({ plain: true })) }] };
    });

    // ── Create / update / delete ──
    server.tool(
        'create_blog_post',
        'Create a public marketing blog post at /blog. Pass `locale` for the primary language. Pass `translations` array to add additional languages in the same call (e.g. de/fr/ar). Status: "draft" (hidden), "published" (live), or "scheduled" (auto-publishes at scheduled_for).',
        {
            title: z.string(),
            content: z.string().describe('HTML or Markdown content (primary language)'),
            excerpt: z.string().optional(),
            featured_image: z.string().optional().describe('URL of the featured image. Generate one first via generate_blog_image.'),
            category: z.string().optional(),
            tags: z.array(z.string()).optional(),
            status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
            scheduled_for: z.string().optional().describe('ISO datetime — required when status is "scheduled". Must be a future date.'),
            meta_title: z.string().optional(),
            meta_description: z.string().optional(),
            locale: z.string().default('en').describe('Primary language code (en/de/fr/ar/...)'),
            slug: z.string().optional(),
            translations: z.array(z.object({
                locale: z.string(),
                title: z.string(),
                content: z.string(),
                excerpt: z.string().optional(),
                meta_title: z.string().optional(),
                meta_description: z.string().optional(),
                slug: z.string().optional(),
            })).optional().describe('Extra-language translations to create alongside the primary post.'),
        },
        async ({ title, content, excerpt, featured_image, category, tags, status, scheduled_for, meta_title, meta_description, locale, slug, translations }) => {
            const admin = await getAdmin();
            if (status === 'scheduled') {
                if (!scheduled_for) return { content: [{ type: 'text', text: 'scheduled_for is required when status is scheduled' }], isError: true };
                if (new Date(scheduled_for).getTime() <= Date.now()) return { content: [{ type: 'text', text: 'scheduled_for must be a future date' }], isError: true };
            }
            const finalSlug = slugify(slug || title);
            const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
            const readingTime = Math.max(1, Math.round(wordCount / 200));
            const autoExcerpt = excerpt || content.replace(/<[^>]+>/g, ' ').slice(0, 160).trim();

            const post: any = await BlogPost.create({
                title, slug: finalSlug, content,
                excerpt: autoExcerpt,
                featured_image, category,
                tags: tags || [],
                status,
                published_at: status === 'published' ? new Date() : null,
                scheduled_for: status === 'scheduled' ? new Date(scheduled_for!) : null,
                meta_title: meta_title || title.slice(0, 70),
                meta_description: meta_description || autoExcerpt.slice(0, 160),
                reading_time: readingTime,
                author_name: admin.name || 'Admin',
                author_avatar: admin.picture || null,
                author_user_id: admin.id || null,
            } as any);

            await BlogPostTranslation.create({
                blog_post_id: post.id, locale, title, slug: finalSlug, content,
                excerpt: autoExcerpt,
                meta_title: meta_title || title.slice(0, 70),
                meta_description: meta_description || autoExcerpt.slice(0, 160),
                reading_time: readingTime,
            });

            const createdLocales: string[] = [locale];
            if (translations && translations.length > 0) {
                for (const tr of translations) {
                    if (tr.locale === locale) continue;
                    const trSlug = slugify(tr.slug || tr.title || finalSlug);
                    const trWordCount = tr.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
                    const trReadingTime = Math.max(1, Math.round(trWordCount / 200));
                    const trExcerpt = tr.excerpt || tr.content.replace(/<[^>]+>/g, ' ').slice(0, 160).trim();
                    await BlogPostTranslation.create({
                        blog_post_id: post.id,
                        locale: tr.locale,
                        title: tr.title,
                        slug: trSlug,
                        content: tr.content,
                        excerpt: trExcerpt,
                        meta_title: tr.meta_title || tr.title.slice(0, 70),
                        meta_description: tr.meta_description || trExcerpt.slice(0, 160),
                        reading_time: trReadingTime,
                    });
                    createdLocales.push(tr.locale);
                }
            }

            return { content: [{ type: 'text', text: JSON.stringify({ ok: true, id: post.id, slug: finalSlug, status: post.status, scheduled_for: post.scheduled_for, url: `/blog/${finalSlug}`, locales: createdLocales }) }] };
        }
    );

    server.tool(
        'update_blog_post',
        'Update a public blog post. Pass `id` plus fields to change. To switch to scheduled, set status="scheduled" and scheduled_for. To translate, pass locale + the translated fields.',
        {
            id: z.number(),
            title: z.string().optional(),
            content: z.string().optional(),
            excerpt: z.string().optional(),
            featured_image: z.string().optional(),
            category: z.string().optional(),
            tags: z.array(z.string()).optional(),
            status: z.enum(['draft', 'published', 'scheduled']).optional(),
            scheduled_for: z.string().optional(),
            meta_title: z.string().optional(),
            meta_description: z.string().optional(),
            locale: z.string().default('en'),
            slug: z.string().optional(),
        },
        async (input) => {
            const post: any = await BlogPost.findByPk(input.id);
            if (!post) return { content: [{ type: 'text', text: 'not_found' }], isError: true };

            const sharedUpdates: any = {};
            if (input.featured_image !== undefined) sharedUpdates.featured_image = input.featured_image;
            if (input.category !== undefined) sharedUpdates.category = input.category;
            if (input.tags !== undefined) sharedUpdates.tags = input.tags;
            if (input.status !== undefined) {
                sharedUpdates.status = input.status;
                if (input.status === 'published') {
                    if (!post.published_at) sharedUpdates.published_at = new Date();
                    sharedUpdates.scheduled_for = null;
                } else if (input.status === 'scheduled') {
                    if (!input.scheduled_for) return { content: [{ type: 'text', text: 'scheduled_for required when status=scheduled' }], isError: true };
                    if (new Date(input.scheduled_for).getTime() <= Date.now()) return { content: [{ type: 'text', text: 'scheduled_for must be a future date' }], isError: true };
                    sharedUpdates.scheduled_for = new Date(input.scheduled_for);
                } else if (input.status === 'draft') {
                    sharedUpdates.scheduled_for = null;
                }
            } else if (input.scheduled_for && post.status === 'scheduled') {
                if (new Date(input.scheduled_for).getTime() <= Date.now()) return { content: [{ type: 'text', text: 'scheduled_for must be a future date' }], isError: true };
                sharedUpdates.scheduled_for = new Date(input.scheduled_for);
            }
            if (Object.keys(sharedUpdates).length > 0) await post.update(sharedUpdates);

            if (input.title || input.content || input.excerpt || input.meta_title || input.meta_description || input.slug) {
                const lang = input.locale || 'en';
                const finalSlug = slugify(input.slug || input.title || post.slug);
                const newContent = input.content || '';
                const wordCount = newContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
                const readingTime = Math.max(1, Math.round(wordCount / 200));
                const autoExcerpt = input.excerpt || newContent.replace(/<[^>]+>/g, ' ').slice(0, 160).trim();
                const translationData: any = {
                    title: input.title || post.title,
                    slug: finalSlug,
                    content: newContent,
                    excerpt: autoExcerpt,
                    meta_title: input.meta_title || (input.title || post.title).slice(0, 70),
                    meta_description: input.meta_description || autoExcerpt.slice(0, 160),
                    reading_time: readingTime,
                };
                const [tr, created] = await BlogPostTranslation.findOrCreate({
                    where: { blog_post_id: input.id, locale: lang },
                    defaults: { blog_post_id: input.id, locale: lang, ...translationData } as any,
                });
                if (!created) await tr.update(translationData);
                if (lang === 'en') {
                    await post.update({
                        title: translationData.title,
                        slug: translationData.slug,
                        content: translationData.content,
                        excerpt: translationData.excerpt,
                        meta_title: translationData.meta_title,
                        meta_description: translationData.meta_description,
                        reading_time: translationData.reading_time,
                    });
                }
            }

            const fresh: any = await BlogPost.findByPk(input.id);
            const o = fresh.get({ plain: true });
            return { content: [{ type: 'text', text: JSON.stringify({ ok: true, id: o.id, slug: o.slug, status: o.status, scheduled_for: o.scheduled_for, published_at: o.published_at }) }] };
        }
    );

    server.tool('delete_blog_post', 'Delete a public blog post (and all its translations).', {
        id: z.number(),
    }, async ({ id }) => {
        const post: any = await BlogPost.findByPk(id);
        if (!post) return { content: [{ type: 'text', text: 'not_found' }], isError: true };
        await post.destroy();
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, deleted: id }) }] };
    });

    // ── Image generation ──
    server.tool(
        'generate_blog_image',
        'Generate a branded SEO Agent banner image (1200x630 OG) for a blog post and return its public URL. Use this BEFORE create_blog_post, then pass the returned URL as featured_image.',
        {
            title: z.string().describe('Headline to render on the banner. Keep ≤8 words for best fit.'),
            tag: z.string().optional().describe('Small uppercase pill in the corner (e.g. "PRODUCT", "GUIDE", "NEWS")'),
            palette: z.enum(['teal', 'navy', 'indigo', 'forest', 'wine', 'carbon', 'overlay']).default('indigo'),
            slug: z.string().describe('Slug for the output filename (no spaces, lowercase).'),
            format: z.enum(['blog', 'square', 'story']).default('blog').describe('blog=1200x630, square=1080x1080, story=1080x1920'),
            seed: z.number().default(0),
        },
        async ({ title, tag, palette, slug, format, seed }) => {
            const path = require('path');
            const fs = require('fs');
            const { spawn } = require('child_process');

            const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const outDir = path.join(process.cwd(), 'public', 'blog-images');
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            const outFile = path.join(outDir, `${cleanSlug}.png`);
            const script = path.join(process.cwd(), 'scripts', 'generate_blog_banner.py');
            if (!fs.existsSync(script)) return { content: [{ type: 'text', text: 'image_script_missing' }], isError: true };

            const args = ['--title', title, '--palette', palette, '--out', outFile, '--seed', String(seed), '--format', format];
            if (tag) args.push('--tag', tag);

            const pythonCmd = process.env.PYTHON_BIN || 'python';
            const result = await new Promise<{ ok: boolean; output: string }>((resolve) => {
                const child = spawn(pythonCmd, [script, ...args], { cwd: process.cwd() });
                let stdout = '', stderr = '';
                child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
                child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
                child.on('close', (code: number) => {
                    resolve({ ok: code === 0 && fs.existsSync(outFile), output: stdout + stderr });
                });
                child.on('error', (err: Error) => resolve({ ok: false, output: err.message }));
            });

            if (!result.ok) return { content: [{ type: 'text', text: `image_generation_failed: ${result.output.slice(0, 500)}` }], isError: true };
            const url = `/blog-images/${cleanSlug}.png`;
            const stats = fs.statSync(outFile);
            return { content: [{ type: 'text', text: JSON.stringify({ ok: true, url, absolute_url: `https://seo-agent.net${url}`, format, palette, size_bytes: stats.size }) }] };
        }
    );

    // ── Topic Bank (auto-blog workflow) ──
    server.tool(
        'get_pending_blog_topics',
        'Read the blog topic bank and return up to N pending topics — use these as the source for the weekly auto-blog run. After publishing each topic via create_blog_post, call mark_blog_topic_used.',
        { limit: z.number().default(2).describe('Max number of pending topics to return (1-5)') },
        async ({ limit }) => {
            const fsp = require('fs').promises;
            const path = require('path');
            const bankPath = path.join(process.cwd(), 'data', 'blog-topic-bank.json');
            try {
                const raw = await fsp.readFile(bankPath, 'utf-8');
                const bank = JSON.parse(raw);
                const pending = (bank.topics || []).filter((t: any) => t.status === 'pending').slice(0, Math.max(1, Math.min(limit, 5)));
                return { content: [{ type: 'text', text: JSON.stringify({ topics: pending, total_pending: (bank.topics || []).filter((t: any) => t.status === 'pending').length }) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `topic_bank_error: ${e.message}` }], isError: true };
            }
        }
    );

    server.tool(
        'mark_blog_topic_used',
        'Mark a topic from the blog topic bank as used (or failed). Call this AFTER successfully publishing the article via create_blog_post, with the returned post_id.',
        {
            topic_id: z.number().describe('Topic id from get_pending_blog_topics'),
            post_id: z.number().optional().describe('The blog_posts.id returned by create_blog_post (skip on failure)'),
            status: z.enum(['used', 'failed', 'pending']).default('used'),
            error: z.string().optional().describe('Error message when status=failed'),
        },
        async ({ topic_id, post_id, status, error }) => {
            const fsp = require('fs').promises;
            const path = require('path');
            const bankPath = path.join(process.cwd(), 'data', 'blog-topic-bank.json');
            try {
                const raw = await fsp.readFile(bankPath, 'utf-8');
                const bank = JSON.parse(raw);
                const idx = (bank.topics || []).findIndex((t: any) => t.id === topic_id);
                if (idx < 0) return { content: [{ type: 'text', text: 'topic_not_found' }], isError: true };
                const updated: any = { ...bank.topics[idx], status };
                if (status === 'used') {
                    updated.used_at = new Date().toISOString();
                    if (post_id) updated.post_id = post_id;
                    delete updated.error;
                } else if (status === 'failed') {
                    updated.failed_at = new Date().toISOString();
                    if (error) updated.error = error;
                } else if (status === 'pending') {
                    delete updated.used_at;
                    delete updated.failed_at;
                    delete updated.post_id;
                    delete updated.error;
                }
                bank.topics[idx] = updated;
                await fsp.writeFile(bankPath, JSON.stringify(bank, null, 2) + '\n', 'utf-8');
                return { content: [{ type: 'text', text: JSON.stringify({ ok: true, topic_id, status }) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `topic_bank_error: ${e.message}` }], isError: true };
            }
        }
    );

    return server;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Last-Event-ID');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!authorizeAdmin(req)) {
        return res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized — admin token required' }, id: null });
    }

    await db.sync();

    // Parse body
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const rawBody = Buffer.concat(chunks).toString('utf-8');
    let parsedBody: any = undefined;
    if (rawBody) { try { parsedBody = JSON.parse(rawBody); } catch { /* ignore */ } }

    const sessionId = (req.headers['mcp-session-id'] as string) || '';
    let transport = sessionId ? sessionTransports.get(sessionId) : undefined;

    if (!transport) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => {
                const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
                return id;
            },
            onsessioninitialized: (id) => { sessionTransports.set(id, transport!); },
        });
        const server = createAdminMcpServer();
        await server.connect(transport);
    }

    await transport.handleRequest(req as any, res as any, parsedBody);
}
