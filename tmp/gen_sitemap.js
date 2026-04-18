// Generate public/sitemap.xml for 11 locales × public pages
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://seo-agent.net';
const LOCALES = ['en','de','fr','es','it','pt','zh','nl','tr','ar','ja'];
const PAGES = [
  { path: '/',                 priority: '1.0', changefreq: 'weekly' },
  { path: '/mcp-seo',          priority: '0.9', changefreq: 'weekly' },
  { path: '/blog',             priority: '0.8', changefreq: 'daily' },
  { path: '/contact',          priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy',          priority: '0.4', changefreq: 'yearly' },
  { path: '/terms',            priority: '0.4', changefreq: 'yearly' },
  { path: '/imprint',          priority: '0.3', changefreq: 'yearly' },
  { path: '/seo-expert-skill', priority: '0.7', changefreq: 'monthly' },
];

const locUrl = (locale, pagePath) => {
  const suffix = pagePath === '/' ? '/' : pagePath;
  return locale === 'en' ? `${SITE_URL}${suffix}` : `${SITE_URL}/${locale}${suffix}`;
};

const today = new Date().toISOString().slice(0, 10);

const urls = [];
for (const page of PAGES) {
  for (const locale of LOCALES) {
    const alternates = LOCALES.map(l => ({
      hreflang: l,
      href: locUrl(l, page.path),
    }));
    alternates.push({ hreflang: 'x-default', href: locUrl('en', page.path) });

    const altLinks = alternates.map(a =>
      `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`
    ).join('\n');

    urls.push(`  <url>
    <loc>${locUrl(locale, page.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${altLinks}
  </url>`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`✓ Generated sitemap.xml with ${urls.length} URLs (${PAGES.length} pages × ${LOCALES.length} locales)`);
