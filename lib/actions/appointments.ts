'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Generate random confirmation token
function generateConfirmationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function getAppointments() {
  const supabase = await createClient()

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone
      ),
      services (
        id,
        name,
        duration_minutes,
        price
      ),
      employees (
        id,
        first_name,
        last_name,
        role,
        specialties,
        is_active,
        work_schedule
      )
    `)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
    return { appointments: [], error: error.message }
  }

  return { appointments, error: null }
}

export async function createAppointment(formData: FormData) {
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

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const employee_id = formData.get('employee_id') as string
  const appointment_date = formData.get('appointment_date') as string
  const appointment_time = formData.get('appointment_time') as string
  const customer_notes = formData.get('customer_notes') as string

  // Get service to calculate end time and price
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, price')
    .eq('id', service_id)
    .single() as { data: { duration_minutes: number; price: number } | null }

  if (!service) {
    return { error: 'Service nicht gefunden' }
  }

  // Combine date and time into TIMESTAMPTZ
  const start_time = new Date(`${appointment_date}T${appointment_time}`)
  const end_time = new Date(start_time.getTime() + service.duration_minutes * 60000)

  // Check if employee is available (not double-booked)
  if (employee_id) {
    const { data: conflictingAppointments } = await supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('employee_id', employee_id)
      .neq('status', 'cancelled')
      .or(`and(start_time.lt.${end_time.toISOString()},end_time.gt.${start_time.toISOString()})`)

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return { error: 'Der Mitarbeiter ist zu dieser Zeit bereits gebucht. Bitte wähle einen anderen Zeitpunkt oder Mitarbeiter.' }
    }
  }

  // Generate confirmation token
  const confirmation_token = generateConfirmationToken()

  const { error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: profile.tenant_id,
      customer_id,
      service_id,
      employee_id: employee_id || null,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      price: service.price,
      status: 'scheduled',
      customer_notes: customer_notes || null,
      confirmation_token,
    })

  if (error) {
    console.error('Error creating appointment:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/appointments')
  return { error: null }
}

export async function updateAppointment(id: string, formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const employee_id = formData.get('employee_id') as string
  const appointment_date = formData.get('appointment_date') as string
  const appointment_time = formData.get('appointment_time') as string
  const status = formData.get('status') as string
  const customer_notes = formData.get('customer_notes') as string

  // Get service to calculate end time and price
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, price')
    .eq('id', service_id)
    .single() as { data: { duration_minutes: number; price: number } | null }

  if (!service) {
    return { error: 'Service nicht gefunden' }
  }

  // Combine date and time into TIMESTAMPTZ
  const start_time = new Date(`${appointment_date}T${appointment_time}`)
  const end_time = new Date(start_time.getTime() + service.duration_minutes * 60000)

  // Check if employee is available (not double-booked), excluding current appointment
  if (employee_id) {
    const { data: conflictingAppointments } = await supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('employee_id', employee_id)
      .neq('id', id) // Exclude current appointment
      .neq('status', 'cancelled')
      .or(`and(start_time.lt.${end_time.toISOString()},end_time.gt.${start_time.toISOString()})`)

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return { error: 'Der Mitarbeiter ist zu dieser Zeit bereits gebucht. Bitte wähle einen anderen Zeitpunkt oder Mitarbeiter.' }
    }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      customer_id,
      service_id,
      employee_id: employee_id || null,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      price: service.price,
      status,
      customer_notes: customer_notes || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/appointments')
  return { error: null }
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting appointment:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/appointments')
  return { error: null }
}

export async function updateAppointmentStatus(id: string, status: string) {
  const supabase = await createClient()

  // Get appointment details before updating (for waitlist matching)
  const { data: appointment } = await supabase
    .from('appointments')
    .select('tenant_id, service_id, employee_id, location_id, start_time')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment status:', error)
    return { error: error.message }
  }

  // Check for waitlist matches if appointment was canceled
  let waitlistMatches: WaitlistMatch[] = []
  if (status === 'canceled' && appointment) {
    const { matches } = await findWaitlistMatchesForCancellation(
      appointment.tenant_id,
      appointment.service_id,
      new Date(appointment.start_time).toISOString().split('T')[0],
      new Date(appointment.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      appointment.employee_id,
      appointment.location_id
    )
    waitlistMatches = matches
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/waitlist')

  return { error: null, waitlistMatches }
}

type WaitlistMatch = {
  id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
}

async function findWaitlistMatchesForCancellation(
  tenantId: string,
  serviceId: string,
  appointmentDate: string,
  appointmentTime: string,
  employeeId?: string | null,
  locationId?: string | null
): Promise<{ matches: WaitlistMatch[] }> {
  const supabase = await createClient()

  // Find waitlist entries that match the canceled appointment
  let query = supabase
    .from('waitlist')
    .select('id, customer_name, customer_phone, customer_email, employee_id, preferred_time_from, preferred_time_to')
    .eq('tenant_id', tenantId)
    .eq('service_id', serviceId)
    .eq('status', 'waiting')
    .lte('preferred_date_from', appointmentDate)
    .gte('preferred_date_to', appointmentDate)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5)

  const { data: entries, error } = await query

  if (error || !entries) {
    return { matches: [] }
  }

  // Filter by time preference if specified
  const timeNum = parseInt(appointmentTime.replace(':', ''))
  const filteredEntries = entries.filter(entry => {
    if (!entry.preferred_time_from && !entry.preferred_time_to) return true
    const fromNum = entry.preferred_time_from ? parseInt(entry.preferred_time_from.replace(':', '')) : 0
    const toNum = entry.preferred_time_to ? parseInt(entry.preferred_time_to.replace(':', '')) : 2359
    return timeNum >= fromNum && timeNum <= toNum
  })

  // Filter by employee preference
  const finalEntries = filteredEntries.filter(entry => {
    if (!entry.employee_id) return true
    return entry.employee_id === employeeId
  })

  return {
    matches: finalEntries.map(e => ({
      id: e.id,
      customer_name: e.customer_name,
      customer_phone: e.customer_phone,
      customer_email: e.customer_email,
    }))
  }
}
