import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTenantEmbeddings } from '@/lib/embeddings'

export async function POST(request: NextRequest) {
  try {
    const { tenantSlug, tenantId } = await request.json()

    if (!tenantSlug && !tenantId) {
      return NextResponse.json(
        { error: 'tenantSlug or tenantId is required' },
        { status: 400 }
      )
    }

    let resolvedTenantId = tenantId

    // If slug provided, get tenant ID
    if (tenantSlug && !tenantId) {
      const adminClient = createAdminClient()
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id')
        .ilike('slug', `${tenantSlug}%`)
        .limit(1)
        .single()

      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant nicht gefunden' },
          { status: 404 }
        )
      }

      resolvedTenantId = (tenant as { id: string }).id
    }

    // Generate embeddings
    const result = await generateTenantEmbeddings(resolvedTenantId)

    return NextResponse.json({
      success: result.success,
      message: `${result.processed} Embeddings erstellt, ${result.errors} Fehler`,
      processed: result.processed,
      errors: result.errors
    })
  } catch (error) {
    console.error('Embeddings generation error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Embedding-Generierung' },
      { status: 500 }
    )
  }
}
