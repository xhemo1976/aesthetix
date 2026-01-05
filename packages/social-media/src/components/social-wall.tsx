'use client'

import React, { useState, useMemo } from 'react'
import type { SocialPost } from '../types'
import { formatSocialDate, truncateText, formatCount } from '../utils'

interface SocialWallProps {
  posts: SocialPost[]
  maxPosts?: number
  layout?: 'grid' | 'masonry' | 'list'
  showPlatformFilter?: boolean
  className?: string
}

const PLATFORM_INFO = {
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'from-yellow-400 via-red-500 to-purple-600',
    bgColor: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
  },
  facebook: {
    name: 'Facebook',
    icon: '👤',
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700'
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'from-black via-gray-800 to-black',
    bgColor: 'bg-gradient-to-br from-black via-gray-800 to-black'
  },
  google: {
    name: 'Google',
    icon: '⭐',
    color: 'from-red-500 to-yellow-500',
    bgColor: 'bg-gradient-to-r from-red-500 to-yellow-500'
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: 'from-red-600 to-red-700',
    bgColor: 'bg-gradient-to-r from-red-600 to-red-700'
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-gradient-to-r from-green-500 to-green-600'
  }
}

/**
 * Social Wall Component
 * Unified feed showing posts from all social media platforms
 * Supports multiple layouts and filtering
 */
export function SocialWall({
  posts,
  maxPosts = 12,
  layout = 'grid',
  showPlatformFilter = true,
  className = ''
}: SocialWallProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPost['platform'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = selectedPlatform === 'all'
      ? posts
      : posts.filter(p => p.platform === selectedPlatform)

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'recent') {
        return b.createdAt.getTime() - a.createdAt.getTime()
      } else {
        const aEngagement = (a.likes || 0) + (a.comments || 0) + (a.shares || 0)
        const bEngagement = (b.likes || 0) + (b.comments || 0) + (b.shares || 0)
        return bEngagement - aEngagement
      }
    })

    return filtered.slice(0, maxPosts)
  }, [posts, selectedPlatform, sortBy, maxPosts])

  // Platform counts
  const platformCounts = useMemo(() => {
    const counts = new Map<SocialPost['platform'], number>()
    posts.forEach(post => {
      counts.set(post.platform, (counts.get(post.platform) || 0) + 1)
    })
    return counts
  }, [posts])

  // Render platform badge
  const renderPlatformBadge = (platform: SocialPost['platform']) => {
    const info = PLATFORM_INFO[platform]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gradient-to-r ${info.color} text-white`}>
        <span>{info.icon}</span>
        <span>{info.name}</span>
      </span>
    )
  }

  if (filteredPosts.length === 0) {
    return (
      <div className={`text-center py-12 text-white/50 ${className}`}>
        <div className="text-6xl mb-4">📱</div>
        <p className="text-lg">Keine Posts verfügbar</p>
        <p className="text-sm mt-2">Verbinden Sie Ihre Social Media Accounts</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Filters */}
      {showPlatformFilter && (
        <div className="mb-6 flex items-center gap-4 flex-wrap pb-4 border-b border-white/10">
          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Plattform:</span>
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedPlatform === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Alle ({posts.length})
            </button>
            {Array.from(platformCounts.entries()).map(([platform, count]) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedPlatform === platform
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {PLATFORM_INFO[platform].icon} {count}
              </button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                sortBy === 'recent'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🕒 Neueste
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                sortBy === 'popular'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🔥 Beliebt
            </button>
          </div>
        </div>
      )}

      {/* Posts Grid/List */}
      {layout === 'list' ? (
        // List Layout
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCardList key={post.id} post={post} renderPlatformBadge={renderPlatformBadge} />
          ))}
        </div>
      ) : (
        // Grid Layout
        <div className={`grid gap-4 ${
          layout === 'masonry'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}>
          {filteredPosts.map((post) => (
            <PostCardGrid key={post.id} post={post} renderPlatformBadge={renderPlatformBadge} />
          ))}
        </div>
      )}
    </div>
  )
}

// Grid Card Component
function PostCardGrid({
  post,
  renderPlatformBadge
}: {
  post: SocialPost
  renderPlatformBadge: (platform: SocialPost['platform']) => React.ReactElement
}) {
  return (
    <a
      href={post.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all"
    >
      {/* Image/Video */}
      {post.imageUrl || post.videoUrl ? (
        <img
          src={post.imageUrl || post.videoUrl}
          alt={truncateText(post.content, 50)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
          <span className="text-white/30 text-4xl">{PLATFORM_INFO[post.platform].icon}</span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-2 left-2">
          {renderPlatformBadge(post.platform)}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          {post.content && (
            <p className="text-xs text-white mb-2 line-clamp-2">
              {post.content}
            </p>
          )}
          <div className="flex items-center gap-3 text-white text-xs">
            {post.likes !== undefined && <span>❤️ {formatCount(post.likes)}</span>}
            {post.comments !== undefined && <span>💬 {formatCount(post.comments)}</span>}
            {post.shares !== undefined && <span>↗️ {formatCount(post.shares)}</span>}
          </div>
        </div>
      </div>

      {/* Video indicator */}
      {post.videoUrl && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </a>
  )
}

// List Card Component
function PostCardList({
  post,
  renderPlatformBadge
}: {
  post: SocialPost
  renderPlatformBadge: (platform: SocialPost['platform']) => React.ReactElement
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      {/* Thumbnail */}
      {(post.imageUrl || post.videoUrl) && (
        <a
          href={post.link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden group"
        >
          <img
            src={post.imageUrl || post.videoUrl}
            alt={truncateText(post.content, 50)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {post.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </a>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          {renderPlatformBadge(post.platform)}
          <span className="text-xs text-white/40">
            {formatSocialDate(post.createdAt)}
          </span>
        </div>

        {post.content && (
          <p className="text-sm text-white/80 mb-2 line-clamp-3">
            {post.content}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-white/50">
          {post.likes !== undefined && <span>❤️ {formatCount(post.likes)}</span>}
          {post.comments !== undefined && <span>💬 {formatCount(post.comments)}</span>}
          {post.shares !== undefined && <span>↗️ {formatCount(post.shares)}</span>}
        </div>
      </div>
    </div>
  )
}
