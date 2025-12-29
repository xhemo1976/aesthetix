'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '@/lib/actions/auth'
import { Sparkles } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Esylana
            </h1>
          </Link>
          <p className="text-muted-foreground">
            Starte deine 14-tägige kostenlose Testphase
          </p>
        </div>

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account erstellen</CardTitle>
            <CardDescription>
              Erstelle deinen Account und deine Klinik
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Personal Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Dein Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Max Mustermann"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="max@beispiel.de"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Clinic Info */}
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Name deiner Klinik/Praxis</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    type="text"
                    placeholder="Beauty Clinic München"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Branche</Label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="beauty_clinic">Schönheitsklinik / Ästhetik</option>
                    <option value="hairdresser">Friseur</option>
                    <option value="gastronomy">Gastronomie</option>
                    <option value="late_shop">Spätkauf / Imbiss</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Account wird erstellt...' : 'Kostenlos starten'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Mit der Registrierung akzeptierst du unsere AGB und Datenschutzerklärung
              </p>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Hast du schon einen Account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Jetzt anmelden
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
