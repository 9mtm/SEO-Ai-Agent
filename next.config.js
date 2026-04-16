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
    locales: ['en', 'de', 'fr', 'es', 'pt'],
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
    return [
      {
        source: '/platform-sso',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" }
        ]
      }
    ];
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
      }
    ];
  },
};

module.exports = nextConfig;
