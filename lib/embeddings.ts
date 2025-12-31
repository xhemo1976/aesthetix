import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'

// Lazy initialization
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

export interface EmbeddingResult {
  id: string
  content_type: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const openai = getOpenAIClient()
  if (!openai) return null

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    return null
  }
}

/**
 * Store embedding in Supabase using raw SQL (since embeddings table uses pgvector)
 */
export async function storeEmbedding(
  tenantId: string,
  contentType: string,
  content: string,
  metadata: Record<string, unknown> = {},
  contentId?: string
): Promise<boolean> {
  const embedding = await generateEmbedding(content)
  if (!embedding) return false

  const adminClient = createAdminClient()

  // Format embedding as a PostgreSQL vector string
  const embeddingString = `[${embedding.join(',')}]`

  // Use upsert via SQL function or raw query
  // First try to delete existing then insert (simple upsert)
  if (contentId) {
    await adminClient
      .from('embeddings' as never)
      .delete()
      .eq('tenant_id' as never, tenantId as never)
      .eq('content_type' as never, contentType as never)
      .eq('content_id' as never, contentId as never)
  }

  const { error } = await adminClient
    .from('embeddings' as never)
    .insert({
      tenant_id: tenantId,
      content_type: contentType,
      content_id: contentId,
      content,
      metadata,
      embedding: embeddingString,
    } as never)

  if (error) {
    console.error('Error storing embedding:', error)
    return false
  }

  return true
}

/**
 * Search for similar content using embeddings
 */
export async function searchSimilar(
  tenantId: string,
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<EmbeddingResult[]> {
  const embedding = await generateEmbedding(query)
  if (!embedding) return []

  const adminClient = createAdminClient()

  // Format embedding as a PostgreSQL vector string
  const embeddingString = `[${embedding.join(',')}]`

  const { data, error } = await adminClient.rpc('match_embeddings' as never, {
    query_embedding: embeddingString,
    match_tenant_id: tenantId,
    match_count: limit,
    match_threshold: threshold,
  } as never)

  if (error) {
    console.error('Error searching embeddings:', error)
    return []
  }

  return (data as EmbeddingResult[] | null) || []
}

// Type definitions for embedding generation
interface TenantData {
  name: string
  address?: string | null
  city?: string | null
  description?: string | null
}

interface ServiceData {
  id: string
  name: string
  description?: string | null
  price: number
  duration_minutes: number
  category?: string | null
}

interface EmployeeData {
  id: string
  first_name: string
  last_name: string
  role: string
  bio?: string | null
  specialties?: string[] | null
}

interface FAQData {
  id: string
  question: string
  answer: string
  category?: string | null
}

interface LocationData {
  id: string
  name: string
  address?: string | null
  city?: string | null
  phone?: string | null
  is_primary?: boolean
}

/**
 * Generate and store embeddings for all tenant content
 */
export async function generateTenantEmbeddings(tenantId: string): Promise<{
  success: boolean
  processed: number
  errors: number
}> {
  const adminClient = createAdminClient()
  let processed = 0
  let errors = 0

  // Get tenant info
  console.log('Looking up tenant with ID:', tenantId)
  const { data: tenantRaw, error: tenantError } = await adminClient
    .from('tenants')
    .select('name, address, city')
    .eq('id', tenantId)
    .single()

  console.log('Tenant lookup:', { tenantRaw, tenantError })

  const tenant = tenantRaw as TenantData | null

  if (!tenant) {
    console.error('Tenant not found for ID:', tenantId)
    return { success: false, processed: 0, errors: 1 }
  }

  // Store tenant general info embedding
  const tenantContent = `${tenant.name} ist eine Schönheitsklinik${tenant.address ? ` in ${tenant.city || tenant.address}` : ''}.`
  const tenantSuccess = await storeEmbedding(
    tenantId,
    'general',
    tenantContent,
    { name: tenant.name, type: 'clinic_info' }
  )
  if (tenantSuccess) processed++; else errors++

  // Get and embed services
  const { data: servicesRaw } = await adminClient
    .from('services')
    .select('id, name, description, price, duration_minutes, category')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  const services = servicesRaw as ServiceData[] | null

  if (services) {
    for (const service of services) {
      const content = `Behandlung: ${service.name}. ${service.description || ''} Preis: ${service.price}€. Dauer: ${service.duration_minutes} Minuten. Kategorie: ${service.category || 'Allgemein'}.`
      const success = await storeEmbedding(
        tenantId,
        'service',
        content,
        {
          name: service.name,
          price: service.price,
          duration: service.duration_minutes,
          category: service.category
        },
        service.id
      )
      if (success) processed++; else errors++
    }
  }

  // Get and embed employees
  const { data: employeesRaw } = await adminClient
    .from('employees')
    .select('id, first_name, last_name, role, bio, specialties')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  const employees = employeesRaw as EmployeeData[] | null

  if (employees) {
    for (const emp of employees) {
      const specialties = emp.specialties?.join(', ') || ''
      const content = `Experte: ${emp.first_name} ${emp.last_name}, ${emp.role}. ${emp.bio || ''} ${specialties ? `Spezialisierungen: ${specialties}.` : ''}`
      const success = await storeEmbedding(
        tenantId,
        'employee',
        content,
        {
          name: `${emp.first_name} ${emp.last_name}`,
          role: emp.role,
          specialties: emp.specialties
        },
        emp.id
      )
      if (success) processed++; else errors++
    }
  }

  // Get and embed FAQs (table may not exist yet)
  const { data: faqsRaw } = await adminClient
    .from('faqs' as never)
    .select('id, question, answer, category')
    .eq('tenant_id' as never, tenantId as never)
    .eq('is_active' as never, true as never)

  const faqs = faqsRaw as FAQData[] | null

  if (faqs) {
    for (const faq of faqs) {
      const content = `Frage: ${faq.question} Antwort: ${faq.answer}`
      const success = await storeEmbedding(
        tenantId,
        'faq',
        content,
        { question: faq.question, category: faq.category },
        faq.id
      )
      if (success) processed++; else errors++
    }
  }

  // Get and embed locations
  const { data: locationsRaw } = await adminClient
    .from('locations')
    .select('id, name, address, city, phone, is_primary')
    .eq('tenant_id', tenantId)

  const locations = locationsRaw as LocationData[] | null

  if (locations) {
    for (const loc of locations) {
      const content = `Standort: ${loc.name}. Adresse: ${loc.address || ''}, ${loc.city || ''}. ${loc.phone ? `Telefon: ${loc.phone}.` : ''} ${loc.is_primary ? 'Dies ist unser Hauptstandort.' : ''}`
      const success = await storeEmbedding(
        tenantId,
        'location',
        content,
        {
          name: loc.name,
          address: loc.address,
          city: loc.city,
          is_primary: loc.is_primary
        },
        loc.id
      )
      if (success) processed++; else errors++
    }
  }

  return { success: errors === 0, processed, errors }
}

/**
 * Build context from RAG results for chat
 */
export function buildRAGContext(results: EmbeddingResult[]): string {
  if (results.length === 0) return ''

  const grouped: Record<string, string[]> = {}

  for (const result of results) {
    if (!grouped[result.content_type]) {
      grouped[result.content_type] = []
    }
    grouped[result.content_type].push(result.content)
  }

  let context = '\n\n### Relevante Informationen aus unserer Wissensdatenbank:\n\n'

  if (grouped.service) {
    context += '**Behandlungen:**\n' + grouped.service.map(s => `- ${s}`).join('\n') + '\n\n'
  }
  if (grouped.employee) {
    context += '**Team:**\n' + grouped.employee.map(e => `- ${e}`).join('\n') + '\n\n'
  }
  if (grouped.faq) {
    context += '**FAQ:**\n' + grouped.faq.map(f => `- ${f}`).join('\n') + '\n\n'
  }
  if (grouped.location) {
    context += '**Standorte:**\n' + grouped.location.map(l => `- ${l}`).join('\n') + '\n\n'
  }
  if (grouped.general) {
    context += '**Allgemein:**\n' + grouped.general.join('\n') + '\n\n'
  }

  return context
}
