/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-auth', '@oslojs/crypto', '@oslojs/encoding', '@oslojs/algorithm'],
    allowedRevalidateHeaderKeys: ['x-revalidate'],
  },
  // Allow cross-origin requests from all origins in development for Replit proxy
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['*'] : undefined,
  // Disable build activity indicator in development for Replit
  devIndicators: process.env.NODE_ENV === 'development' ? {
    buildActivity: false,
  } : undefined,
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
            value: process.env.NODE_ENV === 'development' ? 'SAMEORIGIN' : 'DENY',
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
