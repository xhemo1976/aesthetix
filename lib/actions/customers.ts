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
    .single()

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
