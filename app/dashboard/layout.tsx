import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { Calendar, Users, Sparkles, Settings, LogOut, LayoutDashboard } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Aesthetix
            </h1>
          </Link>
          {profile?.tenants && (
            <p className="text-sm text-muted-foreground hidden md:block">
              {profile.tenants.name}
            </p>
          )}
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
                <Sparkles className="w-5 h-5" />
                <span>Services</span>
              </div>
            </Link>

            <Link href="/dashboard/customers">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Users className="w-5 h-5" />
                <span>Kunden</span>
              </div>
            </Link>

            <Link href="/dashboard/appointments">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors opacity-50 cursor-not-allowed">
                <Calendar className="w-5 h-5" />
                <span>Termine</span>
                <span className="ml-auto text-xs bg-muted px-2 py-1 rounded">Bald</span>
              </div>
            </Link>

            <div className="pt-4 mt-4 border-t">
              <Link href="/dashboard/settings">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors opacity-50 cursor-not-allowed">
                  <Settings className="w-5 h-5" />
                  <span>Einstellungen</span>
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded">Bald</span>
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
