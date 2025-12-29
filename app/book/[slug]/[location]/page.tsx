import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTenantBySlug, getPublicServices, getPublicEmployees } from '@/lib/actions/public-booking'
import { getPublicLocationBySlug } from '@/lib/actions/locations'
import { BookingForm } from '../booking-form'
import { ChatWidget } from '@/components/chat-widget'
import { Sparkles, ChevronLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function LocationBookingPage({
  params,
}: {
  params: Promise<{ slug: string; location: string }>
}) {
  const { slug, location: locationSlug } = await params

  const { tenant, error: tenantError } = await getTenantBySlug(slug)

  if (tenantError || !tenant) {
    notFound()
  }

  const { location, error: locationError } = await getPublicLocationBySlug(slug, locationSlug)

  if (locationError || !location) {
    notFound()
  }

  const [{ services }, { employees }] = await Promise.all([
    getPublicServices(tenant.id, location.id),
    getPublicEmployees(tenant.id, location.id),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Link */}
        <Link href={`/book/${slug}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Standort wechseln
          </Button>
        </Link>

        {/* Header */}
        <header className="text-center mb-8">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-16 mx-auto mb-4 rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-bold">{tenant.name}</h1>

          {/* Location Info */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium text-primary">{location.name}</span>
          </div>

          <p className="text-muted-foreground mt-3">Online Terminbuchung</p>

          {(location.address || location.city) && (
            <p className="text-sm text-muted-foreground mt-1">
              {location.address}
              {location.address && location.city && ', '}
              {location.postal_code} {location.city}
            </p>
          )}
        </header>

        {/* Booking Form */}
        <BookingForm
          tenant={tenant}
          services={services || []}
          employees={employees || []}
          locationId={location.id}
        />

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by Aesthetix</p>
        </footer>
      </div>

      {/* Chat Widget with tenant context */}
      <ChatWidget tenantSlug={slug} tenantName={tenant.name} />
    </div>
  )
}
