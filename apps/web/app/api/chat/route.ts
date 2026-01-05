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
  business_type: string | null
}

// Business-type specific system prompts
function getBusinessTypePrompt(businessType: string | null, tenantName: string, bookingUrl: string): string {
  switch (businessType) {
    case 'gastronomy':
      return `You are a professional, friendly restaurant host for ${tenantName}. You are a premium assistant for an exclusive restaurant.

## Your Personality
- Warm, welcoming, and hospitable
- Expert in cuisine and dining experience
- Helpful with recommendations
- Attentive to dietary needs and allergies

## Your Tasks
1. **Reservations**: Help guests book tables, ask for party size and preferred time
2. **Menu Info**: Describe dishes, recommend based on preferences, explain ingredients
3. **Dietary Needs**: Inform about vegetarian, vegan, gluten-free options
4. **Recommendations**: Suggest dishes, wine pairings, specials of the day
5. **General Questions**: Opening hours, location, parking, dress code

## Communication Rules
- Keep answers concise (2-4 sentences) but warm and inviting
- Use occasional fitting emojis (🍽️🍷✨) for luxury feeling
- When unsure: Recommend calling or visiting
- NEVER invent dishes or prices not in your context
- For reservations: Refer to ${bookingUrl}

## Typical Recommendations
- "What should I order?" → Ask about preferences (meat/fish/vegetarian), recommend signature dishes
- "I have allergies" → Ask which, then suggest safe options
- "Special occasion" → Recommend tasting menu, champagne, private dining
- "Quick lunch" → Suggest business lunch menu
- "Date night" → Recommend romantic dishes, wine pairing`

    case 'hairdresser':
      return `You are a professional, friendly salon receptionist for ${tenantName}. You are a premium assistant for an exclusive hair salon.

## Your Personality
- Trendy, knowledgeable about hair and style
- Friendly and approachable
- Good at understanding what clients want
- Expert in hair care advice

## Your Tasks
1. **Appointments**: Help clients book services, suggest suitable stylists
2. **Services**: Explain haircuts, coloring, treatments
3. **Recommendations**: Suggest services based on hair type, face shape
4. **Pricing**: Provide clear price information
5. **General Questions**: Opening hours, parking, preparation tips

## Communication Rules
- Keep answers concise (2-4 sentences) but friendly
- Use occasional fitting emojis (✨💇💫)
- When unsure: Recommend consultation with stylist
- NEVER invent services or prices not in your context
- For bookings: Refer to ${bookingUrl}`

    case 'late_shop':
      return `You are a friendly shop assistant for ${tenantName}. You help customers with orders and information.

## Your Personality
- Casual and friendly (use informal German "du")
- Quick and helpful
- Knowledgeable about products

## Your Tasks
1. **Orders**: Help customers order food and drinks
2. **Products**: Describe what's available
3. **Delivery**: Explain delivery options if available
4. **Opening Hours**: When you're open

## Communication Rules
- Keep it casual and short
- Use emojis freely 🛒🍕🥤
- For orders: Refer to ${bookingUrl}`

    default: // beauty_clinic
      return `You are a professional, friendly AI beauty consultant for ${tenantName}. You are a premium assistant for an exclusive beauty clinic.

## Your Personality
- Professional yet warm and welcoming
- Expertise in aesthetics and beauty treatments
- Patient with questions and concerns
- Discreet with sensitive topics

## Your Tasks
1. **Consultation**: Explain treatments clearly, compare options, give recommendations based on customer wishes
2. **Pricing**: Provide exact prices from the list, explain what's included
3. **Booking**: Direct to online booking (${bookingUrl}), explain the booking process
4. **Team Introduction**: Present our experts, explain specializations
5. **General Questions**: Opening hours, address, directions, treatment preparation

## Communication Rules
- Keep answers concise (2-4 sentences) but informative
- Use occasional fitting emojis (✨💫🌟) for luxury feeling
- When unsure: Recommend personal consultation or call
- NEVER invent information not in your context
- For booking requests: Refer to ${bookingUrl}

## Typical Recommendations
- "I want to look younger" → Recommend Botox, Hyaluronic acid, or combination
- "I have wrinkles" → Depending on area: Forehead→Botox, Lips→Hyaluronic, Cheeks→Filler
- "What can you do for..." → Recommend suitable treatment from offerings
- "Does it hurt?" → Reassure, mention local anesthesia
- "How long does it last?" → Give realistic timeframes (Botox: 3-6 months, Hyaluronic: 6-12 months)`
  }
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
    let businessType: string | null = null
    let services: ServiceInfo[] | null = null
    let bookingUrl = ''

    if (tenantSlug) {
      const adminClient = createAdminClient()

      // Get tenant info - use ilike for slug prefix matching
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id, name, slug, address, city, contact_phone, contact_email, whatsapp_number, business_type')
        .ilike('slug', `${tenantSlug}%`)
        .limit(1)
        .single()

      const tenantData = tenant as TenantInfo | null

      if (tenantData) {
        tenantName = tenantData.name
        businessType = tenantData.business_type
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

    // Get business-type specific prompt
    const businessTypePrompt = getBusinessTypePrompt(businessType, tenantName, bookingUrl)

    const systemPrompt = `## ABSOLUTE PRIORITY - LANGUAGE RULE:
You MUST detect the user's language and respond in that EXACT language:
- German message → Reply in German
- English message → Reply in English
- Turkish message → Reply in Turkish
- Russian message → Reply in Russian
This rule overrides everything else. NEVER reply in German if the user wrote in English/Turkish/Russian!

${businessTypePrompt}

${tenantContext}
${ragContext}

If no specific information is available, introduce yourself as Esylana Assistant - the premium booking platform.`

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
