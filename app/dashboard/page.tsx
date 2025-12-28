import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, TrendingUp, Settings, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
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
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Willkommen, {profile?.full_name}! 👋
        </h2>
        <p className="text-muted-foreground">
          Hier ist dein Dashboard-Überblick
        </p>
      </div>

        {/* Trial Banner */}
        {profile?.tenants?.subscription_status === 'trial' && (
          <Card className="mb-8 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">🎉 Testphase aktiv</CardTitle>
              <CardDescription>
                Deine 14-tägige kostenlose Testphase läuft noch{' '}
                {profile.tenants.trial_ends_at &&
                  Math.ceil(
                    (new Date(profile.tenants.trial_ends_at).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                Tage
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Termine Heute</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Noch keine Termine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kunden</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Lege den ersten Kunden an</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Umsatz (Monat)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€0</div>
              <p className="text-xs text-muted-foreground">Diesen Monat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Einstellungen</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Konfigurieren
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Erste Schritte 🚀</CardTitle>
            <CardDescription>
              Richte deine Klinik ein und starte durch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/services" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Services hinzufügen</p>
                  <p className="text-sm text-muted-foreground">
                    Füge deine Behandlungen und Preise hinzu
                  </p>
                </div>
                <Button size="sm">Starten</Button>
              </Link>

              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mitarbeiter einladen</p>
                  <p className="text-sm text-muted-foreground">
                    Lade dein Team ein
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Bald verfügbar
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Online-Buchung aktivieren</p>
                  <p className="text-sm text-muted-foreground">
                    Kunden können direkt buchen
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Bald verfügbar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
