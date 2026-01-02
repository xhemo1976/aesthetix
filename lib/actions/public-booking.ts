'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmationEmail } from '@/lib/utils/email'
import type { Database } from '@/lib/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']
type Service = Database['public']['Tables']['services']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

export type Employee = {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string
  specialties: string[]
  work_schedule: Record<string, { start: string; end: string }>
  is_active: boolean
  profile_image_url: string | null
  bio: string | null
}

// Generate random confirmation token
function generateConfirmationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Get tenant by slug for public booking page
 */
export async function getTenantBySlug(slug: string): Promise<{
  tenant: Tenant | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  const { data: tenant, error } = await adminClient
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .in('subscription_status', ['trial', 'active'])
    .single()

  if (error || !tenant) {
    return { tenant: null, error: 'Klinik nicht gefunden' }
  }

  return { tenant, error: null }
}

/**
 * Get active services for a tenant (public access)
 * Optionally filter by location
 */
export async function getPublicServices(tenantId: string, locationId?: string): Promise<{
  services: Service[] | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  // Filter by location if provided
  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data: services, error } = await query.order('name', { ascending: true })

  if (error) {
    console.error('Error fetching public services:', error)
    return { services: null, error: error.message }
  }

  return { services, error: null }
}

/**
 * Get active employees for a tenant (public access)
 * Optionally filter by location
 */
export async function getPublicEmployees(tenantId: string, locationId?: string): Promise<{
  employees: Employee[] | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  // If location is specified, get employees assigned to that location
  if (locationId) {
    const { data: employeeLocations, error: elError } = await adminClient
      .from('employee_locations')
      .select('employee_id')
      .eq('location_id', locationId) as { data: Array<{ employee_id: string }> | null; error: Error | null }

    if (elError) {
      console.error('Error fetching employee locations:', elError)
      return { employees: null, error: elError.message }
    }

    const employeeIds = (employeeLocations || []).map(el => el.employee_id)

    if (employeeIds.length === 0) {
      return { employees: [], error: null }
    }

    const { data: employees, error } = await adminClient
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .in('id', employeeIds)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Error fetching public employees:', error)
      return { employees: null, error: error.message }
    }

    return { employees: employees as Employee[], error: null }
  }

  // No location filter - get all employees
  const { data: employees, error } = await adminClient
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching public employees:', error)
    return { employees: null, error: error.message }
  }

  return { employees: employees as Employee[], error: null }
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableSlots(params: {
  tenantId: string
  serviceId: string
  employeeId?: string
  date: string
}): Promise<{
  slots: string[]
  error: string | null
}> {
  const adminClient = createAdminClient()
  const { tenantId, serviceId, employeeId, date } = params

  // Get service duration
  const { data: service } = await adminClient
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .single() as { data: { duration_minutes: number } | null }

  if (!service) {
    return { slots: [], error: 'Service nicht gefunden' }
  }

  const durationMinutes = service.duration_minutes

  // Get employees to check availability
  let employeesToCheck: Employee[] = []

  if (employeeId) {
    const { data: employee } = await adminClient
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('is_active', true)
      .single() as { data: Employee | null }

    if (employee) {
      employeesToCheck = [employee]
    }
  } else {
    // Get all active employees
    const { data: employees } = await adminClient
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true) as { data: Employee[] | null }

    employeesToCheck = employees || []
  }

  if (employeesToCheck.length === 0) {
    return { slots: [], error: 'Keine Mitarbeiter verfügbar' }
  }

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]

  // Get existing appointments for the date
  const startOfDay = new Date(`${date}T00:00:00`).toISOString()
  const endOfDay = new Date(`${date}T23:59:59`).toISOString()

  const { data: existingAppointments } = await adminClient
    .from('appointments')
    .select('employee_id, start_time, end_time')
    .eq('tenant_id', tenantId)
    .neq('status', 'canceled')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay) as { data: Array<{ employee_id: string; start_time: string; end_time: string }> | null }

  const appointments = existingAppointments || []

  // Calculate available slots
  const availableSlots = new Set<string>()

  for (const employee of employeesToCheck) {
    const schedule = employee.work_schedule?.[dayName]

    if (!schedule || !schedule.start || !schedule.end) {
      continue // Employee doesn't work this day
    }

    const workStart = schedule.start
    const workEnd = schedule.end

    // Generate 30-minute slots
    const [startHour, startMinute] = workStart.split(':').map(Number)
    const [endHour, endMinute] = workEnd.split(':').map(Number)

    const workStartMinutes = startHour * 60 + startMinute
    const workEndMinutes = endHour * 60 + endMinute

    for (let slotStart = workStartMinutes; slotStart + durationMinutes <= workEndMinutes; slotStart += 30) {
      const slotHour = Math.floor(slotStart / 60)
      const slotMinute = slotStart % 60
      const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`

      const slotStartDate = new Date(`${date}T${slotTime}:00`)
      const slotEndDate = new Date(slotStartDate.getTime() + durationMinutes * 60000)

      // Check if slot conflicts with existing appointments for this employee
      const hasConflict = appointments.some(apt => {
        if (apt.employee_id !== employee.id) return false

        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)

        return slotStartDate < aptEnd && slotEndDate > aptStart
      })

      if (!hasConflict) {
        availableSlots.add(slotTime)
      }
    }
  }

  // Sort slots chronologically
  const sortedSlots = Array.from(availableSlots).sort()

  return { slots: sortedSlots, error: null }
}

/**
 * Create a public booking (guest booking)
 */
export async function createPublicBooking(formData: FormData): Promise<{
  confirmationToken: string | null
  appointmentId: string | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  // Extract form data
  const tenantSlug = formData.get('tenant_slug') as string
  const serviceId = formData.get('service_id') as string
  const employeeId = formData.get('employee_id') as string | null
  const locationId = formData.get('location_id') as string | null
  const appointmentDate = formData.get('appointment_date') as string
  const appointmentTime = formData.get('appointment_time') as string
  const customerNotes = formData.get('customer_notes') as string

  // Customer data
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const marketingConsent = formData.get('marketing_consent') === 'true'
  const smsConsent = formData.get('sms_consent') === 'true'

  // Validate required fields
  if (!tenantSlug || !serviceId || !appointmentDate || !appointmentTime || !firstName || !lastName) {
    return { confirmationToken: null, appointmentId: null, error: 'Bitte fülle alle Pflichtfelder aus' }
  }

  if (!email && !phone) {
    return { confirmationToken: null, appointmentId: null, error: 'Bitte gib eine Email-Adresse oder Telefonnummer an' }
  }

  // Get tenant
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single() as { data: { id: string } | null }

  if (!tenant) {
    return { confirmationToken: null, appointmentId: null, error: 'Klinik nicht gefunden' }
  }

  // Get service
  const { data: service } = await adminClient
    .from('services')
    .select('duration_minutes, price')
    .eq('id', serviceId)
    .single() as { data: { duration_minutes: number; price: number } | null }

  if (!service) {
    return { confirmationToken: null, appointmentId: null, error: 'Service nicht gefunden' }
  }

  // Calculate start and end time
  const startTime = new Date(`${appointmentDate}T${appointmentTime}`)
  const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000)

  // Check if slot is still available
  if (employeeId) {
    const { data: conflictingAppointments } = await adminClient
      .from('appointments')
      .select('id')
      .eq('employee_id', employeeId)
      .neq('status', 'canceled')
      .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`)

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return {
        confirmationToken: null,
        appointmentId: null,
        error: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle einen anderen Zeitpunkt.'
      }
    }
  }

  // Find or create customer
  let customerId: string

  // Try to find existing customer by email or phone
  let existingCustomer: Customer | null = null

  if (email) {
    const { data } = await adminClient
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('email', email)
      .single() as { data: Customer | null }

    existingCustomer = data
  }

  if (!existingCustomer && phone) {
    const { data } = await adminClient
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('phone', phone)
      .single() as { data: Customer | null }

    existingCustomer = data
  }

  if (existingCustomer) {
    customerId = existingCustomer.id

    // Update customer info if changed
    await (adminClient
      .from('customers')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email || existingCustomer.email,
        phone: phone || existingCustomer.phone,
        marketing_consent: marketingConsent,
        sms_consent: smsConsent,
      } as unknown as never)
      .eq('id', customerId) as unknown as Promise<unknown>)
  } else {
    // Create new customer
    const { data: newCustomer, error: customerError } = await (adminClient
      .from('customers')
      .insert({
        tenant_id: tenant.id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        marketing_consent: marketingConsent,
        sms_consent: smsConsent,
      } as unknown as never)
      .select('id')
      .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>)

    if (customerError || !newCustomer) {
      console.error('Error creating customer:', customerError)
      return { confirmationToken: null, appointmentId: null, error: 'Fehler beim Erstellen des Kundenprofils' }
    }

    customerId = newCustomer.id
  }

  // Generate confirmation token
  const confirmationToken = generateConfirmationToken()

  // Create appointment
  const { data: appointment, error: appointmentError } = await (adminClient
    .from('appointments')
    .insert({
      tenant_id: tenant.id,
      customer_id: customerId,
      service_id: serviceId,
      employee_id: employeeId || null,
      location_id: locationId || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      price: service.price,
      status: 'scheduled',
      customer_notes: customerNotes || null,
      confirmation_token: confirmationToken,
    } as unknown as never)
    .select('id')
    .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>)

  if (appointmentError || !appointment) {
    console.error('Error creating appointment:', appointmentError)
    return { confirmationToken: null, appointmentId: null, error: 'Fehler beim Erstellen des Termins' }
  }

  // Get tenant info for email
  const { data: tenantInfo } = await adminClient
    .from('tenants')
    .select('name, address, city, contact_phone')
    .eq('slug', tenantSlug)
    .single() as { data: { name: string; address: string | null; city: string | null; contact_phone: string | null } | null }

  // Get service info for email
  const { data: serviceInfo } = await adminClient
    .from('services')
    .select('name, duration_minutes')
    .eq('id', serviceId)
    .single() as { data: { name: string; duration_minutes: number } | null }

  // Get employee info if selected
  let employeeName: string | undefined
  if (employeeId) {
    const { data: employeeInfo } = await adminClient
      .from('employees')
      .select('first_name, last_name')
      .eq('id', employeeId)
      .single() as { data: { first_name: string; last_name: string } | null }
    if (employeeInfo) {
      employeeName = `${employeeInfo.first_name} ${employeeInfo.last_name}`
    }
  }

  // Send confirmation email if email provided
  if (email && tenantInfo && serviceInfo) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const confirmationUrl = `${baseUrl}/confirm/${confirmationToken}`

    const formattedDate = startTime.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const formattedTime = startTime.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Send email (don't block on failure)
    sendBookingConfirmationEmail({
      to: email,
      customerName: `${firstName} ${lastName}`,
      serviceName: serviceInfo.name,
      servicePrice: service.price,
      date: formattedDate,
      time: formattedTime,
      duration: serviceInfo.duration_minutes,
      employeeName,
      clinicName: tenantInfo.name,
      clinicAddress: [tenantInfo.address, tenantInfo.city].filter(Boolean).join(', ') || undefined,
      clinicPhone: tenantInfo.contact_phone || undefined,
      confirmationUrl,
    }).catch(err => {
      console.error('Failed to send confirmation email:', err)
    })
  }

  return {
    confirmationToken,
    appointmentId: appointment.id,
    error: null
  }
}

/**
 * Look up existing customer by phone or email (for returning customers)
 */
export async function lookupCustomer(params: {
  tenantId: string
  phone?: string
  email?: string
}): Promise<{
  customer: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  } | null
  error: string | null
}> {
  const adminClient = createAdminClient()
  const { tenantId, phone, email } = params

  if (!phone && !email) {
    return { customer: null, error: 'Bitte gib eine Telefonnummer oder Email an' }
  }

  let customer = null

  // Try phone first (most common for returning customers)
  if (phone) {
    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '')

    const { data } = await adminClient
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('tenant_id', tenantId)
      .or(`phone.eq.${phone},phone.eq.${normalizedPhone}`)
      .limit(1)
      .single()

    if (data) {
      customer = data
    }
  }

  // If not found by phone, try email
  if (!customer && email) {
    const { data } = await adminClient
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('tenant_id', tenantId)
      .eq('email', email.toLowerCase())
      .limit(1)
      .single()

    if (data) {
      customer = data
    }
  }

  return { customer, error: null }
}

/**
 * Get appointment details by confirmation token (for success page)
 */
export async function getPublicAppointmentByToken(token: string): Promise<{
  appointment: {
    id: string
    start_time: string
    end_time: string
    status: string
    customer_notes: string | null
    service: { name: string; price: number; duration_minutes: number }
    customer: { first_name: string; last_name: string; email: string | null; phone: string | null }
    employee: { first_name: string; last_name: string } | null
    tenant: { name: string; contact_phone: string | null; whatsapp_number: string | null; address: string | null; city: string | null }
  } | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  type AppointmentResult = {
    id: string
    start_time: string
    end_time: string
    status: string
    customer_notes: string | null
    services: { name: string; price: number; duration_minutes: number }
    customers: { first_name: string; last_name: string; email: string | null; phone: string | null }
    employees: { first_name: string; last_name: string } | null
    tenants: { name: string; contact_phone: string | null; whatsapp_number: string | null; address: string | null; city: string | null }
  }

  const { data: appointment, error } = await adminClient
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      customer_notes,
      services (
        name,
        price,
        duration_minutes
      ),
      customers (
        first_name,
        last_name,
        email,
        phone
      ),
      employees (
        first_name,
        last_name
      ),
      tenants (
        name,
        contact_phone,
        whatsapp_number,
        address,
        city
      )
    `)
    .eq('confirmation_token', token)
    .single() as { data: AppointmentResult | null; error: Error | null }

  if (error || !appointment) {
    return { appointment: null, error: 'Termin nicht gefunden' }
  }

  // Transform the data to match the expected structure
  const transformedAppointment = {
    id: appointment.id,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status,
    customer_notes: appointment.customer_notes,
    service: appointment.services,
    customer: appointment.customers,
    employee: appointment.employees,
    tenant: appointment.tenants,
  }

  return { appointment: transformedAppointment, error: null }
}

/**
 * Get available time slots for gastronomy reservations
 * Simple time slots based on restaurant hours
 */
export async function getGastroSlots(params: {
  tenantId: string
  date: string
  guestCount: number
}): Promise<{
  slots: string[]
  error: string | null
}> {
  const { date } = params

  // Get day of week
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay()

  // Restaurant hours (can be customized per tenant later)
  const restaurantHours: Record<number, { open: string; close: string } | null> = {
    0: { open: '12:00', close: '22:00' }, // Sunday
    1: { open: '11:00', close: '23:00' }, // Monday
    2: { open: '11:00', close: '23:00' }, // Tuesday
    3: { open: '11:00', close: '23:00' }, // Wednesday
    4: { open: '11:00', close: '23:00' }, // Thursday
    5: { open: '11:00', close: '24:00' }, // Friday
    6: { open: '11:00', close: '24:00' }, // Saturday
  }

  const hours = restaurantHours[dayOfWeek]
  if (!hours) {
    return { slots: [], error: 'Heute geschlossen' }
  }

  // Generate 30-minute slots
  const [openHour, openMinute] = hours.open.split(':').map(Number)
  const [closeHour, closeMinute] = hours.close.split(':').map(Number)

  const openMinutes = openHour * 60 + openMinute
  const closeMinutes = (closeHour === 24 ? 24 * 60 : closeHour * 60 + closeMinute) - 60 // Last reservation 1 hour before closing

  const slots: string[] = []

  for (let time = openMinutes; time <= closeMinutes; time += 30) {
    const hour = Math.floor(time / 60)
    const minute = time % 60
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
  }

  // Filter out past times if booking for today
  const today = new Date().toISOString().split('T')[0]
  if (date === today) {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30 // At least 30 min in advance

    const filteredSlots = slots.filter(slot => {
      const [h, m] = slot.split(':').map(Number)
      return h * 60 + m > currentMinutes
    })

    return { slots: filteredSlots, error: null }
  }

  return { slots, error: null }
}

/**
 * Create a gastronomy reservation
 */
export async function createGastroReservation(formData: FormData): Promise<{
  confirmationToken: string | null
  reservationId: string | null
  error: string | null
}> {
  const adminClient = createAdminClient()

  // Extract form data
  const tenantSlug = formData.get('tenant_slug') as string
  const reservationDate = formData.get('reservation_date') as string
  const reservationTime = formData.get('reservation_time') as string
  const guestCount = parseInt(formData.get('guest_count') as string)
  const notes = formData.get('notes') as string
  const locationId = formData.get('location_id') as string | null

  // Customer data
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  // Validate required fields
  if (!tenantSlug || !reservationDate || !reservationTime || !guestCount || !firstName || !lastName) {
    return { confirmationToken: null, reservationId: null, error: 'Bitte fülle alle Pflichtfelder aus' }
  }

  if (!email && !phone) {
    return { confirmationToken: null, reservationId: null, error: 'Bitte gib eine Email-Adresse oder Telefonnummer an' }
  }

  if (guestCount < 1 || guestCount > 20) {
    return { confirmationToken: null, reservationId: null, error: 'Ungültige Personenzahl' }
  }

  // Get tenant
  const { data: tenant } = await adminClient
    .from('tenants')
    .select('id, name')
    .eq('slug', tenantSlug)
    .single() as { data: { id: string; name: string } | null }

  if (!tenant) {
    return { confirmationToken: null, reservationId: null, error: 'Restaurant nicht gefunden' }
  }

  // Calculate start time (reservation typically 2 hours)
  const startTime = new Date(`${reservationDate}T${reservationTime}`)
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60000) // 2 hours

  // Find or create customer
  let customerId: string

  // Try to find existing customer by email or phone
  let existingCustomer: Customer | null = null

  if (email) {
    const { data } = await adminClient
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('email', email)
      .single() as { data: Customer | null }

    existingCustomer = data
  }

  if (!existingCustomer && phone) {
    const { data } = await adminClient
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('phone', phone)
      .single() as { data: Customer | null }

    existingCustomer = data
  }

  if (existingCustomer) {
    customerId = existingCustomer.id

    // Update customer info if changed
    await (adminClient
      .from('customers')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email || existingCustomer.email,
        phone: phone || existingCustomer.phone,
      } as unknown as never)
      .eq('id', customerId) as unknown as Promise<unknown>)
  } else {
    // Create new customer
    const { data: newCustomer, error: customerError } = await (adminClient
      .from('customers')
      .insert({
        tenant_id: tenant.id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
      } as unknown as never)
      .select('id')
      .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>)

    if (customerError || !newCustomer) {
      console.error('Error creating customer:', customerError)
      return { confirmationToken: null, reservationId: null, error: 'Fehler beim Erstellen des Kundenprofils' }
    }

    customerId = newCustomer.id
  }

  // Generate confirmation token
  const confirmationToken = generateConfirmationToken()

  // Find or create a "Tischreservierung" service for this tenant
  let reservationServiceId: string

  const { data: existingService } = await adminClient
    .from('services')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('name', 'Tischreservierung')
    .single() as { data: { id: string } | null }

  if (existingService) {
    reservationServiceId = existingService.id
  } else {
    // Create the reservation service
    const { data: newService, error: serviceError } = await (adminClient
      .from('services')
      .insert({
        tenant_id: tenant.id,
        name: 'Tischreservierung',
        description: 'Tischreservierung im Restaurant',
        price: 0,
        duration_minutes: 120, // 2 hours default
        category: 'Reservierung',
        is_active: true,
      } as unknown as never)
      .select('id')
      .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>)

    if (serviceError || !newService) {
      console.error('Error creating reservation service:', serviceError)
      return { confirmationToken: null, reservationId: null, error: 'Fehler beim Erstellen der Reservierung' }
    }

    reservationServiceId = newService.id
  }

  // Create reservation as appointment
  const reservationNotes = `Reservierung für ${guestCount} ${guestCount === 1 ? 'Person' : 'Personen'}${notes ? `. Anmerkungen: ${notes}` : ''}`

  const { data: reservation, error: reservationError } = await (adminClient
    .from('appointments')
    .insert({
      tenant_id: tenant.id,
      customer_id: customerId,
      service_id: reservationServiceId,
      employee_id: null,
      location_id: locationId || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      price: 0,
      status: 'scheduled',
      customer_notes: reservationNotes,
      confirmation_token: confirmationToken,
    } as unknown as never)
    .select('id')
    .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>)

  if (reservationError || !reservation) {
    console.error('Error creating reservation:', reservationError)
    return { confirmationToken: null, reservationId: null, error: 'Fehler beim Erstellen der Reservierung' }
  }

  // TODO: Send confirmation email for reservations

  return {
    confirmationToken,
    reservationId: reservation.id,
    error: null
  }
}
