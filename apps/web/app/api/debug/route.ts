import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const checks: Record<string, string> = {}

  // Check environment variables
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
  checks.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING'

  // Try to connect to Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Test query
      const { data, error } = await supabase.from('tenants').select('count').limit(1)

      if (error) {
        checks.supabase_connection = `ERROR: ${error.message}`
      } else {
        checks.supabase_connection = 'OK'
      }
    } catch (e) {
      checks.supabase_connection = `EXCEPTION: ${e instanceof Error ? e.message : 'Unknown'}`
    }
  } else {
    checks.supabase_connection = 'SKIPPED - Missing env vars'
  }

  // Test admin client
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { data, error } = await adminClient.from('tenants').select('count').limit(1)

      if (error) {
        checks.admin_connection = `ERROR: ${error.message}`
      } else {
        checks.admin_connection = 'OK'
      }
    } catch (e) {
      checks.admin_connection = `EXCEPTION: ${e instanceof Error ? e.message : 'Unknown'}`
    }
  } else {
    checks.admin_connection = 'SKIPPED - Missing env vars'
  }

  return NextResponse.json(checks, { status: 200 })
}
