import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'

type Appointment = {
  id: string
  start_time: string
  end_time: string
  status: string
  price: number
  services: { name: string; duration_minutes: number }
  employees: { first_name: string; last_name: string } | null
  locations: { name: string; address: string | null } | null
  tenants: { name: string; slug: string }
}

async function getCustomerAppointments(userEmail: string) {
  const adminClient = createAdminClient()

  // Find all customers with this email
  const { data: customers } = await adminClient
    .from('customers')
    .select('id, tenant_id')
    .eq('email', userEmail.toLowerCase()) as { data: { id: string; tenant_id: string }[] | null }

  if (!customers || customers.length === 0) {
    return []
  }

  const customerIds = customers.map(c => c.id)

  // Get appointments for these customers
  const { data: appointments } = await adminClient
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      price,
      services (name, duration_minutes),
      employees (first_name, last_name),
      locations (name, address),
      tenants (name, slug)
    `)
    .in('customer_id', customerIds)
    .order('start_time', { ascending: false })

  return (appointments || []) as unknown as Appointment[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    canceled: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
  }

  const labels: Record<string, string> = {
    scheduled: 'Geplant',
    confirmed: 'Bestätigt',
    completed: 'Abgeschlossen',
    canceled: 'Storniert',
    no_show: 'Nicht erschienen',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
}

export default async function CustomerAppointmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/customer/login?redirect=/customer/termine')
  }

  const appointments = await getCustomerAppointments(user.email)

  const upcomingAppointments = appointments.filter(
    a => new Date(a.start_time) >= new Date() && a.status !== 'canceled'
  )
  const pastAppointments = appointments.filter(
    a => new Date(a.start_time) < new Date() || a.status === 'canceled'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Meine Termine</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Upcoming Appointments */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Kommende Termine</h2>
            <Link href="/">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Neuer Termin
              </Button>
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Keine kommenden Termine</p>
                <Link href="/">
                  <Button className="mt-4">
                    Jetzt Termin buchen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appointment.services?.name}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(appointment.start_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(appointment.start_time)} Uhr
                          </div>
                          {appointment.employees && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {appointment.employees.first_name} {appointment.employees.last_name}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {appointment.tenants?.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold">€{appointment.price}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.services?.duration_minutes} Min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-6">Vergangene Termine</h2>
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{appointment.services?.name}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(appointment.start_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(appointment.start_time)} Uhr
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {appointment.tenants?.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">€{appointment.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
