'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']

export type LocationWithEmployees = Location & {
  employee_count: number
  service_count: number
}

/**
 * Get all locations for the current tenant
 */
export async function getLocations(): Promise<{
  locations: LocationWithEmployees[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { locations: [], error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { locations: [], error: 'Kein Tenant gefunden' }
  }

  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return { locations: [], error: error.message }
  }

  // Get employee and service counts for each location
  const locationsWithCounts: LocationWithEmployees[] = []

  for (const location of locations || []) {
    const { count: employeeCount } = await supabase
      .from('employee_locations')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', location.id)

    const { count: serviceCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', location.id)
      .eq('is_active', true)

    locationsWithCounts.push({
      ...location,
      employee_count: employeeCount || 0,
      service_count: serviceCount || 0
    })
  }

  return { locations: locationsWithCounts, error: null }
}

/**
 * Get a single location by ID
 */
export async function getLocationById(locationId: string): Promise<{
  location: Location | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()

  if (error) {
    return { location: null, error: error.message }
  }

  return { location, error: null }
}

/**
 * Create a new location
 */
export async function createLocation(formData: FormData): Promise<{
  location: Location | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { location: null, error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { location: null, error: 'Kein Tenant gefunden' }
  }

  if (!['owner', 'admin'].includes(profile.role)) {
    return { location: null, error: 'Keine Berechtigung' }
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const postalCode = formData.get('postal_code') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const whatsappNumber = formData.get('whatsapp_number') as string

  if (!name || !slug) {
    return { location: null, error: 'Name und Slug sind erforderlich' }
  }

  // Check if slug is unique within tenant
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('slug', slug)
    .single()

  if (existingLocation) {
    return { location: null, error: 'Dieser Slug wird bereits verwendet' }
  }

  const locationData: LocationInsert = {
    tenant_id: profile.tenant_id,
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    address: address || null,
    city: city || null,
    postal_code: postalCode || null,
    phone: phone || null,
    email: email || null,
    whatsapp_number: whatsappNumber || null,
    is_active: true,
    is_primary: false
  }

  const { data: location, error } = await supabase
    .from('locations')
    .insert(locationData)
    .select()
    .single()

  if (error) {
    return { location: null, error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { location, error: null }
}

/**
 * Update a location
 */
export async function updateLocation(locationId: string, formData: FormData): Promise<{
  location: Location | null
  error: string | null
}> {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const postalCode = formData.get('postal_code') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const whatsappNumber = formData.get('whatsapp_number') as string
  const isActive = formData.get('is_active') === 'true'

  const { data: location, error } = await supabase
    .from('locations')
    .update({
      name,
      address: address || null,
      city: city || null,
      postal_code: postalCode || null,
      phone: phone || null,
      email: email || null,
      whatsapp_number: whatsappNumber || null,
      is_active: isActive
    })
    .eq('id', locationId)
    .select()
    .single()

  if (error) {
    return { location: null, error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { location, error: null }
}

/**
 * Delete a location
 */
export async function deleteLocation(locationId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  // Check if this is the primary location
  const { data: location } = await supabase
    .from('locations')
    .select('is_primary')
    .eq('id', locationId)
    .single()

  if (location?.is_primary) {
    return { success: false, error: 'Der Hauptstandort kann nicht gelöscht werden' }
  }

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true, error: null }
}

/**
 * Set a location as primary
 */
export async function setLocationAsPrimary(locationId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { success: false, error: 'Kein Tenant gefunden' }
  }

  // Remove primary from all other locations
  await supabase
    .from('locations')
    .update({ is_primary: false })
    .eq('tenant_id', profile.tenant_id)

  // Set this location as primary
  const { error } = await supabase
    .from('locations')
    .update({ is_primary: true })
    .eq('id', locationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true, error: null }
}

/**
 * Get employees for a location
 */
export async function getLocationEmployees(locationId: string): Promise<{
  employees: Array<{ id: string; first_name: string; last_name: string; role: string }>
  error: string | null
}> {
  const supabase = await createClient()

  const { data: employeeLocations, error } = await supabase
    .from('employee_locations')
    .select(`
      employees (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .eq('location_id', locationId)

  if (error) {
    return { employees: [], error: error.message }
  }

  const employees = (employeeLocations || [])
    .map(el => {
      const emp = Array.isArray(el.employees) ? el.employees[0] : el.employees
      return emp as { id: string; first_name: string; last_name: string; role: string }
    })
    .filter(Boolean)

  return { employees, error: null }
}

/**
 * Assign employee to location
 */
export async function assignEmployeeToLocation(employeeId: string, locationId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employee_locations')
    .insert({ employee_id: employeeId, location_id: locationId })

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { success: false, error: 'Mitarbeiter ist bereits diesem Standort zugewiesen' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true, error: null }
}

/**
 * Remove employee from location
 */
export async function removeEmployeeFromLocation(employeeId: string, locationId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employee_locations')
    .delete()
    .eq('employee_id', employeeId)
    .eq('location_id', locationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/locations')
  return { success: true, error: null }
}

// ============================================
// PUBLIC FUNCTIONS (for booking page)
// ============================================

/**
 * Get public locations for a tenant (by slug)
 */
export async function getPublicLocations(tenantSlug: string): Promise<{
  locations: Location[]
  error: string | null
}> {
  const adminClient = createAdminClient()

  // Get tenant ID
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single() as { data: { id: string } | null }

  if (!tenant) {
    return { locations: [], error: 'Tenant nicht gefunden' }
  }

  const { data: locations, error } = await adminClient
    .from('locations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return { locations: [], error: error.message }
  }

  return { locations: locations || [], error: null }
}

/**
 * Get a public location by slug
 */
export async function getPublicLocationBySlug(tenantSlug: string, locationSlug: string): Promise<{
  location: Location | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  // Get tenant ID
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single() as { data: { id: string } | null }

  if (!tenant) {
    return { location: null, error: 'Tenant nicht gefunden' }
  }

  const { data: location, error } = await adminClient
    .from('locations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('slug', locationSlug)
    .eq('is_active', true)
    .single()

  if (error) {
    return { location: null, error: error.message }
  }

  return { location, error: null }
}
