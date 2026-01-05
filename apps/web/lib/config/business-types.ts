/**
 * Business Type Configuration
 * Defines labels, icons, and texts for each business type
 */

export type BusinessType = 'beauty_clinic' | 'hairdresser' | 'gastronomy' | 'late_shop'

export interface BusinessTypeConfig {
  // Basic Info
  id: BusinessType
  name: string
  description: string

  // Navigation & Dashboard Labels
  labels: {
    services: string
    servicesDescription: string
    serviceSingular: string
    customers: string
    customerSingular: string
    appointments: string
    appointmentSingular: string
    employees: string
    employeeSingular: string
    booking: string
    bookingAction: string
    team: string
    packages: string
    waitlist: string
  }

  // Form Labels
  forms: {
    serviceName: string
    serviceNamePlaceholder: string
    serviceDescription: string
    servicePrice: string
    serviceDuration: string
    serviceCategory: string
    customerFirstName: string
    customerLastName: string
    customerPhone: string
    customerEmail: string
    employeeRole: string
    employeeRoles: { value: string; label: string }[]
  }

  // Categories (predefined)
  defaultCategories: string[]

  // Chat/AI
  chat: {
    welcomeMessage: string
    quickReplies: string[]
    systemPromptAddition: string
  }

  // Landing Page
  landing: {
    heroTitle: string
    heroSubtitle: string
    ctaButton: string
    servicesTitle: string
    teamTitle: string
    bookingTitle: string
  }

  // Colors (optional theme override)
  theme?: {
    primary: string
    accent: string
  }
}

export const businessTypeConfigs: Record<BusinessType, BusinessTypeConfig> = {
  beauty_clinic: {
    id: 'beauty_clinic',
    name: 'Schönheitsklinik',
    description: 'Ästhetik & Beauty Treatments',

    labels: {
      services: 'Behandlungen',
      servicesDescription: 'Verwalte deine Behandlungen und Preise',
      serviceSingular: 'Behandlung',
      customers: 'Kunden',
      customerSingular: 'Kunde',
      appointments: 'Termine',
      appointmentSingular: 'Termin',
      employees: 'Team',
      employeeSingular: 'Mitarbeiter',
      booking: 'Termin buchen',
      bookingAction: 'Jetzt Termin buchen',
      team: 'Unser Team',
      packages: 'Pakete',
      waitlist: 'Warteliste',
    },

    forms: {
      serviceName: 'Behandlungsname',
      serviceNamePlaceholder: 'z.B. Botox Stirn',
      serviceDescription: 'Beschreibung der Behandlung',
      servicePrice: 'Preis (€)',
      serviceDuration: 'Dauer (Minuten)',
      serviceCategory: 'Kategorie',
      customerFirstName: 'Vorname',
      customerLastName: 'Nachname',
      customerPhone: 'Telefon',
      customerEmail: 'E-Mail',
      employeeRole: 'Position',
      employeeRoles: [
        { value: 'doctor', label: 'Arzt/Ärztin' },
        { value: 'nurse', label: 'Krankenschwester' },
        { value: 'aesthetician', label: 'Kosmetiker/in' },
        { value: 'receptionist', label: 'Rezeption' },
        { value: 'manager', label: 'Manager' },
      ],
    },

    defaultCategories: ['Ästhetik', 'Laser', 'Kosmetik', 'Wellness'],

    chat: {
      welcomeMessage: 'Willkommen! ✨ Ich bin Ihr persönlicher Beauty-Berater. Wie kann ich Ihnen heute helfen?',
      quickReplies: [
        'Welche Behandlungen bietet ihr an?',
        'Was kostet Botox?',
        'Ich möchte einen Termin buchen',
        'Wer sind eure Spezialisten?',
      ],
      systemPromptAddition: `You are a professional beauty consultant for an aesthetic clinic.
Focus on: treatments, skincare, anti-aging, beauty procedures.
Recommend: Botox, fillers, laser treatments, facials based on customer needs.`,
    },

    landing: {
      heroTitle: 'Schönheit neu definiert',
      heroSubtitle: 'Erleben Sie erstklassige ästhetische Behandlungen',
      ctaButton: 'Termin vereinbaren',
      servicesTitle: 'Unsere Behandlungen',
      teamTitle: 'Unser Experten-Team',
      bookingTitle: 'Online Termin buchen',
    },
  },

  hairdresser: {
    id: 'hairdresser',
    name: 'Friseursalon',
    description: 'Haare & Styling',

    labels: {
      services: 'Leistungen',
      servicesDescription: 'Verwalte deine Leistungen und Preise',
      serviceSingular: 'Leistung',
      customers: 'Kunden',
      customerSingular: 'Kunde',
      appointments: 'Termine',
      appointmentSingular: 'Termin',
      employees: 'Stylisten',
      employeeSingular: 'Stylist',
      booking: 'Termin buchen',
      bookingAction: 'Jetzt Termin buchen',
      team: 'Unsere Stylisten',
      packages: 'Pakete',
      waitlist: 'Warteliste',
    },

    forms: {
      serviceName: 'Leistungsname',
      serviceNamePlaceholder: 'z.B. Herrenschnitt',
      serviceDescription: 'Beschreibung der Leistung',
      servicePrice: 'Preis (€)',
      serviceDuration: 'Dauer (Minuten)',
      serviceCategory: 'Kategorie',
      customerFirstName: 'Vorname',
      customerLastName: 'Nachname',
      customerPhone: 'Telefon',
      customerEmail: 'E-Mail',
      employeeRole: 'Position',
      employeeRoles: [
        { value: 'stylist', label: 'Stylist/in' },
        { value: 'colorist', label: 'Colorist/in' },
        { value: 'barber', label: 'Barber' },
        { value: 'apprentice', label: 'Azubi' },
        { value: 'receptionist', label: 'Rezeption' },
        { value: 'manager', label: 'Manager' },
      ],
    },

    defaultCategories: ['Damen', 'Herren', 'Kinder', 'Färben', 'Styling'],

    chat: {
      welcomeMessage: 'Willkommen! ✂️ Wie kann ich Ihnen heute helfen?',
      quickReplies: [
        'Was kostet ein Haarschnitt?',
        'Ich möchte einen Termin buchen',
        'Macht ihr auch Färbungen?',
        'Wer sind eure Stylisten?',
      ],
      systemPromptAddition: `You are a friendly receptionist for a hair salon.
Focus on: haircuts, coloring, styling, hair care.
Recommend: services based on hair type and customer wishes.`,
    },

    landing: {
      heroTitle: 'Dein Style, Dein Statement',
      heroSubtitle: 'Professionelle Haarpflege & Styling',
      ctaButton: 'Termin vereinbaren',
      servicesTitle: 'Unsere Leistungen',
      teamTitle: 'Unsere Stylisten',
      bookingTitle: 'Online Termin buchen',
    },
  },

  gastronomy: {
    id: 'gastronomy',
    name: 'Restaurant',
    description: 'Gastronomie & Reservierungen',

    labels: {
      services: 'Speisekarte',
      servicesDescription: 'Verwalte deine Gerichte und Preise',
      serviceSingular: 'Gericht',
      customers: 'Gäste',
      customerSingular: 'Gast',
      appointments: 'Reservierungen',
      appointmentSingular: 'Reservierung',
      employees: 'Personal',
      employeeSingular: 'Mitarbeiter',
      booking: 'Tisch reservieren',
      bookingAction: 'Jetzt Tisch reservieren',
      team: 'Unser Team',
      packages: 'Menüs',
      waitlist: 'Warteliste',
    },

    forms: {
      serviceName: 'Gerichtname',
      serviceNamePlaceholder: 'z.B. Wiener Schnitzel',
      serviceDescription: 'Beschreibung des Gerichts',
      servicePrice: 'Preis (€)',
      serviceDuration: 'Zubereitungszeit (Minuten)',
      serviceCategory: 'Kategorie',
      customerFirstName: 'Vorname',
      customerLastName: 'Nachname',
      customerPhone: 'Telefon',
      customerEmail: 'E-Mail',
      employeeRole: 'Position',
      employeeRoles: [
        { value: 'chef', label: 'Küchenchef' },
        { value: 'cook', label: 'Koch/Köchin' },
        { value: 'waiter', label: 'Kellner/in' },
        { value: 'bartender', label: 'Barkeeper' },
        { value: 'host', label: 'Empfang' },
        { value: 'manager', label: 'Manager' },
      ],
    },

    defaultCategories: ['Vorspeisen', 'Hauptgerichte', 'Desserts', 'Getränke', 'Specials'],

    chat: {
      welcomeMessage: 'Willkommen! 🍽️ Wie kann ich Ihnen heute behilflich sein?',
      quickReplies: [
        'Ich möchte einen Tisch reservieren',
        'Was gibt es heute?',
        'Habt ihr vegetarische Optionen?',
        'Wie sind eure Öffnungszeiten?',
      ],
      systemPromptAddition: `You are a friendly restaurant host/receptionist.
Focus on: table reservations, menu recommendations, opening hours, special events.
Recommend: dishes based on preferences, allergies, and party size.
Important: Ask for party size and preferred time when booking.`,
    },

    landing: {
      heroTitle: 'Kulinarische Erlebnisse',
      heroSubtitle: 'Genießen Sie erstklassige Küche in einzigartigem Ambiente',
      ctaButton: 'Tisch reservieren',
      servicesTitle: 'Unsere Speisekarte',
      teamTitle: 'Unser Küchen-Team',
      bookingTitle: 'Online Reservieren',
    },

    theme: {
      primary: '#b45309', // amber-700
      accent: '#78350f',  // amber-900
    },
  },

  late_shop: {
    id: 'late_shop',
    name: 'Spätkauf',
    description: 'Spätkauf & Imbiss',

    labels: {
      services: 'Produkte',
      servicesDescription: 'Verwalte dein Sortiment und Preise',
      serviceSingular: 'Produkt',
      customers: 'Kunden',
      customerSingular: 'Kunde',
      appointments: 'Bestellungen',
      appointmentSingular: 'Bestellung',
      employees: 'Personal',
      employeeSingular: 'Mitarbeiter',
      booking: 'Bestellen',
      bookingAction: 'Jetzt bestellen',
      team: 'Unser Team',
      packages: 'Angebote',
      waitlist: 'Vorbestellung',
    },

    forms: {
      serviceName: 'Produktname',
      serviceNamePlaceholder: 'z.B. Döner Kebab',
      serviceDescription: 'Beschreibung',
      servicePrice: 'Preis (€)',
      serviceDuration: 'Zubereitungszeit (Minuten)',
      serviceCategory: 'Kategorie',
      customerFirstName: 'Vorname',
      customerLastName: 'Nachname',
      customerPhone: 'Telefon',
      customerEmail: 'E-Mail',
      employeeRole: 'Position',
      employeeRoles: [
        { value: 'cook', label: 'Koch/Köchin' },
        { value: 'cashier', label: 'Kassierer/in' },
        { value: 'delivery', label: 'Lieferant' },
        { value: 'manager', label: 'Manager' },
      ],
    },

    defaultCategories: ['Imbiss', 'Getränke', 'Snacks', 'Tabak', 'Sonstiges'],

    chat: {
      welcomeMessage: 'Moin! 🛒 Was kann ich für dich tun?',
      quickReplies: [
        'Was habt ihr im Angebot?',
        'Ich möchte bestellen',
        'Liefert ihr?',
        'Wie lange habt ihr offen?',
      ],
      systemPromptAddition: `You are a friendly shop assistant for a late-night shop/imbiss.
Focus on: products, orders, delivery options, opening hours.
Be casual and friendly. Use informal German (du).`,
    },

    landing: {
      heroTitle: 'Immer für dich da',
      heroSubtitle: 'Dein Spätkauf um die Ecke - frisch & schnell',
      ctaButton: 'Jetzt bestellen',
      servicesTitle: 'Unser Sortiment',
      teamTitle: 'Unser Team',
      bookingTitle: 'Online Bestellen',
    },
  },
}

// Helper function to get config by business type
export function getBusinessTypeConfig(businessType: string | null | undefined): BusinessTypeConfig {
  const type = businessType as BusinessType
  return businessTypeConfigs[type] || businessTypeConfigs.beauty_clinic
}

// Helper to get all business types for select options
export function getBusinessTypeOptions() {
  return Object.values(businessTypeConfigs).map(config => ({
    value: config.id,
    label: config.name,
    description: config.description,
  }))
}
