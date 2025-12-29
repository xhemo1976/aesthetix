'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import { addToPublicWaitlist } from '@/lib/actions/waitlist'

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
}

type Employee = {
  id: string
  first_name: string
  last_name: string
}

type WaitlistFormProps = {
  tenantSlug: string
  services: Service[]
  employees: Employee[]
  locationId?: string
  selectedService?: Service | null
  selectedEmployee?: Employee | null
  onBack: () => void
}

export function WaitlistForm({
  tenantSlug,
  services,
  employees,
  locationId,
  selectedService,
  selectedEmployee,
  onBack,
}: WaitlistFormProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [serviceId, setServiceId] = useState(selectedService?.id || '')
  const [employeeId, setEmployeeId] = useState(selectedEmployee?.id || '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [notes, setNotes] = useState('')

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('tenant_slug', tenantSlug)
    formData.set('service_id', serviceId)
    formData.set('employee_id', employeeId || '')
    formData.set('location_id', locationId || '')
    formData.set('customer_name', `${firstName} ${lastName}`)
    formData.set('customer_email', email)
    formData.set('customer_phone', phone)
    formData.set('preferred_date_from', dateFrom)
    formData.set('preferred_date_to', dateTo)
    formData.set('preferred_time_from', timeFrom)
    formData.set('preferred_time_to', timeTo)
    formData.set('notes', notes)

    const result = await addToPublicWaitlist(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setStep('success')
    }

    setIsSubmitting(false)
  }

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Du stehst jetzt auf der Warteliste!
            </h3>
            <p className="text-muted-foreground mb-6">
              Wir benachrichtigen dich per {phone ? 'WhatsApp' : 'E-Mail'}, sobald ein passender Termin frei wird.
            </p>
            <Button variant="outline" onClick={onBack}>
              Zurück zur Buchung
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Auf die Warteliste setzen</CardTitle>
            <CardDescription>
              Wir benachrichtigen dich, wenn ein Termin frei wird
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div>
            <Label>Gewünschte Behandlung *</Label>
            <Select value={serviceId} onValueChange={setServiceId} required>
              <SelectTrigger>
                <SelectValue placeholder="Behandlung auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.price}€
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Selection */}
          <div>
            <Label>Bevorzugte/r Mitarbeiter/in</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Egal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Egal</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Vorname *</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nachname *</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon (für WhatsApp) *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+49..."
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Gewünschter Zeitraum *</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_from" className="text-xs text-muted-foreground">Von</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  min={minDate}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_to" className="text-xs text-muted-foreground">Bis</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  min={dateFrom || minDate}
                  required
                />
              </div>
            </div>
          </div>

          {/* Time Preference */}
          <div>
            <Label>Bevorzugte Uhrzeit (optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time_from" className="text-xs text-muted-foreground">Von</Label>
                <Input
                  id="time_from"
                  type="time"
                  value={timeFrom}
                  onChange={e => setTimeFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="time_to" className="text-xs text-muted-foreground">Bis</Label>
                <Input
                  id="time_to"
                  type="time"
                  value={timeTo}
                  onChange={e => setTimeTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Anmerkungen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="z.B. Flexibel bei der Zeit, bevorzugt nachmittags..."
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Wird eingetragen...' : 'Auf Warteliste setzen'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
