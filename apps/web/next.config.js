/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  transpilePackages: ['@acme/core', '@acme/db', '@acme/auth', '@acme/rbac', '@acme/ui'],
  // Allow all hosts for Replit proxy
  async rewrites() {
    return []
  },
  // Configure for Replit development environment
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      allowedRevalidateHeaderKeys: ['x-revalidate'],
    },
  }),
  // Allow cross-origin requests from Replit domains
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['*'] : [],
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
