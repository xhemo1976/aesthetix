// Run with: npx tsx scripts/seed-demo-services.ts

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const services = [
  // Ästhetik - Botox
  { name: 'Botox Stirn', description: 'Glättung horizontaler Stirnfalten für ein entspanntes, jugendliches Erscheinungsbild', category: 'Ästhetik', price: 250, duration_minutes: 30 },
  { name: 'Botox Zornesfalte', description: 'Behandlung der Glabellafalte zwischen den Augenbrauen', category: 'Ästhetik', price: 200, duration_minutes: 20 },
  { name: 'Botox Krähenfüße', description: 'Sanfte Glättung der Lachfalten um die Augen', category: 'Ästhetik', price: 200, duration_minutes: 20 },
  { name: 'Botox Komplett (3 Zonen)', description: 'Stirn, Zornesfalte und Krähenfüße in einer Behandlung', category: 'Ästhetik', price: 450, duration_minutes: 45 },
  { name: 'Hyperhidrose Behandlung', description: 'Botox gegen übermäßiges Schwitzen (Achseln)', category: 'Ästhetik', price: 550, duration_minutes: 45 },

  // Ästhetik - Hyaluron
  { name: 'Hyaluron Lippen', description: 'Natürliche Lippenvolumen-Aufbau und Konturierung', category: 'Ästhetik', price: 350, duration_minutes: 45 },
  { name: 'Hyaluron Nasolabialfalten', description: 'Auffüllung der Falten von Nase zu Mundwinkel', category: 'Ästhetik', price: 300, duration_minutes: 30 },
  { name: 'Hyaluron Wangen', description: 'Volumenaufbau und Konturierung der Wangenknochen', category: 'Ästhetik', price: 400, duration_minutes: 45 },
  { name: 'Hyaluron Kinn', description: 'Kinnmodellierung für harmonische Gesichtsproportionen', category: 'Ästhetik', price: 350, duration_minutes: 30 },
  { name: 'Hyaluron Tränenrinne', description: 'Aufhellung dunkler Augenringe durch sanfte Unterspritzung', category: 'Ästhetik', price: 400, duration_minutes: 45 },
  { name: 'Skinbooster', description: 'Tiefenwirksame Hyaluron-Kur für strahlende Haut', category: 'Ästhetik', price: 280, duration_minutes: 45 },

  // Ästhetik - Weitere
  { name: 'Radiesse Volumenaufbau', description: 'Langanhaltender Filler auf Kalziumbasis für tiefe Falten', category: 'Ästhetik', price: 450, duration_minutes: 45 },
  { name: 'Fadenlifting Gesicht', description: 'Nicht-chirurgisches Lifting mit resorbierbaren PDO-Fäden', category: 'Ästhetik', price: 800, duration_minutes: 90 },
  { name: 'Fadenlifting Hals', description: 'Straffung und Definition der Halskonturen', category: 'Ästhetik', price: 600, duration_minutes: 60 },
  { name: 'Profhilo Behandlung', description: 'Bio-Remodeling für intensive Hautstraffung und Hydration', category: 'Ästhetik', price: 350, duration_minutes: 30 },

  // Laser
  { name: 'BBL Gesicht Komplett', description: 'Broadband Light Therapie für Hautverjüngung und Pigmentkorrektur', category: 'Laser', price: 350, duration_minutes: 45 },
  { name: 'BBL Pigmentbehandlung', description: 'Gezielte Behandlung von Altersflecken und Sonnenschäden', category: 'Laser', price: 200, duration_minutes: 30 },
  { name: 'BBL Rosacea', description: 'Reduktion von Rötungen und sichtbaren Äderchen', category: 'Laser', price: 250, duration_minutes: 30 },
  { name: 'BBL Hals & Dekolleté', description: 'Verjüngung und Straffung von Hals und Brustbereich', category: 'Laser', price: 300, duration_minutes: 45 },
  { name: 'BBL Hände', description: 'Behandlung von Altersflecken und Hautverjüngung der Hände', category: 'Laser', price: 200, duration_minutes: 30 },
  { name: 'Laser Haarentfernung Achseln', description: 'Dauerhafte Haarentfernung mit modernster Lasertechnologie', category: 'Laser', price: 89, duration_minutes: 20 },
  { name: 'Laser Haarentfernung Bikini', description: 'Dauerhafte Haarentfernung der Bikinizone', category: 'Laser', price: 120, duration_minutes: 30 },
  { name: 'Laser Haarentfernung Beine', description: 'Dauerhafte Haarentfernung beider Beine komplett', category: 'Laser', price: 350, duration_minutes: 60 },

  // Kosmetik
  { name: 'Signature Gesichtsbehandlung', description: 'Luxuriöse Komplett-Behandlung mit Reinigung, Peeling, Maske und Massage', category: 'Kosmetik', price: 129, duration_minutes: 75 },
  { name: 'Express Facial', description: 'Schnelle Auffrischung für zwischendurch', category: 'Kosmetik', price: 69, duration_minutes: 30 },
  { name: 'Hydrafacial', description: 'Tiefenreinigung mit Hydration und Antioxidantien', category: 'Kosmetik', price: 189, duration_minutes: 60 },
  { name: 'Microneedling Gesicht', description: 'Kollagenstimulation für feinere Poren und glattere Haut', category: 'Kosmetik', price: 199, duration_minutes: 60 },
  { name: 'Microneedling mit PRP', description: 'Vampire Facial - Microneedling kombiniert mit Eigenblut-Plasma', category: 'Kosmetik', price: 349, duration_minutes: 90 },
  { name: 'Chemisches Peeling Light', description: 'Sanftes Fruchtsäure-Peeling für strahlenden Teint', category: 'Kosmetik', price: 89, duration_minutes: 30 },
  { name: 'Chemisches Peeling Medium', description: 'Intensives TCA-Peeling für deutliche Hauterneuerung', category: 'Kosmetik', price: 149, duration_minutes: 45 },
  { name: 'Mikrodermabrasion', description: 'Mechanisches Peeling für verfeinerte Hautstruktur', category: 'Kosmetik', price: 99, duration_minutes: 45 },
  { name: 'LED Lichttherapie', description: 'Photobiomodulation für Hautverjüngung und Akne-Behandlung', category: 'Kosmetik', price: 59, duration_minutes: 20 },
  { name: 'Augenbrauen Styling', description: 'Professionelles Zupfen und Formen der Augenbrauen', category: 'Kosmetik', price: 25, duration_minutes: 20 },
  { name: 'Wimpernlifting', description: 'Dauerhafte Wimpernwelle für offenen Blick', category: 'Kosmetik', price: 69, duration_minutes: 45 },
]

async function seedServices() {
  console.log('🌱 Seeding demo services...\n')

  // Find the demo clinic tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .ilike('slug', 'demo%')
    .single()

  if (tenantError || !tenant) {
    console.error('❌ Demo tenant not found:', tenantError)
    process.exit(1)
  }

  console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})\n`)

  // Delete existing services for this tenant
  const { error: deleteError } = await supabase
    .from('services')
    .delete()
    .eq('tenant_id', tenant.id)

  if (deleteError) {
    console.error('❌ Error deleting existing services:', deleteError)
  } else {
    console.log('🗑️  Deleted existing services\n')
  }

  // Insert new services
  let successCount = 0
  let errorCount = 0

  for (const service of services) {
    const { error } = await supabase
      .from('services')
      .insert({
        tenant_id: tenant.id,
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration_minutes: service.duration_minutes,
        is_active: true,
      })

    if (error) {
      console.error(`❌ ${service.name}: ${error.message}`)
      errorCount++
    } else {
      console.log(`✅ ${service.category} | ${service.name} - €${service.price}`)
      successCount++
    }
  }

  console.log(`\n========================================`)
  console.log(`✅ Successfully added: ${successCount} services`)
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`)
  }
  console.log(`========================================\n`)
}

seedServices()
