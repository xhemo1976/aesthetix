'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Sparkles,
  Check,
  Loader2,
  ClockIcon,
} from 'lucide-react'
import { getAvailableSlots, createPublicBooking, type Employee } from '@/lib/actions/public-booking'
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
}

type Step = 'service' | 'employee' | 'datetime' | 'customer' | 'confirm' | 'waitlist'

export function BookingForm({ tenant, services, employees, locationId, customerData }: BookingFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('service')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!selectedDate || !selectedService) {
      setAvailableSlots([])
      return
    }

    setLoadingSlots(true)
    setSelectedTime('')

    getAvailableSlots({
      tenantId: tenant.id,
      serviceId: selectedService.id,
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
  }, [selectedDate, selectedService, selectedEmployee, tenant.id])

  const steps: { key: Step; label: string }[] = [
    { key: 'service', label: 'Service' },
    { key: 'employee', label: 'Mitarbeiter' },
    { key: 'datetime', label: 'Termin' },
    { key: 'customer', label: 'Daten' },
    { key: 'confirm', label: 'Bestätigen' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  const canProceed = () => {
    switch (currentStep) {
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
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Bitte fülle alle Pflichtfelder aus')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.set('tenant_slug', tenant.slug)
    formData.set('service_id', selectedService.id)
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
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
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
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'service' && 'Wähle eine Behandlung'}
            {currentStep === 'employee' && 'Wähle einen Mitarbeiter'}
            {currentStep === 'datetime' && 'Wähle Datum & Uhrzeit'}
            {currentStep === 'customer' && 'Deine Kontaktdaten'}
            {currentStep === 'confirm' && 'Bestätigung'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'service' && 'Welche Behandlung möchtest du buchen?'}
            {currentStep === 'employee' && 'Optional: Wähle deinen Wunsch-Mitarbeiter'}
            {currentStep === 'datetime' && 'Wann passt es dir am besten?'}
            {currentStep === 'customer' && 'Wir benötigen deine Kontaktdaten für die Bestätigung'}
            {currentStep === 'confirm' && 'Überprüfe deine Buchung'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Service Selection */}
          {currentStep === 'service' && (
            <div className="space-y-4">
              {/* Category Tabs */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                <p className="text-muted-foreground text-center py-8">
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
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {service.duration_minutes} Minuten
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
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
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Egal / Nächster Verfügbarer</h3>
                    <p className="text-sm text-muted-foreground">
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
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      {employee.role && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {employee.role}
                        </p>
                      )}
                      {employee.specialties?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
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
                <Label htmlFor="date">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Datum
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="space-y-2">
                  <Label>
                    <Clock className="w-4 h-4 inline mr-2" />
                    Uhrzeit
                  </Label>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-muted-foreground">
                        Keine verfügbaren Zeiten an diesem Tag
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('waitlist')}
                        className="mx-auto"
                      >
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Auf Warteliste setzen
                      </Button>
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
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
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
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <Check className="w-4 h-4 inline mr-2" />
                    Deine Daten wurden automatisch ausgefüllt
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Max"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Mustermann"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  disabled={isLoggedIn}
                />
                <p className="text-xs text-muted-foreground">
                  Für die Terminbestätigung per Email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+49 123 456789"
                />
                <p className="text-xs text-muted-foreground">
                  Für die Terminbestätigung per WhatsApp
                </p>
              </div>

              {!email && !phone && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Bitte gib mindestens eine Email-Adresse oder Telefonnummer an
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Anmerkungen (optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Besondere Wünsche oder Hinweise..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsConsent"
                    checked={smsConsent}
                    onCheckedChange={(checked) => setSmsConsent(checked === true)}
                  />
                  <Label htmlFor="smsConsent" className="text-sm">
                    Ich möchte Terminerinnerungen per SMS/WhatsApp erhalten
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingConsent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  />
                  <Label htmlFor="marketingConsent" className="text-sm">
                    Ich möchte über Angebote und Neuigkeiten informiert werden
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {currentStep === 'confirm' && selectedService && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Behandlung</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dauer</span>
                  <span>{selectedService.duration_minutes} Minuten</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mitarbeiter</span>
                  <span>
                    {selectedEmployee
                      ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                      : 'Nächster Verfügbarer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datum</span>
                  <span>{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uhrzeit</span>
                  <span>{selectedTime} Uhr</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-medium">Preis</span>
                  <span className="font-bold text-primary">
                    {formatPrice(selectedService.price)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Deine Daten</h4>
                <p>{firstName} {lastName}</p>
                {email && <p className="text-sm text-muted-foreground">{email}</p>}
                {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
                {notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Anmerkungen: {notes}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Nach der Buchung erhältst du eine Bestätigung per{' '}
                {email && phone ? 'Email und WhatsApp' : email ? 'Email' : 'WhatsApp'}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        {currentStep === 'confirm' ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird gebucht...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Jetzt buchen
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed()}>
            Weiter
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
