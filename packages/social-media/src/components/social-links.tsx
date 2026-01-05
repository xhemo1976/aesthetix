'use client'

import type { SocialPlatform } from '../types'

interface SocialLink {
  platform: SocialPlatform | 'website' | 'whatsapp' | 'email'
  url: string
  label?: string
}

interface SocialLinksProps {
  links: SocialLink[]
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icons' | 'buttons' | 'pills'
  className?: string
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📷',
  facebook: '👤',
  tiktok: '🎵',
  google: '⭐',
  website: '🌐',
  whatsapp: '💬',
  email: '✉️',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-yellow-400 via-red-500 to-purple-600',
  facebook: 'from-blue-600 to-blue-700',
  tiktok: 'from-black to-gray-800',
  google: 'from-red-500 to-yellow-500',
  website: 'from-amber-500 to-amber-600',
  whatsapp: 'from-green-500 to-green-600',
  email: 'from-gray-600 to-gray-700',
}

/**
 * Social Links Component
 * Displays social media links as icons, buttons, or pills
 */
export function SocialLinks({
  links,
  size = 'md',
  variant = 'icons',
  className = ''
}: SocialLinksProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  if (variant === 'icons') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizeClasses[size]} rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors`}
            title={link.label || link.platform}
          >
            <span>{PLATFORM_ICONS[link.platform] || '🔗'}</span>
          </a>
        ))}
      </div>
    )
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-lg bg-gradient-to-r ${PLATFORM_COLORS[link.platform]} text-white flex items-center gap-2 hover:opacity-90 transition-opacity`}
          >
            <span>{PLATFORM_ICONS[link.platform]}</span>
            <span className="text-sm font-medium">{link.label || link.platform}</span>
          </a>
        ))}
      </div>
    )
  }

  // Pills variant
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center gap-1.5 text-sm transition-colors"
        >
          <span>{PLATFORM_ICONS[link.platform]}</span>
          <span>{link.label || link.platform}</span>
        </a>
      ))}
    </div>
  )
}
