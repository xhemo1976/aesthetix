'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, Calendar, Clock, Euro, Bot, Phone, ExternalLink, ArrowLeft, Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionButton {
  type: 'link' | 'whatsapp' | 'phone' | 'booking' | 'start_booking' | 'whatsapp_booking'
  label: string
  value: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  quickReplies?: string[]
  actionButtons?: ActionButton[]
  bookingStep?: BookingStep
  services?: ServiceOption[]
  slots?: string[]
  selectedService?: ServiceOption
  selectedDate?: string
  selectedTime?: string
}

interface ChatWidgetProps {
  tenantSlug?: string
  tenantName?: string
  whatsappNumber?: string
  className?: string
}

interface ServiceOption {
  id: string
  name: string
  price: number
  duration_minutes: number
  category: string | null
}

type BookingStep = 'idle' | 'select_service' | 'select_date' | 'select_time' | 'enter_contact' | 'confirm' | 'success'

interface BookingState {
  step: BookingStep
  service: ServiceOption | null
  date: string | null
  time: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function ChatWidget({ tenantSlug, tenantName, whatsappNumber, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Booking state
  const [booking, setBooking] = useState<BookingState>({
    step: 'idle',
    service: null,
    date: null,
    time: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [isBookingLoading, setIsBookingLoading] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping, booking.step])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current && booking.step === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, booking.step])

  // Add welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: tenantName
          ? `Willkommen bei ${tenantName}! ✨\n\nIch bin Ihr persönlicher Beauty-Berater. Wie kann ich Ihnen heute helfen?`
          : 'Hallo! Ich bin der Esylana-Assistent. Wie kann ich Ihnen helfen?',
        quickReplies: [
          'Welche Behandlungen bietet ihr an?',
          'Was kostet Botox?',
          'Ich möchte einen Termin buchen',
          'Wer sind eure Spezialisten?'
        ],
        actionButtons: [
          {
            type: 'start_booking',
            label: 'Direkt Termin buchen',
            value: 'start'
          }
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length, tenantName])

  // Fetch services when booking starts
  const fetchServices = useCallback(async () => {
    if (!tenantSlug) return
    setIsBookingLoading(true)
    try {
      const response = await fetch('/api/chat/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_services',
          tenantSlug
        })
      })
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsBookingLoading(false)
    }
  }, [tenantSlug])

  // Fetch available slots for selected service and date
  const fetchSlots = useCallback(async (serviceId: string, date: string) => {
    if (!tenantSlug) return
    setIsBookingLoading(true)
    try {
      const response = await fetch('/api/chat/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_slots',
          tenantSlug,
          serviceId,
          date
        })
      })
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setIsBookingLoading(false)
    }
  }, [tenantSlug])

  // Create booking
  const createBooking = useCallback(async () => {
    if (!tenantSlug || !booking.service || !booking.date || !booking.time) return null
    setIsBookingLoading(true)
    try {
      const response = await fetch('/api/chat/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_booking',
          tenantSlug,
          serviceId: booking.service.id,
          date: booking.date,
          time: booking.time,
          customerData: {
            firstName: booking.firstName,
            lastName: booking.lastName,
            email: booking.email || undefined,
            phone: booking.phone || undefined
          }
        })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error creating booking:', error)
      return null
    } finally {
      setIsBookingLoading(false)
    }
  }, [tenantSlug, booking])

  // Generate WhatsApp booking message
  const generateWhatsAppMessage = useCallback(() => {
    if (!booking.service) return ''

    const lines = [
      `Hallo! Ich möchte gerne einen Termin buchen:`,
      ``,
      `📋 Behandlung: ${booking.service.name}`,
      `💰 Preis: ${booking.service.price}€`,
      `⏱️ Dauer: ${booking.service.duration_minutes} Min.`,
    ]

    if (booking.date) {
      const dateObj = new Date(booking.date)
      const formattedDate = dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
      lines.push(`📅 Wunschtermin: ${formattedDate}`)
    }

    if (booking.time) {
      lines.push(`🕐 Uhrzeit: ${booking.time} Uhr`)
    }

    if (booking.firstName || booking.lastName) {
      lines.push(``, `👤 Name: ${booking.firstName} ${booking.lastName}`)
    }

    if (booking.phone) {
      lines.push(`📞 Telefon: ${booking.phone}`)
    }

    lines.push(``, `Bitte um Bestätigung. Vielen Dank!`)

    return encodeURIComponent(lines.join('\n'))
  }, [booking])

  // Start booking flow
  const startBooking = useCallback(() => {
    setBooking(prev => ({ ...prev, step: 'select_service' }))
    fetchServices()

    const bookingMessage: Message = {
      id: `booking-start-${Date.now()}`,
      role: 'assistant',
      content: '🗓️ Perfekt! Lassen Sie uns gemeinsam Ihren Termin buchen.\n\nWelche Behandlung möchten Sie?',
      bookingStep: 'select_service'
    }
    setMessages(prev => [...prev, bookingMessage])
  }, [fetchServices])

  // Handle service selection
  const selectService = useCallback((service: ServiceOption) => {
    setBooking(prev => ({ ...prev, service, step: 'select_date' }))

    const message: Message = {
      id: `service-selected-${Date.now()}`,
      role: 'assistant',
      content: `✨ ${service.name} - ${service.price}€ (${service.duration_minutes} Min.)\n\nWann möchten Sie kommen?`,
      bookingStep: 'select_date',
      selectedService: service
    }
    setMessages(prev => [...prev, message])
  }, [])

  // Handle date selection
  const selectDate = useCallback((date: string) => {
    setBooking(prev => ({ ...prev, date, step: 'select_time' }))

    if (booking.service) {
      fetchSlots(booking.service.id, date)
    }

    const dateObj = new Date(date)
    const formattedDate = dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

    const message: Message = {
      id: `date-selected-${Date.now()}`,
      role: 'assistant',
      content: `📅 ${formattedDate}\n\nWelche Uhrzeit passt Ihnen?`,
      bookingStep: 'select_time',
      selectedDate: date
    }
    setMessages(prev => [...prev, message])
  }, [booking.service, fetchSlots])

  // Handle time selection
  const selectTime = useCallback((time: string) => {
    setBooking(prev => ({ ...prev, time, step: 'enter_contact' }))

    const message: Message = {
      id: `time-selected-${Date.now()}`,
      role: 'assistant',
      content: `🕐 ${time} Uhr\n\nFast geschafft! Bitte geben Sie Ihre Kontaktdaten ein:`,
      bookingStep: 'enter_contact',
      selectedTime: time
    }
    setMessages(prev => [...prev, message])
  }, [])

  // Handle contact form submission
  const submitContact = useCallback(async () => {
    if (!booking.firstName || !booking.lastName || (!booking.email && !booking.phone)) {
      return
    }

    setBooking(prev => ({ ...prev, step: 'confirm' }))

    const dateObj = booking.date ? new Date(booking.date) : null
    const formattedDate = dateObj?.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

    const message: Message = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: `📋 Ihre Buchung:\n\n✨ ${booking.service?.name}\n💰 ${booking.service?.price}€\n📅 ${formattedDate}\n🕐 ${booking.time} Uhr\n👤 ${booking.firstName} ${booking.lastName}\n\nMöchten Sie die Buchung bestätigen?`,
      bookingStep: 'confirm',
      actionButtons: [
        {
          type: 'booking',
          label: 'Jetzt buchen',
          value: 'confirm'
        },
        ...(whatsappNumber ? [{
          type: 'whatsapp_booking' as const,
          label: 'Via WhatsApp buchen',
          value: `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${generateWhatsAppMessage()}`
        }] : [])
      ]
    }
    setMessages(prev => [...prev, message])
  }, [booking, whatsappNumber, generateWhatsAppMessage])

  // Confirm booking
  const confirmBooking = useCallback(async () => {
    const result = await createBooking()

    if (result?.success) {
      setBooking(prev => ({ ...prev, step: 'success' }))

      const message: Message = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `🎉 Perfekt! Ihr Termin ist gebucht!\n\n${result.booking.service}\n📅 ${result.booking.date}\n🕐 ${result.booking.time} Uhr\n\nSie erhalten in Kürze eine Bestätigung. Wir freuen uns auf Sie! ✨`,
        bookingStep: 'success',
        quickReplies: [
          'Weitere Behandlung buchen',
          'Zurück zum Chat'
        ]
      }
      setMessages(prev => [...prev, message])
    } else {
      const message: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Leider ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.',
        actionButtons: whatsappNumber ? [
          {
            type: 'whatsapp_booking',
            label: 'Via WhatsApp buchen',
            value: `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${generateWhatsAppMessage()}`
          }
        ] : []
      }
      setMessages(prev => [...prev, message])
    }
  }, [createBooking, whatsappNumber, generateWhatsAppMessage])

  // Reset booking
  const resetBooking = useCallback(() => {
    setBooking({
      step: 'idle',
      service: null,
      date: null,
      time: null,
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    })
    setServices([])
    setAvailableSlots([])
  }, [])

  // Handle action button click
  const handleActionButton = useCallback((button: ActionButton) => {
    if (button.type === 'start_booking') {
      startBooking()
    } else if (button.type === 'booking' && button.value === 'confirm') {
      confirmBooking()
    } else if (button.type === 'whatsapp_booking' || button.type === 'whatsapp') {
      window.open(button.value, '_blank')
    } else if (button.type === 'phone') {
      window.location.href = button.value
    } else if (button.type === 'booking') {
      window.location.href = button.value
    } else {
      window.open(button.value, '_blank')
    }
  }, [startBooking, confirmBooking])

  const handleQuickReply = (reply: string) => {
    if (reply === 'Weitere Behandlung buchen') {
      resetBooking()
      startBooking()
      return
    }
    if (reply === 'Zurück zum Chat') {
      resetBooking()
      return
    }
    if (reply === 'Ich möchte einen Termin buchen') {
      startBooking()
      return
    }

    setInput(reply)
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement
      if (form) form.requestSubmit()
    }, 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          })),
          tenantSlug
        })
      })

      if (!response.ok) {
        throw new Error('Chat request failed')
      }

      const data = await response.json()

      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if user wants to book
      const wantsBooking = data.intent === 'booking' ||
        input.toLowerCase().includes('termin') ||
        input.toLowerCase().includes('buchen')

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        quickReplies: data.quickReplies,
        actionButtons: [
          ...(data.actionButtons || []),
          ...(wantsBooking ? [{
            type: 'start_booking' as const,
            label: 'Jetzt hier buchen',
            value: 'start'
          }] : [])
        ]
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      // Skip Sundays (0)
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
        })
      }
    }
    return dates
  }

  // Group services by category
  const getServicesByCategory = () => {
    const grouped: Record<string, ServiceOption[]> = {}
    services.forEach(service => {
      const cat = service.category || 'Weitere'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(service)
    })
    return grouped
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Chat Window */}
      <div className={cn(
        'absolute bottom-20 right-0 w-[380px] sm:w-[420px] transition-all duration-300 ease-out origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      )}>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[600px] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {booking.step !== 'idle' && (
                  <button
                    onClick={resetBooking}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {booking.step !== 'idle' ? 'Termin buchen' : `${tenantName || 'Esylana'} Assistent`}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-white/50">
                        {booking.step !== 'idle' ? getBookingStepLabel(booking.step) : 'Online'}
                      </span>
                    </div>
                    {booking.step === 'idle' && (
                      <div className="flex items-center gap-1 text-xs" title="Verfügbare Sprachen">
                        <span>🇩🇪</span>
                        <span>🇬🇧</span>
                        <span>🇹🇷</span>
                        <span>🇷🇺</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                      message.role === 'user'
                        ? 'bg-amber-500 text-black rounded-br-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {message.role === 'assistant' && message.actionButtons && message.actionButtons.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-10 mt-2">
                    {message.actionButtons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionButton(button)}
                        className={cn(
                          'px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all',
                          (button.type === 'booking' || button.type === 'start_booking') && 'bg-amber-500 text-black hover:bg-amber-400',
                          (button.type === 'whatsapp' || button.type === 'whatsapp_booking') && 'bg-green-600 text-white hover:bg-green-500',
                          button.type === 'phone' && 'bg-blue-600 text-white hover:bg-blue-500',
                          button.type === 'link' && 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        {(button.type === 'booking' || button.type === 'start_booking') && <Calendar className="w-4 h-4" />}
                        {(button.type === 'whatsapp' || button.type === 'whatsapp_booking') && (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        )}
                        {button.type === 'phone' && <Phone className="w-4 h-4" />}
                        {button.type === 'link' && <ExternalLink className="w-4 h-4" />}
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Replies */}
                {message.role === 'assistant' && message.quickReplies && message.quickReplies.length > 0 && booking.step === 'idle' && (
                  <div className="flex flex-wrap gap-2 ml-10 mt-2">
                    {message.quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1.5 text-xs border border-amber-500/30 text-amber-400 rounded-full hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Booking: Service Selection */}
            {booking.step === 'select_service' && (
              <div className="ml-10 space-y-3">
                {isBookingLoading ? (
                  <div className="flex items-center gap-2 text-white/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Behandlungen werden geladen...</span>
                  </div>
                ) : (
                  Object.entries(getServicesByCategory()).map(([category, categoryServices]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wide text-amber-400/70">{category}</h4>
                      <div className="grid gap-2">
                        {categoryServices.slice(0, 5).map((service) => (
                          <button
                            key={service.id}
                            onClick={() => selectService(service)}
                            className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors">
                                {service.name}
                              </span>
                              <span className="text-amber-400 text-sm font-semibold">{service.price}€</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-white/50 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{service.duration_minutes} Min.</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Booking: Date Selection */}
            {booking.step === 'select_date' && (
              <div className="ml-10">
                <div className="grid grid-cols-3 gap-2">
                  {getAvailableDates().map((date) => (
                    <button
                      key={date.value}
                      onClick={() => selectDate(date.value)}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all text-center"
                    >
                      <span className="text-white text-sm">{date.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Booking: Time Selection */}
            {booking.step === 'select_time' && (
              <div className="ml-10">
                {isBookingLoading ? (
                  <div className="flex items-center gap-2 text-white/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Verfügbare Zeiten werden geladen...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => selectTime(slot)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all text-center"
                      >
                        <span className="text-white text-sm">{slot}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/50 text-sm">
                    Keine freien Termine an diesem Tag. Bitte wählen Sie ein anderes Datum.
                    <button
                      onClick={() => setBooking(prev => ({ ...prev, step: 'select_date', date: null }))}
                      className="block mt-2 text-amber-400 hover:underline"
                    >
                      ← Anderes Datum wählen
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Booking: Contact Form */}
            {booking.step === 'enter_contact' && (
              <div className="ml-10 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Vorname *"
                    value={booking.firstName}
                    onChange={(e) => setBooking(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Nachname *"
                    value={booking.lastName}
                    onChange={(e) => setBooking(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <input
                  type="email"
                  placeholder="E-Mail"
                  value={booking.email}
                  onChange={(e) => setBooking(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="tel"
                  placeholder="Telefon"
                  value={booking.phone}
                  onChange={(e) => setBooking(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
                <p className="text-xs text-white/40">* Pflichtfelder. E-Mail oder Telefon erforderlich.</p>
                <button
                  onClick={submitContact}
                  disabled={!booking.firstName || !booking.lastName || (!booking.email && !booking.phone)}
                  className="w-full py-3 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                >
                  Weiter zur Bestätigung
                </button>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Hidden during booking flow */}
          {booking.step === 'idle' && (
            <div className="p-4 border-t border-white/10 bg-white/5">
              <form id="chat-form" onSubmit={handleSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Schreiben Sie eine Nachricht..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 text-black rounded-xl flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
              <p className="text-center text-[10px] text-white/30 mt-2">
                Powered by Esylana AI
              </p>
            </div>
          )}

          {/* WhatsApp Quick Action during booking */}
          {booking.step !== 'idle' && booking.step !== 'success' && whatsappNumber && (
            <div className="p-3 border-t border-white/10 bg-white/5">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-green-600/20 text-green-400 text-sm hover:bg-green-600/30 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Lieber per WhatsApp buchen?
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg shadow-black/30 flex items-center justify-center transition-all duration-300',
          'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500',
          isOpen && 'rotate-180'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-black" />
        ) : (
          <MessageCircle className="w-6 h-6 text-black" />
        )}
      </button>

      {/* Notification Badge (when closed) */}
      {!isOpen && messages.length === 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a] animate-pulse"></span>
      )}
    </div>
  )
}

// Helper function for step labels
function getBookingStepLabel(step: BookingStep): string {
  switch (step) {
    case 'select_service': return 'Schritt 1/4 - Behandlung'
    case 'select_date': return 'Schritt 2/4 - Datum'
    case 'select_time': return 'Schritt 3/4 - Uhrzeit'
    case 'enter_contact': return 'Schritt 4/4 - Kontakt'
    case 'confirm': return 'Bestätigung'
    case 'success': return 'Gebucht!'
    default: return 'Online'
  }
}
