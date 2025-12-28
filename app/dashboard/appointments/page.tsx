import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppointments } from '@/lib/actions/appointments'
import { getCustomers } from '@/lib/actions/customers'
import { getServices } from '@/lib/actions/services'
import { getTenantSettings } from '@/lib/actions/settings'
import { AppointmentsList } from './appointments-list'

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [
    { appointments },
    { customers },
    { services },
    { settings }
  ] = await Promise.all([
    getAppointments(),
    getCustomers(),
    getServices(),
    getTenantSettings()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Termine</h2>
        <p className="text-muted-foreground">
          Verwalte deine Termine und Buchungen
        </p>
      </div>

      <AppointmentsList
        initialAppointments={appointments || []}
        customers={customers || []}
        services={services || []}
        clinicWhatsApp={settings?.whatsapp_number || null}
        clinicName={settings?.name || 'Ihre Klinik'}
      />
    </div>
  )
}
