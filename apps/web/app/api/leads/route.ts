import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface LeadData {
  tenant_id?: string
  tenant_slug?: string
  name?: string
  email?: string
  phone?: string
  interest?: string
  notes?: string
  source?: string
  metadata?: Record<string, unknown>
}

// Create a new lead
export async function POST(request: NextRequest) {
  try {
    const data: LeadData = await request.json()
    const { tenant_id, tenant_slug, name, email, phone, interest, notes, source, metadata } = data

    // At least email or phone required
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email oder Telefonnummer erforderlich' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    let resolvedTenantId = tenant_id

    // Get tenant ID from slug if needed
    if (!resolvedTenantId && tenant_slug) {
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id')
        .ilike('slug', `${tenant_slug}%`)
        .limit(1)
        .single()

      if (tenant) {
        resolvedTenantId = (tenant as { id: string }).id
      }
    }

    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: 'Tenant nicht gefunden' },
        { status: 404 }
      )
    }

    // Check for existing lead with same email or phone
    let existingLead = null
    if (email) {
      const { data } = await adminClient
        .from('leads' as never)
        .select('id')
        .eq('tenant_id' as never, resolvedTenantId as never)
        .eq('email' as never, email as never)
        .limit(1)
        .single()
      existingLead = data
    }

    if (!existingLead && phone) {
      const { data } = await adminClient
        .from('leads' as never)
        .select('id')
        .eq('tenant_id' as never, resolvedTenantId as never)
        .eq('phone' as never, phone as never)
        .limit(1)
        .single()
      existingLead = data
    }

    if (existingLead) {
      // Update existing lead
      const { data: updated, error } = await adminClient
        .from('leads' as never)
        .update({
          name: name || undefined,
          interest: interest || undefined,
          notes: notes ? `${notes}\n---\n` : undefined,
          metadata,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id' as never, (existingLead as { id: string }).id as never)
        .select()
        .single()

      if (error) {
        console.error('Lead update error:', error)
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        lead_id: (existingLead as { id: string }).id,
        updated: true
      })
    }

    // Create new lead
    const { data: newLead, error } = await adminClient
      .from('leads' as never)
      .insert({
        tenant_id: resolvedTenantId,
        name,
        email,
        phone,
        interest,
        notes,
        source: source || 'chat',
        metadata: metadata || {},
        status: 'new',
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Lead creation error:', error)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen' },
        { status: 500 }
      )
    }

    // Trigger n8n webhook for new lead
    const n8nWebhookUrl = process.env.N8N_LEAD_WEBHOOK_URL
    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'new_lead',
          tenant_id: resolvedTenantId,
          lead: { name, email, phone, interest },
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      lead_id: (newLead as { id: string } | null)?.id,
      created: true
    })
  } catch (error) {
    console.error('Leads API error:', error)
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    )
  }
}

// Get leads for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    let query = adminClient
      .from('leads' as never)
      .select('*')
      .eq('tenant_id' as never, tenantId as never)
      .order('created_at' as never, { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status' as never, status as never)
    }

    const { data, error } = await query

    if (error) {
      console.log('Leads table may not exist yet')
      return NextResponse.json({ leads: [] })
    }

    return NextResponse.json({ leads: data || [] })
  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json({ leads: [] })
  }
}
