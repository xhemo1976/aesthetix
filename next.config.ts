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
}

export default nextConfig
