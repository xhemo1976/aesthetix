'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const clinicName = formData.get('clinicName') as string
    const businessType = formData.get('businessType') as string

    // Validate inputs
    if (!email || !password || !fullName || !clinicName || !businessType) {
      return { error: 'Bitte fülle alle Felder aus' }
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Fehler beim Erstellen des Accounts' }
    }

    // 2. Create tenant (clinic) - using admin client to bypass RLS
    const slug = clinicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Make slug unique by adding random suffix if needed
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`

    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .insert({
        name: clinicName,
        slug: uniqueSlug,
        business_type: businessType,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (tenantError) {
      console.error('Tenant error:', tenantError)
      // Rollback: delete auth user if tenant creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: 'Fehler beim Erstellen der Klinik: ' + tenantError.message }
    }

    if (!tenant) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: 'Fehler beim Erstellen der Klinik' }
    }

    // 3. Create user profile - using admin client to bypass RLS
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email: email,
        full_name: fullName,
        role: 'owner',
      })

    if (userError) {
      console.error('User profile error:', userError)
      return { error: 'Fehler beim Erstellen des Profils: ' + userError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.' }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
