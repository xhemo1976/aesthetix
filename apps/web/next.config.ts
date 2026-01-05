import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable standalone output for self-hosting (Hostinger)
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Security Header
  poweredByHeader: false,

  // Increase body size limit for image uploads (5 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig
