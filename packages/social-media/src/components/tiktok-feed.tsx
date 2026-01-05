'use client'

import { useState } from 'react'
import type { SocialPost, SocialWidgetProps } from '../types'
import { formatSocialDate, truncateText } from '../utils'

interface TikTokFeedProps extends SocialWidgetProps {
  posts?: SocialPost[]
  profileUrl?: string
}

/**
 * TikTok Feed Component
 * Displays recent TikTok videos with view counts and engagement
 */
export function TikTokFeed({
  username,
  posts = [],
  maxPosts = 6,
  showHeader = true,
  profileUrl,
  className = ''
}: TikTokFeedProps) {
  const displayPosts = posts.slice(0, maxPosts)

  if (displayPosts.length === 0) {
    return (
      <div className={`text-center py-8 text-white/50 ${className}`}>
        <p>Keine TikTok-Videos verfügbar</p>
        {(username || profileUrl) && (
          <a
            href={profileUrl || `https://tiktok.com/@${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 mt-2 inline-block"
          >
            {username ? `@${username} auf TikTok folgen` : 'Auf TikTok besuchen'}
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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-black via-gray-800 to-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-transparent to-pink-500 opacity-30"></div>
            <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
            </svg>
          </div>
          <div>
            <a
              href={profileUrl || `https://tiktok.com/@${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:text-amber-400 transition-colors"
            >
              @{username}
            </a>
            <p className="text-xs text-white/50">TikTok</p>
          </div>
        </div>
      )}

      {/* Videos Grid - Portrait Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {displayPosts.map((post) => (
          <a
            key={post.id}
            href={post.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-[9/16] rounded-lg overflow-hidden group bg-gradient-to-br from-black via-gray-900 to-black"
          >
            {/* Video Thumbnail */}
            {post.imageUrl || post.videoUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={post.imageUrl || post.videoUrl}
                  alt={truncateText(post.content, 50)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>

                {/* Stats Overlay - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="space-y-1 text-white text-xs">
                    {post.likes !== undefined && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>{formatCount(post.likes)}</span>
                      </div>
                    )}
                    {post.comments !== undefined && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                        </svg>
                        <span>{formatCount(post.comments)}</span>
                      </div>
                    )}
                    {post.shares !== undefined && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        <span>{formatCount(post.shares)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/30">Video</span>
              </div>
            )}

            {/* Caption - Hover Overlay */}
            {post.content && (
              <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white line-clamp-3">
                  {truncateText(post.content, 100)}
                </p>
              </div>
            )}
          </a>
        ))}
      </div>

      {/* Footer Link */}
      {(username || profileUrl) && (
        <a
          href={profileUrl || `https://tiktok.com/@${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Mehr auf TikTok →
        </a>
      )}
    </div>
  )
}

// Helper function for formatting large numbers
function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}
