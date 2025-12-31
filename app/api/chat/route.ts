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

    // Generate contextual quick replies
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const hasAppointmentContext = reply.toLowerCase().includes('termin') || reply.toLowerCase().includes('buchung')
    const quickReplies = generateQuickReplies(lastUserMessage, reply, services, hasAppointmentContext)

    return NextResponse.json({
      reply,
      quickReplies
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Verarbeitung der Anfrage' },
      { status: 500 }
    )
  }
}
