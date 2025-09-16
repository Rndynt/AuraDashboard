/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-auth', '@oslojs/crypto', '@oslojs/encoding', '@oslojs/algorithm'],
    allowedRevalidateHeaderKeys: ['x-revalidate'],
  },
  // Allow cross-origin requests from Replit domain
  allowedDevOrigins: [
    '23215867-5b23-46d9-8169-919c4f040f73-00-2204r30y6j2vz.picard.replit.dev',
    'localhost:5000',
    '127.0.0.1:5000'
  ],
  // Allow cross-origin requests from Replit domains in development
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: false,
    },
  }),
  transpilePackages: ['@acme/core', '@acme/db', '@acme/auth', '@acme/rbac', '@acme/ui'],
  // Allow all hosts for Replit proxy
  async rewrites() {
    return []
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
