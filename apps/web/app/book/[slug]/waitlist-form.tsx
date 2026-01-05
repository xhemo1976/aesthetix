'use client'

import { useState } from 'react'
import { Clock, CheckCircle, ArrowLeft, ChevronDown } from 'lucide-react'
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
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Du stehst jetzt auf der Warteliste!
            </h3>
            <p className="text-white/60 mb-6">
              Wir benachrichtigen dich per {phone ? 'WhatsApp' : 'E-Mail'}, sobald ein passender Termin frei wird.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-3 border border-white/20 rounded-lg text-white/70 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
            >
              Zurück zur Buchung
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Auf die Warteliste setzen</h2>
            <p className="text-white/50">
              Wir benachrichtigen dich, wenn ein Termin frei wird
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Gewünschte Behandlung *</label>
            <div className="relative">
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white appearance-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="" className="bg-[#1a1a1a]">Behandlung auswählen...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id} className="bg-[#1a1a1a]">
                    {service.name} - {service.price}€
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Bevorzugte/r Mitarbeiter/in</label>
            <div className="relative">
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white appearance-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="" className="bg-[#1a1a1a]">Egal</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-[#1a1a1a]">
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium text-white">Vorname *</label>
              <input
                id="first_name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium text-white">Nachname *</label>
              <input
                id="last_name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white">E-Mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-white">Telefon (für WhatsApp) *</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+49..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Gewünschter Zeitraum *</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="date_from" className="text-xs text-white/40">Von</label>
                <input
                  id="date_from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  min={minDate}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="date_to" className="text-xs text-white/40">Bis</label>
                <input
                  id="date_to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  min={dateFrom || minDate}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Time Preference */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Bevorzugte Uhrzeit (optional)</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="time_from" className="text-xs text-white/40">Von</label>
                <input
                  id="time_from"
                  type="time"
                  value={timeFrom}
                  onChange={e => setTimeFrom(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="time_to" className="text-xs text-white/40">Bis</label>
                <input
                  id="time_to"
                  type="time"
                  value={timeTo}
                  onChange={e => setTimeTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-white">Anmerkungen</label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="z.B. Flexibel bei der Zeit, bevorzugt nachmittags..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center px-5 py-3 border border-white/20 rounded-lg text-white/70 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Wird eingetragen...' : 'Auf Warteliste setzen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
