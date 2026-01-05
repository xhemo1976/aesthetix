import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route: Sync Social Media Reviews
 * Fetches reviews from Google, Facebook, etc. and caches them
 *
 * POST /api/social-media/reviews
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

    // Fetch reviews based on platform
    let reviews: any[] = []

    switch (account.platform) {
      case 'google':
        reviews = await fetchGoogleReviews(account)
        break
      case 'facebook':
        reviews = await fetchFacebookReviews(account)
        break
      default:
        return NextResponse.json(
          { error: `Reviews not supported for ${account.platform}` },
          { status: 400 }
        )
    }

    // Cache the reviews
    if (reviews.length > 0) {
      const reviewsToInsert = reviews.map(review => ({
        social_account_id: accountId,
        platform: account.platform,
        ...review
      }))

      const { error } = await supabase.from('social_reviews_cache').upsert(reviewsToInsert, {
        onConflict: 'social_account_id,platform_review_id',
        ignoreDuplicates: false
      })

      if (error) throw error

      // Update last_sync_at
      await supabase
        .from('social_accounts')
        .update({ last_sync_at: new Date().toISOString(), sync_error: null })
        .eq('id', accountId)
    }

    return NextResponse.json({
      success: true,
      reviews_synced: reviews.length,
      last_sync_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error syncing reviews:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// Platform-specific review fetch functions
// =====================================================

/**
 * Fetch Google Reviews using Google My Business API
 */
async function fetchGoogleReviews(account: any) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured')
  }

  if (!account.metadata?.place_id) {
    throw new Error('No Google Place ID configured for this account')
  }

  try {
    const placeId = account.metadata.place_id

    // Get place details including reviews
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    const reviews = data.result?.reviews || []

    return reviews.map((review: any) => ({
      platform_review_id: review.time.toString(), // Using timestamp as ID
      author_name: review.author_name,
      author_image_url: review.profile_photo_url || null,
      rating: review.rating,
      review_text: review.text || null,
      reviewed_at: new Date(review.time * 1000).toISOString(),
      helpful_count: 0
    }))
  } catch (error) {
    console.error('Error fetching Google reviews:', error)
    throw error
  }
}

/**
 * Fetch Facebook Reviews using Graph API
 */
async function fetchFacebookReviews(account: any) {
  if (!account.access_token || !account.platform_page_id) {
    throw new Error('No access token or page ID for Facebook account')
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${account.platform_page_id}/ratings?fields=reviewer{id,name,picture},review_text,rating,created_time&access_token=${account.access_token}&limit=50`
    )

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`)
    }

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
  } catch (error) {
    console.error('Error fetching Facebook reviews:', error)
    throw error
  }
}

/**
 * GET endpoint to fetch cached reviews
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let query = supabase
      .from('social_reviews_cache')
      .select(
        `
        *,
        social_accounts!inner(tenant_id, platform, username)
      `
      )
      .eq('social_accounts.tenant_id', userData.tenant_id)
      .order('reviewed_at', { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
