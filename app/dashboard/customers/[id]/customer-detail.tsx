'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Phone,
  Calendar,
  Euro,
  Clock,
  User,
  FileText,
  Heart,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
} from 'lucide-react'
import { updateCustomerNotes, updateAppointmentNotes } from '@/lib/actions/customers'
import { getCustomerContactLink } from '@/lib/utils/whatsapp'

type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  notes: string | null
  medical_notes: string | null
  marketing_consent: boolean
  sms_consent: boolean
  created_at: string
  last_visit_at: string | null
}

type ServiceData = {
  id: string
  name: string
  duration_minutes: number
}

type EmployeeData = {
  id: string
  first_name: string
  last_name: string
}

type Appointment = {
  id: string
  start_time: string
  end_time: string
  status: string
  price: number
  customer_notes: string | null
  staff_notes: string | null
  services: ServiceData | ServiceData[] | null
  employees: EmployeeData | EmployeeData[] | null
}

type Stats = {
  totalAppointments: number
  completedAppointments: number
  canceledAppointments: number
  noShowAppointments: number
  totalSpent: number
} | null

type CustomerDetailProps = {
  customer: Customer
  appointments: Appointment[]
  stats: Stats
  clinicWhatsApp: string | null
  clinicName: string
}

export function CustomerDetail({
  customer,
  appointments,
  stats,
  clinicWhatsApp,
  clinicName,
}: CustomerDetailProps) {
  const [notes, setNotes] = useState(customer.notes || '')
  const [medicalNotes, setMedicalNotes] = useState(customer.medical_notes || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [appointmentNotes, setAppointmentNotes] = useState<Record<string, string>>({})

  async function handleSaveNotes() {
    setIsSavingNotes(true)
    const result = await updateCustomerNotes(customer.id, notes || null, medicalNotes || null)
    setIsSavingNotes(false)
    if (!result.error) {
      setIsEditingNotes(false)
    }
  }

  async function handleSaveAppointmentNotes(appointmentId: string) {
    const noteText = appointmentNotes[appointmentId] || ''
    await updateAppointmentNotes(appointmentId, noteText || null)
    setEditingAppointmentId(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</Badge>
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Bestätigt</Badge>
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Geplant</Badge>
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Storniert</Badge>
      case 'no_show':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />Nicht erschienen</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with customer name and contact */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {customer.first_name} {customer.last_name}
          </h1>
          <p className="text-muted-foreground">
            Kunde seit {formatDate(customer.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {customer.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${customer.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                E-Mail
              </a>
            </Button>
          )}
          {customer.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${customer.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Anrufen
              </a>
            </Button>
          )}
          {clinicWhatsApp && customer.phone && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={getCustomerContactLink(
                  customer.phone,
                  `${customer.first_name} ${customer.last_name}`,
                  clinicName
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
                <p className="text-sm text-muted-foreground">Termine gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completedAppointments || 0}</p>
                <p className="text-sm text-muted-foreground">Abgeschlossen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Euro className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalSpent || 0)}</p>
                <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.canceledAppointments || 0) + (stats?.noShowAppointments || 0)}</p>
                <p className="text-sm text-muted-foreground">Absagen/No-Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Behandlungshistorie</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
          <TabsTrigger value="info">Kontaktdaten</TabsTrigger>
        </TabsList>

        {/* Treatment History */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Behandlungshistorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Noch keine Termine vorhanden
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => {
                    const service = Array.isArray(appointment.services)
                      ? appointment.services[0]
                      : appointment.services
                    const employee = Array.isArray(appointment.employees)
                      ? appointment.employees[0]
                      : appointment.employees

                    return (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium">
                                {service?.name || 'Unbekannter Service'}
                              </span>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {formatDateTime(appointment.start_time)}
                              </p>
                              {employee && (
                                <p className="flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  {employee.first_name} {employee.last_name}
                                </p>
                              )}
                              <p className="flex items-center gap-2">
                                <Euro className="w-3 h-3" />
                                {formatCurrency(appointment.price)}
                              </p>
                            </div>
                          </div>

                          {/* Notes section for appointment */}
                          <div className="flex-1 md:border-l md:pl-4">
                            {editingAppointmentId === appointment.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Behandlungsnotizen..."
                                  value={appointmentNotes[appointment.id] ?? appointment.staff_notes ?? ''}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setAppointmentNotes({
                                      ...appointmentNotes,
                                      [appointment.id]: e.target.value,
                                    })
                                  }
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveAppointmentNotes(appointment.id)}
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    Speichern
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingAppointmentId(null)}
                                  >
                                    Abbrechen
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {appointment.staff_notes ? (
                                  <div className="text-sm">
                                    <p className="font-medium mb-1 flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      Behandlungsnotizen:
                                    </p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                      {appointment.staff_notes}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    Keine Behandlungsnotizen
                                  </p>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2"
                                  onClick={() => {
                                    setAppointmentNotes({
                                      ...appointmentNotes,
                                      [appointment.id]: appointment.staff_notes || '',
                                    })
                                    setEditingAppointmentId(appointment.id)
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  {appointment.staff_notes ? 'Bearbeiten' : 'Notiz hinzufügen'}
                                </Button>
                              </div>
                            )}

                            {/* Customer notes if any */}
                            {appointment.customer_notes && (
                              <div className="mt-3 pt-3 border-t text-sm">
                                <p className="font-medium mb-1">Kundenanmerkung:</p>
                                <p className="text-muted-foreground">
                                  {appointment.customer_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* General Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Allgemeine Notizen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <Textarea
                    placeholder="Allgemeine Notizen zum Kunden..."
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    rows={6}
                  />
                ) : (
                  <div className="min-h-[150px]">
                    {notes ? (
                      <p className="whitespace-pre-wrap">{notes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">Keine Notizen vorhanden</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Medizinische Notizen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <Textarea
                    placeholder="Allergien, Unverträglichkeiten, besondere Hinweise..."
                    value={medicalNotes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMedicalNotes(e.target.value)}
                    rows={6}
                  />
                ) : (
                  <div className="min-h-[150px]">
                    {medicalNotes ? (
                      <p className="whitespace-pre-wrap">{medicalNotes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">Keine medizinischen Notizen</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit/Save Buttons */}
          <div className="flex justify-end mt-4">
            {isEditingNotes ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNotes(customer.notes || '')
                    setMedicalNotes(customer.medical_notes || '')
                    setIsEditingNotes(false)
                  }}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingNotes ? 'Speichert...' : 'Speichern'}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditingNotes(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Notizen bearbeiten
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Kontaktdaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                    <p className="font-medium">{customer.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{customer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Geburtsdatum</p>
                    <p className="font-medium">
                      {customer.date_of_birth ? formatDate(customer.date_of_birth) : '-'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">
                      {customer.address || '-'}
                      {customer.address && (customer.postal_code || customer.city) && <br />}
                      {customer.postal_code} {customer.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marketing-Einwilligung</p>
                    <p className="font-medium">
                      {customer.marketing_consent ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Ja
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Nein
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SMS/WhatsApp-Einwilligung</p>
                    <p className="font-medium">
                      {customer.sms_consent ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Ja
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Nein
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
