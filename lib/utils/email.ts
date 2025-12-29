import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender - update this to your verified domain in Resend
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Aesthetix <onboarding@resend.dev>'

export interface BookingConfirmationEmailParams {
  to: string
  customerName: string
  serviceName: string
  servicePrice: number
  date: string
  time: string
  duration: number
  employeeName?: string
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
  confirmationUrl: string
  currency?: string
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(params: BookingConfirmationEmailParams) {
  const {
    to,
    customerName,
    serviceName,
    servicePrice,
    date,
    time,
    duration,
    employeeName,
    clinicName,
    clinicAddress,
    clinicPhone,
    confirmationUrl,
    currency = 'EUR',
  } = params

  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(servicePrice)

  const subject = `Terminbestätigung - ${clinicName}`

  // HTML Email Template
  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${clinicName}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Terminbestätigung
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hallo ${customerName},
              </p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                vielen Dank für deine Buchung! Hier sind die Details deines Termins:
              </p>

              <!-- Appointment Details Card -->
              <table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Behandlung</span><br>
                          <strong style="color: #111827; font-size: 16px;">${serviceName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Datum</span><br>
                          <strong style="color: #111827; font-size: 16px;">${date}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Uhrzeit</span><br>
                          <strong style="color: #111827; font-size: 16px;">${time} Uhr (${duration} Minuten)</strong>
                        </td>
                      </tr>
                      ${employeeName ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Mitarbeiter</span><br>
                          <strong style="color: #111827; font-size: 16px;">${employeeName}</strong>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Preis</span><br>
                          <strong style="color: #8b5cf6; font-size: 20px;">${formattedPrice}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Termin bestätigen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Bitte bestätige deinen Termin durch Klick auf den Button oben.
              </p>

              <!-- Clinic Info -->
              ${clinicAddress || clinicPhone ? `
              <table role="presentation" style="width: 100%; border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">
                      ${clinicName}
                    </p>
                    ${clinicAddress ? `<p style="margin: 0 0 4px; color: #6b7280; font-size: 14px;">${clinicAddress}</p>` : ''}
                    ${clinicPhone ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Tel: ${clinicPhone}</p>` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Diese Email wurde automatisch von Aesthetix gesendet.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                Bei Fragen kontaktiere uns direkt.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Plain text version
  const text = `
Terminbestätigung - ${clinicName}

Hallo ${customerName},

vielen Dank für deine Buchung! Hier sind die Details deines Termins:

Behandlung: ${serviceName}
Datum: ${date}
Uhrzeit: ${time} Uhr (${duration} Minuten)
${employeeName ? `Mitarbeiter: ${employeeName}\n` : ''}Preis: ${formattedPrice}

Bitte bestätige deinen Termin unter:
${confirmationUrl}

${clinicName}
${clinicAddress || ''}
${clinicPhone ? `Tel: ${clinicPhone}` : ''}

---
Diese Email wurde automatisch von Aesthetix gesendet.
  `.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Error sending booking confirmation email:', error)
      return { success: false, error: error.message }
    }

    console.log('Booking confirmation email sent:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (err) {
    console.error('Failed to send booking confirmation email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send appointment reminder email
 */
export async function sendAppointmentReminderEmail(params: Omit<BookingConfirmationEmailParams, 'confirmationUrl'>) {
  const {
    to,
    customerName,
    serviceName,
    servicePrice,
    date,
    time,
    duration,
    employeeName,
    clinicName,
    clinicAddress,
    clinicPhone,
    currency = 'EUR',
  } = params

  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(servicePrice)

  const subject = `Terminerinnerung - ${clinicName}`

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Terminerinnerung</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                Hallo ${customerName},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                wir möchten dich an deinen bevorstehenden Termin erinnern:
              </p>
              <table style="width: 100%; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px;">Dein Termin</p>
                    <p style="margin: 0; color: #78350f; font-size: 24px; font-weight: bold;">${date}</p>
                    <p style="margin: 8px 0 0; color: #78350f; font-size: 20px;">${time} Uhr</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;"><strong>Behandlung:</strong> ${serviceName} (${duration} Min.)</p>
              ${employeeName ? `<p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;"><strong>Mitarbeiter:</strong> ${employeeName}</p>` : ''}
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;"><strong>Preis:</strong> ${formattedPrice}</p>
              <p style="margin: 0; color: #374151; font-size: 14px;">
                Wir freuen uns auf dich!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center;">
              <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">${clinicName}</p>
              ${clinicAddress ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">${clinicAddress}</p>` : ''}
              ${clinicPhone ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Tel: ${clinicPhone}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
Terminerinnerung - ${clinicName}

Hallo ${customerName},

wir möchten dich an deinen bevorstehenden Termin erinnern:

Datum: ${date}
Uhrzeit: ${time} Uhr
Behandlung: ${serviceName} (${duration} Min.)
${employeeName ? `Mitarbeiter: ${employeeName}\n` : ''}Preis: ${formattedPrice}

Wir freuen uns auf dich!

${clinicName}
${clinicAddress || ''}
${clinicPhone ? `Tel: ${clinicPhone}` : ''}
  `.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Error sending reminder email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (err) {
    console.error('Failed to send reminder email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
