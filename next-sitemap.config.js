/** @type {import('next-sitemap').IConfig} */
const LOCALES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'nl', 'tr', 'ar', 'ja'];
const SITE_URL = process.env.SITE_URL || 'https://seo-agent.net';

const alternateRefs = LOCALES.map(loc => ({
    href: loc === 'en' ? SITE_URL : `${SITE_URL}/${loc}`,
    hreflang: loc,
}));

module.exports = {
    siteUrl: SITE_URL,
    generateRobotsTxt: false, // custom robots.txt in public/
    generateIndexSitemap: false,
    exclude: [
        '/api/*',
        '/admin/*',
        '/profile/*',
        '/domain/*',
        '/domains/*',
        '/onboarding/*',
        '/auth/*',
        '/login',
        '/register',
        '/oauth/*',
        '/platform-sso',
        '/platform/*',
        '/unsubscribe',
        '/workspace/*',
        '/setup',
        '/research',
        '/keywords/*',
    ],
    alternateRefs,
    transform: async (config, path) => {
        const isHome = path === '/';
        return {
            loc: path,
            changefreq: isHome ? 'weekly' : 'monthly',
            priority: isHome ? 1.0 : 0.8,
            lastmod: new Date().toISOString(),
            alternateRefs: config.alternateRefs ?? [],
        };
    },
};
