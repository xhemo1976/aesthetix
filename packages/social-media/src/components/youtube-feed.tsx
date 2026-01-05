'use client'

import { useState } from 'react'
import type { SocialPost, SocialWidgetProps } from '../types'
import { formatSocialDate, truncateText, formatCount } from '../utils'

interface YouTubeFeedProps extends SocialWidgetProps {
  posts?: SocialPost[]
  channelUrl?: string
}

/**
 * YouTube Feed Component
 * Displays recent YouTube videos with view counts and engagement
 */
export function YouTubeFeed({
  username,
  posts = [],
  maxPosts = 6,
  showHeader = true,
  channelUrl,
  className = ''
}: YouTubeFeedProps) {
  const displayPosts = posts.slice(0, maxPosts)

  if (displayPosts.length === 0) {
    return (
      <div className={`text-center py-8 text-white/50 ${className}`}>
        <p>Keine YouTube-Videos verfügbar</p>
        {(username || channelUrl) && (
          <a
            href={channelUrl || `https://youtube.com/@${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 mt-2 inline-block"
          >
            {username ? `@${username} auf YouTube ansehen` : 'YouTube Kanal besuchen'}
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div>
            <a
              href={channelUrl || `https://youtube.com/@${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:text-amber-400 transition-colors"
            >
              {username}
            </a>
            <p className="text-xs text-white/50">YouTube</p>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayPosts.map((post) => (
          <a
            key={post.id}
            href={post.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2">
              {post.imageUrl ? (
                <>
                  <img
                    src={post.imageUrl}
                    alt={truncateText(post.content, 50)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Duration Badge (if available) */}
                  {post.metadata?.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
                      {formatDuration(post.metadata.duration)}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                  <svg className="w-12 h-12 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div>
              {/* Title */}
              {post.content && (
                <h3 className="font-medium text-white text-sm line-clamp-2 mb-1 group-hover:text-amber-400 transition-colors">
                  {extractTitle(post.content)}
                </h3>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-white/50">
                {post.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {formatCount(post.views)}
                  </span>
                )}
                {post.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                    </svg>
                    {formatCount(post.likes)}
                  </span>
                )}
                {post.comments !== undefined && (
                  <span className="flex items-center gap-1">
                    💬 {formatCount(post.comments)}
                  </span>
                )}
              </div>

              {/* Posted Date */}
              <p className="text-xs text-white/40 mt-1">
                {formatSocialDate(post.createdAt)}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Footer Link */}
      {(username || channelUrl) && (
        <a
          href={channelUrl || `https://youtube.com/@${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-6 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Alle Videos auf YouTube ansehen →
        </a>
      )}
    </div>
  )
}

// Helper function to extract title from content (first line before description)
function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0]
  return firstLine || content
}

// Helper function to format video duration (seconds to MM:SS)
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
