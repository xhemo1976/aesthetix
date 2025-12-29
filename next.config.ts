import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // WICHTIG: Standalone-Modus für Hostinger aktivieren
  output: 'standalone',

  // Deine bestehende Image-Konfiguration bleibt erhalten
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Sicherheits-Header
  poweredByHeader: false,
}

export default nextConfig
