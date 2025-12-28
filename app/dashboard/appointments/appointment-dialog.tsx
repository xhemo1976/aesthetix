'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAppointment, updateAppointment } from '@/lib/actions/appointments'
import { useRouter } from 'next/navigation'

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
  start_time: string  // TIMESTAMPTZ from database
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
}

const statusOptions = [
  { value: 'scheduled', label: 'Geplant' },
  { value: 'confirmed', label: 'Bestätigt' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Abgesagt' },
  { value: 'no_show', label: 'Nicht erschienen' },
]

export function AppointmentDialog({ open, onOpenChange, appointment, customers, services }: AppointmentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!appointment

  // Convert TIMESTAMPTZ to date and time for form
  const getDateFromTimestamp = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toISOString().split('T')[0]
  }

  const getTimeFromTimestamp = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toTimeString().slice(0, 5)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Kunde *</Label>
              <select
                id="customer_id"
                name="customer_id"
                defaultValue={appointment?.customer_id || ''}
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
                name="service_id"
                defaultValue={appointment?.service_id || ''}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Datum *</Label>
              <Input
                id="appointment_date"
                name="appointment_date"
                type="date"
                defaultValue={getDateFromTimestamp(appointment?.start_time)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_time">Uhrzeit *</Label>
              <Input
                id="appointment_time"
                name="appointment_time"
                type="time"
                defaultValue={getTimeFromTimestamp(appointment?.start_time)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                name="status"
                defaultValue={appointment?.status || 'scheduled'}
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
              name="customer_notes"
              placeholder="Besondere Wünsche, Hinweise..."
              defaultValue={appointment?.customer_notes || ''}
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
