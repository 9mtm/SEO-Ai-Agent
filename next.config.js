/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    APP_VERSION: version,
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
