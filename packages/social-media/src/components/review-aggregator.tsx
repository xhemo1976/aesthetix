'use client'

import { useState } from 'react'
import { formatSocialDate } from '../utils'

export interface Review {
  id: string
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot'
  author: string
  authorImageUrl?: string
  rating: number
  text: string
  createdAt: Date
  helpful?: number
}

interface ReviewAggregatorProps {
  reviews: Review[]
  averageRating?: number
  totalReviews?: number
  maxReviews?: number
  showFilter?: boolean
  className?: string
}

interface PlatformStats {
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot'
  count: number
  averageRating: number
}

const PLATFORM_INFO = {
  google: {
    name: 'Google',
    icon: '🔍',
    color: 'from-red-500 to-yellow-500',
    logo: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png'
  },
  facebook: {
    name: 'Facebook',
    icon: '👤',
    color: 'from-blue-600 to-blue-700',
    logo: null
  },
  yelp: {
    name: 'Yelp',
    icon: '🔴',
    color: 'from-red-600 to-red-700',
    logo: null
  },
  trustpilot: {
    name: 'Trustpilot',
    icon: '⭐',
    color: 'from-green-500 to-green-600',
    logo: null
  }
}

/**
 * Review Aggregator Component
 * Combines reviews from multiple platforms (Google, Facebook, etc.)
 * Shows unified rating and allows filtering by platform
 */
export function ReviewAggregator({
  reviews,
  averageRating,
  totalReviews,
  maxReviews = 10,
  showFilter = true,
  className = ''
}: ReviewAggregatorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | Review['platform']>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent')

  // Calculate platform statistics
  const platformStats: PlatformStats[] = []
  const platformCounts = new Map<Review['platform'], { count: number, totalRating: number }>()

  reviews.forEach(review => {
    const current = platformCounts.get(review.platform) || { count: 0, totalRating: 0 }
    platformCounts.set(review.platform, {
      count: current.count + 1,
      totalRating: current.totalRating + review.rating
    })
  })

  platformCounts.forEach((stats, platform) => {
    platformStats.push({
      platform,
      count: stats.count,
      averageRating: stats.totalRating / stats.count
    })
  })

  platformStats.sort((a, b) => b.count - a.count)

  // Filter and sort reviews
  let filteredReviews = selectedPlatform === 'all'
    ? reviews
    : reviews.filter(r => r.platform === selectedPlatform)

  filteredReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'recent') return b.createdAt.getTime() - a.createdAt.getTime()
    if (sortBy === 'highest') return b.rating - a.rating
    return a.rating - b.rating
  })

  const displayReviews = filteredReviews.slice(0, maxReviews)

  // Render stars
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
    return (
      <div className={`flex gap-0.5 ${sizeClass}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-amber-400' : 'text-white/20'}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  // Calculate overall average if not provided
  const calculatedAverage = averageRating ||
    (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0)

  const calculatedTotal = totalReviews || reviews.length

  return (
    <div className={className}>
      {/* Overall Rating Header */}
      <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
        <div className="flex items-center gap-6">
          {/* Big Rating Number */}
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {calculatedAverage.toFixed(1)}
            </div>
            {renderStars(Math.round(calculatedAverage), 'lg')}
            <p className="text-sm text-white/50 mt-2">
              {calculatedTotal} Bewertungen
            </p>
          </div>

          {/* Platform Breakdown */}
          <div className="flex-1 space-y-2">
            {platformStats.map(stat => (
              <div key={stat.platform} className="flex items-center gap-3">
                <span className="text-sm text-white/70 w-20">
                  {PLATFORM_INFO[stat.platform].name}
                </span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${PLATFORM_INFO[stat.platform].color}`}
                    style={{ width: `${(stat.count / calculatedTotal) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-white/50 w-16 text-right">
                  {stat.count} ({stat.averageRating.toFixed(1)}★)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilter && platformStats.length > 1 && (
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Plattform:</span>
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedPlatform === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Alle ({calculatedTotal})
            </button>
            {platformStats.map(stat => (
              <button
                key={stat.platform}
                onClick={() => setSelectedPlatform(stat.platform)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedPlatform === stat.platform
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {PLATFORM_INFO[stat.platform].icon} {stat.count}
              </button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-white/50">Sortieren:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:border-amber-500"
            >
              <option value="recent">Neueste</option>
              <option value="highest">Beste</option>
              <option value="lowest">Niedrigste</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {displayReviews.length > 0 ? (
        <div className="space-y-4">
          {displayReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Author Avatar */}
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {review.authorImageUrl ? (
                    <img
                      src={review.authorImageUrl}
                      alt={review.author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white/50 text-sm font-medium">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">
                        {review.author}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs bg-gradient-to-r ${PLATFORM_INFO[review.platform].color} text-white`}>
                        {PLATFORM_INFO[review.platform].icon} {PLATFORM_INFO[review.platform].name}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">
                      {formatSocialDate(review.createdAt)}
                    </span>
                  </div>

                  {renderStars(review.rating, 'sm')}

                  {review.text && (
                    <p className="text-sm text-white/70 mt-2 line-clamp-4">
                      {review.text}
                    </p>
                  )}

                  {/* Helpful Counter */}
                  {review.helpful !== undefined && review.helpful > 0 && (
                    <div className="mt-2 text-xs text-white/40">
                      👍 {review.helpful} fanden das hilfreich
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/50">
          <p>Keine Bewertungen für diese Auswahl</p>
        </div>
      )}

      {/* Show More */}
      {filteredReviews.length > maxReviews && (
        <div className="text-center mt-6">
          <button className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
            Weitere Bewertungen laden ({filteredReviews.length - maxReviews} verbleibend)
          </button>
        </div>
      )}
    </div>
  )
}
