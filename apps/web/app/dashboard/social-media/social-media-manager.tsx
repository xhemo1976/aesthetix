'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SocialLinks, InstagramFeed, GoogleReviews } from '@esylana/social-media'
import { Instagram, Facebook, Star, Globe, MessageCircle, Save, ExternalLink, Eye } from 'lucide-react'
import { updateSocialMediaLinks } from './actions'

interface Tenant {
  id: string
  name: string
  slug: string
  instagram_url?: string | null
  facebook_url?: string | null
  google_place_url?: string | null
  website_url?: string | null
  whatsapp_number?: string | null
}

interface SocialMediaManagerProps {
  tenant: Tenant
}

export function SocialMediaManager({ tenant }: SocialMediaManagerProps) {
  const [instagramUrl, setInstagramUrl] = useState(tenant.instagram_url || '')
  const [facebookUrl, setFacebookUrl] = useState(tenant.facebook_url || '')
  const [googlePlaceUrl, setGooglePlaceUrl] = useState(tenant.google_place_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(tenant.website_url || '')
  const [whatsappNumber, setWhatsappNumber] = useState(tenant.whatsapp_number || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const result = await updateSocialMediaLinks(tenant.id, {
        instagram_url: instagramUrl || null,
        facebook_url: facebookUrl || null,
        google_place_url: googlePlaceUrl || null,
        website_url: websiteUrl || null,
        whatsapp_number: whatsappNumber || null,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Einstellungen gespeichert!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Fehler beim Speichern' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  // Build social links for preview
  const socialLinks = [
    instagramUrl && { platform: 'instagram' as const, url: instagramUrl, label: 'Instagram' },
    facebookUrl && { platform: 'facebook' as const, url: facebookUrl, label: 'Facebook' },
    googlePlaceUrl && { platform: 'google' as const, url: googlePlaceUrl, label: 'Google' },
    websiteUrl && { platform: 'website' as const, url: websiteUrl, label: 'Website' },
    whatsappNumber && { platform: 'whatsapp' as const, url: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, label: 'WhatsApp' },
  ].filter(Boolean) as { platform: 'instagram' | 'facebook' | 'google' | 'website' | 'whatsapp'; url: string; label: string }[]

  // Demo data for previews
  const demoReviews = [
    { id: '1', author: 'Maria S.', rating: 5, text: 'Absolut fantastisch! Das Team ist super freundlich und professionell.', createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: '2', author: 'Thomas M.', rating: 5, text: 'Sehr zufrieden mit dem Ergebnis. Komme gerne wieder!', createdAt: new Date(Date.now() - 86400000 * 5) },
    { id: '3', author: 'Anna K.', rating: 4, text: 'Toller Service, kann ich nur empfehlen.', createdAt: new Date(Date.now() - 86400000 * 10) },
  ]

  const demoPosts = [
    { id: '1', platform: 'instagram' as const, imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', content: 'Neuer Look!', likes: 124, comments: 8, createdAt: new Date(), link: '#' },
    { id: '2', platform: 'instagram' as const, imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', content: 'Styling', likes: 89, comments: 5, createdAt: new Date(), link: '#' },
    { id: '3', platform: 'instagram' as const, imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400', content: 'Beauty', likes: 156, comments: 12, createdAt: new Date(), link: '#' },
  ]

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList>
        <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        <TabsTrigger value="preview">Vorschau</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
        {/* Social Media Links */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Social Media Profile</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Verknüpfe deine Social Media Profile, um sie auf deiner Landingpage anzuzeigen.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram URL
              </Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/deinprofil"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook URL
              </Label>
              <Input
                id="facebook"
                placeholder="https://facebook.com/deinprofil"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
            </div>

            {/* Google Place */}
            <div className="space-y-2">
              <Label htmlFor="google" className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Google Maps / Bewertungen URL
              </Label>
              <Input
                id="google"
                placeholder="https://g.page/deinbusiness"
                value={googlePlaceUrl}
                onChange={(e) => setGooglePlaceUrl(e.target.value)}
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                Website URL
              </Label>
              <Input
                id="website"
                placeholder="https://deine-website.de"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                WhatsApp Nummer
              </Label>
              <Input
                id="whatsapp"
                placeholder="+49 123 456789"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mit Ländervorwahl, z.B. +49 für Deutschland
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
            <Button onClick={handleSave} disabled={saving} className="ml-auto">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </Card>

        {/* Quick Preview */}
        {socialLinks.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Schnellvorschau</h2>
            <p className="text-muted-foreground text-sm mb-4">
              So werden deine Social Media Links auf der Landingpage angezeigt:
            </p>

            <div className="bg-zinc-900 rounded-lg p-6">
              <p className="text-white/50 text-sm mb-4">Icons:</p>
              <SocialLinks links={socialLinks} variant="icons" size="lg" />

              <p className="text-white/50 text-sm mt-6 mb-4">Buttons:</p>
              <SocialLinks links={socialLinks} variant="buttons" />

              <p className="text-white/50 text-sm mt-6 mb-4">Pills:</p>
              <SocialLinks links={socialLinks} variant="pills" />
            </div>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="preview" className="space-y-6">
        {/* Component Previews */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Google Reviews Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Google Bewertungen</h2>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Demo-Daten</span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <GoogleReviews
                reviews={demoReviews}
                averageRating={4.7}
                totalReviews={127}
                placeUrl={googlePlaceUrl || '#'}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Diese Komponente zeigt echte Google Bewertungen an, sobald die Google API integriert ist.
            </p>
          </Card>

          {/* Instagram Feed Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Instagram Feed</h2>
              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">Demo-Daten</span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <InstagramFeed
                platform="instagram"
                username={instagramUrl ? instagramUrl.split('/').pop() || 'deinprofil' : 'deinprofil'}
                posts={demoPosts}
                maxPosts={3}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Diese Komponente zeigt echte Instagram Posts an, sobald die Instagram API integriert ist.
            </p>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">API Integration (Kommt bald)</h3>
          <p className="text-sm text-blue-700">
            Aktuell werden Demo-Daten angezeigt. In Kürze kannst du deine echten Instagram Posts
            und Google Bewertungen automatisch laden lassen. Dafür werden API-Schlüssel benötigt.
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
