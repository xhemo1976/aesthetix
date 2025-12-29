'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getServices() {
  const supabase = await createClient()

  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching services:', error)
    return { services: [], error: error.message }
  }

  return { services, error: null }
}

export async function createService(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  // Get tenant_id using admin client (bypasses RLS)
  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null }

  if (!profile) {
    return { error: 'Profil nicht gefunden' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const price = parseFloat(formData.get('price') as string)
  const duration_minutes = parseInt(formData.get('duration_minutes') as string)

  const { error } = await supabase
    .from('services')
    .insert({
      tenant_id: profile.tenant_id,
      name,
      description,
      category,
      price,
      duration_minutes,
      is_active: true,
    })

  if (error) {
    console.error('Error creating service:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const price = parseFloat(formData.get('price') as string)
  const duration_minutes = parseInt(formData.get('duration_minutes') as string)

  const { error } = await supabase
    .from('services')
    .update({
      name,
      description,
      category,
      price,
      duration_minutes,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating service:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}

export async function deleteService(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting service:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling service status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}
