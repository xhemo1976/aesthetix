import { notFound } from 'next/navigation'
import { getTenantBySlug, getPublicServices, getPublicEmployees } from '@/lib/actions/public-booking'
import { getPublicLocations } from '@/lib/actions/locations'
import { BookingForm } from './booking-form'
import { LocationSelector } from './location-selector'
import { ChatWidget } from '@/components/chat-widget'
import { Sparkles } from 'lucide-react'

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { tenant, error: tenantError } = await getTenantBySlug(slug)

  if (tenantError || !tenant) {
    notFound()
  }

  // Check if tenant has multiple locations
  const { locations } = await getPublicLocations(slug)
  const hasMultipleLocations = locations.length > 1

  // If multiple locations, show location selector
  if (hasMultipleLocations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
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
            <p className="text-muted-foreground mt-2">Wähle einen Standort</p>
          </header>

          {/* Location Selector */}
          <LocationSelector locations={locations} tenantSlug={slug} />

          {/* Footer */}
          <footer className="text-center mt-8 text-sm text-muted-foreground">
            <p>Powered by Aesthetix</p>
          </footer>
        </div>

        <ChatWidget tenantSlug={slug} tenantName={tenant.name} />
      </div>
    )
  }

  // Single location or no locations - show booking form directly
  const primaryLocation = locations.find(l => l.is_primary) || locations[0]

  const [{ services }, { employees }] = await Promise.all([
    getPublicServices(tenant.id, primaryLocation?.id),
    getPublicEmployees(tenant.id, primaryLocation?.id),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
          <p className="text-muted-foreground mt-2">Online Terminbuchung</p>
          {primaryLocation && (primaryLocation.address || primaryLocation.city) && (
            <p className="text-sm text-muted-foreground mt-1">
              {primaryLocation.address}{primaryLocation.address && primaryLocation.city ? ', ' : ''}{primaryLocation.city}
            </p>
          )}
        </header>

        {/* Booking Form */}
        <BookingForm
          tenant={tenant}
          services={services || []}
          employees={employees || []}
          locationId={primaryLocation?.id}
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
