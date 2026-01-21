/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // ⚡ Vercel Optimization: Ignore TS/ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    APP_VERSION: version,
  },

  // ✅ Internationalization (i18n) Configuration
  i18n: {
    locales: ['en', 'de', 'fr'],
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
};

module.exports = nextConfig;
