'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'google' | 'youtube' | 'whatsapp'

export interface SocialAccount {
  id: string
  tenant_id: string
  platform: SocialPlatform
  username: string | null
  profile_url: string | null
  profile_image_url: string | null
  is_active: boolean
  last_sync_at: string | null
  sync_error: string | null
  created_at: string
}

export interface SocialPost {
  id: string
  platform: SocialPlatform
  platform_post_id: string
  content: string | null
  image_url: string | null
  video_url: string | null
  link: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  posted_at: string
}

export interface SocialReview {
  id: string
  platform: SocialPlatform
  platform_review_id: string
  author_name: string
  author_image_url: string | null
  rating: number
  review_text: string | null
  reviewed_at: string
  helpful_count: number
  business_response: string | null
  business_response_at: string | null
}

// =====================================================
// Social Accounts Management
// =====================================================

/**
 * Get all social accounts for the current tenant
 */
export async function getSocialAccounts(): Promise<{ success: boolean; data?: SocialAccount[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data as SocialAccount[] }
  } catch (error) {
    console.error('Error fetching social accounts:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Add a new social account
 */
export async function addSocialAccount(
  platform: SocialPlatform,
  username: string,
  profileUrl: string,
  accessToken?: string
): Promise<{ success: boolean; data?: SocialAccount; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    if (!['admin', 'owner'].includes(userData.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .insert({
        tenant_id: userData.tenant_id,
        platform,
        username,
        profile_url: profileUrl,
        access_token: accessToken,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/social-media')
    return { success: true, data: data as SocialAccount }
  } catch (error) {
    console.error('Error adding social account:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update a social account
 */
export async function updateSocialAccount(
  accountId: string,
  updates: Partial<Pick<SocialAccount, 'username' | 'profile_url' | 'is_active'>>
): Promise<{ success: boolean; data?: SocialAccount; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/social-media')
    return { success: true, data: data as SocialAccount }
  } catch (error) {
    console.error('Error updating social account:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a social account
 */
export async function deleteSocialAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', accountId)

    if (error) throw error

    revalidatePath('/dashboard/social-media')
    return { success: true }
  } catch (error) {
    console.error('Error deleting social account:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =====================================================
// Social Posts
// =====================================================

/**
 * Get cached social posts for the tenant
 */
export async function getSocialPosts(
  platform?: SocialPlatform,
  limit: number = 50
): Promise<{ success: boolean; data?: SocialPost[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    let query = supabase
      .from('social_posts_cache')
      .select(`
        *,
        social_accounts!inner(tenant_id, platform)
      `)
      .eq('social_accounts.tenant_id', userData.tenant_id)
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data as any as SocialPost[] }
  } catch (error) {
    console.error('Error fetching social posts:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Cache social posts from external API
 */
export async function cacheSocialPosts(
  accountId: string,
  posts: Array<{
    platform_post_id: string
    content?: string
    image_url?: string
    video_url?: string
    link?: string
    likes_count?: number
    comments_count?: number
    shares_count?: number
    views_count?: number
    posted_at: string
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get account info
    const { data: account } = await supabase
      .from('social_accounts')
      .select('platform')
      .eq('id', accountId)
      .single()

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    const postsToInsert = posts.map(post => ({
      social_account_id: accountId,
      platform: account.platform,
      ...post,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      views_count: post.views_count || 0
    }))

    const { error } = await supabase
      .from('social_posts_cache')
      .upsert(postsToInsert, {
        onConflict: 'social_account_id,platform_post_id',
        ignoreDuplicates: false
      })

    if (error) throw error

    // Update last_sync_at
    await supabase
      .from('social_accounts')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', accountId)

    revalidatePath('/dashboard/social-media')
    return { success: true }
  } catch (error) {
    console.error('Error caching social posts:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =====================================================
// Social Reviews
// =====================================================

/**
 * Get cached social reviews for the tenant
 */
export async function getSocialReviews(
  platform?: SocialPlatform,
  limit: number = 50
): Promise<{ success: boolean; data?: SocialReview[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    let query = supabase
      .from('social_reviews_cache')
      .select(`
        *,
        social_accounts!inner(tenant_id, platform)
      `)
      .eq('social_accounts.tenant_id', userData.tenant_id)
      .order('reviewed_at', { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data as any as SocialReview[] }
  } catch (error) {
    console.error('Error fetching social reviews:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get average rating across all platforms
 */
export async function getAverageRating(): Promise<{
  success: boolean
  data?: { average_rating: number; total_reviews: number }
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    const { data, error } = await supabase.rpc('get_tenant_average_rating', {
      tenant_uuid: userData.tenant_id
    })

    if (error) throw error

    return {
      success: true,
      data: data?.[0] || { average_rating: 0, total_reviews: 0 }
    }
  } catch (error) {
    console.error('Error getting average rating:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Respond to a review
 */
export async function respondToReview(
  reviewId: string,
  response: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('social_reviews_cache')
      .update({
        business_response: response,
        business_response_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (error) throw error

    revalidatePath('/dashboard/social-media')
    return { success: true }
  } catch (error) {
    console.error('Error responding to review:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
