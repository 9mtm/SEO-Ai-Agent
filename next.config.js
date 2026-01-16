/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    APP_VERSION: version,
  },

  // ✅ Internationalization (i18n) Configuration
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    localeDetection: true, // Auto-detect browser language
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
};

module.exports = nextConfig;
