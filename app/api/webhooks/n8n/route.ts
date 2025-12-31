import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Webhook secret for n8n authentication
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'default-secret'

interface WebhookPayload {
  event: string
  data: Record<string, unknown>
  tenant_id?: string
}

// Verify webhook authenticity
function verifyWebhook(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const [type, token] = authHeader.split(' ')
  return type === 'Bearer' && token === WEBHOOK_SECRET
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    if (!verifyWebhook(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload: WebhookPayload = await request.json()
    const { event, data, tenant_id } = payload

    const adminClient = createAdminClient()

    switch (event) {
      case 'send_reminder':
        // Send appointment reminder via email/SMS
        // This would be triggered by n8n workflow
        console.log('Sending reminder:', data)
        break

      case 'sync_calendar':
        // Sync with external calendar (Google, Outlook)
        console.log('Syncing calendar:', data)
        break

      case 'generate_report':
        // Generate analytics report
        console.log('Generating report:', data)
        break

      case 'update_customer':
        // Update customer data from external CRM
        if (tenant_id && data.customer_id) {
          await adminClient
            .from('customers' as never)
            .update(data.updates as never)
            .eq('id' as never, (data.customer_id as string) as never)
            .eq('tenant_id' as never, tenant_id as never)
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown event: ${event}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook testing/health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'n8n webhook endpoint ready',
    supported_events: [
      'send_reminder',
      'sync_calendar',
      'generate_report',
      'update_customer'
    ]
  })
}
