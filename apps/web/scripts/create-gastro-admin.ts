/**
 * Create admin user for demo-gastro tenant
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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function createGastroAdmin() {
  // Get demo-gastro tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', 'demo-gastro')
    .single()

  if (!tenant) {
    console.log('Tenant nicht gefunden!')
    return
  }

  console.log('Tenant:', tenant.name)

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'gastro@esylana.de',
    password: 'Gastro2025!',
    email_confirm: true
  })

  if (authError) {
    console.log('Auth Error:', authError.message)
    // User might already exist, try to get them
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === 'gastro@esylana.de')
    if (existingUser) {
      console.log('User existiert bereits, aktualisiere Profil...')

      // Update or create profile
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: existingUser.id,
          email: 'gastro@esylana.de',
          full_name: 'Gastro Admin',
          tenant_id: tenant.id,
          role: 'owner'
        })

      if (upsertError) {
        console.log('Upsert Error:', upsertError.message)
      } else {
        console.log('Profil aktualisiert!')
      }
    }
  } else if (authUser) {
    console.log('Auth User erstellt:', authUser.user.id)

    // Create user profile linked to tenant
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: 'gastro@esylana.de',
        full_name: 'Gastro Admin',
        tenant_id: tenant.id,
        role: 'owner'
      })

    if (profileError) {
      console.log('Profile Error:', profileError.message)
    } else {
      console.log('Profil erstellt!')
    }
  }

  console.log('')
  console.log('=== LOGIN DATEN ===')
  console.log('URL: https://esylana.de/login')
  console.log('Email: gastro@esylana.de')
  console.log('Passwort: Gastro2025!')
}

createGastroAdmin().catch(console.error)
