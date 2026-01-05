import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheSocialPosts } from '@/lib/actions/social-media'

/**
 * API Route: Sync Social Media Data
 * Fetches posts from external social media APIs and caches them
 *
 * POST /api/social-media/sync
 * Body: { accountId: string, force?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId, force = false } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('*, users!inner(tenant_id)')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Check if user has access to this account
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.tenant_id !== account.users.tenant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if we need to sync (skip if synced recently unless forced)
    if (!force && account.last_sync_at) {
      const lastSync = new Date(account.last_sync_at)
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)

      if (hoursSinceSync < 1) {
        return NextResponse.json({
          success: true,
          message: 'Already synced recently',
          last_sync_at: account.last_sync_at
        })
      }
    }

    // Fetch posts based on platform
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
        return NextResponse.json(
          { error: `Platform ${account.platform} not supported yet` },
          { status: 400 }
        )
    }

    // Cache the posts
    if (posts.length > 0) {
      const result = await cacheSocialPosts(accountId, posts)

      if (!result.success) {
        throw new Error(result.error)
      }
    }

    return NextResponse.json({
      success: true,
      posts_synced: posts.length,
      last_sync_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error syncing social media:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// Platform-specific fetch functions
// =====================================================

/**
 * Fetch Instagram posts using Instagram Basic Display API
 */
async function fetchInstagramPosts(account: any) {
  if (!account.access_token) {
    throw new Error('No access token for Instagram account')
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${account.access_token}&limit=25`
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`)
    }

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
  } catch (error) {
    console.error('Error fetching Instagram posts:', error)
    throw error
  }
}

/**
 * Fetch Facebook posts using Graph API
 */
async function fetchFacebookPosts(account: any) {
  if (!account.access_token || !account.platform_page_id) {
    throw new Error('No access token or page ID for Facebook account')
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${account.platform_page_id}/posts?fields=id,message,full_picture,created_time,permalink_url,likes.summary(true),comments.summary(true),shares&access_token=${account.access_token}&limit=25`
    )

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`)
    }

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
  } catch (error) {
    console.error('Error fetching Facebook posts:', error)
    throw error
  }
}

/**
 * Fetch TikTok videos using TikTok API
 */
async function fetchTikTokPosts(account: any) {
  if (!account.access_token) {
    throw new Error('No access token for TikTok account')
  }

  try {
    // TikTok API v2
    const response = await fetch('https://open.tiktokapis.com/v2/video/list/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        max_count: 20
      })
    })

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.statusText}`)
    }

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
  } catch (error) {
    console.error('Error fetching TikTok posts:', error)
    throw error
  }
}

/**
 * Fetch YouTube videos using YouTube Data API
 */
async function fetchYouTubePosts(account: any) {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured')
  }

  if (!account.platform_user_id) {
    throw new Error('No channel ID for YouTube account')
  }

  try {
    // Get channel's uploads playlist
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${account.platform_user_id}&key=${process.env.YOUTUBE_API_KEY}`
    )

    const channelData = await channelResponse.json()
    const uploadsPlaylistId =
      channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist')
    }

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=25&key=${process.env.YOUTUBE_API_KEY}`
    )

    const videosData = await videosResponse.json()

    // Get statistics for each video
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
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    throw error
  }
}
