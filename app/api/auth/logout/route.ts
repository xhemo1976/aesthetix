import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Get redirect from form data or referer
  const formData = await request.formData().catch(() => null)
  const redirect = formData?.get('redirect')?.toString() || request.headers.get('referer') || '/'

  return NextResponse.redirect(new URL(redirect, request.url))
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Get redirect from query params
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/'

  return NextResponse.redirect(new URL(redirect, request.url))
}
