'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatWidget } from '@/components/chat-widget'
import { MenuCard } from '@/components/menu-card'
import { getBusinessTypeConfig, type BusinessType } from '@/lib/config/business-types'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Star,
  ChevronRight,
  ChevronDown,
  Instagram,
  Facebook,
  Mail,
  Sparkles,
  Award,
  Heart,
  Users,
  UtensilsCrossed,
  Scissors,
  Wine,
  Coffee
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  category: string | null
  image_url?: string | null
  allergens?: string[] | null
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
}

interface Employee {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
  profile_image_url: string | null
  bio: string | null
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
  whatsapp_number: string | null
}

interface BusinessLandingProps {
  tenant: Tenant
  services: Service[]
  employees: Employee[]
  locations: Location[]
}

// Business-type specific images
const HERO_IMAGES: Record<string, string> = {
  beauty_clinic: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1920&q=80',
  hairdresser: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80',
  gastronomy: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
  late_shop: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1920&q=80',
}

const ABOUT_IMAGES: Record<string, string> = {
  beauty_clinic: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  hairdresser: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  gastronomy: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  late_shop: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
}

const BANNER_IMAGES: Record<string, string> = {
  beauty_clinic: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1920&q=80',
  hairdresser: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1920&q=80',
  gastronomy: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920&q=80',
  late_shop: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1920&q=80',
}

const ABOUT_TEXTS: Record<string, { title: string; highlight: string; p1: string; p2: string; stats: { value: string; label: string }[] }> = {
  beauty_clinic: {
    title: 'Schönheit ist',
    highlight: 'unsere Leidenschaft',
    p1: 'In unserem exklusiven Beauty-Salon verbinden wir modernste Technologie mit zeitloser Eleganz. Jede Behandlung wird individuell auf Ihre Bedürfnisse abgestimmt.',
    p2: 'Unser hochqualifiziertes Team aus Beauty-Experten sorgt dafür, dass Sie sich von der ersten Minute an wie ein VIP fühlen.',
    stats: [
      { value: '10+', label: 'Jahre Erfahrung' },
      { value: '5000+', label: 'Zufriedene Kunden' },
      { value: '100%', label: 'Hingabe' },
    ]
  },
  hairdresser: {
    title: 'Style ist',
    highlight: 'unsere Kunst',
    p1: 'In unserem Salon vereinen wir Kreativität mit Handwerk. Jeder Schnitt, jede Farbe wird mit Präzision und Leidenschaft ausgeführt.',
    p2: 'Unsere erfahrenen Stylisten beraten Sie individuell und finden gemeinsam mit Ihnen Ihren perfekten Look.',
    stats: [
      { value: '15+', label: 'Jahre Erfahrung' },
      { value: '8000+', label: 'Happy Clients' },
      { value: '100%', label: 'Qualität' },
    ]
  },
  gastronomy: {
    title: 'Genuss ist',
    highlight: 'unsere Philosophie',
    p1: 'In unserem Restaurant verbinden wir erstklassige Zutaten mit kulinarischer Kreativität. Jedes Gericht erzählt eine Geschichte.',
    p2: 'Unser leidenschaftliches Küchenteam kreiert für Sie unvergessliche Geschmackserlebnisse in stilvollem Ambiente.',
    stats: [
      { value: '12+', label: 'Jahre Erfahrung' },
      { value: '50000+', label: 'Gäste bewirtet' },
      { value: '100%', label: 'Frische' },
    ]
  },
  late_shop: {
    title: 'Service ist',
    highlight: 'unser Versprechen',
    p1: 'Wir sind für Sie da - schnell, freundlich und zuverlässig. Unser Sortiment bietet alles, was Sie brauchen.',
    p2: 'Ob Tag oder Nacht, wir sind Ihr Nachbar um die Ecke für alle Fälle.',
    stats: [
      { value: '7', label: 'Tage die Woche' },
      { value: '1000+', label: 'Produkte' },
      { value: '100%', label: 'Kundennah' },
    ]
  },
}

const BANNER_QUOTES: Record<string, string> = {
  beauty_clinic: '"Wahre Schönheit beginnt mit Selbstliebe"',
  hairdresser: '"Gutes Aussehen ist kein Zufall"',
  gastronomy: '"Essen ist die schönste Form der Liebe"',
  late_shop: '"Immer für Sie da, wenn Sie uns brauchen"',
}

export function BusinessLanding({ tenant, services, employees, locations }: BusinessLandingProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const businessType = (tenant.business_type || 'beauty_clinic') as BusinessType
  const config = getBusinessTypeConfig(businessType)
  const primaryLocation = locations[0]
  const bookingUrl = `/book/${tenant.slug}`

  // Get icon based on business type
  const getIcon = () => {
    switch (businessType) {
      case 'gastronomy': return UtensilsCrossed
      case 'hairdresser': return Scissors
      case 'late_shop': return Coffee
      default: return Sparkles
    }
  }
  const BusinessIcon = getIcon()

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Extract unique categories from services
  const categories = Array.from(
    new Set(services.map(s => s.category).filter((c): c is string => c !== null && c !== ''))
  ).sort()

  // Group services by category
  const servicesByCategory = categories.reduce((acc, category) => {
    acc[category] = services.filter(s => s.category === category)
    return acc
  }, {} as Record<string, Service[]>)

  // Services without category
  const uncategorizedServices = services.filter(s => !s.category || s.category === '')

  const heroImage = HERO_IMAGES[businessType] || HERO_IMAGES.beauty_clinic
  const aboutImage = ABOUT_IMAGES[businessType] || ABOUT_IMAGES.beauty_clinic
  const bannerImage = BANNER_IMAGES[businessType] || BANNER_IMAGES.beauty_clinic
  const aboutText = ABOUT_TEXTS[businessType] || ABOUT_TEXTS.beauty_clinic
  const bannerQuote = BANNER_QUOTES[businessType] || BANNER_QUOTES.beauty_clinic

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden scroll-smooth">
      {/* Elegant Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <BusinessIcon className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-light tracking-[0.2em] uppercase">{tenant.name}</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('about')} className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">Über uns</button>
              <button onClick={() => scrollToSection('services')} className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">{config.labels.services}</button>
              <button onClick={() => scrollToSection('team')} className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">{config.labels.team}</button>
              <button onClick={() => scrollToSection('contact')} className="text-sm tracking-widest uppercase text-white/70 hover:text-amber-400 transition-colors">Kontakt</button>
              <Link href={bookingUrl}>
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase text-sm px-6">
                  {config.labels.booking}
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
            <button onClick={() => scrollToSection('about')} className="block text-sm tracking-widest uppercase text-white/70">Über uns</button>
            <button onClick={() => scrollToSection('services')} className="block text-sm tracking-widest uppercase text-white/70">{config.labels.services}</button>
            <button onClick={() => scrollToSection('team')} className="block text-sm tracking-widest uppercase text-white/70">{config.labels.team}</button>
            <button onClick={() => scrollToSection('contact')} className="block text-sm tracking-widest uppercase text-white/70">Kontakt</button>
            <Link href={bookingUrl}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium">
                {config.labels.booking}
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
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0a]" />

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 border border-amber-500/20 rounded-full" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 border border-amber-500/10 rounded-full" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/30 rounded-full mb-8">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm tracking-[0.3em] uppercase text-amber-400">{config.description}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.15em] uppercase mb-6">
            {tenant.name}
          </h1>

          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8" />

          <p className="text-xl md:text-2xl font-light text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {config.landing.heroSubtitle}
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">Willkommen</span>
              <h2 className="text-4xl md:text-5xl font-extralight mt-4 mb-8 tracking-wide">
                {aboutText.title} <br />
                <span className="text-amber-400">{aboutText.highlight}</span>
              </h2>
              <div className="w-16 h-[1px] bg-amber-500 mb-8" />
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                {aboutText.p1}
              </p>
              <p className="text-white/70 text-lg leading-relaxed mb-10">
                {aboutText.p2}
              </p>

              <div className="grid grid-cols-3 gap-8">
                {aboutText.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-light text-amber-400 mb-2">{stat.value}</div>
                    <div className="text-xs tracking-[0.2em] uppercase text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src={aboutImage}
                  alt={tenant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-amber-500/30 rounded-2xl" />
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Modern Menu for Gastronomy, Accordion for others */}
      <section id="services" className="py-32 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a] scroll-mt-24">
        <div className={businessType === 'gastronomy' ? 'max-w-7xl mx-auto px-6' : 'max-w-4xl mx-auto px-6'}>
          <div className="text-center mb-16">
            <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">{config.labels.servicesDescription}</span>
            <h2 className="text-4xl md:text-5xl font-extralight mt-4 tracking-wide">
              {config.landing.servicesTitle}
            </h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-8" />
            {businessType !== 'gastronomy' && (
              <p className="text-white/50 mt-6">Wählen Sie eine Kategorie</p>
            )}
          </div>

          {/* Modern Menu Card for Gastronomy */}
          {businessType === 'gastronomy' ? (
            <MenuCard items={services} />
          ) : (
            <>
              {/* Category Accordions for other business types */}
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
                  >
                    {/* Category Header - Clickable */}
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                      className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                          <BusinessIcon className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-light tracking-wide">{category}</h3>
                          <p className="text-white/50 text-sm">{servicesByCategory[category].length} {config.labels.services}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-amber-400 transition-transform duration-300 ${expandedCategory === category ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Services List - Expandable */}
                    {expandedCategory === category && (
                      <div className="border-t border-white/10">
                        {servicesByCategory[category].map((service) => (
                          <div
                            key={service.id}
                            className="px-8 py-5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-light tracking-wide">{service.name}</h4>
                                {service.description && (
                                  <p className="text-white/40 text-sm mt-1 line-clamp-1">{service.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-6 ml-4">
                                {service.duration_minutes > 0 && (
                                  <div className="flex items-center gap-2 text-white/50 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {service.duration_minutes} Min
                                  </div>
                                )}
                                <div className="text-amber-400 font-light text-lg min-w-[80px] text-right">
                                  {service.price > 0 ? `€${service.price}` : 'Anfrage'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Uncategorized Services */}
                {uncategorizedServices.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === '_other' ? null : '_other')}
                      className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                          <BusinessIcon className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-light tracking-wide">Weitere</h3>
                          <p className="text-white/50 text-sm">{uncategorizedServices.length} {config.labels.services}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-amber-400 transition-transform duration-300 ${expandedCategory === '_other' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedCategory === '_other' && (
                      <div className="border-t border-white/10">
                        {uncategorizedServices.map((service) => (
                          <div
                            key={service.id}
                            className="px-8 py-5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-light tracking-wide">{service.name}</h4>
                                {service.description && (
                                  <p className="text-white/40 text-sm mt-1 line-clamp-1">{service.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-6 ml-4">
                                {service.duration_minutes > 0 && (
                                  <div className="flex items-center gap-2 text-white/50 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {service.duration_minutes} Min
                                  </div>
                                )}
                                <div className="text-amber-400 font-light text-lg min-w-[80px] text-right">
                                  {service.price > 0 ? `€${service.price}` : 'Anfrage'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="text-center mt-16">
            <Link href={bookingUrl}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase px-10">
                <Calendar className="w-5 h-5 mr-2" />
                {config.labels.bookingAction}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Luxury Banner */}
      <section className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url('${bannerImage}')` }}
        />
        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <Award className="w-16 h-16 text-amber-400 mx-auto mb-8" />
          <h3 className="text-3xl md:text-4xl font-extralight tracking-wide mb-6">
            {bannerQuote}
          </h3>
          <div className="w-16 h-[1px] bg-amber-500 mx-auto mb-6" />
          <p className="text-white/60 tracking-widest uppercase text-sm">Premium Erfahrung garantiert</p>
        </div>
      </section>

      {/* Team Section */}
      {employees.length > 0 && (
        <section id="team" className="py-32 scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-amber-400 tracking-[0.3em] uppercase text-sm">{config.labels.team}</span>
              <h2 className="text-4xl md:text-5xl font-extralight mt-4 tracking-wide">
                {config.landing.teamTitle}
              </h2>
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-8" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {employees.map((employee) => (
                <div key={employee.id} className="group text-center">
                  <div className="relative mb-6 mx-auto w-48 h-48 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-amber-500/50 transition-colors">
                    {(employee.profile_image_url || employee.avatar_url) ? (
                      <img
                        src={employee.profile_image_url || employee.avatar_url || ''}
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

            {/* Link to full team page */}
            <div className="text-center mt-12">
              <Link href={`/team/${tenant.slug}`}>
                <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 tracking-wider uppercase">
                  Mehr über unser Team
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-gradient-to-b from-[#0a0a0a] to-[#111] scroll-mt-24">
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
                      Montag - Freitag: 9:00 - 22:00<br />
                      Samstag: 10:00 - 22:00<br />
                      Sonntag: 12:00 - 20:00
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
                {config.landing.bookingTitle}
              </h3>

              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4 text-white/70">
                  <Heart className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Persönliche Betreuung inklusive</span>
                </div>
                <div className="flex items-center gap-4 text-white/70">
                  <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Beste Qualität garantiert</span>
                </div>
                <div className="flex items-center gap-4 text-white/70">
                  <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>Erfahrenes Team</span>
                </div>
              </div>

              <Link href={bookingUrl}>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium tracking-wider uppercase py-6 text-base">
                  <Calendar className="w-5 h-5 mr-2" />
                  {config.labels.bookingAction}
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
                <BusinessIcon className="w-4 h-4 text-black" />
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

      {/* Chat Widget */}
      <ChatWidget tenantSlug={tenant.slug} tenantName={tenant.name} whatsappNumber={tenant.whatsapp_number || undefined} />
    </div>
  )
}
