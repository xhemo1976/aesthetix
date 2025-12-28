'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAppointmentByToken(token: string) {
  const supabase = await createClient()

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      services (
        id,
        name,
        duration_minutes,
        price
      ),
      tenants (
        id,
        name,
        contact_phone,
        whatsapp_number,
        address,
        city
      )
    `)
    .eq('confirmation_token', token)
    .single()

  if (error || !appointment) {
    return { appointment: null, error: 'Termin nicht gefunden' }
  }

  return { appointment, error: null }
}

export async function confirmAppointment(token: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({
      customer_response: 'confirmed',
      customer_confirmed_at: new Date().toISOString(),
      status: 'confirmed'
    })
    .eq('confirmation_token', token)

  if (error) {
    console.error('Error confirming appointment:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function declineAppointment(token: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({
      customer_response: 'declined',
      customer_confirmed_at: new Date().toISOString(),
      status: 'cancelled'
    })
    .eq('confirmation_token', token)

  if (error) {
    console.error('Error declining appointment:', error)
    return { error: error.message }
  }

  return { error: null }
}
