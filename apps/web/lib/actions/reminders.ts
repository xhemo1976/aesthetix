'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AppointmentForReminder = {
  id: string
  start_time: string
  end_time: string
  status: string
  reminder_sent_at: string | null
  customer: {
    id: string
    first_name: string
    last_name: string
    phone: string | null
    email: string | null
  }
  service: {
    id: string
    name: string
    duration_minutes: number
  }
  employee: {
    first_name: string
    last_name: string
  } | null
}

export type TenantInfo = {
  name: string
  whatsapp_number: string | null
}

/**
 * Get appointments that need reminders (tomorrow's appointments)
 */
export async function getAppointmentsForReminders(): Promise<{
  appointments: AppointmentForReminder[]
  tenant: TenantInfo | null
  error: string | null
}> {
  const supabase = await createClient()

  // Get current user's tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { appointments: [], tenant: null, error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, tenants(name, whatsapp_number)')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { appointments: [], tenant: null, error: 'Kein Tenant gefunden' }
  }

  // Calculate tomorrow's date range
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfterTomorrow = new Date(tomorrow)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

  // Get tomorrow's appointments that haven't been reminded yet
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      reminder_sent_at,
      customers (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      services (
        id,
        name,
        duration_minutes
      ),
      employees (
        first_name,
        last_name
      )
    `)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['scheduled', 'confirmed'])
    .gte('start_time', tomorrow.toISOString())
    .lt('start_time', dayAfterTomorrow.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments for reminders:', error)
    return { appointments: [], tenant: null, error: error.message }
  }

  // Transform the data - handle both array and single object response from Supabase
  const transformedAppointments: AppointmentForReminder[] = (appointments || []).map(apt => {
    const customer = Array.isArray(apt.customers) ? apt.customers[0] : apt.customers
    const service = Array.isArray(apt.services) ? apt.services[0] : apt.services
    const employee = Array.isArray(apt.employees) ? apt.employees[0] : apt.employees

    return {
      id: apt.id,
      start_time: apt.start_time,
      end_time: apt.end_time,
      status: apt.status,
      reminder_sent_at: apt.reminder_sent_at,
      customer: customer as AppointmentForReminder['customer'],
      service: service as AppointmentForReminder['service'],
      employee: employee as AppointmentForReminder['employee'] | null
    }
  })

  const tenantInfo = profile.tenants as unknown as TenantInfo

  return {
    appointments: transformedAppointments,
    tenant: tenantInfo,
    error: null
  }
}

/**
 * Get all appointments for a specific date range (for filtering)
 */
export async function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<{
  appointments: AppointmentForReminder[]
  tenant: TenantInfo | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { appointments: [], tenant: null, error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, tenants(name, whatsapp_number)')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { appointments: [], tenant: null, error: 'Kein Tenant gefunden' }
  }

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      reminder_sent_at,
      customers (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      services (
        id,
        name,
        duration_minutes
      ),
      employees (
        first_name,
        last_name
      )
    `)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['scheduled', 'confirmed'])
    .gte('start_time', startDate.toISOString())
    .lt('start_time', endDate.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
    return { appointments: [], tenant: null, error: error.message }
  }

  const transformedAppointments: AppointmentForReminder[] = (appointments || []).map(apt => {
    const customer = Array.isArray(apt.customers) ? apt.customers[0] : apt.customers
    const service = Array.isArray(apt.services) ? apt.services[0] : apt.services
    const employee = Array.isArray(apt.employees) ? apt.employees[0] : apt.employees

    return {
      id: apt.id,
      start_time: apt.start_time,
      end_time: apt.end_time,
      status: apt.status,
      reminder_sent_at: apt.reminder_sent_at,
      customer: customer as AppointmentForReminder['customer'],
      service: service as AppointmentForReminder['service'],
      employee: employee as AppointmentForReminder['employee'] | null
    }
  })

  const tenantInfo = profile.tenants as unknown as TenantInfo

  return {
    appointments: transformedAppointments,
    tenant: tenantInfo,
    error: null
  }
}

/**
 * Mark a reminder as sent
 */
export async function markReminderSent(appointmentId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', appointmentId)

  if (error) {
    console.error('Error marking reminder as sent:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/reminders')
  return { success: true, error: null }
}

/**
 * Reset reminder status (for re-sending)
 */
export async function resetReminderStatus(appointmentId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ reminder_sent_at: null })
    .eq('id', appointmentId)

  if (error) {
    console.error('Error resetting reminder status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/reminders')
  return { success: true, error: null }
}
