/**
 * Seed Demo Restaurant für Gastro-Branche
 * Erstellt einen Demo-Tenant mit Restaurant-Speisekarte und Personal
 *
 * Run with: npx tsx scripts/seed-demo-gastro.ts
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

// Restaurant Menu Items
const MENU_ITEMS = {
  'Vorspeisen': [
    { name: 'Bruschetta Classica', description: 'Geröstetes Ciabatta mit Tomaten, Knoblauch & Basilikum', price: 8.90, duration: 10 },
    { name: 'Vitello Tonnato', description: 'Hauchdünnes Kalbfleisch mit Thunfischsauce', price: 14.90, duration: 15 },
    { name: 'Carpaccio vom Rind', description: 'Mit Rucola, Parmesan & Trüffelöl', price: 16.90, duration: 10 },
    { name: 'Burrata', description: 'Cremiger Mozzarella mit Tomaten & Pesto', price: 13.90, duration: 10 },
    { name: 'Suppe des Tages', description: 'Fragen Sie unser Service-Team', price: 7.90, duration: 5 },
  ],
  'Hauptgerichte': [
    { name: 'Wiener Schnitzel', description: 'Kalb, Petersilienkartoffeln & Preiselbeeren', price: 26.90, duration: 25 },
    { name: 'Rinderfilet', description: '200g Argentinisches Beef, Rotweinjus, Gemüse', price: 38.90, duration: 30 },
    { name: 'Dorade Royal', description: 'Im Ganzen gegrillt mit Mediterranem Gemüse', price: 28.90, duration: 25 },
    { name: 'Pasta Carbonara', description: 'Spaghetti, Guanciale, Eigelb, Pecorino', price: 18.90, duration: 20 },
    { name: 'Risotto ai Funghi', description: 'Steinpilzrisotto mit Parmesan', price: 21.90, duration: 25 },
    { name: 'Tagliatelle al Tartufo', description: 'Hausgemachte Pasta mit schwarzem Trüffel', price: 32.90, duration: 20 },
    { name: 'Lammcarré', description: 'Rosa gebraten, Kräuterkruste, Ratatouille', price: 34.90, duration: 30 },
    { name: 'Vegetarische Gemüseplatte', description: 'Saisonales Grillgemüse mit Halloumi', price: 19.90, duration: 20 },
  ],
  'Desserts': [
    { name: 'Tiramisu', description: 'Original italienisch, hausgemacht', price: 8.90, duration: 5 },
    { name: 'Panna Cotta', description: 'Mit Beerenragout', price: 7.90, duration: 5 },
    { name: 'Crème Brûlée', description: 'Klassiker mit karamellisierter Kruste', price: 8.90, duration: 10 },
    { name: 'Schoko-Lava-Kuchen', description: 'Mit Vanilleeis', price: 10.90, duration: 15 },
    { name: 'Käseauswahl', description: '5 erlesene Käsesorten mit Feigensenf', price: 14.90, duration: 10 },
  ],
  'Getränke': [
    { name: 'Aperol Spritz', description: 'Der italienische Klassiker', price: 9.90, duration: 5 },
    { name: 'Hauswein Weiß/Rot (0,2l)', description: 'Wechselnde Auswahl', price: 6.90, duration: 2 },
    { name: 'Champagner Moët', description: 'Flasche 0,75l', price: 89.00, duration: 2 },
    { name: 'San Pellegrino (0,75l)', description: 'Italienisches Mineralwasser', price: 5.90, duration: 2 },
    { name: 'Espresso', description: 'Lavazza Qualità Oro', price: 3.50, duration: 3 },
    { name: 'Cappuccino', description: 'Mit Latte Art', price: 4.50, duration: 5 },
  ],
  'Specials': [
    { name: 'Degustationsmenü (5 Gänge)', description: 'Chefkoch-Empfehlung mit Weinbegleitung', price: 89.00, duration: 120 },
    { name: 'Business Lunch', description: '2 Gänge inkl. Wasser & Kaffee (Mo-Fr)', price: 24.90, duration: 45 },
    { name: 'Sonntagsbrunch', description: 'All-you-can-eat Buffet (11-14 Uhr)', price: 39.00, duration: 180 },
  ],
}

// Restaurant Staff
const STAFF = [
  { first_name: 'Marco', last_name: 'Rossi', role: 'chef', bio: 'Küchenchef mit 20 Jahren Erfahrung in der gehobenen Gastronomie. Ausbildung in Rom und Paris.' },
  { first_name: 'Lisa', last_name: 'Weber', role: 'cook', bio: 'Sous-Chefin spezialisiert auf mediterrane Küche und vegane Gerichte.' },
  { first_name: 'Thomas', last_name: 'Schneider', role: 'waiter', bio: 'Oberkellner und Sommelier. Weinexperte mit Zertifizierung.' },
  { first_name: 'Anna', last_name: 'Klein', role: 'host', bio: 'Gastgeberin und Reservierungsmanagement. Ihr Lächeln ist unser Markenzeichen.' },
]

async function seedGastroDemo() {
  console.log('🍽️  Erstelle Demo Restaurant...')

  // 1. Create Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Ristorante Milano',
      slug: 'demo-gastro',
      business_type: 'gastronomy',
      subscription_status: 'active',
      whatsapp_number: '+4915123456789',
    })
    .select()
    .single()

  if (tenantError) {
    // Check if already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', 'demo-gastro')
      .single()

    if (existingTenant) {
      console.log('⚠️  Demo-Gastro existiert bereits, aktualisiere...')

      // Delete existing services
      await supabase.from('services').delete().eq('tenant_id', existingTenant.id)
      // Delete existing employees
      await supabase.from('employees').delete().eq('tenant_id', existingTenant.id)
      // Delete existing locations
      await supabase.from('locations').delete().eq('tenant_id', existingTenant.id)

      // Continue with existing tenant
      await seedData(existingTenant.id)
      return
    }

    console.error('Fehler beim Erstellen des Tenants:', tenantError)
    process.exit(1)
  }

  await seedData(tenant.id)
}

async function seedData(tenantId: string) {
  console.log('📍 Erstelle Standort...')

  // 2. Create Location
  const { error: locationError } = await supabase
    .from('locations')
    .insert({
      tenant_id: tenantId,
      name: 'Ristorante Milano',
      address: 'Maximilianstraße 42',
      city: 'München',
      phone: '+49 89 12345678',
      is_primary: true,
    })

  if (locationError) {
    console.error('Fehler beim Erstellen des Standorts:', locationError)
  }

  console.log('🍝 Erstelle Speisekarte...')

  // 3. Create Services (Menu Items)
  for (const [category, items] of Object.entries(MENU_ITEMS)) {
    for (const item of items) {
      const { error } = await supabase
        .from('services')
        .insert({
          tenant_id: tenantId,
          name: item.name,
          description: item.description,
          price: item.price,
          duration_minutes: item.duration,
          category: category,
          is_active: true,
        })

      if (error) {
        console.error(`Fehler bei ${item.name}:`, error.message)
      }
    }
  }

  console.log('👨‍🍳 Erstelle Personal...')

  // 4. Create Employees
  for (const member of STAFF) {
    const { error } = await supabase
      .from('employees')
      .insert({
        tenant_id: tenantId,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role,
        bio: member.bio,
        is_active: true,
        work_schedule: {
          monday: { start: '11:00', end: '23:00' },
          tuesday: { start: '11:00', end: '23:00' },
          wednesday: { start: '11:00', end: '23:00' },
          thursday: { start: '11:00', end: '23:00' },
          friday: { start: '11:00', end: '24:00' },
          saturday: { start: '11:00', end: '24:00' },
          sunday: { start: '12:00', end: '22:00' },
        },
      })

    if (error) {
      console.error(`Fehler bei ${member.first_name}:`, error.message)
    }
  }

  console.log('')
  console.log('✅ Demo Restaurant erstellt!')
  console.log('')
  console.log('📊 Übersicht:')
  console.log(`   - ${Object.values(MENU_ITEMS).flat().length} Gerichte in ${Object.keys(MENU_ITEMS).length} Kategorien`)
  console.log(`   - ${STAFF.length} Teammitglieder`)
  console.log('')
  console.log('🌐 Erreichbar unter:')
  console.log('   - gastro.esylana.de (nach DNS-Setup)')
  console.log('   - esylana.de/book/demo-gastro')
  console.log('')
}

seedGastroDemo().catch(console.error)
