import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { searchSimilar, buildRAGContext } from '@/lib/embeddings'

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
  slug: string
  address: string | null
  city: string | null
  contact_phone: string | null
  contact_email: string | null
  whatsapp_number: string | null
}

interface ServiceInfo {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  category: string | null
}

interface EmployeeInfo {
  first_name: string
  last_name: string
  role: string
  specialties: string[] | null
  bio: string | null
}

interface LocationInfo {
  name: string
  address: string | null
  city: string | null
  phone: string | null
}

// Intent detection for smart actions
type UserIntent = 'booking' | 'pricing' | 'info' | 'consultation' | 'complaint' | 'general'

interface ActionButton {
  type: 'link' | 'whatsapp' | 'phone' | 'booking'
  label: string
  value: string
}

function detectIntent(message: string): UserIntent {
  const lower = message.toLowerCase()

  // Booking intent
  if (lower.includes('termin') || lower.includes('buchen') || lower.includes('reserv') ||
      lower.includes('wann') || lower.includes('zeit') || lower.includes('frei')) {
    return 'booking'
  }

  // Pricing intent
  if (lower.includes('preis') || lower.includes('kost') || lower.includes('€') ||
      lower.includes('euro') || lower.includes('teuer') || lower.includes('günstig')) {
    return 'pricing'
  }

  // Consultation request
  if (lower.includes('berat') || lower.includes('empfehl') || lower.includes('welche behandlung') ||
      lower.includes('was hilft') || lower.includes('was würden sie')) {
    return 'consultation'
  }

  // Complaint detection
  if (lower.includes('beschwer') || lower.includes('unzufried') || lower.includes('problem') ||
      lower.includes('schlecht') || lower.includes('ärger')) {
    return 'complaint'
  }

  // Info request
  if (lower.includes('info') || lower.includes('wie lange') || lower.includes('was ist') ||
      lower.includes('erklär') || lower.includes('beschreib')) {
    return 'info'
  }

  return 'general'
}

function generateActionButtons(
  intent: UserIntent,
  bookingUrl: string,
  whatsappNumber: string | null,
  phone: string | null
): ActionButton[] {
  const buttons: ActionButton[] = []

  if (intent === 'booking') {
    buttons.push({
      type: 'booking',
      label: 'Jetzt Termin buchen',
      value: bookingUrl
    })
  }

  if (whatsappNumber && (intent === 'booking' || intent === 'consultation')) {
    buttons.push({
      type: 'whatsapp',
      label: 'WhatsApp schreiben',
      value: `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    })
  }

  if (phone && intent === 'complaint') {
    buttons.push({
      type: 'phone',
      label: 'Direkt anrufen',
      value: `tel:${phone.replace(/[^0-9+]/g, '')}`
    })
  }

  return buttons
}

// Generate smart quick replies based on conversation
function generateQuickReplies(
  userMessage: string,
  assistantReply: string,
  services: ServiceInfo[] | null,
  hasAppointmentContext: boolean
): string[] {
  const lowerMessage = userMessage.toLowerCase()
  const lowerReply = assistantReply.toLowerCase()

  // If talking about specific treatment, offer related options
  if (lowerReply.includes('botox') || lowerMessage.includes('botox')) {
    return [
      'Was kostet Hyaluron?',
      'Termin für Botox buchen',
      'Gibt es Nebenwirkungen?'
    ]
  }

  if (lowerReply.includes('hyaluron') || lowerMessage.includes('hyaluron')) {
    return [
      'Lippen oder Falten?',
      'Termin für Hyaluron buchen',
      'Wie lange hält das Ergebnis?'
    ]
  }

  if (lowerReply.includes('laser') || lowerMessage.includes('laser')) {
    return [
      'Welche Körperbereiche?',
      'Wie viele Sitzungen brauche ich?',
      'Preisliste Laser'
    ]
  }

  // If asking about prices
  if (lowerMessage.includes('preis') || lowerMessage.includes('kost')) {
    const categories = services
      ? [...new Set(services.map(s => s.category).filter(Boolean))]
      : []
    if (categories.length > 0) {
      return [
        ...categories.slice(0, 2).map(c => `Preise ${c}`),
        'Termin buchen'
      ]
    }
    return ['Alle Behandlungen', 'Termin buchen', 'Beratungsgespräch']
  }

  // If asking about appointments
  if (lowerMessage.includes('termin') || lowerMessage.includes('buchen')) {
    return [
      'Welche Zeiten sind frei?',
      'Kann ich auch samstags kommen?',
      'Online Termin buchen'
    ]
  }

  // If asking about team
  if (lowerMessage.includes('team') || lowerMessage.includes('mitarbeiter') || lowerMessage.includes('arzt')) {
    return [
      'Wer macht Botox?',
      'Welche Spezialisten habt ihr?',
      'Termin buchen'
    ]
  }

  // Default suggestions based on context
  if (hasAppointmentContext) {
    return [
      'Was muss ich mitbringen?',
      'Kann ich vorher essen?',
      'Wie lange dauert die Behandlung?'
    ]
  }

  // General fallback
  return [
    'Beliebte Behandlungen',
    'Preise anzeigen',
    'Termin buchen'
  ]
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
    let services: ServiceInfo[] | null = null
    let bookingUrl = ''

    if (tenantSlug) {
      const adminClient = createAdminClient()

      // Get tenant info - use ilike for slug prefix matching
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id, name, slug, address, city, contact_phone, contact_email, whatsapp_number')
        .ilike('slug', `${tenantSlug}%`)
        .limit(1)
        .single()

      const tenantData = tenant as TenantInfo | null

      if (tenantData) {
        tenantName = tenantData.name
        bookingUrl = `/book/${tenantData.slug}`

        // Get services with categories
        const { data: servicesData } = await adminClient
          .from('services')
          .select('id, name, description, price, duration_minutes, category')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)
          .order('category')
          .order('name')

        services = servicesData as ServiceInfo[] | null

        // Get employees
        const { data: employeesData } = await adminClient
          .from('employees')
          .select('first_name, last_name, role, specialties, bio')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)

        const employees = employeesData as EmployeeInfo[] | null

        // Get locations
        const { data: locationsData } = await adminClient
          .from('locations')
          .select('name, address, city, phone')
          .eq('tenant_id', tenantData.id)
          .order('is_primary', { ascending: false })

        const locations = locationsData as LocationInfo[] | null
        const primaryLocation = locations?.[0]

        // Group services by category
        const servicesByCategory: Record<string, ServiceInfo[]> = {}
        if (services) {
          services.forEach(service => {
            const cat = service.category || 'Weitere'
            if (!servicesByCategory[cat]) {
              servicesByCategory[cat] = []
            }
            servicesByCategory[cat].push(service)
          })
        }

        // Build comprehensive context
        tenantContext = `
## Klinik: ${tenantData.name}

### Standort & Kontakt
${primaryLocation?.address ? `📍 Adresse: ${primaryLocation.address}${primaryLocation.city ? `, ${primaryLocation.city}` : ''}` : ''}
${tenantData.contact_phone || primaryLocation?.phone ? `📞 Telefon: ${tenantData.contact_phone || primaryLocation?.phone}` : ''}
${tenantData.contact_email ? `✉️ Email: ${tenantData.contact_email}` : ''}
${tenantData.whatsapp_number ? `💬 WhatsApp: ${tenantData.whatsapp_number}` : ''}

### Öffnungszeiten
Montag - Freitag: 9:00 - 19:00 Uhr
Samstag: 10:00 - 16:00 Uhr
Sonntag: Geschlossen

### Unsere Behandlungen & Preise

${Object.entries(servicesByCategory).map(([category, categoryServices]) => `
**${category}:**
${categoryServices.map(s => `• ${s.name}: ${s.price > 0 ? `${s.price}€` : 'Preis auf Anfrage'} (${s.duration_minutes} Min.)${s.description ? `\n  → ${s.description}` : ''}`).join('\n')}
`).join('\n')}

### Unser Experten-Team

${employees && employees.length > 0
  ? employees.map(e => `• **${e.first_name} ${e.last_name}** - ${e.role}${e.specialties?.length ? `\n  Spezialisierung: ${e.specialties.join(', ')}` : ''}${e.bio ? `\n  ${e.bio}` : ''}`).join('\n\n')
  : 'Unser erfahrenes Team freut sich auf Sie.'}

### Online-Buchung
Termine können rund um die Uhr online gebucht werden: ${bookingUrl}
`
      }
    }

    // RAG: Search for relevant context based on user's last message
    let ragContext = ''
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    if (tenantSlug && lastUserMessage) {
      try {
        const adminClient = createAdminClient()
        const { data: ragTenant } = await adminClient
          .from('tenants')
          .select('id')
          .ilike('slug', `${tenantSlug}%`)
          .limit(1)
          .single()

        if (ragTenant) {
          const ragResults = await searchSimilar((ragTenant as { id: string }).id, lastUserMessage, 5, 0.5)
          if (ragResults.length > 0) {
            ragContext = buildRAGContext(ragResults)
          }
        }
      } catch (ragError) {
        console.log('RAG search skipped:', ragError)
        // Continue without RAG if it fails
      }
    }

    const systemPrompt = `Du bist ein professioneller, freundlicher KI-Beauty-Berater für ${tenantName}. Du bist ein Premium-Assistent für eine exklusive Schönheitsklinik.

## Deine Persönlichkeit
- Professionell aber warm und einladend
- Expertise in Ästhetik und Beauty-Behandlungen
- Geduldig bei Fragen und Bedenken
- Diskret bei sensiblen Themen

## Deine Aufgaben
1. **Beratung**: Erkläre Behandlungen verständlich, vergleiche Optionen, gib Empfehlungen basierend auf Kundenwünschen
2. **Preisauskunft**: Nenne genaue Preise aus der Liste, erkläre was im Preis enthalten ist
3. **Terminbuchung**: Leite zur Online-Buchung (${bookingUrl}), erkläre den Buchungsprozess
4. **Team-Vorstellung**: Stelle unsere Experten vor, erkläre Spezialisierungen
5. **Allgemeine Fragen**: Öffnungszeiten, Adresse, Anfahrt, Vorbereitung auf Behandlungen

## Kommunikationsregeln
- Antworte IMMER auf Deutsch
- Halte Antworten prägnant (2-4 Sätze), aber informativ
- Verwende gelegentlich passende Emojis (✨💫🌟) für Luxus-Feeling
- Bei Unsicherheit: Empfehle persönliche Beratung oder Anruf
- Erfinde NIEMALS Informationen die nicht in deinem Kontext stehen
- Bei Buchungswunsch: Verweise auf ${bookingUrl}

## Typische Empfehlungen
- "Ich möchte jünger aussehen" → Botox, Hyaluron, oder beides kombiniert empfehlen
- "Ich habe Falten" → Je nach Bereich: Stirn→Botox, Lippen→Hyaluron, Wangen→Filler
- "Was könnt ihr gegen..." → Passende Behandlung aus dem Angebot empfehlen
- "Tut das weh?" → Beruhigen, lokale Betäubung erwähnen
- "Wie lange hält das?" → Realistische Zeiträume nennen (Botox: 3-6 Monate, Hyaluron: 6-12 Monate)

${tenantContext}
${ragContext}

Wenn keine spezifischen Klinik-Informationen verfügbar sind, stelle dich als Esylana-Assistent vor - die Premium-Buchungsplattform für Schönheitskliniken.`

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
      max_tokens: 600,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.'

    // Detect user intent for smart actions
    const intent = detectIntent(lastUserMessage)

    // Generate action buttons based on intent
    let whatsappNumber: string | null = null
    let contactPhone: string | null = null

    if (tenantSlug) {
      const adminClient = createAdminClient()
      const { data: tenantContact } = await adminClient
        .from('tenants')
        .select('whatsapp_number, contact_phone')
        .ilike('slug', `${tenantSlug}%`)
        .limit(1)
        .single()

      if (tenantContact) {
        whatsappNumber = (tenantContact as { whatsapp_number: string | null }).whatsapp_number
        contactPhone = (tenantContact as { contact_phone: string | null }).contact_phone
      }
    }

    const actionButtons = generateActionButtons(intent, bookingUrl, whatsappNumber, contactPhone)

    // Generate contextual quick replies
    const hasAppointmentContext = reply.toLowerCase().includes('termin') || reply.toLowerCase().includes('buchung')
    const quickReplies = generateQuickReplies(lastUserMessage, reply, services, hasAppointmentContext)

    // Emit event for n8n automation (non-blocking)
    if (tenantSlug && (intent === 'booking' || intent === 'consultation' || intent === 'complaint')) {
      try {
        const adminClient = createAdminClient()
        const { data: eventTenant } = await adminClient
          .from('tenants')
          .select('id')
          .ilike('slug', `${tenantSlug}%`)
          .limit(1)
          .single()

        if (eventTenant) {
          // Store event for n8n processing
          await adminClient
            .from('chat_events' as never)
            .insert({
              tenant_id: (eventTenant as { id: string }).id,
              event_type: intent === 'booking' ? 'booking_intent' : intent === 'consultation' ? 'consultation_request' : 'complaint',
              user_message: lastUserMessage,
              assistant_reply: reply,
              intent,
              metadata: { actionButtons, hasAppointmentContext },
              processed: false,
            } as never)

          // Trigger n8n webhook if configured (fire and forget)
          const n8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL
          if (n8nWebhookUrl) {
            fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: intent,
                tenant_id: (eventTenant as { id: string }).id,
                user_message: lastUserMessage,
                timestamp: new Date().toISOString()
              })
            }).catch(() => {})
          }
        }
      } catch (eventError) {
        console.log('Chat event emission skipped:', eventError)
      }
    }

    return NextResponse.json({
      reply,
      quickReplies,
      actionButtons,
      intent
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Verarbeitung der Anfrage' },
      { status: 500 }
    )
  }
}
