'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type Package = {
  id: string
  tenant_id: string
  location_id: string | null
  name: string
  description: string | null
  package_type: 'bundle' | 'multiuse'
  service_id: string | null
  total_uses: number
  original_price: number
  sale_price: number
  discount_percentage: number | null
  validity_days: number | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  is_featured: boolean
  max_purchases: number | null
  max_per_customer: number
  created_at: string
  package_items?: PackageItem[]
  services?: { name: string } | null
}

export type PackageItem = {
  id: string
  package_id: string
  service_id: string
  quantity: number
  services?: { id: string; name: string; price: number; duration_minutes: number } | null
}

export type CustomerPackage = {
  id: string
  tenant_id: string
  customer_id: string
  package_id: string
  purchase_price: number
  purchased_at: string
  expires_at: string | null
  total_uses: number
  uses_remaining: number
  status: 'active' | 'expired' | 'fully_used' | 'canceled' | 'refunded'
  notes: string | null
  packages?: Package | null
  customers?: { first_name: string; last_name: string; email: string | null; phone: string | null } | null
}

/**
 * Get all packages for the tenant
 */
export async function getPackages() {
  const supabase = await createClient()

  const { data: packages, error } = await supabase
    .from('packages')
    .select(`
      *,
      services (name),
      package_items (
        id,
        service_id,
        quantity,
        services (id, name, price, duration_minutes)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching packages:', error)
    return { packages: [], error: error.message }
  }

  return { packages: packages || [], error: null }
}

/**
 * Get active packages (for public/booking)
 */
export async function getActivePackages(tenantId: string, locationId?: string) {
  const adminClient = createAdminClient()

  const now = new Date().toISOString()

  let query = adminClient
    .from('packages')
    .select(`
      *,
      services (name),
      package_items (
        id,
        service_id,
        quantity,
        services (id, name, price, duration_minutes)
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (locationId) {
    query = query.or(`location_id.is.null,location_id.eq.${locationId}`)
  }

  const { data: packages, error } = await query

  if (error) {
    console.error('Error fetching active packages:', error)
    return { packages: [], error: error.message }
  }

  return { packages: packages || [], error: null }
}

/**
 * Get a single package by ID
 */
export async function getPackageById(id: string) {
  const supabase = await createClient()

  const { data: pkg, error } = await supabase
    .from('packages')
    .select(`
      *,
      services (name),
      package_items (
        id,
        service_id,
        quantity,
        services (id, name, price, duration_minutes)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching package:', error)
    return { package: null, error: error.message }
  }

  return { package: pkg, error: null }
}

/**
 * Create a new package
 */
export async function createPackage(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert', packageId: null }
  }

  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null }

  if (!profile) {
    return { error: 'Profil nicht gefunden', packageId: null }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const packageType = formData.get('package_type') as 'bundle' | 'multiuse'
  const serviceId = formData.get('service_id') as string | null
  const totalUses = parseInt(formData.get('total_uses') as string) || 1
  const originalPrice = parseFloat(formData.get('original_price') as string)
  const salePrice = parseFloat(formData.get('sale_price') as string)
  const validityDays = formData.get('validity_days') ? parseInt(formData.get('validity_days') as string) : null
  const validFrom = formData.get('valid_from') as string | null
  const validUntil = formData.get('valid_until') as string | null
  const isActive = formData.get('is_active') === 'true'
  const isFeatured = formData.get('is_featured') === 'true'
  const maxPurchases = formData.get('max_purchases') ? parseInt(formData.get('max_purchases') as string) : null
  const maxPerCustomer = parseInt(formData.get('max_per_customer') as string) || 1
  const locationId = formData.get('location_id') as string | null

  // Calculate discount percentage
  const discountPercentage = originalPrice > 0
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100 * 100) / 100
    : null

  const { data: pkg, error } = await supabase
    .from('packages')
    .insert({
      tenant_id: profile.tenant_id,
      location_id: locationId || null,
      name,
      description: description || null,
      package_type: packageType,
      service_id: packageType === 'multiuse' ? serviceId : null,
      total_uses: packageType === 'multiuse' ? totalUses : 1,
      original_price: originalPrice,
      sale_price: salePrice,
      discount_percentage: discountPercentage,
      validity_days: validityDays,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      is_active: isActive,
      is_featured: isFeatured,
      max_purchases: maxPurchases,
      max_per_customer: maxPerCustomer,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating package:', error)
    return { error: error.message, packageId: null }
  }

  revalidatePath('/dashboard/packages')
  return { error: null, packageId: pkg.id }
}

/**
 * Update package items (services in a bundle)
 */
export async function updatePackageItems(packageId: string, items: { serviceId: string; quantity: number }[]) {
  const supabase = await createClient()

  // Delete existing items
  await supabase
    .from('package_items')
    .delete()
    .eq('package_id', packageId)

  // Insert new items
  if (items.length > 0) {
    const { error } = await supabase
      .from('package_items')
      .insert(
        items.map(item => ({
          package_id: packageId,
          service_id: item.serviceId,
          quantity: item.quantity,
        }))
      )

    if (error) {
      console.error('Error updating package items:', error)
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/packages')
  return { error: null }
}

/**
 * Update a package
 */
export async function updatePackage(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const packageType = formData.get('package_type') as 'bundle' | 'multiuse'
  const serviceId = formData.get('service_id') as string | null
  const totalUses = parseInt(formData.get('total_uses') as string) || 1
  const originalPrice = parseFloat(formData.get('original_price') as string)
  const salePrice = parseFloat(formData.get('sale_price') as string)
  const validityDays = formData.get('validity_days') ? parseInt(formData.get('validity_days') as string) : null
  const validFrom = formData.get('valid_from') as string | null
  const validUntil = formData.get('valid_until') as string | null
  const isActive = formData.get('is_active') === 'true'
  const isFeatured = formData.get('is_featured') === 'true'
  const maxPurchases = formData.get('max_purchases') ? parseInt(formData.get('max_purchases') as string) : null
  const maxPerCustomer = parseInt(formData.get('max_per_customer') as string) || 1
  const locationId = formData.get('location_id') as string | null

  const discountPercentage = originalPrice > 0
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100 * 100) / 100
    : null

  const { error } = await supabase
    .from('packages')
    .update({
      location_id: locationId || null,
      name,
      description: description || null,
      package_type: packageType,
      service_id: packageType === 'multiuse' ? serviceId : null,
      total_uses: packageType === 'multiuse' ? totalUses : 1,
      original_price: originalPrice,
      sale_price: salePrice,
      discount_percentage: discountPercentage,
      validity_days: validityDays,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      is_active: isActive,
      is_featured: isFeatured,
      max_purchases: maxPurchases,
      max_per_customer: maxPerCustomer,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating package:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/packages')
  return { error: null }
}

/**
 * Delete a package
 */
export async function deletePackage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting package:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/packages')
  return { error: null }
}

/**
 * Sell a package to a customer
 */
export async function sellPackageToCustomer(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null }

  if (!profile) {
    return { error: 'Profil nicht gefunden' }
  }

  const packageId = formData.get('package_id') as string
  const customerId = formData.get('customer_id') as string
  const notes = formData.get('notes') as string | null

  // Get package details
  const { data: pkg } = await supabase
    .from('packages')
    .select('sale_price, total_uses, validity_days, max_per_customer')
    .eq('id', packageId)
    .single()

  if (!pkg) {
    return { error: 'Paket nicht gefunden' }
  }

  // Check if customer already has max purchases
  const { count } = await supabase
    .from('customer_packages')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('package_id', packageId)
    .in('status', ['active', 'fully_used'])

  if (count && count >= pkg.max_per_customer) {
    return { error: `Dieser Kunde hat bereits die maximale Anzahl (${pkg.max_per_customer}) dieses Pakets` }
  }

  // Calculate expiry date
  let expiresAt: string | null = null
  if (pkg.validity_days) {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + pkg.validity_days)
    expiresAt = expiry.toISOString()
  }

  const { error } = await supabase
    .from('customer_packages')
    .insert({
      tenant_id: profile.tenant_id,
      customer_id: customerId,
      package_id: packageId,
      purchase_price: pkg.sale_price,
      total_uses: pkg.total_uses,
      uses_remaining: pkg.total_uses,
      expires_at: expiresAt,
      status: 'active',
      notes: notes || null,
    })

  if (error) {
    console.error('Error selling package:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/packages')
  revalidatePath('/dashboard/customers')
  return { error: null }
}

/**
 * Get customer packages (purchased packages)
 */
export async function getCustomerPackages(customerId?: string, status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('customer_packages')
    .select(`
      *,
      packages (
        id,
        name,
        package_type,
        total_uses,
        service_id,
        services (name)
      ),
      customers (
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .order('purchased_at', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: customerPackages, error } = await query

  if (error) {
    console.error('Error fetching customer packages:', error)
    return { customerPackages: [], error: error.message }
  }

  return { customerPackages: customerPackages || [], error: null }
}

/**
 * Redeem a use from a customer package
 */
export async function redeemPackageUse(
  customerPackageId: string,
  appointmentId?: string,
  serviceId?: string,
  notes?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get customer package
  const { data: customerPackage } = await supabase
    .from('customer_packages')
    .select('uses_remaining, status')
    .eq('id', customerPackageId)
    .single()

  if (!customerPackage) {
    return { error: 'Paket nicht gefunden' }
  }

  if (customerPackage.status !== 'active') {
    return { error: 'Paket ist nicht aktiv' }
  }

  if (customerPackage.uses_remaining <= 0) {
    return { error: 'Keine Verwendungen mehr übrig' }
  }

  // Create redemption record
  const { error: redemptionError } = await supabase
    .from('package_redemptions')
    .insert({
      customer_package_id: customerPackageId,
      appointment_id: appointmentId || null,
      service_id: serviceId || null,
      redeemed_by: user?.id || null,
      notes: notes || null,
    })

  if (redemptionError) {
    console.error('Error creating redemption:', redemptionError)
    return { error: redemptionError.message }
  }

  // Update uses remaining
  const newUsesRemaining = customerPackage.uses_remaining - 1
  const newStatus = newUsesRemaining === 0 ? 'fully_used' : 'active'

  const { error: updateError } = await supabase
    .from('customer_packages')
    .update({
      uses_remaining: newUsesRemaining,
      status: newStatus,
    })
    .eq('id', customerPackageId)

  if (updateError) {
    console.error('Error updating customer package:', updateError)
    return { error: updateError.message }
  }

  revalidatePath('/dashboard/packages')
  revalidatePath('/dashboard/customers')
  return { error: null }
}

/**
 * Get active packages for a specific customer (for booking/redemption)
 */
export async function getActiveCustomerPackages(customerId: string, serviceId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('customer_packages')
    .select(`
      *,
      packages (
        id,
        name,
        package_type,
        service_id,
        services (name),
        package_items (
          service_id
        )
      )
    `)
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .gt('uses_remaining', 0)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

  const { data: customerPackages, error } = await query

  if (error) {
    console.error('Error fetching active customer packages:', error)
    return { packages: [], error: error.message }
  }

  // Filter by service if provided
  let filteredPackages = customerPackages || []
  if (serviceId) {
    filteredPackages = filteredPackages.filter(cp => {
      const pkg = Array.isArray(cp.packages) ? cp.packages[0] : cp.packages
      if (!pkg) return false

      // Multiuse package - check if service matches
      if (pkg.package_type === 'multiuse') {
        return pkg.service_id === serviceId
      }

      // Bundle package - check if service is in items
      const items = pkg.package_items || []
      return items.some((item: { service_id: string }) => item.service_id === serviceId)
    })
  }

  return { packages: filteredPackages, error: null }
}
