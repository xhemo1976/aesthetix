import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SocialAccount = {
  id: string
  tenant_id: string
  platform: 'instagram' | 'facebook' | 'tiktok' | 'google' | 'youtube' | 'whatsapp'
  username: string | null
  access_token: string | null
  platform_page_id: string | null
  platform_user_id: string | null
  metadata: any
  is_active: boolean
  last_sync_at: string | null
}

/**
 * Cron Job: Auto-sync social media accounts
 *
 * This endpoint should be called periodically (e.g., every hour) by a cron service
 * to automatically sync all active social media accounts.
 *
 * Security: Should be protected by a secret token in production
 *
 * GET /api/cron/social-media-sync?secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all active social accounts that haven't been synced in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('is_active', true)
      .or(`last_sync_at.is.null,last_sync_at.lt.${oneHourAgo}`) as { data: SocialAccount[] | null, error: any }

    if (accountsError) {
      throw accountsError
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to sync',
        synced: 0
      })
    }

    const results = {
      total: accounts.length,
      synced: 0,
      failed: 0,
      errors: [] as Array<{ accountId: string; platform: string; error: string }>
    }

    // Sync each account
    for (const account of accounts) {
      try {
        // Sync posts
        await syncAccountPosts(account)

        // Sync reviews (only for Google and Facebook)
        if (['google', 'facebook'].includes(account.platform)) {
          await syncAccountReviews(account)
        }

        results.synced++
      } catch (error) {
        console.error(`Error syncing account ${account.id}:`, error)
        results.failed++
        results.errors.push({
          accountId: account.id,
          platform: account.platform,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        // Update account with error
        await (supabase as any)
          .from('social_accounts')
          .update({
            sync_error: error instanceof Error ? error.message : 'Unknown error',
            last_sync_at: new Date().toISOString()
          })
          .eq('id', account.id)
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// Helper Functions
// =====================================================

async function syncAccountPosts(account: SocialAccount) {
  let posts: any[] = []

  switch (account.platform) {
    case 'instagram':
      posts = await fetchInstagramPosts(account)
      break
    case 'facebook':
      posts = await fetchFacebookPosts(account)
      break
    case 'tiktok':
      posts = await fetchTikTokPosts(account)
      break
    case 'youtube':
      posts = await fetchYouTubePosts(account)
      break
    default:
      return
  }

  if (posts.length === 0) return

  const supabase = createAdminClient()

  const postsToInsert = posts.map(post => ({
    social_account_id: account.id,
    platform: account.platform,
    ...post
  }))

  await (supabase.from('social_posts_cache').upsert as any)(postsToInsert, {
    onConflict: 'social_account_id,platform_post_id',
    ignoreDuplicates: false
  })

  await supabase
    .from('social_accounts')
      // @ts-expect-error
    .update({ last_sync_at: new Date().toISOString(), sync_error: null })
    .eq('id', account.id)
}

async function syncAccountReviews(account: SocialAccount) {
  let reviews: any[] = []

  switch (account.platform) {
    case 'google':
      reviews = await fetchGoogleReviews(account)
      break
    case 'facebook':
      reviews = await fetchFacebookReviews(account)
      break
    default:
      return
  }

  if (reviews.length === 0) return

  const supabase = createAdminClient()

  const reviewsToInsert = reviews.map(review => ({
    social_account_id: account.id,
    platform: account.platform,
    ...review
  }))

  await (supabase.from('social_reviews_cache').upsert as any)(reviewsToInsert, {
    onConflict: 'social_account_id,platform_review_id',
    ignoreDuplicates: false
  })
}

// Copy functions from sync/route.ts
async function fetchInstagramPosts(account: SocialAccount) {
  if (!account.access_token) return []

  const response = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${account.access_token}&limit=25`
  )

  if (!response.ok) return []

  const data = await response.json()

  return data.data.map((post: any) => ({
    platform_post_id: post.id,
    content: post.caption || '',
    image_url: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
    video_url: post.media_type === 'VIDEO' ? post.media_url : null,
    link: post.permalink,
    likes_count: post.like_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: 0,
    views_count: 0,
    posted_at: post.timestamp
  }))
}

async function fetchFacebookPosts(account: SocialAccount) {
  if (!account.access_token || !account.platform_page_id) return []

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${account.platform_page_id}/posts?fields=id,message,full_picture,created_time,permalink_url,likes.summary(true),comments.summary(true),shares&access_token=${account.access_token}&limit=25`
  )

  if (!response.ok) return []

  const data = await response.json()

  return data.data.map((post: any) => ({
    platform_post_id: post.id,
    content: post.message || '',
    image_url: post.full_picture || null,
    video_url: null,
    link: post.permalink_url,
    likes_count: post.likes?.summary?.total_count || 0,
    comments_count: post.comments?.summary?.total_count || 0,
    shares_count: post.shares?.count || 0,
    views_count: 0,
    posted_at: post.created_time
  }))
}

async function fetchTikTokPosts(account: SocialAccount) {
  if (!account.access_token) return []

  const response = await fetch('https://open.tiktokapis.com/v2/video/list/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ max_count: 20 })
  })

  if (!response.ok) return []

  const data = await response.json()

  return data.data.videos.map((video: any) => ({
    platform_post_id: video.id,
    content: video.title || video.video_description || '',
    image_url: video.cover_image_url,
    video_url: video.embed_link,
    link: video.share_url,
    likes_count: video.like_count || 0,
    comments_count: video.comment_count || 0,
    shares_count: video.share_count || 0,
    views_count: video.view_count || 0,
    posted_at: new Date(video.create_time * 1000).toISOString()
  }))
}

async function fetchYouTubePosts(account: SocialAccount) {
  if (!process.env.YOUTUBE_API_KEY || !account.platform_user_id) return []

  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${account.platform_user_id}&key=${process.env.YOUTUBE_API_KEY}`
  )

  const channelData = await channelResponse.json()
  const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!uploadsPlaylistId) return []

  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=25&key=${process.env.YOUTUBE_API_KEY}`
  )

  const videosData = await videosResponse.json()
  const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')

  const statsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
  )

  const statsData = await statsResponse.json()

  return videosData.items.map((item: any, index: number) => {
    const stats = statsData.items[index]?.statistics || {}
    return {
      platform_post_id: item.snippet.resourceId.videoId,
      content: item.snippet.title + '\n\n' + item.snippet.description,
      image_url: item.snippet.thumbnails.high.url,
      video_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      likes_count: parseInt(stats.likeCount || '0'),
      comments_count: parseInt(stats.commentCount || '0'),
      shares_count: 0,
      views_count: parseInt(stats.viewCount || '0'),
      posted_at: item.snippet.publishedAt
    }
  })
}

async function fetchGoogleReviews(account: SocialAccount) {
  if (!process.env.GOOGLE_MAPS_API_KEY || !account.metadata?.place_id) return []

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${account.metadata.place_id}&fields=reviews&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )

  if (!response.ok) return []

  const data = await response.json()
  const reviews = data.result?.reviews || []

  return reviews.map((review: any) => ({
    platform_review_id: review.time.toString(),
    author_name: review.author_name,
    author_image_url: review.profile_photo_url || null,
    rating: review.rating,
    review_text: review.text || null,
    reviewed_at: new Date(review.time * 1000).toISOString(),
    helpful_count: 0
  }))
}

async function fetchFacebookReviews(account: SocialAccount) {
  if (!account.access_token || !account.platform_page_id) return []

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${account.platform_page_id}/ratings?fields=reviewer{id,name,picture},review_text,rating,created_time&access_token=${account.access_token}&limit=50`
  )

  if (!response.ok) return []

  const data = await response.json()

  return data.data.map((review: any) => ({
    platform_review_id: review.created_time + '_' + review.reviewer.id,
    author_name: review.reviewer.name,
    author_image_url: review.reviewer.picture?.data?.url || null,
    rating: review.rating,
    review_text: review.review_text || null,
    reviewed_at: review.created_time,
    helpful_count: 0
  }))
}
