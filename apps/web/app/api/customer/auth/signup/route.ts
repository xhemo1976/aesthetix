import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, tenantSlug } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Bitte fülle alle Pflichtfelder aus' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen haben' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get tenant ID if slug provided
    let tenantId: string | null = null
    if (tenantSlug) {
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single() as { data: { id: string } | null }

      if (tenant) {
        tenantId = tenant.id
      }
    }

    // Check if customer with this email already exists
    if (tenantId) {
      const { data: existingCustomer } = await adminClient
        .from('customers')
        .select('id, email')
        .eq('tenant_id', tenantId)
        .eq('email', email.toLowerCase())
        .single() as { data: { id: string; email: string } | null }

      if (existingCustomer) {
        // Customer exists - check if they already have an auth account
        const { data: authUsers } = await adminClient.auth.admin.listUsers()
        const existingAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (existingAuth) {
          return NextResponse.json(
            { error: 'Ein Account mit dieser Email existiert bereits. Bitte melde dich an.' },
            { status: 400 }
          )
        }
      }
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
          tenant_id: tenantId,
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)

      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Ein Account mit dieser Email existiert bereits' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create or update customer record
    if (tenantId && authData.user) {
      const { data: existingCustomer } = await adminClient
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', email.toLowerCase())
        .single() as { data: { id: string } | null }

      if (existingCustomer) {
        // Update existing customer with auth_id
        await adminClient
          .from('customers')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          } as never)
          .eq('id', existingCustomer.id)
      } else {
        // Create new customer
        await adminClient
          .from('customers')
          .insert({
            tenant_id: tenantId,
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          } as never)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account erfolgreich erstellt',
      user: authData.user ? {
        id: authData.user.id,
        email: authData.user.email,
      } : null
    })

  } catch (error) {
    console.error('Customer signup error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
