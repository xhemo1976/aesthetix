'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import { confirmAppointment, declineAppointment } from '@/lib/actions/confirmation'
import { useRouter } from 'next/navigation'

type AppointmentData = {
  id: string
  start_time: string
  end_time: string
  services: {
    name: string
    duration_minutes: number
    price: number
  }
  customers: {
    first_name: string
    last_name: string
  }
  tenants: {
    name: string
    address: string | null
    city: string | null
  }
}

export function ConfirmationForm({ appointment, token }: { appointment: AppointmentData; token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const appointmentDate = new Date(appointment.start_time)
  const formattedDate = appointmentDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    const result = await confirmAppointment(token)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  async function handleDecline() {
    if (!confirm('Möchten Sie den Termin wirklich absagen?')) return

    setLoading(true)
    setError(null)

    const result = await declineAppointment(token)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Appointment Details Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Datum</p>
                <p className="text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Uhrzeit</p>
                <p className="text-muted-foreground">{formattedTime} Uhr</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Behandlung</p>
                <p className="text-muted-foreground">{appointment.services.name}</p>
                <p className="text-sm text-muted-foreground">
                  Dauer: {appointment.services.duration_minutes} Minuten
                </p>
              </div>
            </div>

            {appointment.tenants.address && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-primary mt-0.5">📍</div>
                <div>
                  <p className="font-semibold">Adresse</p>
                  <p className="text-muted-foreground">{appointment.tenants.address}</p>
                  {appointment.tenants.city && (
                    <p className="text-muted-foreground">{appointment.tenants.city}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          size="lg"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {loading ? 'Wird bestätigt...' : 'Termin bestätigen'}
        </Button>

        <Button
          onClick={handleDecline}
          disabled={loading}
          variant="outline"
          size="lg"
          className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Termin absagen
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Bei Fragen können Sie uns gerne kontaktieren
      </p>
    </div>
  )
}
