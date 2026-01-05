'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Users,
  Sparkles,
  Check,
  Loader2,
  ClockIcon,
  UtensilsCrossed,
} from 'lucide-react'
import { getAvailableSlots, createPublicBooking, createGastroReservation, getGastroSlots, type Employee } from '@/lib/actions/public-booking'
import { WaitlistForm } from './waitlist-form'
import type { Database } from '@/lib/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']
type Service = Database['public']['Tables']['services']['Row']

type CustomerData = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
} | null

interface BookingFormProps {
  tenant: Tenant
  services: Service[]
  employees: Employee[]
  locationId?: string
  customerData?: CustomerData
  businessType?: string
}

type Step = 'service' | 'employee' | 'datetime' | 'customer' | 'confirm' | 'waitlist' | 'guests'

export function BookingForm({ tenant, services, employees, locationId, customerData, businessType = 'beauty_clinic' }: BookingFormProps) {
  const router = useRouter()
  const isGastronomy = businessType === 'gastronomy'
  const [currentStep, setCurrentStep] = useState<Step>(isGastronomy ? 'guests' : 'service')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gastro-specific state
  const [guestCount, setGuestCount] = useState(2)

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const categories = Array.from(
    new Set(services.map(s => s.category).filter((c): c is string => c !== null && c !== ''))
  ).sort()
  const filteredServices = selectedCategory
    ? services.filter(s => s.category === selectedCategory)
    : services

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Customer info - pre-fill from logged-in customer data
  const [firstName, setFirstName] = useState(customerData?.firstName || '')
  const [lastName, setLastName] = useState(customerData?.lastName || '')
  const [email, setEmail] = useState(customerData?.email || '')
  const [phone, setPhone] = useState(customerData?.phone || '')
  const [notes, setNotes] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [smsConsent, setSmsConsent] = useState(false)

  // Track if customer is logged in
  const isLoggedIn = !!customerData

  // Calculate min date (today)
  const today = new Date().toISOString().split('T')[0]

  // Fetch available slots when date/service/employee changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([])
      return
    }

    // For gastronomy, we don't need a service selected
    if (!isGastronomy && !selectedService) {
      setAvailableSlots([])
      return
    }

    setLoadingSlots(true)
    setSelectedTime('')

    if (isGastronomy) {
      // Gastro: Get available reservation times
      getGastroSlots({
        tenantId: tenant.id,
        date: selectedDate,
        guestCount,
      })
        .then(({ slots, error }) => {
          if (error) {
            setError(error)
            setAvailableSlots([])
          } else {
            setAvailableSlots(slots)
          }
        })
        .finally(() => {
          setLoadingSlots(false)
        })
    } else {
      // Standard: Get available appointment slots
      getAvailableSlots({
        tenantId: tenant.id,
        serviceId: selectedService!.id,
        employeeId: selectedEmployee?.id,
        date: selectedDate,
      })
        .then(({ slots, error }) => {
          if (error) {
            setError(error)
            setAvailableSlots([])
          } else {
            setAvailableSlots(slots)
          }
        })
        .finally(() => {
          setLoadingSlots(false)
        })
    }
  }, [selectedDate, selectedService, selectedEmployee, tenant.id, isGastronomy, guestCount])

  // Different steps for gastronomy vs other business types
  const steps: { key: Step; label: string }[] = isGastronomy
    ? [
        { key: 'guests', label: 'Gäste' },
        { key: 'datetime', label: 'Termin' },
        { key: 'customer', label: 'Daten' },
        { key: 'confirm', label: 'Bestätigen' },
      ]
    : [
        { key: 'service', label: 'Service' },
        { key: 'employee', label: 'Mitarbeiter' },
        { key: 'datetime', label: 'Termin' },
        { key: 'customer', label: 'Daten' },
        { key: 'confirm', label: 'Bestätigen' },
      ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'guests':
        return guestCount >= 1 && guestCount <= 20
      case 'service':
        return selectedService !== null
      case 'employee':
        return true // Employee is optional
      case 'datetime':
        return selectedDate && selectedTime
      case 'customer':
        return firstName && lastName && (email || phone)
      case 'confirm':
        return true
      default:
        return false
    }
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key)
      setError(null)
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Bitte fülle alle Pflichtfelder aus')
      return
    }

    // For non-gastro, service is required
    if (!isGastronomy && !selectedService) {
      setError('Bitte wähle eine Behandlung aus')
      return
    }

    setIsSubmitting(true)
    setError(null)

    if (isGastronomy) {
      // Gastro reservation
      const formData = new FormData()
      formData.set('tenant_slug', tenant.slug)
      formData.set('reservation_date', selectedDate)
      formData.set('reservation_time', selectedTime)
      formData.set('guest_count', guestCount.toString())
      formData.set('first_name', firstName)
      formData.set('last_name', lastName)
      formData.set('email', email)
      formData.set('phone', phone)
      formData.set('notes', notes)
      if (locationId) {
        formData.set('location_id', locationId)
      }

      const result = await createGastroReservation(formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      // Redirect to success page
      router.push(`/book/${tenant.slug}/success?token=${result.confirmationToken}&type=reservation`)
    } else {
      // Standard booking
      const formData = new FormData()
      formData.set('tenant_slug', tenant.slug)
      formData.set('service_id', selectedService!.id)
      if (selectedEmployee) {
        formData.set('employee_id', selectedEmployee.id)
      }
      if (locationId) {
        formData.set('location_id', locationId)
      }
      formData.set('appointment_date', selectedDate)
      formData.set('appointment_time', selectedTime)
      formData.set('first_name', firstName)
      formData.set('last_name', lastName)
      formData.set('email', email)
      formData.set('phone', phone)
      formData.set('customer_notes', notes)
      formData.set('marketing_consent', marketingConsent.toString())
      formData.set('sms_consent', smsConsent.toString())

      const result = await createPublicBooking(formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      // Redirect to success page
      router.push(`/book/${tenant.slug}/success?token=${result.confirmationToken}`)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: tenant.currency || 'EUR',
    }).format(price)
  }

  // Handle waitlist step
  if (currentStep === 'waitlist') {
    return (
      <WaitlistForm
        tenantSlug={tenant.slug}
        services={services}
        employees={employees}
        locationId={locationId}
        selectedService={selectedService}
        selectedEmployee={selectedEmployee}
        onBack={() => setCurrentStep('datetime')}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentStepIndex
                  ? 'bg-amber-500 text-black'
                  : index === currentStepIndex
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 text-white/50'
                }`}
            >
              {index < currentStepIndex ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  index < currentStepIndex ? 'bg-amber-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {currentStep === 'guests' && 'Wie viele Gäste?'}
            {currentStep === 'service' && 'Wähle eine Behandlung'}
            {currentStep === 'employee' && 'Wähle einen Mitarbeiter'}
            {currentStep === 'datetime' && (isGastronomy ? 'Wähle Datum & Uhrzeit' : 'Wähle Datum & Uhrzeit')}
            {currentStep === 'customer' && 'Deine Kontaktdaten'}
            {currentStep === 'confirm' && 'Bestätigung'}
          </h2>
          <p className="text-white/60 mt-1">
            {currentStep === 'guests' && 'Für wie viele Personen möchtest du reservieren?'}
            {currentStep === 'service' && 'Welche Behandlung möchtest du buchen?'}
            {currentStep === 'employee' && 'Optional: Wähle deinen Wunsch-Mitarbeiter'}
            {currentStep === 'datetime' && 'Wann passt es dir am besten?'}
            {currentStep === 'customer' && 'Wir benötigen deine Kontaktdaten für die Bestätigung'}
            {currentStep === 'confirm' && (isGastronomy ? 'Überprüfe deine Reservierung' : 'Überprüfe deine Buchung')}
          </p>
        </div>

        <div className="p-6">
          {/* Guest Count Selection (Gastro only) */}
          {currentStep === 'guests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  disabled={guestCount <= 1}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white text-2xl font-light hover:bg-white/20 hover:border-amber-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-5xl font-light text-amber-400">{guestCount}</div>
                  <div className="text-white/50 text-sm mt-1">
                    {guestCount === 1 ? 'Person' : 'Personen'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                  disabled={guestCount >= 20}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white text-2xl font-light hover:bg-white/20 hover:border-amber-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              {/* Quick select buttons */}
              <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-white/10">
                {[2, 4, 6, 8, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setGuestCount(count)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      guestCount === count
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {count} Personen
                  </button>
                ))}
              </div>

              {guestCount >= 8 && (
                <p className="text-center text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                  <UtensilsCrossed className="w-4 h-4 inline mr-2" />
                  Für größere Gruppen empfehlen wir eine telefonische Reservierung
                </p>
              )}
            </div>
          )}

          {/* Service Selection */}
          {currentStep === 'service' && (
            <div className="space-y-4">
              {/* Category Tabs */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    Alle
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* Service List */}
              <div className="grid gap-3">
              {filteredServices.length === 0 ? (
                <p className="text-white/50 text-center py-8">
                  Keine Services verfügbar
                </p>
              ) : (
                filteredServices.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedService?.id === service.id
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                        : 'border-white/10 hover:border-amber-500/50 bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-white/50 mt-1">
                            {service.description}
                          </p>
                        )}
                        <p className="text-sm text-white/50 mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {service.duration_minutes} Minuten
                        </p>
                      </div>
                      <span className="font-semibold text-amber-400">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </button>
                ))
              )}
              </div>
            </div>
          )}

          {/* Employee Selection */}
          {currentStep === 'employee' && (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedEmployee === null
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-white/10 hover:border-amber-500/50 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white/50" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Egal / Nächster Verfügbarer</h3>
                    <p className="text-sm text-white/50">
                      Wir wählen automatisch einen verfügbaren Mitarbeiter
                    </p>
                  </div>
                </div>
              </button>

              {employees.map(employee => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setSelectedEmployee(employee)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedEmployee?.id === employee.id
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-white/10 hover:border-amber-500/50 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      {employee.role && (
                        <p className="text-sm text-white/50 capitalize">
                          {employee.role}
                        </p>
                      )}
                      {employee.specialties?.length > 0 && (
                        <p className="text-xs text-white/40 mt-1">
                          {employee.specialties.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Date & Time Selection */}
          {currentStep === 'datetime' && (
            <div className="space-y-6">
              {/* Date Picker */}
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium text-white flex items-center">
                  <Calendar className="w-4 h-4 inline mr-2 text-amber-400" />
                  Datum
                </label>
                <input
                  id="date"
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center">
                    <Clock className="w-4 h-4 inline mr-2 text-amber-400" />
                    Uhrzeit
                  </label>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-white/50">
                        Keine verfügbaren Zeiten an diesem Tag
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('waitlist')}
                        className="mx-auto px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:text-amber-400 hover:border-amber-500/50 transition-colors flex items-center"
                      >
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Auf Warteliste setzen
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedTime === slot
                              ? 'border-amber-500 bg-amber-500 text-black'
                              : 'border-white/10 text-white/70 hover:border-amber-500/50 bg-white/5'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          {currentStep === 'customer' && (
            <div className="space-y-4">
              {isLoggedIn && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    <Check className="w-4 h-4 inline mr-2" />
                    Deine Daten wurden automatisch ausgefüllt
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-white">Vorname *</label>
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Max"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-white">Nachname *</label>
                  <input
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Mustermann"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  disabled={isLoggedIn}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
                />
                <p className="text-xs text-white/40">
                  Für die Terminbestätigung per Email
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-white">Telefon / WhatsApp</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+49 123 456789"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-xs text-white/40">
                  Für die Terminbestätigung per WhatsApp
                </p>
              </div>

              {!email && !phone && (
                <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                  Bitte gib mindestens eine Email-Adresse oder Telefonnummer an
                </p>
              )}

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium text-white">Anmerkungen (optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Besondere Wünsche oder Hinweise..."
                  className="flex min-h-[80px] w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="smsConsent"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  <label htmlFor="smsConsent" className="text-sm text-white/70">
                    Ich möchte Terminerinnerungen per SMS/WhatsApp erhalten
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="marketingConsent"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  <label htmlFor="marketingConsent" className="text-sm text-white/70">
                    Ich möchte über Angebote und Neuigkeiten informiert werden
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                {isGastronomy ? (
                  <>
                    {/* Gastro Reservation Confirmation */}
                    <div className="flex justify-between">
                      <span className="text-white/50">Anzahl Gäste</span>
                      <span className="font-medium text-white flex items-center">
                        <Users className="w-4 h-4 mr-2 text-amber-400" />
                        {guestCount} {guestCount === 1 ? 'Person' : 'Personen'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Datum</span>
                      <span className="text-white">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Uhrzeit</span>
                      <span className="text-white">{selectedTime} Uhr</span>
                    </div>
                  </>
                ) : selectedService && (
                  <>
                    {/* Standard Booking Confirmation */}
                    <div className="flex justify-between">
                      <span className="text-white/50">Behandlung</span>
                      <span className="font-medium text-white">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Dauer</span>
                      <span className="text-white">{selectedService.duration_minutes} Minuten</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Mitarbeiter</span>
                      <span className="text-white">
                        {selectedEmployee
                          ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                          : 'Nächster Verfügbarer'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Datum</span>
                      <span className="text-white">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Uhrzeit</span>
                      <span className="text-white">{selectedTime} Uhr</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-white/10">
                      <span className="font-medium text-white">Preis</span>
                      <span className="font-bold text-amber-400">
                        {formatPrice(selectedService.price)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2">
                <h4 className="font-medium text-white">Deine Daten</h4>
                <p className="text-white">{firstName} {lastName}</p>
                {email && <p className="text-sm text-white/50">{email}</p>}
                {phone && <p className="text-sm text-white/50">{phone}</p>}
                {notes && (
                  <p className="text-sm text-white/50 mt-2">
                    Anmerkungen: {notes}
                  </p>
                )}
              </div>

              <p className="text-sm text-white/50">
                Nach der {isGastronomy ? 'Reservierung' : 'Buchung'} erhältst du eine Bestätigung per{' '}
                {email && phone ? 'Email und WhatsApp' : email ? 'Email' : 'WhatsApp'}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStepIndex === 0}
          className="flex items-center px-5 py-3 border border-white/20 rounded-lg text-white/70 hover:text-amber-400 hover:border-amber-500/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </button>

        {currentStep === 'confirm' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isGastronomy ? 'Wird reserviert...' : 'Wird gebucht...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isGastronomy ? 'Jetzt reservieren' : 'Jetzt buchen'}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Weiter
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  )
}
