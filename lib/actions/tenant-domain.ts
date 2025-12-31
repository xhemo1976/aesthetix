'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// Mapping von Subdomain zu Tenant-Slug
// Später kann das in der Datenbank gespeichert werden
const SUBDOMAIN_MAPPING: Record<string, string> = {
  'demo': 'demo-klinik', // demo.esylana.de -> demo-klinik tenant
}

interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  business_type: string | null
}

export async function getTenantBySubdomain(subdomain: string): Promise<{ tenant: Tenant | null; error: string | null }> {
  try {
    const adminClient = createAdminClient()

    // Erst im Mapping schauen
    const mappedSlug = SUBDOMAIN_MAPPING[subdomain]

    if (mappedSlug) {
      // Suche Tenant der mit diesem Slug beginnt
      const { data: tenant, error } = await adminClient
        .from('tenants')
        .select('*')
        .ilike('slug', `${mappedSlug}%`)
        .limit(1)
        .single()

      if (error || !tenant) {
        return { tenant: null, error: 'Tenant nicht gefunden' }
      }

      return { tenant, error: null }
    }

    // Sonst direkt nach Subdomain als Slug suchen
    const { data: tenant, error } = await adminClient
      .from('tenants')
      .select('*')
      .ilike('slug', `${subdomain}%`)
      .limit(1)
      .single()

    if (error || !tenant) {
      return { tenant: null, error: 'Tenant nicht gefunden' }
    }

    return { tenant, error: null }
  } catch (error) {
    console.error('Error getting tenant by subdomain:', error)
    return { tenant: null, error: 'Fehler beim Laden' }
  }
}

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  category: string | null
}

interface Employee {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
  profile_image_url: string | null
  bio: string | null
}

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
}

export async function getTenantWithDetails(tenantId: string): Promise<{
  services: Service[]
  employees: Employee[]
  locations: Location[]
  error: string | null
}> {
  try {
    const adminClient = createAdminClient()

    const [
      { data: services },
      { data: employeesRaw },
      { data: locations }
    ] = await Promise.all([
      adminClient
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name'),
      adminClient
        .from('employees')
        .select('id, first_name, last_name, role, profile_image_url, bio')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('first_name'),
      adminClient
        .from('locations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false })
    ])

    // Transform employees to include 'name' field
    const employees = (employeesRaw || []).map((emp: { id: string; first_name: string; last_name: string; role: string | null; profile_image_url: string | null; bio: string | null }) => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      role: emp.role,
      avatar_url: null,
      profile_image_url: emp.profile_image_url,
      bio: emp.bio,
    }))

    return {
      services: services || [],
      employees,
      locations: locations || [],
      error: null
    }
  } catch (error) {
    console.error('Error getting tenant details:', error)
    return { services: [], employees: [], locations: [], error: 'Fehler beim Laden' }
  }
}
