'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { AppointmentDialog } from './appointment-dialog'
import { deleteAppointment, updateAppointmentStatus } from '@/lib/actions/appointments'

type Customer = {
  id: string
  first_name: string
  last_name: string
}

type Service = {
  id: string
  name: string
  duration_minutes: number
}

type Appointment = {
  id: string
  customer_id: string
  service_id: string
  start_time: string  // TIMESTAMPTZ
  end_time: string    // TIMESTAMPTZ
  status: string
  customer_notes: string | null
  customers: Customer
  services: Service
}

type AppointmentsListProps = {
  initialAppointments: Appointment[]
  customers: Customer[]
  services: Service[]
}

const statusConfig = {
  scheduled: { label: 'Geplant', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  confirmed: { label: 'Bestätigt', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  completed: { label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
  cancelled: { label: 'Abgesagt', color: 'bg-red-100 text-red-800', icon: XCircle },
  no_show: { label: 'Nicht erschienen', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
}

export function AppointmentsList({ initialAppointments, customers, services }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Möchtest du diesen Termin wirklich löschen?')) return

    const result = await deleteAppointment(id)
    if (!result.error) {
      setAppointments(appointments.filter(a => a.id !== id))
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await updateAppointmentStatus(id, newStatus)
    setAppointments(appointments.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ))
  }

  function handleEdit(appointment: Appointment) {
    setEditingAppointment(appointment)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingAppointment(null)
    setDialogOpen(true)
  }

  function handleDialogClose() {
    setDialogOpen(false)
    setEditingAppointment(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getDateKey(timestamp: string) {
    return new Date(timestamp).toISOString().split('T')[0]
  }

  // Group appointments by date
  const groupedAppointments = appointments.reduce((groups, appointment) => {
    const date = getDateKey(appointment.start_time)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {} as Record<string, Appointment[]>)

  const sortedDates = Object.keys(groupedAppointments).sort()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          {appointments.length} Termin{appointments.length !== 1 ? 'e' : ''}
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Termin
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Noch keine Termine angelegt</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten Termin erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {formatDate(date)}
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {groupedAppointments[date].map((appointment) => {
                      const StatusIcon = statusConfig[appointment.status as keyof typeof statusConfig]?.icon || Calendar
                      const statusStyle = statusConfig[appointment.status as keyof typeof statusConfig]

                      return (
                        <div key={appointment.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">
                                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="font-medium">
                                  {appointment.customers.first_name} {appointment.customers.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {appointment.services.name} ({appointment.services.duration_minutes} Min)
                                </div>
                                {appointment.customer_notes && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    💬 {appointment.customer_notes}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle?.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusStyle?.label}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {appointment.status === 'scheduled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                >
                                  Bestätigen
                                </Button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(appointment.id, 'completed')}
                                >
                                  Abschließen
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(appointment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(appointment.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={editingAppointment}
        customers={customers}
        services={services}
      />
    </div>
  )
}
