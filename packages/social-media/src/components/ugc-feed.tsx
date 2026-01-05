'use client'

import { useState } from 'react'
import type { SocialPost } from '../types'
import { formatSocialDate, truncateText, formatCount } from '../utils'

interface UGCFeedProps {
  posts: SocialPost[]
  hashtag?: string
  maxPosts?: number
  layout?: 'grid' | 'masonry'
  showModeration?: boolean
  onApprove?: (postId: string) => void
  onReject?: (postId: string) => void
  className?: string
}

/**
 * User Generated Content Feed Component
 * Displays posts from users mentioning specific hashtags
 * Includes moderation features for admins
 */
export function UGCFeed({
  posts,
  hashtag,
  maxPosts = 12,
  layout = 'masonry',
  showModeration = false,
  onApprove,
  onReject,
  className = ''
}: UGCFeedProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const displayPosts = posts
    .filter(post => {
      if (filter === 'all') return true
      if (filter === 'pending') return !post.metadata?.ugc_status
      if (filter === 'approved') return post.metadata?.ugc_status === 'approved'
      if (filter === 'rejected') return post.metadata?.ugc_status === 'rejected'
      return true
    })
    .slice(0, maxPosts)

  if (posts.length === 0) {
    return (
      <div className={`text-center py-12 text-white/50 ${className}`}>
        <div className="text-6xl mb-4">📸</div>
        <p className="text-lg">Noch keine Nutzer-Posts</p>
        {hashtag && (
          <p className="text-sm mt-2">
            Teile deinen Besuch mit <span className="text-amber-400">#{hashtag}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {hashtag && (
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            #{hashtag}
          </h3>
          <p className="text-white/60">
            Geteilt von unserer Community • {posts.length} Posts
          </p>
        </div>
      )}

      {/* Moderation Filter */}
      {showModeration && (
        <div className="mb-6 flex items-center gap-2 justify-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Alle ({posts.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Ausstehend ({posts.filter(p => !p.metadata?.ugc_status).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'approved'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Genehmigt ({posts.filter(p => p.metadata?.ugc_status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'rejected'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Abgelehnt ({posts.filter(p => p.metadata?.ugc_status === 'rejected').length})
          </button>
        </div>
      )}

      {/* Posts Grid */}
      <div className={`grid gap-4 ${
        layout === 'masonry'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      }`}>
        {displayPosts.map((post) => (
          <UGCCard
            key={post.id}
            post={post}
            showModeration={showModeration}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>

      {/* Call to Action */}
      {hashtag && !showModeration && (
        <div className="mt-8 text-center p-6 rounded-lg bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-white/10">
          <p className="text-white font-medium mb-2">
            Teile auch du deinen Besuch!
          </p>
          <p className="text-white/70 text-sm">
            Verwende <span className="text-amber-400 font-semibold">#{hashtag}</span> in deinem Post
          </p>
        </div>
      )}
    </div>
  )
}

// Individual UGC Card Component
function UGCCard({
  post,
  showModeration,
  onApprove,
  onReject
}: {
  post: SocialPost
  showModeration?: boolean
  onApprove?: (postId: string) => void
  onReject?: (postId: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  const platformIcons = {
    instagram: '📷',
    facebook: '👤',
    tiktok: '🎵',
    youtube: '▶️',
    google: '⭐',
    whatsapp: '💬'
  }

  const moderationStatus = post.metadata?.ugc_status

  return (
    <div
      className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          <span className="text-white/30 text-4xl">{platformIcons[post.platform]}</span>
        </div>
      )}

      {/* Moderation Status Badge */}
      {moderationStatus && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
          moderationStatus === 'approved'
            ? 'bg-green-500 text-white'
            : moderationStatus === 'rejected'
            ? 'bg-red-500 text-white'
            : 'bg-yellow-500 text-black'
        }`}>
          {moderationStatus === 'approved' ? '✓ Genehmigt' : moderationStatus === 'rejected' ? '✗ Abgelehnt' : '⏳ Ausstehend'}
        </div>
      )}

      {/* Platform Badge */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs">
        {platformIcons[post.platform]} {post.platform}
      </div>

      {/* Hover Overlay with Info */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Author info (if available) */}
            {post.metadata?.author_name && (
              <div className="flex items-center gap-2 mb-2">
                {post.metadata.author_image ? (
                  <img
                    src={post.metadata.author_image}
                    alt={post.metadata.author_name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {post.metadata.author_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-white text-xs font-medium">
                  @{post.metadata.author_name}
                </span>
              </div>
            )}

            {/* Content Preview */}
            {post.content && (
              <p className="text-xs text-white mb-2 line-clamp-2">
                {truncateText(post.content, 80)}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-white text-xs mb-3">
              {post.likes !== undefined && <span>❤️ {formatCount(post.likes)}</span>}
              {post.comments !== undefined && <span>💬 {formatCount(post.comments)}</span>}
            </div>

            {/* Moderation Actions */}
            {showModeration && !moderationStatus && onApprove && onReject && (
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(post.id)}
                  className="flex-1 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                >
                  ✓ Genehmigen
                </button>
                <button
                  onClick={() => onReject(post.id)}
                  className="flex-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                >
                  ✗ Ablehnen
                </button>
              </div>
            )}

            {/* View Original Link */}
            {post.link && (
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-center text-xs text-amber-400 hover:text-amber-300"
              >
                Original ansehen →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
