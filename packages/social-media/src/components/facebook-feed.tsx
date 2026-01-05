'use client'

import { useState } from 'react'
import type { SocialPost, SocialWidgetProps } from '../types'
import { formatSocialDate, truncateText } from '../utils'

interface FacebookFeedProps extends SocialWidgetProps {
  posts?: SocialPost[]
  pageUrl?: string
}

/**
 * Facebook Feed Component
 * Displays recent Facebook posts with engagement metrics
 */
export function FacebookFeed({
  username,
  posts = [],
  maxPosts = 6,
  showHeader = true,
  pageUrl,
  className = ''
}: FacebookFeedProps) {
  const displayPosts = posts.slice(0, maxPosts)

  if (displayPosts.length === 0) {
    return (
      <div className={`text-center py-8 text-white/50 ${className}`}>
        <p>Keine Facebook-Posts verfügbar</p>
        {(username || pageUrl) && (
          <a
            href={pageUrl || `https://facebook.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 mt-2 inline-block"
          >
            {username ? `${username} auf Facebook folgen` : 'Auf Facebook besuchen'}
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <a
              href={pageUrl || `https://facebook.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:text-amber-400 transition-colors"
            >
              {username}
            </a>
            <p className="text-xs text-white/50">Facebook</p>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {displayPosts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {/* Post Content */}
            {post.content && (
              <p className="text-sm text-white/80 mb-3 line-clamp-4">
                {post.content}
              </p>
            )}

            {/* Post Image/Video */}
            {(post.imageUrl || post.videoUrl) && (
              <a
                href={post.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative rounded-lg overflow-hidden mb-3 group"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={truncateText(post.content, 50)}
                    className="w-full h-auto max-h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : post.videoUrl ? (
                  <div className="relative w-full h-64 bg-black/50 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                      Video
                    </div>
                  </div>
                ) : null}
              </a>
            )}

            {/* Engagement Metrics */}
            <div className="flex items-center gap-4 text-xs text-white/50">
              {post.likes !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                  </svg>
                  {post.likes}
                </span>
              )}
              {post.comments !== undefined && (
                <span className="flex items-center gap-1">
                  💬 {post.comments}
                </span>
              )}
              {post.shares !== undefined && (
                <span className="flex items-center gap-1">
                  ↗️ {post.shares}
                </span>
              )}
              <span className="ml-auto">
                {formatSocialDate(post.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      {(username || pageUrl) && (
        <a
          href={pageUrl || `https://facebook.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Mehr auf Facebook →
        </a>
      )}
    </div>
  )
}
