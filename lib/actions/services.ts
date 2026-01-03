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

  // Gastronomy fields
  const image_url = formData.get('image_url') as string || null
  const category_image_url = formData.get('category_image_url') as string || null
  const allergensJson = formData.get('allergens') as string
  const allergens = allergensJson ? JSON.parse(allergensJson) : []
  const dietLabelsJson = formData.get('diet_labels') as string
  const diet_labels = dietLabelsJson ? JSON.parse(dietLabelsJson) : []
  const otherLabelsJson = formData.get('other_labels') as string
  const other_labels = otherLabelsJson ? JSON.parse(otherLabelsJson) : []
  const crossContaminationJson = formData.get('cross_contamination') as string
  const cross_contamination = crossContaminationJson ? JSON.parse(crossContaminationJson) : []
  // Legacy fields for backwards compatibility
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
      category_image_url: category_image_url || null,
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

  // If category image was set, update all services in the same category
  if (category && category_image_url) {
    await supabase
      .from('services')
      .update({ category_image_url })
      .eq('tenant_id', profile.tenant_id)
      .eq('category', category)
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

  // Gastronomy fields
  const image_url = formData.get('image_url') as string || null
  const category_image_url = formData.get('category_image_url') as string || null
  const allergensJson = formData.get('allergens') as string
  const allergens = allergensJson ? JSON.parse(allergensJson) : []
  // Legacy fields for backwards compatibility
  const is_vegetarian = formData.get('is_vegetarian') === 'true'
  const is_vegan = formData.get('is_vegan') === 'true'
  const is_spicy = formData.get('is_spicy') === 'true'

  const { error } = await supabase
    .from('services')
    .update({
      name,
      description,
      category,
      category_image_url: category_image_url || null,
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

  // If category image was set, update all services in the same category
  if (category && category_image_url) {
    // Get tenant_id from the service
    const { data: service } = await supabase
      .from('services')
      .select('tenant_id')
      .eq('id', id)
      .single()

    if (service) {
      await supabase
        .from('services')
        .update({ category_image_url })
        .eq('tenant_id', service.tenant_id)
        .eq('category', category)
    }
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

// Export services as JSON
export async function exportServices() {
  const supabase = await createClient()

  const { data: services, error } = await supabase
    .from('services')
    .select('name, description, category, price, duration_minutes, is_active, image_url, category_image_url, allergens, diet_labels, other_labels, cross_contamination, is_vegetarian, is_vegan, is_spicy')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error exporting services:', error)
    return { services: [], error: error.message }
  }

  return { services, error: null }
}

// Import services from JSON array
export async function importServices(servicesData: Array<{
  name: string
  description?: string
  category?: string
  price: number
  duration_minutes: number
  is_active?: boolean
  image_url?: string
  category_image_url?: string
  allergens?: string[]
  diet_labels?: string[]
  other_labels?: string[]
  cross_contamination?: string[]
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
}>) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert', imported: 0 }
  }

  // Get tenant_id
  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null }

  if (!profile) {
    return { error: 'Profil nicht gefunden', imported: 0 }
  }

  let imported = 0
  const errors: string[] = []

  for (const service of servicesData) {
    if (!service.name || service.price === undefined || service.duration_minutes === undefined) {
      errors.push(`Übersprungen: "${service.name || 'Unbenannt'}" - Name, Preis oder Dauer fehlt`)
      continue
    }

    const { error } = await supabase
      .from('services')
      .insert({
        tenant_id: profile.tenant_id,
        name: service.name,
        description: service.description || null,
        category: service.category || null,
        price: service.price,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active !== false,
        image_url: service.image_url || null,
        category_image_url: service.category_image_url || null,
        allergens: service.allergens?.length ? service.allergens : null,
        diet_labels: service.diet_labels?.length ? service.diet_labels : null,
        other_labels: service.other_labels?.length ? service.other_labels : null,
        cross_contamination: service.cross_contamination?.length ? service.cross_contamination : null,
        is_vegetarian: service.is_vegetarian || false,
        is_vegan: service.is_vegan || false,
        is_spicy: service.is_spicy || false,
      })

    if (error) {
      errors.push(`Fehler bei "${service.name}": ${error.message}`)
    } else {
      imported++
    }
  }

  revalidatePath('/dashboard/services')

  return {
    error: errors.length > 0 ? errors.join('\n') : null,
    imported,
    total: servicesData.length
  }
}
