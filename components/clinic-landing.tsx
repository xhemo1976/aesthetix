'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Sparkles,
  Users,
  CheckCircle
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
}

interface Employee {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
}

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
}

interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  business_type: string | null
}

interface ClinicLandingProps {
  tenant: Tenant
  services: Service[]
  employees: Employee[]
  locations: Location[]
}

export function ClinicLanding({ tenant, services, employees, locations }: ClinicLandingProps) {
  const primaryLocation = locations[0]
  const bookingUrl = `/book/${tenant.slug}`

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-10 rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            )}
            <span className="font-bold text-xl">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#services" className="hidden md:block text-muted-foreground hover:text-foreground">
              Behandlungen
            </Link>
            <Link href="#team" className="hidden md:block text-muted-foreground hover:text-foreground">
              Team
            </Link>
            <Link href="#contact" className="hidden md:block text-muted-foreground hover:text-foreground">
              Kontakt
            </Link>
            <Link href={bookingUrl}>
              <Button>Termin buchen</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Willkommen bei <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {tenant.name}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Professionelle Behandlungen für Ihr Wohlbefinden.
              Vereinbaren Sie jetzt Ihren Termin online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={bookingUrl}>
                <Button size="lg" className="text-lg px-8">
                  <Calendar className="w-5 h-5 mr-2" />
                  Jetzt Termin buchen
                </Button>
              </Link>
              <Link href="#services">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Behandlungen ansehen
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Online buchbar</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Top bewertet</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Erfahrenes Team</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Unsere Behandlungen</h2>
            <p className="text-muted-foreground text-lg">
              Entdecken Sie unser vielfältiges Angebot
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.slice(0, 6).map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {service.name}
                    <span className="text-primary font-bold">
                      {service.price > 0 ? `€${service.price}` : 'Auf Anfrage'}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {service.duration} Minuten
                  </CardDescription>
                </CardHeader>
                {service.description && (
                  <CardContent>
                    <p className="text-muted-foreground">{service.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {services.length > 6 && (
            <div className="text-center mt-8">
              <Link href={bookingUrl}>
                <Button variant="outline" size="lg">
                  Alle {services.length} Behandlungen ansehen
                </Button>
              </Link>
            </div>
          )}

          {services.length === 0 && (
            <div className="text-center text-muted-foreground">
              <p>Behandlungen werden in Kürze hinzugefügt.</p>
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      {employees.length > 0 && (
        <section id="team" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Unser Team</h2>
              <p className="text-muted-foreground text-lg">
                Kompetent, freundlich und für Sie da
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
              {employees.map((employee) => (
                <div key={employee.id} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                    {employee.avatar_url ? (
                      <img
                        src={employee.avatar_url}
                        alt={employee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-primary">
                        {employee.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{employee.name}</h3>
                  {employee.role && (
                    <p className="text-muted-foreground">{employee.role}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {primaryLocation && (
        <section id="contact" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Kontakt & Anfahrt</h2>
              <p className="text-muted-foreground text-lg">
                Wir freuen uns auf Ihren Besuch
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {primaryLocation.address && (
                      <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium">Adresse</p>
                          <p className="text-muted-foreground">
                            {primaryLocation.address}
                            {primaryLocation.city && `, ${primaryLocation.city}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {primaryLocation.phone && (
                      <div className="flex items-start gap-4">
                        <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium">Telefon</p>
                          <a
                            href={`tel:${primaryLocation.phone}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            {primaryLocation.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Öffnungszeiten</p>
                        <p className="text-muted-foreground">
                          Mo-Fr: 9:00 - 18:00 Uhr<br />
                          Sa: Nach Vereinbarung
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link href={bookingUrl}>
                      <Button className="w-full" size="lg">
                        <Calendar className="w-5 h-5 mr-2" />
                        Online Termin vereinbaren
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit für Ihren Termin?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Buchen Sie jetzt online - schnell, einfach und bequem
          </p>
          <Link href={bookingUrl}>
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Jetzt Termin buchen
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-8 rounded" />
              ) : (
                <Sparkles className="w-6 h-6 text-primary" />
              )}
              <span className="font-semibold">{tenant.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {tenant.name}. Powered by{' '}
              <a href="https://esylana.de" className="text-primary hover:underline">
                Esylana
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
