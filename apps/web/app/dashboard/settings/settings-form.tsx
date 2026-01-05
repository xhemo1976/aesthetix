'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTenantSettings } from '@/lib/actions/settings'
import { useRouter } from 'next/navigation'
import { Building2, Phone, Mail, MapPin, MessageCircle } from 'lucide-react'

type Tenant = {
  id: string
  name: string
  contact_phone: string | null
  contact_email: string | null
  whatsapp_number: string | null
  address: string | null
  city: string | null
  postal_code: string | null
}

export function SettingsForm({ initialSettings }: { initialSettings: Tenant | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateTenantSettings(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div className="max-w-3xl">
      <form action={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">Einstellungen erfolgreich gespeichert!</p>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Klinik-Informationen
            </CardTitle>
            <CardDescription>
              Grundlegende Informationen über deine Klinik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Klinik-Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Beauty Klinik Mustermann"
                defaultValue={initialSettings?.name || ''}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="München"
                  defaultValue={initialSettings?.city || ''}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">PLZ</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  placeholder="80331"
                  defaultValue={initialSettings?.postal_code || ''}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                placeholder="Musterstraße 123"
                defaultValue={initialSettings?.address || ''}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Kontakt & WhatsApp
            </CardTitle>
            <CardDescription>
              Kontaktdaten für Kunden-Kommunikation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                WhatsApp Nummer
                <span className="text-xs text-green-600 font-semibold">WICHTIG</span>
              </Label>
              <Input
                id="whatsapp_number"
                name="whatsapp_number"
                type="tel"
                placeholder="+49 123 456789"
                defaultValue={initialSettings?.whatsapp_number || ''}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Format: +49 123 456789 (mit Ländervorwahl, ohne Leerzeichen für beste Kompatibilität)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefon
              </Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                placeholder="+49 89 123456"
                defaultValue={initialSettings?.contact_phone || ''}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-Mail
              </Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="info@klinik.de"
                defaultValue={initialSettings?.contact_email || ''}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={loading}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  )
}
