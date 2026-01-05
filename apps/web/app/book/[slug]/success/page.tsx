import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicAppointmentByToken } from '@/lib/actions/public-booking'
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-green-400">Buchung erfolgreich!</h1>
          <p className="text-white/60 mt-2">
            Dein Termin wurde erfolgreich angelegt
          </p>
        </div>

        {/* Appointment Details */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {appointment.tenant.name}
            </h2>
            <p className="text-white/50 mt-1">Termindetails</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{appointment.service.name}</p>
                  <p className="text-sm text-white/50">
                    {appointment.service.duration_minutes} Minuten
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{formattedDate}</p>
                  <p className="text-sm text-white/50">Datum</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{formattedTime} Uhr</p>
                  <p className="text-sm text-white/50">Uhrzeit</p>
                </div>
              </div>

              {appointment.employee && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {appointment.employee.first_name} {appointment.employee.last_name}
                    </p>
                    <p className="text-sm text-white/50">Mitarbeiter</p>
                  </div>
                </div>
              )}

              {(appointment.tenant.address || appointment.tenant.city) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {[appointment.tenant.address, appointment.tenant.city]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    <p className="text-sm text-white/50">Adresse</p>
                  </div>
                </div>
              )}
            </div>

            {appointment.customer_notes && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/50">Deine Anmerkungen:</p>
                <p className="text-sm text-white mt-1">{appointment.customer_notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">Preis</span>
                <span className="text-xl font-bold text-amber-400">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(appointment.service.price)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Notice */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-amber-500/20">
            <h2 className="text-amber-400 text-lg font-semibold">
              Bitte bestätige deinen Termin
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-amber-300/80 text-sm">
              Um deinen Termin verbindlich zu buchen, klicke bitte auf den Bestätigungslink:
            </p>

            <div className="space-y-3">
              {/* Email confirmation */}
              {appointment.customer.email && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Bestätigung an {appointment.customer.email} gesendet</span>
                </div>
              )}

              {/* WhatsApp confirmation */}
              {clinicWhatsAppLink && appointment.customer.phone && (
                <a
                  href={clinicWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Per WhatsApp bestätigen</span>
                </a>
              )}

              {/* Direct confirmation link */}
              <Link href={`/confirm/${token}`}>
                <button className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  Termin jetzt bestätigen
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Kontakt</h2>
            <p className="text-white/50 mt-1">Bei Fragen oder Änderungswünschen</p>
          </div>
          <div className="p-6 space-y-3">
            {appointment.tenant.contact_phone && (
              <a
                href={`tel:${appointment.tenant.contact_phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Phone className="w-5 h-5 text-amber-400" />
                <span className="text-white">{appointment.tenant.contact_phone}</span>
              </a>
            )}

            {clinicWhatsAppLink && (
              <a
                href={clinicWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">WhatsApp Nachricht senden</span>
              </a>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href={`/book/${slug}`}
            className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
          >
            Weiteren Termin buchen
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-white/40">
          <p>Powered by Esylana</p>
        </footer>
      </div>
    </div>
  )
}
