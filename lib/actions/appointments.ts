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
    .single()

  if (!profile) {
    return { error: 'Profil nicht gefunden' }
  }

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const appointment_date = formData.get('appointment_date') as string
  const appointment_time = formData.get('appointment_time') as string
  const customer_notes = formData.get('customer_notes') as string

  // Get service to calculate end time and price
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, price')
    .eq('id', service_id)
    .single()

  if (!service) {
    return { error: 'Service nicht gefunden' }
  }

  // Combine date and time into TIMESTAMPTZ
  const start_time = new Date(`${appointment_date}T${appointment_time}`)
  const end_time = new Date(start_time.getTime() + service.duration_minutes * 60000)

  // Generate confirmation token
  const confirmation_token = generateConfirmationToken()

  const { error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: profile.tenant_id,
      customer_id,
      service_id,
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
  const appointment_date = formData.get('appointment_date') as string
  const appointment_time = formData.get('appointment_time') as string
  const status = formData.get('status') as string
  const customer_notes = formData.get('customer_notes') as string

  // Get service to calculate end time and price
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, price')
    .eq('id', service_id)
    .single()

  if (!service) {
    return { error: 'Service nicht gefunden' }
  }

  // Combine date and time into TIMESTAMPTZ
  const start_time = new Date(`${appointment_date}T${appointment_time}`)
  const end_time = new Date(start_time.getTime() + service.duration_minutes * 60000)

  const { error } = await supabase
    .from('appointments')
    .update({
      customer_id,
      service_id,
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

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating appointment status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/appointments')
  return { error: null }
}
