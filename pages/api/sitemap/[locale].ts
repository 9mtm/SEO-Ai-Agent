/**
 * GET /api/sitemap/{locale}
 * -----------------------------
 * Public-routed via the rewrite `/sitemap-{locale}.xml` → `/api/sitemap/{locale}`.
 * Returns the XML <urlset> for one locale: every static page + every blog
 * post translation that exists for this locale, with hreflang alternates.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import BlogPost from '../../../database/models/blogPost';
import BlogPostTranslation from '../../../database/models/blogPostTranslation';
import { SUPPORTED_LOCALES } from '../../../utils/i18nHelpers';

const SITE = 'https://seo-agent.net';

const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
    { path: '',                  priority: '1.0', changefreq: 'weekly' },
    { path: '/blog',             priority: '0.8', changefreq: 'daily' },
    { path: '/how-to-use',       priority: '0.8', changefreq: 'monthly' },
    { path: '/mcp-seo',          priority: '0.8', changefreq: 'monthly' },
    { path: '/seo-expert-skill', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact',          priority: '0.5', changefreq: 'yearly' },
    { path: '/imprint',          priority: '0.3', changefreq: 'yearly' },
    { path: '/privacy',          priority: '0.3', changefreq: 'yearly' },
    { path: '/terms',            priority: '0.3', changefreq: 'yearly' },
];

function localizedUrl(locale: string, path: string): string {
    if (locale === 'en') return `${SITE}${path || '/'}`;
    return `${SITE}/${locale}${path || '/'}`;
}

function isoDate(d: Date | string | null | undefined): string {
    if (!d) return new Date().toISOString().slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
}

function escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod: string, priority: string, changefreq: string, alternates: { hreflang: string; href: string }[]): string {
    const altLines = alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escape(a.href)}" />`).join('\n');
    return `  <url>
    <loc>${escape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${altLines}
  </url>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const locale = String(req.query.locale || '');
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
        res.status(404).setHeader('Content-Type', 'text/plain').send('Invalid locale');
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const parts: string[] = [];

    // ── Static pages for this locale ─────────────────────────────────
    for (const page of STATIC_PAGES) {
        const alternates = SUPPORTED_LOCALES.map(loc => ({
            hreflang: loc,
            href: localizedUrl(loc, page.path),
        }));
        alternates.push({ hreflang: 'x-default', href: localizedUrl('en', page.path) });
        parts.push(urlEntry(localizedUrl(locale, page.path), today, page.priority, page.changefreq, alternates));
    }

    // ── Blog posts that have a translation for this locale ──────────
    try {
        await db.sync();
        const posts: any[] = await BlogPost.findAll({
            where: { status: 'published' } as any,
            include: [{ model: BlogPostTranslation, as: 'translations', attributes: ['locale', 'slug', 'updatedAt'] }],
            order: [['published_at', 'DESC']],
        });

        for (const p of posts) {
            const post = p.get({ plain: true });
            const translations: { locale: string; slug: string; updatedAt: string }[] = post.translations || [];
            const myRow = translations.find(t => t.locale === locale);
            if (!myRow) continue;

            const alternates = translations.map(t => ({
                hreflang: t.locale,
                href: localizedUrl(t.locale, `/blog/${t.slug}`),
            }));
            const enRow = translations.find(t => t.locale === 'en') || translations[0];
            alternates.push({
                hreflang: 'x-default',
                href: localizedUrl(enRow.locale, `/blog/${enRow.slug}`),
            });

            parts.push(urlEntry(
                localizedUrl(locale, `/blog/${myRow.slug}`),
                isoDate(myRow.updatedAt) || isoDate(post.updatedAt),
                '0.7',
                'monthly',
                alternates,
            ));
        }
    } catch (err) {
        console.error('[sitemap-' + locale + '] failed to load blog posts:', err);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${parts.join('\n')}
</urlset>
`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(xml);
}
