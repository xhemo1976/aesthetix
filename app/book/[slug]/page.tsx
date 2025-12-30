import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTenantBySlug, getPublicServices, getPublicEmployees } from '@/lib/actions/public-booking'
import { getPublicLocations } from '@/lib/actions/locations'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BookingForm } from './booking-form'
import { LocationSelector } from './location-selector'
import { ChatWidget } from '@/components/chat-widget'
import { Sparkles, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CustomerData = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

async function getLoggedInCustomer(tenantId: string): Promise<CustomerData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return null
  }

  const adminClient = createAdminClient()
  const { data: customer } = await adminClient
    .from('customers')
    .select('id, first_name, last_name, email, phone')
    .eq('tenant_id', tenantId)
    .eq('email', user.email.toLowerCase())
    .single() as { data: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null }

  if (!customer) {
    // User is logged in but not a customer of this tenant yet
    // Return user metadata as fallback
    return {
      id: '',
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      email: user.email,
      phone: null,
    }
  }

  return {
    id: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email || user.email,
    phone: customer.phone,
  }
}

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
            <p>Powered by Esylana</p>
          </footer>
        </div>

        <ChatWidget tenantSlug={slug} tenantName={tenant.name} />
      </div>
    )
  }

  // Single location or no locations - show booking form directly
  const primaryLocation = locations.find(l => l.is_primary) || locations[0]

  const [{ services }, { employees }, customerData] = await Promise.all([
    getPublicServices(tenant.id, primaryLocation?.id),
    getPublicEmployees(tenant.id, primaryLocation?.id),
    getLoggedInCustomer(tenant.id),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-8">
          {/* User Actions */}
          <div className="flex justify-end mb-4">
            {customerData ? (
              <div className="flex items-center gap-3">
                <Link href="/customer/termine">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {customerData.firstName || 'Meine Termine'}
                  </Button>
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <input type="hidden" name="redirect" value={`/book/${slug}`} />
                  <Button variant="outline" size="sm" type="submit">
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/customer/login?redirect=/book/${slug}&tenant=${slug}`}>
                  <Button variant="ghost" size="sm">
                    Anmelden
                  </Button>
                </Link>
                <Link href={`/customer/signup?redirect=/book/${slug}&tenant=${slug}`}>
                  <Button variant="outline" size="sm">
                    Registrieren
                  </Button>
                </Link>
              </div>
            )}
          </div>

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
          customerData={customerData}
        />

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by Esylana</p>
        </footer>
      </div>

      {/* Chat Widget with tenant context */}
      <ChatWidget tenantSlug={slug} tenantName={tenant.name} />
    </div>
  )
}
