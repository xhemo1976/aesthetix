'use client'

import { useState, useEffect } from 'react'
import type { SocialPost, SocialWidgetProps } from '../types'
import { formatSocialDate, truncateText } from '../utils'

interface InstagramFeedProps extends SocialWidgetProps {
  posts?: SocialPost[]
}

/**
 * Instagram Feed Component
 * Displays recent Instagram posts in a grid
 */
export function InstagramFeed({
  username,
  posts = [],
  maxPosts = 6,
  showHeader = true,
  className = ''
}: InstagramFeedProps) {
  const displayPosts = posts.slice(0, maxPosts)

  if (displayPosts.length === 0) {
    return (
      <div className={`text-center py-8 text-white/50 ${className}`}>
        <p>Keine Instagram-Posts verfügbar</p>
        {username && (
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 mt-2 inline-block"
          >
            @{username} auf Instagram folgen
          </a>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {showHeader && username && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <span className="text-white font-semibold text-sm">IG</span>
            </div>
          </div>
          <div>
            <a
              href={`https://instagram.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:text-amber-400 transition-colors"
            >
              @{username}
            </a>
            <p className="text-xs text-white/50">Instagram</p>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1">
        {displayPosts.map((post) => (
          <a
            key={post.id}
            href={post.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square relative group overflow-hidden rounded"
          >
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={truncateText(post.content, 50)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <span className="text-white/30">Bild</span>
              </div>
            )}

            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm">
              {post.likes !== undefined && (
                <span>❤️ {post.likes}</span>
              )}
              {post.comments !== undefined && (
                <span>💬 {post.comments}</span>
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Footer Link */}
      {username && (
        <a
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Mehr auf Instagram →
        </a>
      )}
    </div>
  )
}
