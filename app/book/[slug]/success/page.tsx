import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicAppointmentByToken } from '@/lib/actions/public-booking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { generateWhatsAppLink, getAppointmentConfirmationMessage } from '@/lib/utils/whatsapp'

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const { appointment, error } = await getPublicAppointmentByToken(token)

  if (error || !appointment) {
    notFound()
  }

  const startDate = new Date(appointment.start_time)
  const formattedDate = startDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = startDate.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/confirm/${token}`

  // Generate WhatsApp link for customer to send confirmation
  const whatsAppMessage = getAppointmentConfirmationMessage({
    customerName: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
    date: formattedDate,
    time: formattedTime,
    serviceName: appointment.service.name,
    clinicName: appointment.tenant.name,
    confirmationUrl,
  })

  const clinicWhatsAppLink = appointment.tenant.whatsapp_number
    ? generateWhatsAppLink(appointment.tenant.whatsapp_number, whatsAppMessage)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600">Buchung erfolgreich!</h1>
          <p className="text-muted-foreground mt-2">
            Dein Termin wurde erfolgreich angelegt
          </p>
        </div>

        {/* Appointment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {appointment.tenant.name}
            </CardTitle>
            <CardDescription>Termindetails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{appointment.service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service.duration_minutes} Minuten
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">Datum</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{formattedTime} Uhr</p>
                  <p className="text-sm text-muted-foreground">Uhrzeit</p>
                </div>
              </div>

              {appointment.employee && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {appointment.employee.first_name} {appointment.employee.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">Mitarbeiter</p>
                  </div>
                </div>
              )}

              {(appointment.tenant.address || appointment.tenant.city) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {[appointment.tenant.address, appointment.tenant.city]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                  </div>
                </div>
              )}
            </div>

            {appointment.customer_notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Deine Anmerkungen:</p>
                <p className="text-sm mt-1">{appointment.customer_notes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Preis</span>
                <span className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(appointment.service.price)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Notice */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 text-lg">
              Bitte bestätige deinen Termin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-amber-700 text-sm">
              Um deinen Termin verbindlich zu buchen, klicke bitte auf den Bestätigungslink:
            </p>

            <div className="space-y-3">
              {/* Email confirmation */}
              {appointment.customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span>Bestätigung an {appointment.customer.email} gesendet</span>
                </div>
              )}

              {/* WhatsApp confirmation */}
              {clinicWhatsAppLink && appointment.customer.phone && (
                <a
                  href={clinicWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Per WhatsApp bestätigen</span>
                </a>
              )}

              {/* Direct confirmation link */}
              <Link href={`/confirm/${token}`}>
                <Button className="w-full mt-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Termin jetzt bestätigen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontakt</CardTitle>
            <CardDescription>Bei Fragen oder Änderungswünschen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointment.tenant.contact_phone && (
              <a
                href={`tel:${appointment.tenant.contact_phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Phone className="w-5 h-5 text-primary" />
                <span>{appointment.tenant.contact_phone}</span>
              </a>
            )}

            {clinicWhatsAppLink && (
              <a
                href={clinicWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span>WhatsApp Nachricht senden</span>
              </a>
            )}
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href={`/book/${slug}`}
            className="text-primary hover:underline text-sm"
          >
            Weiteren Termin buchen
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by Esylana</p>
        </footer>
      </div>
    </div>
  )
}
