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

export async function uploadServiceImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `dishes/${fileName}`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('dish-images')
    .upload(filePath, uint8Array, {
      contentType: file.type,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    return { url: null, error: uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('dish-images')
    .getPublicUrl(filePath)

  return { url: publicUrl, error: null }
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

  // New gastronomy fields
  const image_url = formData.get('image_url') as string || null
  const allergensJson = formData.get('allergens') as string
  const allergens = allergensJson ? JSON.parse(allergensJson) : []
  const is_vegetarian = formData.get('is_vegetarian') === 'true'
  const is_vegan = formData.get('is_vegan') === 'true'
  const is_spicy = formData.get('is_spicy') === 'true'

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
      image_url: image_url || null,
      allergens: allergens.length > 0 ? allergens : null,
      is_vegetarian,
      is_vegan,
      is_spicy,
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

  // New gastronomy fields
  const image_url = formData.get('image_url') as string || null
  const allergensJson = formData.get('allergens') as string
  const allergens = allergensJson ? JSON.parse(allergensJson) : []
  const is_vegetarian = formData.get('is_vegetarian') === 'true'
  const is_vegan = formData.get('is_vegan') === 'true'
  const is_spicy = formData.get('is_spicy') === 'true'

  const { error } = await supabase
    .from('services')
    .update({
      name,
      description,
      category,
      price,
      duration_minutes,
      image_url: image_url || null,
      allergens: allergens.length > 0 ? allergens : null,
      is_vegetarian,
      is_vegan,
      is_spicy,
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
