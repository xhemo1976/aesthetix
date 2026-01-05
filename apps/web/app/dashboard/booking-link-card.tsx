'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Link2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Share2,
  X,
} from 'lucide-react'

interface BookingLinkCardProps {
  tenantSlug: string
  tenantName: string
}

export function BookingLinkCard({ tenantSlug, tenantName }: BookingLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const bookingUrl = `${baseUrl}/book/${tenantSlug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Online Terminbuchung - ${tenantName}`,
          text: `Buche deinen Termin online bei ${tenantName}`,
          url: bookingUrl,
        })
      } catch (err) {
        // User cancelled or share failed
        console.error('Share failed:', err)
      }
    } else {
      // Fallback to copy
      handleCopy()
    }
  }

  // Generate QR code URL using a free QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}`

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Dein Buchungslink
          </CardTitle>
          <CardDescription>
            Teile diesen Link mit deinen Kunden für Online-Terminbuchungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Display */}
          <div className="flex gap-2">
            <Input
              value={bookingUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Link kopieren
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowQR(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              QR-Code
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Teilen
            </Button>

            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Vorschau
              </Button>
            </a>
          </div>

          {/* Tips */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Tipps zum Teilen:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Füge den Link zu deiner Website hinzu</li>
              <li>• Drucke den QR-Code auf Visitenkarten</li>
              <li>• Teile ihn in deiner Instagram Bio</li>
              <li>• Sende ihn per WhatsApp an Stammkunden</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-sm mx-4 relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-2 text-center">QR-Code</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {tenantName}
            </p>

            <div className="flex justify-center mb-4">
              <img
                src={qrCodeUrl}
                alt="QR Code für Buchungslink"
                className="w-48 h-48 rounded-lg border"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center mb-4">
              Scanne den Code um zur Buchungsseite zu gelangen
            </p>

            <div className="flex gap-2">
              <a
                href={qrCodeUrl}
                download={`qr-code-${tenantSlug}.png`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full" size="sm">
                  Herunterladen
                </Button>
              </a>
              <Button
                variant="default"
                className="flex-1"
                size="sm"
                onClick={() => setShowQR(false)}
              >
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
