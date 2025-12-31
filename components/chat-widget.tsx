'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, Calendar, Clock, Euro, Bot, Phone, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionButton {
  type: 'link' | 'whatsapp' | 'phone' | 'booking'
  label: string
  value: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  quickReplies?: string[]
  actionButtons?: ActionButton[]
}

interface ChatWidgetProps {
  tenantSlug?: string
  tenantName?: string
  className?: string
}

export function ChatWidget({ tenantSlug, tenantName, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

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
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length, tenantName])

  const handleQuickReply = (reply: string) => {
    setInput(reply)
    // Trigger submit after setting input
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

      // Simulate typing delay for more natural feel
      await new Promise(resolve => setTimeout(resolve, 500))

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        quickReplies: data.quickReplies,
        actionButtons: data.actionButtons
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

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Chat Window */}
      <div className={cn(
        'absolute bottom-20 right-0 w-[380px] sm:w-[420px] transition-all duration-300 ease-out origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      )}>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col h-[550px] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {tenantName ? `${tenantName}` : 'Esylana'} Assistent
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-white/50">Online</span>
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
                      <a
                        key={index}
                        href={button.value}
                        target={button.type === 'booking' ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className={cn(
                          'px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all',
                          button.type === 'booking' && 'bg-amber-500 text-black hover:bg-amber-400',
                          button.type === 'whatsapp' && 'bg-green-600 text-white hover:bg-green-500',
                          button.type === 'phone' && 'bg-blue-600 text-white hover:bg-blue-500',
                          button.type === 'link' && 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        {button.type === 'booking' && <Calendar className="w-4 h-4" />}
                        {button.type === 'whatsapp' && (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        )}
                        {button.type === 'phone' && <Phone className="w-4 h-4" />}
                        {button.type === 'link' && <ExternalLink className="w-4 h-4" />}
                        {button.label}
                      </a>
                    ))}
                  </div>
                )}

                {/* Quick Replies */}
                {message.role === 'assistant' && message.quickReplies && message.quickReplies.length > 0 && (
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

          {/* Input Area */}
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
