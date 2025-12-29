import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for self-contained deployment
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

  // Disable x-powered-by header for security
  poweredByHeader: false,
}

export default nextConfig
