'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface SocialMediaLinks {
  instagram_url: string | null
  facebook_url: string | null
  google_place_url: string | null
  website_url: string | null
  whatsapp_number: string | null
}

export async function updateSocialMediaLinks(
  tenantId: string,
  links: SocialMediaLinks
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const updateData = {
      instagram_url: links.instagram_url,
      facebook_url: links.facebook_url,
      google_place_url: links.google_place_url,
      website_url: links.website_url,
      whatsapp_number: links.whatsapp_number,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('tenants') as any)
      .update(updateData)
      .eq('id', tenantId)

    if (error) {
      console.error('Error updating social media links:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/social-media')
    revalidatePath(`/book/${tenantId}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating social media links:', error)
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}
