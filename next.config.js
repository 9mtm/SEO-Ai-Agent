/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,

  // ⚡ Vercel Optimization: Ignore TS/ESLint errors during build
  // ⚡ Vercel Optimization: Ignore TS errors during build
  typescript: {
    ignoreBuildErrors: true,
  },


  env: {
    APP_VERSION: version,
  },

  // ✅ Internationalization (i18n) Configuration
  i18n: {
    locales: ['en', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'nl', 'tr', 'ar', 'ja'],
    defaultLocale: 'en',
    localeDetection: false, // Auto-detect browser language
  },

  // ✅ تحسين الصور
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ✅ تحسين الأداء
  compress: true,
  poweredByHeader: false,

  async headers() {
    // Routes that must render inside third-party admin UIs (WordPress plugin,
    // Shopify embedded app, etc.). Every route listed here needs auth guards
    // of its own — framing just widens the set of parent origins allowed to
    // display the page.
    const IFRAMABLE_SOURCES = [
      '/platform-sso',
      '/domain/:path*',
      '/api/platform/iframe-login',
    ];
    const iframeHeaders = [
      // X-Frame-Options has no "from list" syntax in modern browsers; we rely
      // on CSP frame-ancestors for the real policy. We still strip the default
      // SAMEORIGIN behaviour that some hosts inject.
      { key: 'X-Frame-Options', value: 'ALLOWALL' },
      { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
    ];

    return IFRAMABLE_SOURCES.map((source) => ({ source, headers: iframeHeaders }));
  },

  // Expose OAuth discovery documents at the standard RFC 8414 / RFC 9728 paths
  async rewrites() {
    return [
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/.well-known/oauth-authorization-server'
      },
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/.well-known/oauth-protected-resource'
      },
      // Per-locale sitemaps: /sitemap-en.xml, /sitemap-de.xml, … → API handler
      {
        source: '/sitemap-:locale.xml',
        destination: '/api/sitemap/:locale'
      }
    ];
  },
};

module.exports = nextConfig;
