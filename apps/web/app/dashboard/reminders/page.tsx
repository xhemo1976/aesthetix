import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppointmentsForReminders } from '@/lib/actions/reminders'
import { RemindersList } from './reminders-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Bell } from 'lucide-react'

export default async function RemindersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { appointments, tenant, error } = await getAppointmentsForReminders()

  // Count pending reminders (not yet sent)
  const pendingCount = appointments.filter(apt => !apt.reminder_sent_at).length
  const sentCount = appointments.filter(apt => apt.reminder_sent_at).length
  const withPhoneCount = appointments.filter(apt => apt.customer.phone).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          WhatsApp Erinnerungen
        </h2>
        <p className="text-muted-foreground">
          Sende Terminerinnerungen an Kunden für morgen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Termine morgen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ausstehende Erinnerungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bereits gesendet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{sentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Warning if no WhatsApp number configured */}
      {!tenant?.whatsapp_number && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              WhatsApp-Nummer nicht konfiguriert
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Konfiguriere deine WhatsApp-Nummer in den Einstellungen, um Erinnerungen zu senden.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Info about customers without phone */}
      {appointments.length > 0 && withPhoneCount < appointments.length && (
        <Card className="mb-6 border-blue-300 bg-blue-50">
          <CardHeader className="py-3">
            <CardDescription className="text-blue-700">
              {appointments.length - withPhoneCount} von {appointments.length} Kunden haben keine Telefonnummer hinterlegt.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Reminders List */}
      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-red-600">
            Fehler beim Laden: {error}
          </CardContent>
        </Card>
      ) : (
        <RemindersList
          appointments={appointments}
          tenantName={tenant?.name || 'Unsere Klinik'}
        />
      )}
    </div>
  )
}
