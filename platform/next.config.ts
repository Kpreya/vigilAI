import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CORS headers to all /api/* routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, x-api-key',
          },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
