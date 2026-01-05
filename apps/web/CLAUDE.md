# Esylana - Projekt Kontext

## Überblick

**Esylana** ist eine Multi-Branchen SaaS-Plattform für Dienstleister.
- Multi-Tenant Architektur
- **Multi-Branchen:** Kliniken, Gastronomie, Friseure, Spätkauf
- Online-Terminbuchung / Tischreservierung mit Subdomain-Support
- Luxus-Landingpages (Dark Theme)
- KI-Chatbot mit branchenspezifischen Prompts
- WhatsApp-Integration für Buchungen

**Repository:** github.com/xhemo1976/aesthetix

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router, Standalone Output)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Hostinger VPS (KVM 4)
- **Process Manager:** PM2
- **Reverse Proxy:** Traefik (mit Let's Encrypt SSL)
- **KI:** OpenAI GPT-4o-mini für Chat
- **Image Compression:** browser-image-compression (Client-side)

## Branchen-Support

| Branche | business_type | Demo-URL | Dashboard-Labels |
|---------|---------------|----------|------------------|
| Schönheitsklinik | `beauty_clinic` | demo.esylana.de | Behandlungen, Termine, Kunden |
| Restaurant | `gastronomy` | gastro.esylana.de | Speisekarte, Reservierungen, Gäste |
| Friseur | `hairdresser` | - | Leistungen, Termine, Kunden |
| Spätkauf | `late_shop` | - | Produkte, Bestellungen, Kunden |

**Konfiguration:** `lib/config/business-types.ts`

## Projekt-Struktur

```
/app
  /api
    /auth               - Staff Login/Signup/Logout
    /customer/auth      - Kunden Login/Signup
    /chat               - KI-Chat Endpoint (branchenspezifisch)
    /chat/booking       - Chat-Buchungs-API (Services, Slots, Create)
    /chat/events        - n8n Webhook Events
    /debug              - Supabase Connection Test
  /book/[slug]          - Öffentliche Buchungsseite (Dark Theme)
    /success            - Buchungsbestätigung
    /[location]         - Multi-Standort Buchung
    booking-form.tsx    - Mehrstufiges Buchungsformular (inkl. Gastro-Reservierung)
    waitlist-form.tsx   - Warteliste
    location-selector.tsx
  /confirm/[token]      - Terminbestätigung
  /customer
    /login              - Kunden-Login
    /signup             - Kunden-Registrierung
    /termine            - "Meine Termine" für Kunden
  /dashboard            - Admin Dashboard (Multi-Tenant, dynamische Labels)
    /employees          - Mitarbeiterverwaltung
    /services           - Behandlungen/Speisekarte/Leistungen
    /customers          - Kunden/Gäste
    /appointments       - Termine/Reservierungen
    /calendar           - Kalenderansicht
    /analytics          - Statistiken
    /locations          - Standorte
    /packages           - Pakete/Menüs
    /reminders          - Erinnerungen
    /waitlist           - Warteliste
    /settings           - Einstellungen
  /team/[slug]          - Öffentliche Team-Seite
  /login, /signup       - Staff Auth Seiten
  page.tsx              - Landing (SaaS oder Tenant je nach Subdomain)

/components
  business-landing.tsx  - Universal-Landingpage (alle Branchen)
  menu-card.tsx         - Moderne Speisekarte mit Bildern, Allergenen & Kategorie-Bildern
  chat-widget.tsx       - KI-Chatbot mit Booking-Flow + WhatsApp
  /ui                   - shadcn/ui Komponenten

/lib
  /config
    business-types.ts   - Branchen-Konfiguration (Labels, Prompts, Bilder)
  /actions
    tenant-domain.ts    - Subdomain → Tenant Mapping
    services.ts         - CRUD für Services (inkl. Kategorie-Bild-Propagierung)
    employees.ts        - CRUD + Bild-Upload
    public-booking.ts   - Buchungs-Logik (inkl. Gastro-Reservierung)
    customers.ts        - Kundenverwaltung
    locations.ts        - Standorte
    waitlist.ts         - Warteliste
  /supabase
    server.ts           - Supabase Client (mit Cookies)
    admin.ts            - Service Role Client (bypasses RLS)
  /types
    database.ts         - Supabase Types
  /utils
    whatsapp.ts         - WhatsApp Link Generator

/scripts
  seed-demo-services.ts     - Demo-Klinik Behandlungen
  seed-demo-gastro.ts       - Demo-Restaurant Speisekarte
  create-gastro-admin.ts    - Admin-User für Gastro
  update-gastro-menu.ts     - Bilder & Allergene für Demo-Gerichte
  add-menu-fields.sql       - DB-Migration für Gastro-Felder
```

## Domains & Subdomains

| Domain | Zeigt |
|--------|-------|
| esylana.de | SaaS Landing Page |
| esylana.de/dashboard | Admin Dashboard |
| esylana.de/book/[slug] | Buchungsseite |
| demo.esylana.de | Demo-Klinik |
| gastro.esylana.de | Demo-Restaurant |
| [kunde].esylana.de | Kunden-Website |

**Subdomain-Erkennung:** `app/page.tsx` prüft Host-Header
**Mapping:** `lib/actions/tenant-domain.ts`

## VPS Setup

**Server:** 72.60.36.113 (Hostinger KVM 4, bis 2027-08-22)
**SSH-Passwort:** Donaidan1(2025)

```bash
# SSH Zugang
ssh root@72.60.36.113

# App Verzeichnis
cd /var/www/esylana

# Deploy Befehl (WICHTIG!)
git pull && npm install && npm run build && cp .env.local .next/standalone/ && pm2 restart esylana

# Logs
pm2 logs esylana

# Status
pm2 status
```

### Deploy via Python (wenn SSH-Key fehlt)
```python
import pexpect
child = pexpect.spawn('ssh -o StrictHostKeyChecking=no root@72.60.36.113', timeout=180)
child.expect('password:')
child.sendline('Donaidan1(2025)')
child.expect(r'\$|#')
child.sendline('cd /var/www/esylana && git pull && npm run build && cp .env.local .next/standalone/ && pm2 restart esylana')
child.expect(r'\$|#', timeout=180)
print(child.before.decode())
child.close()
```

### Pfade auf VPS
```
/var/www/esylana/              # App
/var/www/esylana/.env.local    # Env Vars
/root/docker-compose.yml       # Traefik + n8n
/etc/traefik/dynamic/          # Routing Configs (je Subdomain eine .yml)
```

### Traefik - Neue Subdomain hinzufügen
```bash
# 1. DNS bei Hostinger: A-Record für subdomain → 72.60.36.113
# 2. Traefik Config erstellen:
nano /etc/traefik/dynamic/[subdomain].yml

# Inhalt:
http:
    routers:
      [subdomain]:
        rule: "Host(`[subdomain].esylana.de`)"
        entryPoints:
          - web
          - websecure
        service: esylana
        tls:
          certResolver: mytlschallenge
    services:
      [subdomain]:
        loadBalancer:
          servers:
            - url: "http://172.17.0.1:3000"

# 3. Traefik neustarten:
docker restart root-traefik-1
```

### Dienste
| Dienst | Port | Manager |
|--------|------|---------|
| Esylana | 3000 | PM2 |
| n8n | 5678 | Docker |
| Traefik | 80, 443 | Docker (root-traefik-1) |

## Supabase

**URL:** https://hccoltgswaqhpyzswvwa.supabase.co

### Wichtige Tabellen
| Tabelle | Beschreibung |
|---------|--------------|
| `tenants` | Kliniken/Restaurants (mit `business_type`!) |
| `users` | Staff/Admin Accounts |
| `customers` | Endkunden der Tenants |
| `services` | Behandlungen/Gerichte (mit `category`, `category_image_url`) |
| `appointments` | Termine/Reservierungen |
| `employees` | Mitarbeiter/Personal |
| `locations` | Standorte (mit `slug`!) |
| `packages` | Pakete/Menüs |
| `waitlist` | Warteliste-Einträge |

### Storage Buckets
| Bucket | Beschreibung |
|--------|--------------|
| `employee-images` | Mitarbeiter-Profilbilder (public) |
| `dish-images` | Gerichte-Bilder für Gastro (public) |

**RLS:** Aktiv - Service Role Key für Admin-Operationen

### Services-Tabelle (erweitert für Gastro)
```sql
-- Basis-Felder
id, tenant_id, name, description, category, price, duration_minutes, is_active

-- Kategorie-Bild (wird auf alle Gerichte der Kategorie propagiert)
category_image_url TEXT,

-- Gericht-Bild
image_url TEXT,

-- Erweiterte Kennzeichnungen (Arrays)
allergens TEXT[],           -- EU-Allergene
diet_labels TEXT[],         -- Diät-Optionen
other_labels TEXT[],        -- Sonstige Kennzeichnungen
cross_contamination TEXT[], -- Kreuzkontaminations-Hinweise

-- Legacy-Felder (noch unterstützt)
is_vegetarian BOOLEAN,
is_vegan BOOLEAN,
is_spicy BOOLEAN
```

### Allergen-Codes (EU-kennzeichnungspflichtig)
`gluten, lactose, eggs, nuts, peanuts, soy, fish, shellfish, crustaceans, molluscs, celery, mustard, sesame, sulfites, lupins`

### Diät-Labels
`vegetarian, vegan, pescatarian, flexitarian, halal, kosher, lactose_free, gluten_free, sugar_free, low_carb, keto, paleo`

### Sonstige Labels
`spicy, alcohol, caffeine, additives, colorants, preservatives, flavor_enhancers, blackened, waxed, phosphate, sweeteners`

### Kreuzkontamination
`traces_possible, no_separate_prep`

## Features Status

### Fertig ✅
- Multi-Tenant Dashboard
- **Multi-Branchen-Support** (Klinik, Gastro, Friseur, Spätkauf)
- Online-Terminbuchung (Dark Luxury Theme)
- **Tischreservierung für Gastro** (mit Personenanzahl-Auswahl)
- Subdomain-basierte Landingpages
- **Chat-Widget mit Booking-Flow** (Service → Datum → Zeit → Kontakt)
- **WhatsApp-Integration** (Buchungsanfrage per WhatsApp)
- Branchenspezifische KI-Chat-Prompts
- Dynamische Dashboard-Labels je Branche
- Kategorie-Filter (Accordion)
- **Kategorie-Bilder** (eigene Bilder pro Warengruppe, werden propagiert)
- Warteliste-System
- Email-Bestätigungen
- Mitarbeiter mit Profilbildern
- Standort-Verwaltung
- Kunden-Login + "Meine Termine"
- Mehrsprachiger Chat (DE/EN/TR/RU)
- **Moderne Speisekarte** (MenuCard) mit Bildern, Allergenen, Diät-Icons
- **Erweiterte Gastro-Labels:** 12 Diät-Optionen, 15 EU-Allergene, 11 sonstige Labels, Kreuzkontamination
- **Gastro-Dashboard** mit Bild-Upload, Allergen-Auswahl, Kategorie-Bilder

### Demo-Tenants
| Tenant | Login | Passwort |
|--------|-------|----------|
| Demo-Klinik | demo@esylana.de | - |
| Ristorante Milano | gastro@esylana.de | Gastro2025! |

### Geplant 📋
- Warenkorb (mehrere Behandlungen)
- Online-Zahlung (Stripe)
- Embeddable Booking Widget
- Custom Domain Support
- Gutschein-System
- SMS/WhatsApp Erinnerungen

## Gastro Tischreservierung

### Buchungsflow (booking-form.tsx)
1. **Personenanzahl** (1-10+ Gäste, mit +/- Buttons und Quick-Select)
2. **Datum** (nächste 14 Tage)
3. **Uhrzeit** (Restaurant-Öffnungszeiten: 11:00-14:00, 17:00-22:00)
4. **Kontaktdaten** (Name, Email, Telefon, Anmerkungen)
5. **Bestätigung**

### Backend (public-booking.ts)
- `getGastroSlots()` - Generiert verfügbare Zeitslots
- `createGastroReservation()` - Erstellt Reservierung mit automatischem "Tischreservierung" Service

## Chat-Widget Features

### Booking-Flow im Chat
1. "Direkt Termin buchen" Button
2. Service-Auswahl (nach Kategorien gruppiert)
3. Datum-Auswahl (nächste 14 Tage, ohne Sonntag)
4. Zeit-Auswahl (basierend auf Verfügbarkeit)
5. Kontaktdaten-Formular
6. Bestätigung + Buchung

### WhatsApp-Integration
- "Lieber per WhatsApp buchen?" Link während Booking-Flow
- Vorgefertigte Nachricht mit allen Buchungsdetails
- Benötigt `whatsapp_number` in tenants-Tabelle

### Branchenspezifische Prompts
- **Klinik:** Beauty-Beratung, Behandlungsempfehlungen
- **Gastro:** Restaurant-Host, Menü-Empfehlungen, Allergien
- **Friseur:** Styling-Beratung
- **Spätkauf:** Produkt-Info, Bestellungen

## Häufige Befehle

```bash
# Lokal entwickeln
npm run dev

# Build testen
npm run build

# Demo-Klinik seeden
npx tsx scripts/seed-demo-services.ts

# Demo-Restaurant seeden
npx tsx scripts/seed-demo-gastro.ts

# Git Workflow
git add -A && git commit -m "message" && git push origin main

# Deploy auf VPS (nach git push)
# Siehe "Deploy via Python" oben
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://hccoltgswaqhpyzswvwa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://esylana.de
OPENAI_API_KEY=sk-... (für Chat)
```

## next.config.ts

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}
```

## Bekannte Lösungen

### "Server Action not found" (404)
→ API Routes statt Server Actions für Auth nutzen

### "supabaseKey is required"
→ Nach Build: `cp .env.local .next/standalone/`

### SSL Zertifikat Fehler
→ AAAA Records bei Hostinger löschen, nur A Records

### Neue Subdomain zeigt 404
→ Traefik Config fehlt! Siehe "Traefik - Neue Subdomain hinzufügen"

### Traefik Container neustarten
```bash
docker restart root-traefik-1
```

### Port 3000 belegt
```bash
pm2 delete all && pkill -f "node.*server.js"
pm2 start npm --name "esylana" -- start && pm2 save
```

### Server nicht aktualisiert
```bash
git fetch origin && git reset --hard origin/main
```

### Dialog zeigt alte Werte
→ useEffect für State-Reset wenn Dialog öffnet (service-dialog.tsx)

### Kategorie-Bild wird nicht angezeigt
→ MenuCard muss `category_image_url` aus Items verwenden, nicht hardcodierte Bilder

## Design System (Landing & Booking)

```
Background:  #0a0a0a (fast schwarz)
Cards:       bg-white/5, border-white/10
Akzent:      amber-400 (text), amber-500 (buttons/active)
Hover:       amber-500/50 (borders)
Text:        white, white/70 (secondary), white/50 (muted)
Font:        Light weights, tracking-wide, uppercase für Labels
Buttons:     bg-amber-500, text-black, hover:bg-amber-400
```

## DNS bei Hostinger

| Typ | Name | Ziel |
|-----|------|------|
| A | @ | 72.60.36.113 |
| A | www | 72.60.36.113 |
| A | demo | 72.60.36.113 |
| A | gastro | 72.60.36.113 |

**Keine AAAA Records!** (blockiert SSL)

## Gastro-Speisekarte (MenuCard)

### Features
- Eigene Kategorie-Bilder (aus DB, Fallback auf Defaults)
- Hochwertige Bilder pro Gericht
- Allergen-Badges mit Icons und Farben
- Vegetarisch/Vegan/Scharf Icons
- Kategorien mit ausklappbaren Header-Bildern
- Responsive Grid (1-4 Spalten)
- Hover-Effekte und Animationen
- Allergen-Legende am Anfang

### Kategorie-Bild Logik
1. User lädt Kategorie-Bild bei einem Gericht hoch
2. `category_image_url` wird in DB gespeichert
3. Propagierung: Alle anderen Gerichte der gleichen Kategorie bekommen dasselbe Bild
4. MenuCard: Sucht erstes Gericht mit `category_image_url`, nutzt das als Header

### Dashboard-Features (Gastro)
- Bild-Upload mit Client-side Komprimierung (max 500KB)
- Kategorie-Bild Upload direkt im Gericht-Dialog
- 15 EU-Allergen-Checkboxen
- 12 Diät-Label-Checkboxen
- 11 Sonstige-Label-Checkboxen
- 2 Kreuzkontaminations-Optionen
- Vorschau der Bilder in der Liste
- Dynamische Labels (Gericht statt Behandlung)

### Komponenten
```
components/menu-card.tsx          - Speisekarten-Anzeige auf Landing
app/dashboard/services/
  service-dialog.tsx              - Formular mit Gastro-Feldern + Kategorie-Bild
  services-list.tsx               - Liste mit Bild-Vorschau
  page.tsx                        - Lädt businessType für Labels
lib/actions/services.ts           - CRUD mit Kategorie-Bild-Propagierung
```

## Letzte Änderungen (Januar 2026)

1. **Tischreservierung** - Gastro-Buchungsflow mit Personenanzahl
2. **Erweiterte Labels** - 12 Diät, 15 Allergene, 11 Sonstige, 2 Kreuzkontamination
3. **Kategorie-Bilder** - Eigene Bilder pro Warengruppe, automatische Propagierung
4. **Dialog State Reset** - useEffect für korrektes Zurücksetzen bei neuem/anderem Gericht
5. **MenuCard Fix** - Nutzt jetzt category_image_url aus DB statt hardcodierte Unsplash-Bilder
