import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWaitlist } from '@/lib/actions/waitlist'
import { getServices } from '@/lib/actions/services'
import { getCustomers } from '@/lib/actions/customers'
import { getEmployees } from '@/lib/actions/employees'
import { getTenantSettings } from '@/lib/actions/settings'
import { WaitlistManager } from './waitlist-manager'

export default async function WaitlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [
    { entries },
    { services },
    { customers },
    { employees },
    { settings }
  ] = await Promise.all([
    getWaitlist(),
    getServices(),
    getCustomers(),
    getEmployees(),
    getTenantSettings(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Warteliste</h2>
        <p className="text-muted-foreground">
          Kunden, die auf einen Termin warten. Benachrichtige sie, wenn Termine frei werden.
        </p>
      </div>

      <WaitlistManager
        initialEntries={entries}
        services={services || []}
        customers={customers || []}
        employees={employees || []}
        tenantSlug={settings?.slug || ''}
        clinicName={settings?.name || 'Ihre Klinik'}
      />
    </div>
  )
}
