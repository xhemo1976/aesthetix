/**
 * Update Demo Restaurant Menu with Images and Allergens
 *
 * Run with: npx tsx scripts/update-gastro-menu.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Menu item updates with images and allergens
const MENU_UPDATES: Record<string, {
  image_url: string
  allergens?: string[]
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
}> = {
  // Vorspeisen
  'Bruschetta Classica': {
    image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop',
    allergens: ['gluten'],
    is_vegetarian: true,
    is_vegan: true
  },
  'Vitello Tonnato': {
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    allergens: ['fish', 'eggs']
  },
  'Carpaccio vom Rind': {
    image_url: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&h=400&fit=crop',
    allergens: ['lactose']
  },
  'Burrata': {
    image_url: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&h=400&fit=crop',
    allergens: ['lactose'],
    is_vegetarian: true
  },
  'Suppe des Tages': {
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
    allergens: ['celery']
  },

  // Hauptgerichte
  'Wiener Schnitzel': {
    image_url: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=600&h=400&fit=crop',
    allergens: ['gluten', 'eggs']
  },
  'Rinderfilet': {
    image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=400&fit=crop',
    allergens: ['sulfites']
  },
  'Dorade Royal': {
    image_url: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=600&h=400&fit=crop',
    allergens: ['fish']
  },
  'Pasta Carbonara': {
    image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop',
    allergens: ['gluten', 'eggs', 'lactose']
  },
  'Risotto ai Funghi': {
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop',
    allergens: ['lactose'],
    is_vegetarian: true
  },
  'Tagliatelle al Tartufo': {
    image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=400&fit=crop',
    allergens: ['gluten', 'eggs', 'lactose'],
    is_vegetarian: true
  },
  'Lammcarré': {
    image_url: 'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=600&h=400&fit=crop',
    allergens: ['gluten']
  },
  'Vegetarische Gemüseplatte': {
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    allergens: ['lactose'],
    is_vegetarian: true
  },

  // Desserts
  'Tiramisu': {
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    allergens: ['gluten', 'eggs', 'lactose'],
    is_vegetarian: true
  },
  'Panna Cotta': {
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop',
    allergens: ['lactose'],
    is_vegetarian: true
  },
  'Crème Brûlée': {
    image_url: 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=600&h=400&fit=crop',
    allergens: ['eggs', 'lactose'],
    is_vegetarian: true
  },
  'Schoko-Lava-Kuchen': {
    image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=400&fit=crop',
    allergens: ['gluten', 'eggs', 'lactose'],
    is_vegetarian: true
  },
  'Käseauswahl': {
    image_url: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&h=400&fit=crop',
    allergens: ['lactose'],
    is_vegetarian: true
  },

  // Getränke
  'Aperol Spritz': {
    image_url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600&h=400&fit=crop',
    allergens: ['sulfites'],
    is_vegan: true
  },
  'Hauswein Weiß/Rot (0,2l)': {
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop',
    allergens: ['sulfites'],
    is_vegan: true
  },
  'Champagner Moët': {
    image_url: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=600&h=400&fit=crop',
    allergens: ['sulfites'],
    is_vegan: true
  },
  'San Pellegrino (0,75l)': {
    image_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=400&fit=crop',
    is_vegan: true
  },
  'Espresso': {
    image_url: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&h=400&fit=crop',
    is_vegan: true
  },
  'Cappuccino': {
    image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&h=400&fit=crop',
    allergens: ['lactose'],
    is_vegetarian: true
  },

  // Specials
  'Degustationsmenü (5 Gänge)': {
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    allergens: ['gluten', 'lactose', 'fish', 'eggs', 'sulfites']
  },
  'Business Lunch': {
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    allergens: ['gluten', 'lactose']
  },
  'Sonntagsbrunch': {
    image_url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&h=400&fit=crop',
    allergens: ['gluten', 'eggs', 'lactose']
  },
}

async function updateGastroMenu() {
  console.log('🍽️  Aktualisiere Speisekarte mit Bildern und Allergenen...\n')

  // Get demo-gastro tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', 'demo-gastro')
    .single()

  if (!tenant) {
    console.error('❌ Demo-Gastro Tenant nicht gefunden!')
    process.exit(1)
  }

  console.log(`📍 Tenant: ${tenant.name}\n`)

  // Get all services for this tenant
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name')
    .eq('tenant_id', tenant.id)

  if (error || !services) {
    console.error('❌ Fehler beim Laden der Services:', error?.message)
    process.exit(1)
  }

  console.log(`📋 Gefunden: ${services.length} Gerichte\n`)

  let updated = 0
  let skipped = 0

  for (const service of services) {
    const update = MENU_UPDATES[service.name]

    if (update) {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          image_url: update.image_url,
          allergens: update.allergens || [],
          is_vegetarian: update.is_vegetarian || false,
          is_vegan: update.is_vegan || false,
          is_spicy: update.is_spicy || false,
        })
        .eq('id', service.id)

      if (updateError) {
        console.error(`❌ ${service.name}: ${updateError.message}`)
      } else {
        console.log(`✅ ${service.name}`)
        updated++
      }
    } else {
      console.log(`⏭️  ${service.name} (kein Update definiert)`)
      skipped++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✨ Fertig!`)
  console.log(`   Aktualisiert: ${updated}`)
  console.log(`   Übersprungen: ${skipped}`)
  console.log('')
  console.log('🌐 Ansehen unter: https://gastro.esylana.de')
}

updateGastroMenu().catch(console.error)
