'use client'

import { formatSocialDate, truncateText } from '../utils'

interface GoogleReview {
  id: string
  author: string
  authorImageUrl?: string
  rating: number
  text: string
  createdAt: Date
}

interface GoogleReviewsProps {
  reviews: GoogleReview[]
  placeUrl?: string
  averageRating?: number
  totalReviews?: number
  maxReviews?: number
  className?: string
}

/**
 * Google Reviews Component
 * Displays Google Business reviews with ratings
 */
export function GoogleReviews({
  reviews,
  placeUrl,
  averageRating,
  totalReviews,
  maxReviews = 3,
  className = ''
}: GoogleReviewsProps) {
  const displayReviews = reviews.slice(0, maxReviews)

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
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

  return (
    <div className={className}>
      {/* Header with Average Rating */}
      {(averageRating !== undefined || totalReviews !== undefined) && (
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">
              {averageRating?.toFixed(1) || '-'}
            </span>
            <div>
              {averageRating && renderStars(Math.round(averageRating))}
              <p className="text-xs text-white/50 mt-1">
                {totalReviews ? `${totalReviews} Bewertungen` : 'Google Bewertungen'}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <img
              src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
              alt="Google"
              className="w-8 h-8"
            />
          </div>
        </div>
      )}

      {/* Reviews List */}
      {displayReviews.length > 0 ? (
        <div className="space-y-4">
          {displayReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
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
                    <span className="text-white/50 text-sm">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      {review.author}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatSocialDate(review.createdAt)}
                    </span>
                  </div>

                  {renderStars(review.rating)}

                  {review.text && (
                    <p className="text-sm text-white/70 mt-2 line-clamp-3">
                      {review.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/50">
          <p>Keine Bewertungen verfügbar</p>
        </div>
      )}

      {/* Link to Google */}
      {placeUrl && (
        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mt-6 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Alle Bewertungen auf Google ansehen →
        </a>
      )}
    </div>
  )
}
