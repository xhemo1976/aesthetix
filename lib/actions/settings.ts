'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getTenantSettings() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { settings: null, error: 'Nicht authentifiziert' }
  }

  // Get tenant_id
  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { settings: null, error: 'Profil nicht gefunden' }
  }

  // Get tenant settings
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  if (error) {
    console.error('Error fetching tenant:', error)
    return { settings: null, error: error.message }
  }

  return { settings: tenant, error: null }
}

export async function updateTenantSettings(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  // Get tenant_id
  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profil nicht gefunden' }
  }

  const name = formData.get('name') as string
  const contact_phone = formData.get('contact_phone') as string
  const contact_email = formData.get('contact_email') as string
  const whatsapp_number = formData.get('whatsapp_number') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const postal_code = formData.get('postal_code') as string

  const { error } = await supabase
    .from('tenants')
    .update({
      name,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      whatsapp_number: whatsapp_number || null,
      address: address || null,
      city: city || null,
      postal_code: postal_code || null,
    })
    .eq('id', profile.tenant_id)

  if (error) {
    console.error('Error updating tenant:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { error: null }
}
