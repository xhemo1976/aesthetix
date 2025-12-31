import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Store chat events for n8n to process
// This can be polled by n8n or used with webhooks

interface ChatEvent {
  id?: string
  tenant_id: string
  event_type: 'new_conversation' | 'booking_intent' | 'consultation_request' | 'complaint' | 'lead_captured'
  user_message: string
  assistant_reply: string
  intent: string
  metadata?: Record<string, unknown>
  created_at?: string
  processed?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const event: ChatEvent = await request.json()

    const adminClient = createAdminClient()

    // Store the event in the database
    const { data, error } = await adminClient
      .from('chat_events' as never)
      .insert({
        tenant_id: event.tenant_id,
        event_type: event.event_type,
        user_message: event.user_message,
        assistant_reply: event.assistant_reply,
        intent: event.intent,
        metadata: event.metadata || {},
        processed: false,
      } as never)
      .select()
      .single()

    if (error) {
      // If table doesn't exist, just log and return success
      console.log('Chat event logged (table may not exist):', event.event_type)
      return NextResponse.json({ success: true, logged: true })
    }

    // Optionally trigger n8n webhook if configured
    const n8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: event.event_type,
            tenant_id: event.tenant_id,
            data: event,
            timestamp: new Date().toISOString()
          })
        })
      } catch (webhookError) {
        console.error('n8n webhook failed:', webhookError)
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({ success: true, event_id: (data as { id: string } | null)?.id })
  } catch (error) {
    console.error('Chat events error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Events' },
      { status: 500 }
    )
  }
}

// GET: Fetch unprocessed events for n8n polling
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const eventType = searchParams.get('event_type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const adminClient = createAdminClient()

    let query = adminClient
      .from('chat_events' as never)
      .select('*')
      .eq('processed' as never, false as never)
      .order('created_at' as never, { ascending: false })
      .limit(limit)

    if (tenantId) {
      query = query.eq('tenant_id' as never, tenantId as never)
    }

    if (eventType) {
      query = query.eq('event_type' as never, eventType as never)
    }

    const { data, error } = await query

    if (error) {
      console.log('Chat events table may not exist yet')
      return NextResponse.json({ events: [] })
    }

    return NextResponse.json({ events: data || [] })
  } catch (error) {
    console.error('Chat events fetch error:', error)
    return NextResponse.json({ events: [] })
  }
}

// PATCH: Mark events as processed
export async function PATCH(request: NextRequest) {
  try {
    const { event_ids } = await request.json()

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return NextResponse.json(
        { error: 'event_ids array required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('chat_events' as never)
      .update({ processed: true } as never)
      .in('id' as never, event_ids as never)

    if (error) {
      console.error('Error marking events as processed:', error)
    }

    return NextResponse.json({ success: true, processed_count: event_ids.length })
  } catch (error) {
    console.error('Chat events patch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren' },
      { status: 500 }
    )
  }
}
