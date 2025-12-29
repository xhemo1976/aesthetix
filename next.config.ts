import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hier war oft der Fehler: Das Komma am Ende ist wichtig!
  output: 'standalone',

  // Deine Image Einstellungen
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
