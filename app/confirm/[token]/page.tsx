import { redirect } from 'next/navigation'
import { getAppointmentByToken } from '@/lib/actions/confirmation'
import { ConfirmationForm } from './confirmation-form'

export default async function ConfirmationPage({ params }: { params: { token: string } }) {
  const { appointment, error } = await getAppointmentByToken(params.token)

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Termin nicht gefunden</h1>
          <p className="text-muted-foreground">
            Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.
          </p>
        </div>
      </div>
    )
  }

  // If already confirmed or declined
  if (appointment.customer_response) {
    const isConfirmed = appointment.customer_response === 'confirmed'

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">{isConfirmed ? '✅' : '❌'}</div>
          <h1 className="text-2xl font-bold mb-4">
            {isConfirmed ? 'Termin bestätigt' : 'Termin abgesagt'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isConfirmed
              ? 'Vielen Dank! Wir haben Ihre Bestätigung erhalten und freuen uns auf Ihren Besuch.'
              : 'Ihr Termin wurde abgesagt. Bei Fragen können Sie uns gerne kontaktieren.'}
          </p>
          <div className="p-4 bg-muted/50 rounded-lg text-left">
            <p className="text-sm font-semibold mb-2">{appointment.tenants.name}</p>
            {appointment.tenants.contact_phone && (
              <p className="text-sm text-muted-foreground">
                📞 {appointment.tenants.contact_phone}
              </p>
            )}
            {appointment.tenants.whatsapp_number && (
              <p className="text-sm text-muted-foreground">
                💬 {appointment.tenants.whatsapp_number}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Termin-Bestätigung</h1>
          <p className="text-muted-foreground">{appointment.tenants.name}</p>
        </div>

        <ConfirmationForm appointment={appointment} token={params.token} />
      </div>
    </div>
  )
}
