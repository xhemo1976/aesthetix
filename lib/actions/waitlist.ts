'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWaitlistNotificationMessage } from '@/lib/utils/whatsapp'

export type WaitlistEntry = {
  id: string
  tenant_id: string
  customer_id: string | null
  service_id: string
  employee_id: string | null
  location_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  preferred_date_from: string
  preferred_date_to: string
  preferred_time_from: string | null
  preferred_time_to: string | null
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'canceled'
  priority: number
  notified_at: string | null
  notification_count: number
  notes: string | null
  created_at: string
  services?: { name: string; duration_minutes: number } | null
  employees?: { first_name: string; last_name: string } | null
  locations?: { name: string } | null
}

/**
 * Get all waitlist entries for the tenant
 */
export async function getWaitlist(status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('waitlist')
    .select(`
      *,
      services (name, duration_minutes),
      employees (first_name, last_name),
      locations (name)
    `)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: entries, error } = await query

  if (error) {
    console.error('Error fetching waitlist:', error)
    return { entries: [], error: error.message }
  }

  return { entries: entries || [], error: null }
}

/**
 * Get waitlist entries for a specific service (used when checking for cancellations)
 */
export async function getWaitlistForService(
  serviceId: string,
  date: string,
  employeeId?: string,
  locationId?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('waitlist')
    .select(`
      *,
      services (name, duration_minutes),
      employees (first_name, last_name)
    `)
    .eq('service_id', serviceId)
    .eq('status', 'waiting')
    .lte('preferred_date_from', date)
    .gte('preferred_date_to', date)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (employeeId) {
    query = query.or(`employee_id.eq.${employeeId},employee_id.is.null`)
  }

  if (locationId) {
    query = query.or(`location_id.eq.${locationId},location_id.is.null`)
  }

  const { data: entries, error } = await query

  if (error) {
    console.error('Error fetching waitlist for service:', error)
    return { entries: [], error: error.message }
  }

  return { entries: entries || [], error: null }
}

/**
 * Add a customer to the waitlist (from dashboard)
 */
export async function addToWaitlist(formData: FormData) {
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

  const serviceId = formData.get('service_id') as string
  const employeeId = formData.get('employee_id') as string | null
  const locationId = formData.get('location_id') as string | null
  const customerId = formData.get('customer_id') as string | null
  const customerName = formData.get('customer_name') as string
  const customerEmail = formData.get('customer_email') as string | null
  const customerPhone = formData.get('customer_phone') as string | null
  const preferredDateFrom = formData.get('preferred_date_from') as string
  const preferredDateTo = formData.get('preferred_date_to') as string
  const preferredTimeFrom = formData.get('preferred_time_from') as string | null
  const preferredTimeTo = formData.get('preferred_time_to') as string | null
  const notes = formData.get('notes') as string | null
  const priority = parseInt(formData.get('priority') as string) || 0

  if (!serviceId || !customerName || !preferredDateFrom || !preferredDateTo) {
    return { error: 'Bitte fülle alle Pflichtfelder aus' }
  }

  if (!customerEmail && !customerPhone) {
    return { error: 'E-Mail oder Telefonnummer erforderlich' }
  }

  const { error } = await supabase
    .from('waitlist')
    .insert({
      tenant_id: profile.tenant_id,
      service_id: serviceId,
      employee_id: employeeId || null,
      location_id: locationId || null,
      customer_id: customerId || null,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      preferred_date_from: preferredDateFrom,
      preferred_date_to: preferredDateTo,
      preferred_time_from: preferredTimeFrom || null,
      preferred_time_to: preferredTimeTo || null,
      notes: notes || null,
      priority,
      status: 'waiting',
    })

  if (error) {
    console.error('Error adding to waitlist:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/waitlist')
  return { error: null }
}

/**
 * Add to waitlist from public booking page
 */
export async function addToPublicWaitlist(formData: FormData) {
  const adminClient = createAdminClient()

  const tenantSlug = formData.get('tenant_slug') as string
  const serviceId = formData.get('service_id') as string
  const employeeId = formData.get('employee_id') as string | null
  const locationId = formData.get('location_id') as string | null
  const customerName = formData.get('customer_name') as string
  const customerEmail = formData.get('customer_email') as string | null
  const customerPhone = formData.get('customer_phone') as string | null
  const preferredDateFrom = formData.get('preferred_date_from') as string
  const preferredDateTo = formData.get('preferred_date_to') as string
  const preferredTimeFrom = formData.get('preferred_time_from') as string | null
  const preferredTimeTo = formData.get('preferred_time_to') as string | null
  const notes = formData.get('notes') as string | null

  if (!tenantSlug || !serviceId || !customerName || !preferredDateFrom || !preferredDateTo) {
    return { error: 'Bitte fülle alle Pflichtfelder aus' }
  }

  if (!customerEmail && !customerPhone) {
    return { error: 'E-Mail oder Telefonnummer erforderlich' }
  }

  // Get tenant ID
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single() as { data: { id: string } | null }

  if (!tenant) {
    return { error: 'Klinik nicht gefunden' }
  }

  // Check if customer exists
  let customerId: string | null = null
  if (customerEmail) {
    const { data: existingCustomer } = await adminClient
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('email', customerEmail)
      .single() as { data: { id: string } | null }
    customerId = existingCustomer?.id || null
  }

  const { error } = await (adminClient
    .from('waitlist')
    .insert({
      tenant_id: tenant.id,
      service_id: serviceId,
      employee_id: employeeId || null,
      location_id: locationId || null,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      preferred_date_from: preferredDateFrom,
      preferred_date_to: preferredDateTo,
      preferred_time_from: preferredTimeFrom || null,
      preferred_time_to: preferredTimeTo || null,
      notes: notes || null,
      priority: 0,
      status: 'waiting',
    } as unknown as never) as unknown as Promise<{ error: Error | null }>)

  if (error) {
    console.error('Error adding to public waitlist:', error)
    return { error: error.message }
  }

  return { error: null, success: true }
}

/**
 * Update waitlist entry status
 */
export async function updateWaitlistStatus(id: string, status: string) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'notified') {
    updateData.notified_at = new Date().toISOString()
    // Increment notification count
    const { data: current } = await supabase
      .from('waitlist')
      .select('notification_count')
      .eq('id', id)
      .single()
    updateData.notification_count = (current?.notification_count || 0) + 1
  }

  const { error } = await supabase
    .from('waitlist')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating waitlist status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/waitlist')
  return { error: null }
}

/**
 * Delete waitlist entry
 */
export async function deleteWaitlistEntry(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('waitlist')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting waitlist entry:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/waitlist')
  return { error: null }
}

/**
 * Get WhatsApp notification link for a waitlist entry
 */
export async function getWaitlistNotificationLink(
  entryId: string,
  availableSlot: { date: string; time: string },
  clinicName: string,
  bookingUrl: string
) {
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('waitlist')
    .select(`
      *,
      services (name)
    `)
    .eq('id', entryId)
    .single()

  if (!entry || !entry.customer_phone) {
    return { link: null, error: 'Kein Telefon hinterlegt' }
  }

  const service = Array.isArray(entry.services) ? entry.services[0] : entry.services

  const message = getWaitlistNotificationMessage({
    customerName: entry.customer_name,
    serviceName: service?.name || 'Ihr gewünschter Service',
    date: availableSlot.date,
    time: availableSlot.time,
    clinicName,
    bookingUrl,
  })

  // Format phone number
  let phone = entry.customer_phone.replace(/\s/g, '')
  if (phone.startsWith('0')) {
    phone = '49' + phone.substring(1)
  }
  if (!phone.startsWith('+')) {
    phone = '+' + phone
  }

  const link = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`

  // Update status to notified
  await updateWaitlistStatus(entryId, 'notified')

  return { link, error: null }
}

/**
 * Find matching waitlist entries when an appointment is canceled
 */
export async function findWaitlistMatchesForCancellation(
  tenantId: string,
  serviceId: string,
  appointmentDate: string,
  appointmentTime: string,
  employeeId?: string | null,
  locationId?: string | null
) {
  const adminClient = createAdminClient()

  // Find waitlist entries that match the canceled appointment
  let query = adminClient
    .from('waitlist')
    .select(`
      *,
      services (name, duration_minutes),
      employees (first_name, last_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('service_id', serviceId)
    .eq('status', 'waiting')
    .lte('preferred_date_from', appointmentDate)
    .gte('preferred_date_to', appointmentDate)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5) // Return top 5 matches

  type WaitlistEntryResult = {
    id: string
    customer_name: string
    customer_email: string | null
    customer_phone: string | null
    employee_id: string | null
    preferred_time_from: string | null
    preferred_time_to: string | null
    services: { name: string; duration_minutes: number } | null
    employees: { first_name: string; last_name: string } | null
  }

  const { data: entries, error } = await query as { data: WaitlistEntryResult[] | null; error: Error | null }

  if (error) {
    console.error('Error finding waitlist matches:', error)
    return { matches: [], error: error.message }
  }

  // Filter by time preference if specified
  const timeNum = parseInt(appointmentTime.replace(':', ''))
  const filteredEntries = (entries || []).filter(entry => {
    // If no time preference, include
    if (!entry.preferred_time_from && !entry.preferred_time_to) return true

    const fromNum = entry.preferred_time_from ? parseInt(entry.preferred_time_from.replace(':', '')) : 0
    const toNum = entry.preferred_time_to ? parseInt(entry.preferred_time_to.replace(':', '')) : 2359

    return timeNum >= fromNum && timeNum <= toNum
  })

  // Filter by employee preference
  const finalEntries = filteredEntries.filter(entry => {
    if (!entry.employee_id) return true // No preference
    return entry.employee_id === employeeId
  })

  return { matches: finalEntries, error: null }
}

/**
 * Get waitlist count for a tenant (for dashboard stats)
 */
export async function getWaitlistCount() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'waiting')

  if (error) {
    console.error('Error getting waitlist count:', error)
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}
