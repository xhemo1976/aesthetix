import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'

// Lazy initialization - only create OpenAI client when needed
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

interface TenantInfo {
  id: string
  name: string
  address: string | null
  city: string | null
  contact_phone: string | null
  contact_email: string | null
  whatsapp_number: string | null
}

interface ServiceInfo {
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

interface EmployeeInfo {
  first_name: string
  last_name: string
  role: string
  specialties: string[] | null
}

export async function POST(request: NextRequest) {
  try {
    const { messages, tenantSlug } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Get tenant context if provided
    let tenantContext = ''
    let tenantName = 'unsere Klinik'

    if (tenantSlug) {
      const adminClient = createAdminClient()

      // Get tenant info
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id, name, address, city, contact_phone, contact_email, whatsapp_number')
        .eq('slug', tenantSlug)
        .single()

      const tenantData = tenant as TenantInfo | null

      if (tenantData) {
        tenantName = tenantData.name

        // Get services
        const { data: servicesData } = await adminClient
          .from('services')
          .select('name, description, price, duration_minutes')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)
          .order('name')

        const services = servicesData as ServiceInfo[] | null

        // Get employees
        const { data: employeesData } = await adminClient
          .from('employees')
          .select('first_name, last_name, role, specialties')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)

        const employees = employeesData as EmployeeInfo[] | null

        // Build context
        tenantContext = `
## Klinik-Informationen

**Name:** ${tenantData.name}
${tenantData.address ? `**Adresse:** ${tenantData.address}, ${tenantData.city || ''}` : ''}
${tenantData.contact_phone ? `**Telefon:** ${tenantData.contact_phone}` : ''}
${tenantData.contact_email ? `**Email:** ${tenantData.contact_email}` : ''}
${tenantData.whatsapp_number ? `**WhatsApp:** ${tenantData.whatsapp_number}` : ''}

## Unsere Behandlungen & Preise

${services && services.length > 0
  ? services.map(s => `- **${s.name}**: ${s.price}€ (${s.duration_minutes} Min.)${s.description ? ` - ${s.description}` : ''}`).join('\n')
  : 'Keine Services verfügbar.'}

## Unser Team

${employees && employees.length > 0
  ? employees.map(e => `- ${e.first_name} ${e.last_name} (${e.role})${e.specialties?.length ? ` - Spezialisiert auf: ${e.specialties.join(', ')}` : ''}`).join('\n')
  : 'Team-Informationen nicht verfügbar.'}

## Buchung

Kunden können online Termine buchen unter: /book/${tenantSlug}
`
      }
    }

    const systemPrompt = `Du bist ein freundlicher und professioneller Assistent für ${tenantName}, eine Schönheitsklinik/Ästhetik-Praxis.

Deine Aufgaben:
1. Beantworte Fragen zu unseren Behandlungen, Preisen und Services
2. Hilf Kunden bei der Terminbuchung
3. Gib Informationen zu unserem Team und unseren Spezialgebieten
4. Sei immer freundlich, professionell und hilfsbereit

Wichtige Regeln:
- Antworte immer auf Deutsch
- Halte deine Antworten kurz und prägnant (max. 2-3 Sätze wenn möglich)
- Wenn du nach Terminen gefragt wirst, verweise auf unsere Online-Buchung
- Erfinde keine Informationen - wenn du etwas nicht weißt, sag es ehrlich
- Verwende gelegentlich passende Emojis für eine freundliche Atmosphäre

${tenantContext}

Wenn keine spezifischen Klinik-Informationen verfügbar sind, erkläre dass du ein Assistent für Esylana bist - eine Buchungsplattform für Schönheitskliniken.`

    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json(
        { error: 'Chat nicht verfügbar - OPENAI_API_KEY nicht konfiguriert' },
        { status: 503 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // Only send last 10 messages for context
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Verarbeitung der Anfrage' },
      { status: 500 }
    )
  }
}
