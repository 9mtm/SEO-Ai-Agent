/**
 * /sitemap.xml — Top-level Sitemap Index
 *
 * Points search engines at one sitemap per locale. Each per-locale sitemap
 * lists every static page + every blog translation for that language.
 *
 * Pattern (Yoast-style):
 *   /sitemap.xml          ← this file (sitemapindex)
 *   /sitemap-en.xml       ← all English URLs (urlset)
 *   /sitemap-de.xml       ← all German URLs
 *   /sitemap-fr.xml       ← ... and so on for all 11 locales
 */
import type { GetServerSideProps } from 'next';
import { SUPPORTED_LOCALES } from '../utils/i18nHelpers';

const SITE = 'https://seo-agent.net';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const lastmod = new Date().toISOString();
    const sitemaps = SUPPORTED_LOCALES.map(locale => `  <sitemap>
    <loc>${SITE}/sitemap-${locale}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.write(xml);
    res.end();
    return { props: {} };
};

export default function SitemapIndex() { return null; }
