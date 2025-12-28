import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServices } from '@/lib/actions/services'
import { ServicesList } from './services-list'

export default async function ServicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { services } = await getServices()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Services & Behandlungen</h1>
        <p className="text-muted-foreground">
          Verwalte deine Behandlungen, Preise und Verfügbarkeit
        </p>
      </div>

      <ServicesList initialServices={services || []} />
    </div>
  )
}
