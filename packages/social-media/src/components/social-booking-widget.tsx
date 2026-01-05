'use client'

import { useState } from 'react'

interface SocialBookingWidgetProps {
  platforms: Array<{
    platform: 'whatsapp' | 'facebook' | 'instagram' | 'telegram'
    url: string
    label?: string
  }>
  businessName?: string
  message?: string
  variant?: 'floating' | 'inline' | 'popup'
  className?: string
}

const PLATFORM_CONFIG = {
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-600 hover:bg-green-700',
    description: 'Schreib uns auf WhatsApp'
  },
  facebook: {
    name: 'Messenger',
    icon: '💭',
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Nachricht auf Facebook'
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-yellow-500 via-red-500 to-purple-600',
    description: 'DM auf Instagram'
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    color: 'bg-sky-600 hover:bg-sky-700',
    description: 'Schreib uns auf Telegram'
  }
}

/**
 * Social Booking Widget
 * Provides quick booking/contact options via social media
 * Supports WhatsApp, Facebook Messenger, Instagram, Telegram
 */
export function SocialBookingWidget({
  platforms,
  businessName,
  message = 'Hallo! Ich möchte einen Termin vereinbaren.',
  variant = 'floating',
  className = ''
}: SocialBookingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  const handlePlatformClick = (platform: SocialBookingWidgetProps['platforms'][0]) => {
    let finalUrl = platform.url

    // Add message for WhatsApp
    if (platform.platform === 'whatsapp') {
      const encodedMessage = encodeURIComponent(message)
      finalUrl = platform.url.includes('?')
        ? `${platform.url}&text=${encodedMessage}`
        : `${platform.url}?text=${encodedMessage}`
    }

    window.open(finalUrl, '_blank', 'noopener,noreferrer')
    setSelectedPlatform(platform.platform)

    if (variant === 'popup') {
      setTimeout(() => setIsOpen(false), 500)
    }
  }

  // Floating Button Variant
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-2xl p-4 w-72 animate-in slide-in-from-bottom">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">
                {businessName ? `${businessName} kontaktieren` : 'Jetzt Termin buchen'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Wähle deinen bevorzugten Kanal
              </p>
            </div>
            <div className="space-y-2">
              {platforms.map((platform) => {
                const config = PLATFORM_CONFIG[platform.platform]
                return (
                  <button
                    key={platform.platform}
                    onClick={() => handlePlatformClick(platform)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white transition-all ${config.color} hover:scale-105`}
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-medium">{platform.label || config.name}</div>
                      <div className="text-xs opacity-90">{config.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center text-2xl ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          {isOpen ? '✕' : '📱'}
        </button>
      </div>
    )
  }

  // Inline Variant
  if (variant === 'inline') {
    return (
      <div className={`space-y-3 ${className}`}>
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform.platform]
          return (
            <button
              key={platform.platform}
              onClick={() => handlePlatformClick(platform)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-lg text-white transition-all ${config.color} hover:scale-105 hover:shadow-lg`}
            >
              <span className="text-3xl">{config.icon}</span>
              <div className="text-left flex-1">
                <div className="font-semibold text-lg">
                  {platform.label || `Buchen via ${config.name}`}
                </div>
                <div className="text-sm opacity-90">{config.description}</div>
              </div>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )
        })}
      </div>
    )
  }

  // Popup Variant (Modal)
  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium transition-all hover:shadow-lg hover:scale-105 ${className}`}
      >
        📱 Jetzt Termin buchen
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-3xl">
                📱
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {businessName ? `${businessName} kontaktieren` : 'Termin buchen'}
              </h2>
              <p className="text-gray-600">
                Wähle deinen bevorzugten Kommunikationskanal
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {platforms.map((platform) => {
                const config = PLATFORM_CONFIG[platform.platform]
                return (
                  <button
                    key={platform.platform}
                    onClick={() => handlePlatformClick(platform)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-white transition-all ${config.color} hover:scale-105 hover:shadow-lg`}
                  >
                    <span className="text-3xl">{config.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold">{platform.label || config.name}</div>
                      <div className="text-sm opacity-90">{config.description}</div>
                    </div>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Quick WhatsApp Button
 * Simplified component for quick WhatsApp booking
 */
export function WhatsAppButton({
  phoneNumber,
  message = 'Hallo! Ich möchte einen Termin vereinbaren.',
  label = 'WhatsApp Termin',
  className = ''
}: {
  phoneNumber: string
  message?: string
  label?: string
  className?: string
}) {
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '')
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all hover:shadow-lg hover:scale-105 ${className}`}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      {label}
    </a>
  )
}
