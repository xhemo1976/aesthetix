'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Plus,
  Clock,
  Calendar,
  User,
  MessageCircle,
  Trash2,
  CheckCircle,
  XCircle,
  Bell,
  AlertCircle,
} from 'lucide-react'
import {
  addToWaitlist,
  updateWaitlistStatus,
  deleteWaitlistEntry,
  getWaitlistNotificationLink,
} from '@/lib/actions/waitlist'

type WaitlistEntry = {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  preferred_date_from: string
  preferred_date_to: string
  preferred_time_from: string | null
  preferred_time_to: string | null
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'canceled'
  priority: number
  notified_at: string | null
  notification_count: number
  notes: string | null
  created_at: string
  service_id: string
  employee_id: string | null
  services?: { name: string; duration_minutes: number } | { name: string; duration_minutes: number }[] | null
  employees?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
}

type Service = {
  id: string
  name: string
  duration_minutes: number
}

type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

type Employee = {
  id: string
  first_name: string
  last_name: string
}

type WaitlistManagerProps = {
  initialEntries: WaitlistEntry[]
  services: Service[]
  customers: Customer[]
  employees: Employee[]
  tenantSlug: string
  clinicName: string
}

export function WaitlistManager({
  initialEntries,
  services,
  customers,
  employees,
  tenantSlug,
  clinicName,
}: WaitlistManagerProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [notifyDate, setNotifyDate] = useState('')
  const [notifyTime, setNotifyTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('0')

  const waitingEntries = entries.filter(e => e.status === 'waiting')
  const notifiedEntries = entries.filter(e => e.status === 'notified')
  const completedEntries = entries.filter(e => ['booked', 'expired', 'canceled'].includes(e.status))

  function resetForm() {
    setSelectedCustomerId('')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setSelectedServiceId('')
    setSelectedEmployeeId('')
    setDateFrom('')
    setDateTo('')
    setTimeFrom('')
    setTimeTo('')
    setNotes('')
    setPriority('0')
  }

  function handleCustomerSelect(customerId: string) {
    setSelectedCustomerId(customerId)
    if (customerId) {
      const customer = customers.find(c => c.id === customerId)
      if (customer) {
        setCustomerName(`${customer.first_name} ${customer.last_name}`)
        setCustomerEmail(customer.email || '')
        setCustomerPhone(customer.phone || '')
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.set('service_id', selectedServiceId)
    formData.set('employee_id', selectedEmployeeId || '')
    formData.set('customer_id', selectedCustomerId || '')
    formData.set('customer_name', customerName)
    formData.set('customer_email', customerEmail)
    formData.set('customer_phone', customerPhone)
    formData.set('preferred_date_from', dateFrom)
    formData.set('preferred_date_to', dateTo)
    formData.set('preferred_time_from', timeFrom)
    formData.set('preferred_time_to', timeTo)
    formData.set('notes', notes)
    formData.set('priority', priority)

    const result = await addToWaitlist(formData)

    if (!result.error) {
      setDialogOpen(false)
      resetForm()
      // Refresh entries
      window.location.reload()
    } else {
      alert(result.error)
    }

    setIsLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) return

    const result = await deleteWaitlistEntry(id)
    if (!result.error) {
      setEntries(entries.filter(e => e.id !== id))
    }
  }

  async function handleMarkBooked(id: string) {
    const result = await updateWaitlistStatus(id, 'booked')
    if (!result.error) {
      setEntries(entries.map(e => e.id === id ? { ...e, status: 'booked' as const } : e))
    }
  }

  async function handleCancel(id: string) {
    const result = await updateWaitlistStatus(id, 'canceled')
    if (!result.error) {
      setEntries(entries.map(e => e.id === id ? { ...e, status: 'canceled' as const } : e))
    }
  }

  async function handleNotify(entry: WaitlistEntry) {
    setSelectedEntry(entry)
    setNotifyDate('')
    setNotifyTime('')
    setNotifyDialogOpen(true)
  }

  async function sendNotification() {
    if (!selectedEntry || !notifyDate || !notifyTime) return

    setIsLoading(true)

    const formattedDate = new Date(notifyDate).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    const bookingUrl = `${window.location.origin}/book/${tenantSlug}`

    const result = await getWaitlistNotificationLink(
      selectedEntry.id,
      { date: formattedDate, time: notifyTime },
      clinicName,
      bookingUrl
    )

    if (result.link) {
      window.open(result.link, '_blank')
      setEntries(entries.map(e =>
        e.id === selectedEntry.id
          ? { ...e, status: 'notified' as const, notified_at: new Date().toISOString() }
          : e
      ))
      setNotifyDialogOpen(false)
    } else {
      alert(result.error || 'Fehler beim Erstellen des Links')
    }

    setIsLoading(false)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE')
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

  function getStatusBadge(status: string) {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Wartend</Badge>
      case 'notified':
        return <Badge className="bg-blue-100 text-blue-800"><Bell className="w-3 h-3 mr-1" />Benachrichtigt</Badge>
      case 'booked':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Gebucht</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />Abgelaufen</Badge>
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Storniert</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function renderEntry(entry: WaitlistEntry) {
    const service = Array.isArray(entry.services) ? entry.services[0] : entry.services
    const employee = Array.isArray(entry.employees) ? entry.employees[0] : entry.employees

    return (
      <div
        key={entry.id}
        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium">{entry.customer_name}</span>
              {getStatusBadge(entry.status)}
              {entry.priority > 0 && (
                <Badge variant="outline" className="text-xs">
                  Priorität: {entry.priority}
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Zeitraum: {formatDate(entry.preferred_date_from)} - {formatDate(entry.preferred_date_to)}
              </p>
              {(entry.preferred_time_from || entry.preferred_time_to) && (
                <p className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Zeit: {entry.preferred_time_from || '00:00'} - {entry.preferred_time_to || '23:59'}
                </p>
              )}
              <p>
                Service: <span className="font-medium">{service?.name || 'Unbekannt'}</span>
              </p>
              {employee && (
                <p className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Bevorzugt: {employee.first_name} {employee.last_name}
                </p>
              )}
              {entry.customer_email && <p>E-Mail: {entry.customer_email}</p>}
              {entry.customer_phone && <p>Tel: {entry.customer_phone}</p>}
              {entry.notes && (
                <p className="mt-2 italic">&quot;{entry.notes}&quot;</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Eingetragen am {formatDateTime(entry.created_at)}
              {entry.notified_at && (
                <span> | Benachrichtigt am {formatDateTime(entry.notified_at)}</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {entry.status === 'waiting' && entry.customer_phone && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleNotify(entry)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Benachrichtigen
              </Button>
            )}
            {entry.status === 'notified' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleMarkBooked(entry.id)}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Als gebucht markieren
              </Button>
            )}
            {['waiting', 'notified'].includes(entry.status) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancel(entry.id)}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Abbrechen
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(entry.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingEntries.length}</p>
                <p className="text-sm text-muted-foreground">Wartend</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifiedEntries.length}</p>
                <p className="text-sm text-muted-foreground">Benachrichtigt</p>
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
                <p className="text-2xl font-bold">
                  {completedEntries.filter(e => e.status === 'booked').length}
                </p>
                <p className="text-sm text-muted-foreground">Gebucht</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Zur Warteliste hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Zur Warteliste hinzufügen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Selection */}
              <div>
                <Label>Bestehender Kunde (optional)</Label>
                <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Neuer Kunde</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Telefon</Label>
                  <Input
                    id="customer_phone"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customer_email">E-Mail</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
              </div>

              {/* Service */}
              <div>
                <Label>Service *</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Service auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration_minutes} Min.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}
              <div>
                <Label>Bevorzugter Mitarbeiter (optional)</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
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

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_from">Datum von *</Label>
                  <Input
                    id="date_from"
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_to">Datum bis *</Label>
                  <Input
                    id="date_to"
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_from">Zeit von (optional)</Label>
                  <Input
                    id="time_from"
                    type="time"
                    value={timeFrom}
                    onChange={e => setTimeFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time_to">Zeit bis (optional)</Label>
                  <Input
                    id="time_to"
                    type="time"
                    value={timeTo}
                    onChange={e => setTimeTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority">Priorität</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Normal</SelectItem>
                    <SelectItem value="1">Hoch</SelectItem>
                    <SelectItem value="2">Sehr hoch (VIP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="z.B. Flexibel bei der Zeit, bevorzugt vormittags..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Speichert...' : 'Hinzufügen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notify Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde benachrichtigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wähle den verfügbaren Termin aus, über den du {selectedEntry?.customer_name} benachrichtigen möchtest:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="notify_date">Datum</Label>
                <Input
                  id="notify_date"
                  type="date"
                  value={notifyDate}
                  onChange={e => setNotifyDate(e.target.value)}
                  min={selectedEntry?.preferred_date_from}
                  max={selectedEntry?.preferred_date_to}
                />
              </div>
              <div>
                <Label htmlFor="notify_time">Uhrzeit</Label>
                <Input
                  id="notify_time"
                  type="time"
                  value={notifyTime}
                  onChange={e => setNotifyTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={sendNotification} disabled={isLoading || !notifyDate || !notifyTime}>
                <MessageCircle className="w-4 h-4 mr-2" />
                {isLoading ? 'Öffnet WhatsApp...' : 'Per WhatsApp benachrichtigen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="waiting" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="waiting">
            Wartend ({waitingEntries.length})
          </TabsTrigger>
          <TabsTrigger value="notified">
            Benachrichtigt ({notifiedEntries.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Abgeschlossen ({completedEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Wartende Kunden</CardTitle>
            </CardHeader>
            <CardContent>
              {waitingEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keine Kunden auf der Warteliste
                </p>
              ) : (
                <div className="space-y-4">
                  {waitingEntries.map(renderEntry)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notified" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigte Kunden</CardTitle>
            </CardHeader>
            <CardContent>
              {notifiedEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keine benachrichtigten Kunden
                </p>
              ) : (
                <div className="space-y-4">
                  {notifiedEntries.map(renderEntry)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Abgeschlossene Einträge</CardTitle>
            </CardHeader>
            <CardContent>
              {completedEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keine abgeschlossenen Einträge
                </p>
              ) : (
                <div className="space-y-4">
                  {completedEntries.map(renderEntry)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
