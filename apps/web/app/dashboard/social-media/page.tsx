import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSocialAccounts, getSocialPosts, getSocialReviews, getAverageRating } from '@/lib/actions/social-media'
import { SocialAccountsManager } from './social-accounts-manager'
import { SocialMediaStats } from './social-media-stats'

export default async function SocialMediaPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all social media data
  const [accountsResult, postsResult, reviewsResult, ratingResult] = await Promise.all([
    getSocialAccounts(),
    getSocialPosts(undefined, 12),
    getSocialReviews(undefined, 10),
    getAverageRating()
  ])

  const accounts = accountsResult.data || []
  const posts = postsResult.data || []
  const reviews = reviewsResult.data || []
  const rating = ratingResult.data || { average_rating: 0, total_reviews: 0 }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Social Media</h2>
        <p className="text-muted-foreground">
          Verwalte deine Social Media Accounts und sehe deine Performance
        </p>
      </div>

      {/* Stats Overview */}
      <SocialMediaStats
        accounts={accounts}
        posts={posts}
        reviews={reviews}
        averageRating={rating.average_rating}
        totalReviews={rating.total_reviews}
      />

      {/* Accounts Manager */}
      <div className="mt-8">
        <SocialAccountsManager initialAccounts={accounts} />
      </div>

      {/* Recent Posts Preview */}
      {posts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Neueste Posts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.slice(0, 8).map((post: any) => (
              <a
                key={post.id}
                href={post.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity"
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.content || 'Post'}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <span className="capitalize">{post.platform}</span>
                    <span>•</span>
                    <span>❤️ {post.likes_count}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews Preview */}
      {reviews.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Neueste Bewertungen</h3>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review: any) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-muted border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {review.author_image_url ? (
                      <img
                        src={review.author_image_url}
                        alt={review.author_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium">
                        {review.author_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{review.author_name}</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {review.platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
