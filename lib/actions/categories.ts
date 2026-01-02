'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type Category = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getCategories() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return { categories: [], error: error.message }
  }

  return { categories: categories as Category[], error: null }
}

export async function getPublicCategories(tenantId: string) {
  const adminClient = createAdminClient()

  const { data: categories, error } = await adminClient
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching public categories:', error)
    return { categories: [], error: error.message }
  }

  return { categories: categories as Category[], error: null }
}

export async function uploadCategoryImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('dish-images')
    .upload(fileName, uint8Array, {
      contentType: file.type,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('Error uploading category image:', uploadError)
    return { url: null, error: uploadError.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('dish-images')
    .getPublicUrl(fileName)

  return { url: publicUrl, error: null }
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert', category: null }
  }

  // Get tenant_id
  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null }

  if (!profile) {
    return { error: 'Profil nicht gefunden', category: null }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string || null
  const image_url = formData.get('image_url') as string || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      tenant_id: profile.tenant_id,
      name,
      description,
      image_url,
      sort_order,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return { error: error.message, category: null }
  }

  revalidatePath('/dashboard/services')
  return { error: null, category }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string || null
  const image_url = formData.get('image_url') as string || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const { error } = await supabase
    .from('categories')
    .update({
      name,
      description,
      image_url,
      sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating category:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  // First, update all services that use this category to have null category_id
  await supabase
    .from('services')
    .update({ category_id: null, category: null })
    .eq('category_id', id)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling category status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}

export async function reorderCategories(categoryIds: string[]) {
  const supabase = await createClient()

  // Update sort_order for each category
  const updates = categoryIds.map((id, index) =>
    supabase
      .from('categories')
      .update({ sort_order: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    return { error: 'Fehler beim Sortieren' }
  }

  revalidatePath('/dashboard/services')
  return { error: null }
}
