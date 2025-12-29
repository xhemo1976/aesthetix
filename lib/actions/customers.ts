'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getCustomers() {
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
    return { customers: [], error: error.message }
  }

  return { customers, error: null }
}

export async function createCustomer(formData: FormData) {
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

  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const date_of_birth = formData.get('date_of_birth') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('customers')
    .insert({
      tenant_id: profile.tenant_id,
      first_name,
      last_name,
      email: email || null,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      notes: notes || null,
    })

  if (error) {
    console.error('Error creating customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { error: null }
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()

  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const date_of_birth = formData.get('date_of_birth') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('customers')
    .update({
      first_name,
      last_name,
      email: email || null,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { error: null }
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { error: null }
}

/**
 * Get a single customer by ID with full details
 */
export async function getCustomerById(id: string) {
  const supabase = await createClient()

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    return { customer: null, error: error.message }
  }

  return { customer, error: null }
}

/**
 * Get appointment history for a customer
 */
export async function getCustomerAppointments(customerId: string) {
  const supabase = await createClient()

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      price,
      customer_notes,
      staff_notes,
      services (
        id,
        name,
        duration_minutes
      ),
      employees (
        id,
        first_name,
        last_name
      )
    `)
    .eq('customer_id', customerId)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching customer appointments:', error)
    return { appointments: [], error: error.message }
  }

  return { appointments: appointments || [], error: null }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(customerId: string) {
  const supabase = await createClient()

  // Get completed appointments count and total spent
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('status, price')
    .eq('customer_id', customerId)

  if (error) {
    console.error('Error fetching customer stats:', error)
    return { stats: null, error: error.message }
  }

  const completedAppointments = appointments?.filter(a => a.status === 'completed') || []
  const totalAppointments = appointments?.length || 0
  const totalSpent = completedAppointments.reduce((sum, a) => sum + (a.price || 0), 0)
  const canceledAppointments = appointments?.filter(a => a.status === 'canceled').length || 0
  const noShowAppointments = appointments?.filter(a => a.status === 'no_show').length || 0

  return {
    stats: {
      totalAppointments,
      completedAppointments: completedAppointments.length,
      canceledAppointments,
      noShowAppointments,
      totalSpent,
    },
    error: null
  }
}

/**
 * Update customer notes (general or medical)
 */
export async function updateCustomerNotes(
  customerId: string,
  notes: string | null,
  medicalNotes: string | null
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({
      notes: notes,
      medical_notes: medicalNotes,
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error updating customer notes:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/customers/${customerId}`)
  return { error: null }
}

/**
 * Add staff notes to an appointment
 */
export async function updateAppointmentNotes(appointmentId: string, staffNotes: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({
      staff_notes: staffNotes,
    })
    .eq('id', appointmentId)

  if (error) {
    console.error('Error updating appointment notes:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { error: null }
}
