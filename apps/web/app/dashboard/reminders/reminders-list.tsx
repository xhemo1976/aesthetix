'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Clock,
  User,
  Check,
  RefreshCw,
  Phone,
  Mail,
  Sparkles,
  UserCircle
} from 'lucide-react'
import { markReminderSent, resetReminderStatus, type AppointmentForReminder } from '@/lib/actions/reminders'
import { getAppointmentReminderMessage, generateWhatsAppLink } from '@/lib/utils/whatsapp'

type RemindersListProps = {
  appointments: AppointmentForReminder[]
  tenantName: string
}

export function RemindersList({ appointments, tenantName }: RemindersListProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSendReminder = async (appointment: AppointmentForReminder) => {
    if (!appointment.customer.phone) return

    // Generate WhatsApp message
    const message = getAppointmentReminderMessage({
      customerName: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
      date: formatDate(appointment.start_time),
      time: formatTime(appointment.start_time),
      serviceName: appointment.service.name,
      clinicName: tenantName
    })

    // Open WhatsApp link
    const whatsappLink = generateWhatsAppLink(appointment.customer.phone, message)
    window.open(whatsappLink, '_blank')

    // Mark as sent
    setLoadingIds(prev => new Set(prev).add(appointment.id))
    await markReminderSent(appointment.id)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(appointment.id)
      return next
    })
  }

  const handleResetReminder = async (appointmentId: string) => {
    setLoadingIds(prev => new Set(prev).add(appointmentId))
    await resetReminderStatus(appointmentId)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(appointmentId)
      return next
    })
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Keine Termine für morgen</p>
          <p className="text-sm">Es gibt keine anstehenden Termine, für die Erinnerungen gesendet werden müssen.</p>
        </CardContent>
      </Card>
    )
  }

  // Separate pending and sent reminders
  const pendingReminders = appointments.filter(apt => !apt.reminder_sent_at)
  const sentReminders = appointments.filter(apt => apt.reminder_sent_at)

  return (
    <div className="space-y-6">
      {/* Pending Reminders */}
      {pendingReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Ausstehende Erinnerungen ({pendingReminders.length})
          </h3>
          <div className="space-y-3">
            {pendingReminders.map(appointment => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Appointment Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {formatTime(appointment.start_time)}
                        </div>
                        <Badge variant="outline">{appointment.status === 'confirmed' ? 'Bestätigt' : 'Geplant'}</Badge>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-foreground">
                          {appointment.customer.first_name} {appointment.customer.last_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        {appointment.service.name} ({appointment.service.duration_minutes} Min.)
                      </div>

                      {appointment.employee && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserCircle className="w-4 h-4" />
                          {appointment.employee.first_name} {appointment.employee.last_name}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        {appointment.customer.phone ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Phone className="w-3 h-3" />
                            {appointment.customer.phone}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                            <Phone className="w-3 h-3" />
                            Keine Telefonnummer
                          </span>
                        )}
                        {appointment.customer.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {appointment.customer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Button
                        onClick={() => handleSendReminder(appointment)}
                        disabled={!appointment.customer.phone || loadingIds.has(appointment.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loadingIds.has(appointment.id) ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-2" />
                        )}
                        WhatsApp senden
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent Reminders */}
      {sentReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Bereits gesendet ({sentReminders.length})
          </h3>
          <div className="space-y-3">
            {sentReminders.map(appointment => (
              <Card key={appointment.id} className="bg-green-50/50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Appointment Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          {formatTime(appointment.start_time)}
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <Check className="w-3 h-3 mr-1" />
                          Gesendet
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.customer.first_name} {appointment.customer.last_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        {appointment.service.name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Gesendet: {new Date(appointment.reminder_sent_at!).toLocaleString('de-DE')}
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetReminder(appointment.id)}
                        disabled={loadingIds.has(appointment.id)}
                      >
                        {loadingIds.has(appointment.id) ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Erneut senden
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
