'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAppointment, updateAppointment } from '@/lib/actions/appointments'
import { useRouter } from 'next/navigation'
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

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

type Employee = {
  id: string
  first_name: string
  last_name: string
  role: string
  specialties: string[]
  is_active: boolean
  work_schedule: Record<string, { start: string; end: string }>
}

type Appointment = {
  id: string
  customer_id: string
  service_id: string
  employee_id: string | null
  start_time: string
  end_time: string
  status: string
  customer_notes: string | null
}

type AppointmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  customers: Customer[]
  services: Service[]
  employees: Employee[]
  existingAppointments?: Array<{
    id: string
    employee_id: string | null
    start_time: string
    end_time: string
    status: string
  }>
}

const statusOptions = [
  { value: 'scheduled', label: 'Geplant' },
  { value: 'confirmed', label: 'Bestätigt' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Abgesagt' },
  { value: 'no_show', label: 'Nicht erschienen' },
]

const DAYS_MAP: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  customers,
  services,
  employees,
  existingAppointments = []
}: AppointmentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!appointment

  // Form state - controlled inputs to preserve data on error
  const [customerId, setCustomerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [customerNotes, setCustomerNotes] = useState('')

  // Available time slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Initialize form when appointment changes or dialog opens
  useEffect(() => {
    if (open) {
      if (appointment) {
        setCustomerId(appointment.customer_id)
        setServiceId(appointment.service_id)
        setEmployeeId(appointment.employee_id || '')
        setAppointmentDate(new Date(appointment.start_time).toISOString().split('T')[0])
        setAppointmentTime(new Date(appointment.start_time).toTimeString().slice(0, 5))
        setStatus(appointment.status)
        setCustomerNotes(appointment.customer_notes || '')
      } else {
        // Reset for new appointment
        setCustomerId('')
        setServiceId('')
        setEmployeeId('')
        setAppointmentDate('')
        setAppointmentTime('')
        setStatus('scheduled')
        setCustomerNotes('')
      }
      setError(null)
    }
  }, [open, appointment])

  // Calculate available time slots when date, employee, or service changes
  useEffect(() => {
    if (!appointmentDate || !serviceId) {
      setAvailableSlots([])
      return
    }

    const selectedService = services.find(s => s.id === serviceId)
    if (!selectedService) {
      setAvailableSlots([])
      return
    }

    const duration = selectedService.duration_minutes
    const selectedDate = new Date(appointmentDate)
    const dayOfWeek = DAYS_MAP[selectedDate.getDay()]

    // Get employee's work schedule for this day (if employee selected)
    let workStart = '09:00'
    let workEnd = '18:00'

    if (employeeId) {
      const selectedEmployee = employees.find(e => e.id === employeeId)
      if (selectedEmployee?.work_schedule?.[dayOfWeek]) {
        workStart = selectedEmployee.work_schedule[dayOfWeek].start
        workEnd = selectedEmployee.work_schedule[dayOfWeek].end
      } else if (selectedEmployee?.work_schedule && Object.keys(selectedEmployee.work_schedule).length > 0) {
        // Employee doesn't work this day
        setAvailableSlots([])
        return
      }
    }

    // Generate all possible time slots (every 30 minutes)
    const slots: string[] = []
    const [startHour, startMin] = workStart.split(':').map(Number)
    const [endHour, endMin] = workEnd.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    for (let mins = startMinutes; mins + duration <= endMinutes; mins += 30) {
      const hour = Math.floor(mins / 60)
      const minute = mins % 60
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

      // Check if this slot conflicts with existing appointments
      const slotStart = new Date(`${appointmentDate}T${timeSlot}`)
      const slotEnd = new Date(slotStart.getTime() + duration * 60000)

      const hasConflict = existingAppointments.some(apt => {
        // Skip cancelled appointments
        if (apt.status === 'cancelled') return false
        // Skip current appointment when editing
        if (appointment && apt.id === appointment.id) return false
        // Only check conflicts for same employee (if employee selected)
        if (employeeId && apt.employee_id !== employeeId) return false

        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)

        // Check overlap: slotStart < aptEnd AND slotEnd > aptStart
        return slotStart < aptEnd && slotEnd > aptStart
      })

      if (!hasConflict) {
        slots.push(timeSlot)
      }
    }

    setAvailableSlots(slots)
  }, [appointmentDate, employeeId, serviceId, services, employees, existingAppointments, appointment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('customer_id', customerId)
    formData.set('service_id', serviceId)
    formData.set('employee_id', employeeId)
    formData.set('appointment_date', appointmentDate)
    formData.set('appointment_time', appointmentTime)
    formData.set('status', status)
    formData.set('customer_notes', customerNotes)

    const result = isEditing
      ? await updateAppointment(appointment.id, formData)
      : await createAppointment(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onOpenChange(false)
      router.refresh()
    }
  }

  const selectedService = services.find(s => s.id === serviceId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Termin bearbeiten' : 'Neuer Termin'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Aktualisiere die Termin-Details'
              : 'Erstelle einen neuen Termin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Kunde *</Label>
              <select
                id="customer_id"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Kunde auswählen</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_id">Behandlung *</Label>
              <select
                id="service_id"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Behandlung auswählen</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} Min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_id">Mitarbeiter</Label>
            <select
              id="employee_id"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value)
                setAppointmentTime('') // Reset time when employee changes
              }}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Kein Mitarbeiter zugewiesen</option>
              {employees.filter(e => e.is_active).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_date">Datum *</Label>
            <Input
              id="appointment_date"
              type="date"
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value)
                setAppointmentTime('') // Reset time when date changes
              }}
              required
              disabled={loading}
            />
          </div>

          {/* Time Selection - Only show available slots */}
          {appointmentDate && serviceId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Uhrzeit wählen *
                {selectedService && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedService.duration_minutes} Min pro Termin)
                  </span>
                )}
              </Label>

              {availableSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg max-h-40 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={appointmentTime === slot ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAppointmentTime(slot)}
                      className="text-xs"
                      disabled={loading}
                    >
                      {slot}
                      {appointmentTime === slot && (
                        <CheckCircle2 className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                  {employeeId
                    ? 'Keine verfügbaren Zeiten für diesen Mitarbeiter an diesem Tag.'
                    : 'Bitte wähle zuerst einen Mitarbeiter, um verfügbare Zeiten zu sehen.'}
                </div>
              )}

              {appointmentTime && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Gewählte Zeit: <strong>{appointmentTime} Uhr</strong>
                </div>
              )}

              {/* Hidden input for form validation */}
              <input type="hidden" name="appointment_time" value={appointmentTime} required />
            </div>
          )}

          {!appointmentDate && serviceId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              Bitte wähle ein Datum, um verfügbare Zeiten zu sehen.
            </div>
          )}

          {!serviceId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              Bitte wähle eine Behandlung, um verfügbare Zeiten zu sehen.
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer_notes">Notizen</Label>
            <textarea
              id="customer_notes"
              placeholder="Besondere Wünsche, Hinweise..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird gespeichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
