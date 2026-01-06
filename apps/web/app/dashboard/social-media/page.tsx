import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SocialMediaManager } from './social-media-manager'

export default async function SocialMediaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.tenants) {
    redirect('/dashboard')
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Social Media</h1>
        <p className="text-muted-foreground mt-1">
          Verwalte deine Social Media Profile und Bewertungen
        </p>
      </div>

      <SocialMediaManager tenant={profile.tenants} />
    </div>
  )
}
