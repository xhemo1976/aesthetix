import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Bot, Sparkles, TrendingUp, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 text-center">
        <div className="flex flex-col gap-6 items-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Neu: KI-gestützte Terminverwaltung</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Aesthetix
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            Die All-in-One Management-Plattform für Schönheitskliniken und Ästhetik-Praxen
          </p>

          <p className="text-lg text-muted-foreground max-w-xl">
            Automatisiere Buchungen, verwalte Kunden und spare bis zu 10 Stunden pro Woche mit KI-Unterstützung
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/signup">
              <Button size="lg" className="text-base">
                Kostenlos testen
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base">
                Anmelden
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>DSGVO-konform</span>
            </div>
            <div>•</div>
            <div>Keine Kreditkarte erforderlich</div>
            <div>•</div>
            <div>14 Tage kostenlos</div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Alles was du brauchst</h2>
          <p className="text-muted-foreground">Professionelle Tools für modernes Praxismanagement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Smart Booking</CardTitle>
              <CardDescription>
                Online-Terminbuchung mit intelligentem Kalender und automatischen Erinnerungen per SMS/Email
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Kundenverwaltung</CardTitle>
              <CardDescription>
                Komplettes CRM mit Behandlungs-Historie, Dokumenten und personalisierten Profilen
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bot className="w-10 h-10 text-primary mb-2" />
              <CardTitle>KI-Assistent</CardTitle>
              <CardDescription>
                24/7 Chatbot beantwortet Kundenanfragen und nimmt Buchungen automatisch entgegen
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>
                Einblicke in Umsätze, beliebte Behandlungen und Kundenverhalten in Echtzeit
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Kassensystem-Integration</CardTitle>
              <CardDescription>
                Nahtlose Integration mit Quorion, Olympia und Noris Kassensystemen
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Multi-Standort</CardTitle>
              <CardDescription>
                Verwalte mehrere Filialen mit zentraler Übersicht und individuellen Einstellungen
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Transparent & Fair</h2>
        <p className="text-muted-foreground mb-8">Keine versteckten Kosten. Jederzeit kündbar.</p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-4xl mx-auto">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">€49</span>
                <span className="text-muted-foreground">/Monat</span>
              </div>
              <CardDescription className="mt-2">
                Perfekt für einzelne Praxen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup">
                <Button variant="outline" className="w-full">Mehr erfahren</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex-1 border-primary">
            <CardHeader>
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full mb-2">
                Beliebt
              </div>
              <CardTitle className="text-2xl">Professional</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">€99</span>
                <span className="text-muted-foreground">/Monat</span>
              </div>
              <CardDescription className="mt-2">
                Für wachsende Kliniken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup">
                <Button className="w-full">Jetzt starten</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <CardDescription className="mt-2">
                Individuelle Lösungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup">
                <Button variant="outline" className="w-full">Kontakt</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-20">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">Bereit durchzustarten?</h2>
          <p className="text-xl mb-8 opacity-90">
            Schließe dich hunderten zufriedenen Kliniken an
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-base">
              14 Tage kostenlos testen
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Aesthetix - Professionelle Praxissoftware für die Beauty-Branche</p>
        </div>
      </footer>
    </div>
  );
}
