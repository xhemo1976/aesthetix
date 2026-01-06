import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { Calendar, Users, Sparkles, Settings, LogOut, LayoutDashboard, UserCircle, Bell, BarChart3, MapPin, Clock, Package, UtensilsCrossed, Scissors, Share2 } from 'lucide-react'
import { getBusinessTypeConfig, type BusinessType } from '@/lib/config/business-types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  // Get business type config for dynamic labels
  const businessType = profile?.tenants?.business_type as BusinessType | undefined
  const config = getBusinessTypeConfig(businessType)

  // Get icon based on business type
  const getServiceIcon = () => {
    switch (businessType) {
      case 'gastronomy':
      case 'late_shop':
        return UtensilsCrossed
      case 'hairdresser':
        return Scissors
      default:
        return Sparkles
    }
  }
  const ServiceIcon = getServiceIcon()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Esylana
            </h1>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            {profile?.tenants && (
              <>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {config.name}
                </span>
                <p className="text-sm text-muted-foreground">
                  {profile.tenants.name}
                </p>
              </>
            )}
          </div>
          <form action={logout}>
            <Button variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </form>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-muted/10 min-h-[calc(100vh-73px)] hidden md:block">
          <nav className="p-4 space-y-2">
            <Link href="/dashboard">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link href="/dashboard/services">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <ServiceIcon className="w-5 h-5" />
                <span>{config.labels.services}</span>
              </div>
            </Link>

            <Link href="/dashboard/packages">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Package className="w-5 h-5" />
                <span>{config.labels.packages}</span>
              </div>
            </Link>

            <Link href="/dashboard/customers">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Users className="w-5 h-5" />
                <span>{config.labels.customers}</span>
              </div>
            </Link>

            <Link href="/dashboard/employees">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <UserCircle className="w-5 h-5" />
                <span>{config.labels.employees}</span>
              </div>
            </Link>

            <Link href="/dashboard/locations">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <MapPin className="w-5 h-5" />
                <span>Standorte</span>
              </div>
            </Link>

            <Link href="/dashboard/appointments">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Calendar className="w-5 h-5" />
                <span>{config.labels.appointments}</span>
              </div>
            </Link>

            <Link href="/dashboard/calendar">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Calendar className="w-5 h-5" />
                <span>Kalender</span>
              </div>
            </Link>

            <Link href="/dashboard/reminders">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Bell className="w-5 h-5" />
                <span>Erinnerungen</span>
              </div>
            </Link>

            <Link href="/dashboard/waitlist">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Clock className="w-5 h-5" />
                <span>{config.labels.waitlist}</span>
              </div>
            </Link>

            <Link href="/dashboard/analytics">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </div>
            </Link>

            <Link href="/dashboard/social-media">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Social Media</span>
              </div>
            </Link>

            <div className="pt-4 mt-4 border-t">
              <Link href="/dashboard/settings">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Einstellungen</span>
                </div>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
