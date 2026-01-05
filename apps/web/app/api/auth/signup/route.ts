'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, clinicName, businessType } = body

    // Validate inputs
    if (!email || !password || !fullName || !clinicName || !businessType) {
      return NextResponse.json(
        { error: 'Bitte fülle alle Felder aus' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

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
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Accounts' },
        { status: 400 }
      )
    }

    // 2. Create tenant (clinic) - using admin client to bypass RLS
    const slug = clinicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Make slug unique by adding random suffix
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenant, error: tenantError } = await (adminClient as any)
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
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Klinik: ' + tenantError.message },
        { status: 400 }
      )
    }

    if (!tenant) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Klinik' },
        { status: 400 }
      )
    }

    // 3. Create user profile - using admin client to bypass RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userError } = await (adminClient as any)
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
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Profils: ' + userError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, redirect: '/dashboard' })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
