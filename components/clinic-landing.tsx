'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Star,
  ChevronRight,
  Instagram,
  Facebook,
  Mail,
  Sparkles,
  Award,
  Heart
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const primaryLocation = locations[0]
  const bookingUrl = `/book/${tenant.slug}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Elegant Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-light tracking-[0.2em] uppercase">{tenant.name}</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">Über uns</a>
              <a href="#services" className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">Behandlungen</a>
              <a href="#team" className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">Team</a>
              <a href="#contact" className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">Kontakt</a>
              <Link href={bookingUrl}>
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase text-sm px-6">
                  Termin buchen
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-white"></div>
                <div className="w-6 h-0.5 bg-white"></div>
                <div className="w-6 h-0.5 bg-white"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/10 py-6 px-6 space-y-4">
            <a href="#about" className="block text-sm tracking-widest uppercase text-white/70">Über uns</a>
            <a href="#services" className="block text-sm tracking-widest uppercase text-white/70">Behandlungen</a>
            <a href="#team" className="block text-sm tracking-widest uppercase text-white/70">Team</a>
            <a href="#contact" className="block text-sm tracking-widest uppercase text-white/70">Kontakt</a>
            <Link href={bookingUrl}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium">
                Termin buchen
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0a]" />

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 border border-amber-500/20 rounded-full" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 border border-amber-500/10 rounded-full" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/30 rounded-full mb-8">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm tracking-[0.3em] uppercase text-amber-400">Premium Beauty & Wellness</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.15em] uppercase mb-6">
            {tenant.name}
          </h1>

          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8" />

          <p className="text-xl md:text-2xl font-light text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Erleben Sie exklusive Schönheitsbehandlungen in luxuriösem Ambiente.
            Wo Perfektion auf Eleganz trifft.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={bookingUrl}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase px-10 py-6 text-base">
                <Calendar className="w-5 h-5 mr-2" />
                Termin vereinbaren
              </Button>
            </Link>
            <a href="#services">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 tracking-wider uppercase px-10 py-6 text-base">
                Entdecken
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">Willkommen</span>
              <h2 className="text-4xl md:text-5xl font-extralight mt-4 mb-8 tracking-wide">
                Schönheit ist <br />
                <span className="text-amber-400">unsere Leidenschaft</span>
              </h2>
              <div className="w-16 h-[1px] bg-amber-500 mb-8" />
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                In unserem exklusiven Beauty-Salon verbinden wir modernste Technologie
                mit zeitloser Eleganz. Jede Behandlung wird individuell auf Ihre Bedürfnisse
                abgestimmt.
              </p>
              <p className="text-white/70 text-lg leading-relaxed mb-10">
                Unser hochqualifiziertes Team aus Beauty-Experten sorgt dafür, dass Sie
                sich von der ersten Minute an wie ein VIP fühlen.
              </p>

              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-light text-amber-400 mb-2">10+</div>
                  <div className="text-xs tracking-[0.2em] uppercase text-white/50">Jahre Erfahrung</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-amber-400 mb-2">5000+</div>
                  <div className="text-xs tracking-[0.2em] uppercase text-white/50">Zufriedene Kunden</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-amber-400 mb-2">100%</div>
                  <div className="text-xs tracking-[0.2em] uppercase text-white/50">Hingabe</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80"
                  alt="Luxury Beauty Treatment"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-amber-500/30 rounded-2xl" />
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">Unsere Leistungen</span>
            <h2 className="text-4xl md:text-5xl font-extralight mt-4 tracking-wide">
              Exklusive Behandlungen
            </h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-8" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-500 hover:transform hover:scale-105"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>

                  <h3 className="text-xl font-light tracking-wide mb-3">{service.name}</h3>

                  {service.description && (
                    <p className="text-white/50 text-sm mb-6 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Clock className="w-4 h-4" />
                      {service.duration} Min
                    </div>
                    <div className="text-amber-400 font-light text-xl">
                      {service.price > 0 ? `€${service.price}` : 'Auf Anfrage'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href={bookingUrl}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase px-10">
                Alle Behandlungen & Buchen
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Luxury Banner */}
      <section className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <Award className="w-16 h-16 text-amber-400 mx-auto mb-8" />
          <h3 className="text-3xl md:text-4xl font-extralight tracking-wide mb-6">
            "Wahre Schönheit beginnt mit Selbstliebe"
          </h3>
          <div className="w-16 h-[1px] bg-amber-500 mx-auto mb-6" />
          <p className="text-white/60 tracking-widest uppercase text-sm">Premium Erfahrung garantiert</p>
        </div>
      </section>

      {/* Team Section */}
      {employees.length > 0 && (
        <section id="team" className="py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">Unser Team</span>
              <h2 className="text-4xl md:text-5xl font-extralight mt-4 tracking-wide">
                Beauty Experten
              </h2>
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-8" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {employees.map((employee) => (
                <div key={employee.id} className="group text-center">
                  <div className="relative mb-6 mx-auto w-48 h-48 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-amber-500/50 transition-colors">
                    {employee.avatar_url ? (
                      <img
                        src={employee.avatar_url}
                        alt={employee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                        <span className="text-5xl font-extralight text-amber-400">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-light tracking-wide">{employee.name}</h3>
                  {employee.role && (
                    <p className="text-amber-400 text-sm tracking-widest uppercase mt-1">{employee.role}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">Kontakt</span>
              <h2 className="text-4xl md:text-5xl font-extralight mt-4 mb-8 tracking-wide">
                Besuchen Sie uns
              </h2>
              <div className="w-16 h-[1px] bg-amber-500 mb-8" />

              <div className="space-y-8">
                {primaryLocation?.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-light tracking-wide mb-1">Adresse</h4>
                      <p className="text-white/60">
                        {primaryLocation.address}
                        {primaryLocation.city && <><br />{primaryLocation.city}</>}
                      </p>
                    </div>
                  </div>
                )}

                {primaryLocation?.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-light tracking-wide mb-1">Telefon</h4>
                      <a href={`tel:${primaryLocation.phone}`} className="text-white/60 hover:text-amber-400 transition-colors">
                        {primaryLocation.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-light tracking-wide mb-1">Öffnungszeiten</h4>
                    <p className="text-white/60">
                      Montag - Freitag: 9:00 - 19:00<br />
                      Samstag: 10:00 - 16:00<br />
                      Sonntag: Geschlossen
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-amber-500/50 hover:bg-amber-500/10 transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-amber-500/50 hover:bg-amber-500/10 transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-amber-500/50 hover:bg-amber-500/10 transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-2xl font-extralight tracking-wide mb-8 text-center">
                Vereinbaren Sie Ihren Termin
              </h3>

              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4 text-white/70">
                  <Heart className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Persönliche Beratung inklusive</span>
                </div>
                <div className="flex items-center gap-4 text-white/70">
                  <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Premium Produkte & Technologie</span>
                </div>
                <div className="flex items-center gap-4 text-white/70">
                  <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Zertifizierte Beauty-Experten</span>
                </div>
              </div>

              <Link href={bookingUrl}>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase py-6 text-base">
                  <Calendar className="w-5 h-5 mr-2" />
                  Jetzt online buchen
                </Button>
              </Link>

              <p className="text-center text-white/40 text-sm mt-6">
                Oder rufen Sie uns an für eine persönliche Beratung
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-light tracking-[0.15em] uppercase">{tenant.name}</span>
            </div>

            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} {tenant.name}. Alle Rechte vorbehalten.
            </p>

            <p className="text-white/30 text-xs">
              Buchungssystem von{' '}
              <a href="https://esylana.de" className="text-amber-400/60 hover:text-amber-400 transition-colors">
                Esylana
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
