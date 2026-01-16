/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://seo-agent.net',
    generateRobotsTxt: false, // We have a custom robots.txt
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
    ],
    alternateRefs: [
        {
            href: 'https://seo-agent.net',
            hreflang: 'en',
        },
        {
            href: 'https://seo-agent.net/de',
            hreflang: 'de',
        },
    ],
    transform: async (config, path) => {
        // Custom transformation for specific pages
        return {
            loc: path,
            changefreq: path === '/' || path === '/de/' ? 'weekly' : 'monthly',
            priority: path === '/' || path === '/de/' ? 1.0 : 0.8,
            lastmod: new Date().toISOString(),
            alternateRefs: config.alternateRefs ?? [],
        };
    },
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/profile/', '/domain/', '/domains/', '/onboarding/', '/auth/'],
            },
        ],
    },
};
