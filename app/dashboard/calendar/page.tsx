import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppointments } from '@/lib/actions/appointments'
import { getCustomers } from '@/lib/actions/customers'
import { getServices } from '@/lib/actions/services'
import { getActiveEmployees } from '@/lib/actions/employees'
import { CalendarView } from './calendar-view'

export default async function CalendarPage() {
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
    { employees }
  ] = await Promise.all([
    getAppointments(),
    getCustomers(),
    getServices(),
    getActiveEmployees()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Kalender</h2>
        <p className="text-muted-foreground">
          Terminübersicht in Tages-, Wochen- und Monatsansicht
        </p>
      </div>

      <CalendarView
        initialAppointments={appointments || []}
        customers={customers || []}
        services={services || []}
        employees={employees || []}
      />
    </div>
  )
}
