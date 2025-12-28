/**
 * WhatsApp Integration Utilities
 *
 * Generates WhatsApp links with pre-filled messages for customer communication
 */

export type WhatsAppMessageType =
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'customer_contact'
  | 'custom'

/**
 * Format phone number for WhatsApp (remove spaces, dashes, parentheses)
 * Expected format: +491234567890
 */
export function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '')
}

/**
 * Generate WhatsApp link with pre-filled message
 * Works on both mobile and desktop
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone)
  const encodedMessage = encodeURIComponent(message)

  // Universal WhatsApp link that works on both mobile and desktop
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Generate appointment reminder message
 */
export function getAppointmentReminderMessage(params: {
  customerName: string
  date: string
  time: string
  serviceName: string
  clinicName: string
}): string {
  return `Hallo ${params.customerName}! 👋

Dies ist eine Erinnerung an Ihren Termin bei ${params.clinicName}:

📅 Datum: ${params.date}
🕐 Uhrzeit: ${params.time}
💆 Behandlung: ${params.serviceName}

Wir freuen uns auf Sie!

Bei Fragen oder Terminänderungen melden Sie sich gerne.`
}

/**
 * Generate appointment confirmation message
 */
export function getAppointmentConfirmationMessage(params: {
  customerName: string
  date: string
  time: string
  serviceName: string
  clinicName: string
  confirmationUrl?: string
}): string {
  const baseMessage = `Hallo ${params.customerName}! 👋

Termin-Bestätigung bei ${params.clinicName}:

📅 Datum: ${params.date}
🕐 Uhrzeit: ${params.time}
💆 Behandlung: ${params.serviceName}`

  if (params.confirmationUrl) {
    return `${baseMessage}

🔗 Bitte bestätigen Sie Ihren Termin:
${params.confirmationUrl}

Wir freuen uns auf Sie!`
  }

  return `${baseMessage}

Bis bald!`
}

/**
 * Generate custom contact message
 */
export function getCustomerContactMessage(params: {
  customerName: string
  clinicName: string
}): string {
  return `Hallo ${params.customerName}! 👋

Hier ist ${params.clinicName}. `
}

/**
 * Generate WhatsApp link for appointment reminder
 */
export function getAppointmentReminderLink(
  whatsappNumber: string,
  customerName: string,
  date: string,
  time: string,
  serviceName: string,
  clinicName: string
): string {
  const message = getAppointmentReminderMessage({
    customerName,
    date,
    time,
    serviceName,
    clinicName
  })

  return generateWhatsAppLink(whatsappNumber, message)
}

/**
 * Generate WhatsApp link for appointment confirmation
 */
export function getAppointmentConfirmationLink(
  whatsappNumber: string,
  customerName: string,
  date: string,
  time: string,
  serviceName: string,
  clinicName: string,
  confirmationUrl?: string
): string {
  const message = getAppointmentConfirmationMessage({
    customerName,
    date,
    time,
    serviceName,
    clinicName,
    confirmationUrl
  })

  return generateWhatsAppLink(whatsappNumber, message)
}

/**
 * Generate WhatsApp link for customer contact
 */
export function getCustomerContactLink(
  whatsappNumber: string,
  customerName: string,
  clinicName: string
): string {
  const message = getCustomerContactMessage({
    customerName,
    clinicName
  })

  return generateWhatsAppLink(whatsappNumber, message)
}
