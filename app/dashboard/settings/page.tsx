import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTenantSettings } from '@/lib/actions/settings'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { settings } = await getTenantSettings()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Einstellungen</h2>
        <p className="text-muted-foreground">
          Verwalte deine Klinik-Informationen und Kontaktdaten
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  )
}
