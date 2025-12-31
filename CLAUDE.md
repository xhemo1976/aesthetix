# Esylana - Projekt Kontext

## Überblick

**Esylana** ist eine SaaS-Plattform für Schönheitskliniken und Ästhetik-Praxen.
- Multi-Tenant Architektur
- Online-Terminbuchung mit Subdomain-Support
- Luxus-Landingpages für Kunden-Kliniken (Dark Theme)
- Kunden-Login System (Email/Passwort)
- KI-Chatbot für Kundenanfragen

**Repository:** github.com/xhemo1976/aesthetix

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router, Standalone Output)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Hostinger VPS (KVM 4)
- **Process Manager:** PM2
- **Reverse Proxy:** Traefik (mit Let's Encrypt SSL)
- **Image Compression:** browser-image-compression (Client-side)

## Projekt-Struktur

```
/app
  /api
    /auth               - Staff Login/Signup/Logout
    /customer/auth      - Kunden Login/Signup
    /chat               - KI-Chat Endpoint
    /debug              - Supabase Connection Test
  /book/[slug]          - Öffentliche Buchungsseite (Dark Theme)
    /success            - Buchungsbestätigung
    /[location]         - Multi-Standort Buchung
    booking-form.tsx    - Mehrstufiges Buchungsformular
    waitlist-form.tsx   - Warteliste
    location-selector.tsx
  /confirm/[token]      - Terminbestätigung
  /customer
    /login              - Kunden-Login
    /signup             - Kunden-Registrierung
    /termine            - "Meine Termine" für Kunden
  /dashboard            - Admin Dashboard (Multi-Tenant)
    /employees          - Mitarbeiterverwaltung (mit Profilbildern)
    /services           - Behandlungen
    /customers          - Kundenverwaltung
    /appointments       - Termine
    /calendar           - Kalenderansicht
    /analytics          - Statistiken
    /locations          - Standorte
    /packages           - Behandlungspakete
    /reminders          - Erinnerungen
    /waitlist           - Warteliste
    /settings           - Einstellungen
  /team/[slug]          - Öffentliche Team-Seite (optional)
  /login, /signup       - Staff Auth Seiten
  page.tsx              - Landing (SaaS oder Klinik je nach Subdomain)

/components
  clinic-landing.tsx    - Luxus-Landingpage (Dark Theme, Accordion Services)
  chat-widget.tsx       - KI-Chatbot
  /ui                   - shadcn/ui Komponenten

/lib
  /actions
    tenant-domain.ts    - Subdomain → Tenant Mapping
    services.ts         - CRUD für Behandlungen
    employees.ts        - CRUD + Bild-Upload für Mitarbeiter
    public-booking.ts   - Buchungs-Logik
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
  seed-demo-services.ts           - Demo-Behandlungen
  add-employee-profile-fields.sql - DB Migration für Mitarbeiterbilder
```

## Domains & Subdomains

| Domain | Zeigt |
|--------|-------|
| esylana.de | SaaS Landing Page |
| esylana.de/dashboard | Admin Dashboard |
| esylana.de/book/[slug] | Buchungsseite (Dark Theme) |
| demo.esylana.de | Demo-Klinik Kundenwebsite |
| [kunde].esylana.de | Kunden-Klinik Website |

**Subdomain-Erkennung:** `app/page.tsx` prüft Host-Header
**Mapping:** `lib/actions/tenant-domain.ts`

## VPS Setup

**Server:** 72.60.36.113 (Hostinger KVM 4, bis 2027-08-22)

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

### Pfade auf VPS
```
/var/www/esylana/              # App
/var/www/esylana/.env.local    # Env Vars
/root/docker-compose.yml       # Traefik + n8n
/etc/traefik/dynamic/          # Routing Configs
```

### Dienste
| Dienst | Port | Manager |
|--------|------|---------|
| Esylana | 3000 | PM2 |
| n8n | 5678 | Docker |
| Traefik | 80, 443 | Docker |

## Supabase

**URL:** https://hccoltgswaqhpyzswvwa.supabase.co

### Wichtige Tabellen
| Tabelle | Beschreibung |
|---------|--------------|
| `tenants` | Kliniken/Kunden |
| `users` | Staff/Admin Accounts |
| `customers` | Endkunden der Kliniken (mit Auth) |
| `services` | Behandlungen (mit `category`!) |
| `appointments` | Termine |
| `employees` | Mitarbeiter (mit `profile_image_url`, `bio`) |
| `locations` | Standorte |
| `packages` | Behandlungs-Pakete |
| `waitlist` | Warteliste-Einträge |

### Storage Buckets
| Bucket | Beschreibung |
|--------|--------------|
| `employee-images` | Mitarbeiter-Profilbilder (public) |

**RLS:** Aktiv - Service Role Key für Admin-Operationen

## Features Status

### Fertig ✅
- Multi-Tenant Dashboard
- Online-Terminbuchung (Dark Luxury Theme)
- Subdomain-basierte Klinik-Landingpages
- Luxus-Design Template (dark theme #0a0a0a, amber accents)
- Kategorie-Filter für Behandlungen (Accordion auf Landing)
- Warteliste-System
- Email-Bestätigungen
- Mitarbeiter-Verwaltung mit Profilbildern
- Automatische Bildkomprimierung (max 500KB, 800px)
- Standort-Verwaltung
- Demo-Klinik mit 34 Behandlungen (3 Kategorien)
- Kunden-Login (Email/Passwort für Endkunden)
- "Meine Termine" Seite für eingeloggte Kunden
- Team-Sektion auf Landing Page mit Scroll-Navigation

### Geplant 📋
- Warenkorb (mehrere Behandlungen buchen)
- Online-Zahlung (Stripe)
- Embeddable Booking Widget (JavaScript)
- Custom Domain Support pro Tenant
- Gutschein-System
- SMS/WhatsApp Erinnerungen

## Häufige Befehle

```bash
# Lokal entwickeln
npm run dev

# Build testen
npm run build

# Demo-Services seeden
npx tsx scripts/seed-demo-services.ts

# Git Workflow
git add -A && git commit -m "message" && git push origin main

# Deploy auf VPS
ssh root@72.60.36.113 "cd /var/www/esylana && git pull && npm run build && cp .env.local .next/standalone/ && pm2 restart esylana"
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
      bodySizeLimit: '5mb',  // Für Bild-Uploads
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

### RLS Recursion Error
→ Einfache Policies ohne Subqueries

### Port 3000 belegt
```bash
pm2 delete all && pkill -f "node.*server.js"
pm2 start npm --name "esylana" -- start && pm2 save
```

### Bild-Upload "Body exceeded 1MB limit"
→ `next.config.ts`: `serverActions.bodySizeLimit: '5mb'`
→ Client-side Komprimierung mit `browser-image-compression`

### useSearchParams Suspense Error
→ Komponente in `<Suspense>` wrappen

### Server nicht aktualisiert
```bash
git fetch origin && git reset --hard origin/main
```

## Design System (Klinik-Landing & Booking)

```
Background:  #0a0a0a (fast schwarz)
Cards:       bg-white/5, border-white/10
Akzent:      amber-400 (text), amber-500 (buttons/active)
Hover:       amber-500/50 (borders)
Text:        white, white/70 (secondary), white/50 (muted), white/40 (hint)
Font:        Light weights, tracking-wide, uppercase für Labels
Buttons:     bg-amber-500, text-black, hover:bg-amber-400
```

### Booking Form Steps
1. Service auswählen (Kategorie-Filter)
2. Mitarbeiter auswählen (optional)
3. Datum & Uhrzeit
4. Kontaktdaten
5. Bestätigung

## Mitarbeiter-Bilder

### Datenbank-Felder (employees)
```sql
profile_image_url TEXT,
bio TEXT
```

### Storage Policy
```sql
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'employee-images');
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'employee-images');
CREATE POLICY "Auth delete" ON storage.objects FOR DELETE USING (bucket_id = 'employee-images');
```

### Client-side Komprimierung
```typescript
import imageCompression from 'browser-image-compression'

const options = {
  maxSizeMB: 0.5,      // Max 500KB
  maxWidthOrHeight: 800,
  useWebWorker: true,
}
const compressedFile = await imageCompression(file, options)
```

## Kunden-Authentifizierung

### Registrierung
- `/customer/signup` → `/api/customer/auth/signup`
- Erstellt Supabase Auth User
- Erstellt `customers` Eintrag mit tenant_id
- Redirect zu `/book/[slug]`

### Login
- `/customer/login` → `/api/customer/auth/login`
- Prüft Email in `customers` Tabelle
- Login mit Supabase Auth
- Redirect zu `/book/[slug]`

### Buchungsformular
- Erkennt eingeloggten Kunden
- Füllt Kontaktdaten automatisch aus
- Zeigt "Meine Termine" Link

## Demo-Klinik Behandlungen

**Kategorien:** Ästhetik (15), Laser (8), Kosmetik (11)

Beispiele:
- Botox Stirn €250, Hyaluron Lippen €350
- BBL Gesicht €350, Laser Haarentfernung €89-350
- Signature Facial €129, Microneedling €199

## DNS bei Hostinger

| Typ | Name | Ziel |
|-----|------|------|
| A | @ | 72.60.36.113 |
| A | www | 72.60.36.113 |
| A | demo | 72.60.36.113 |

**Keine AAAA Records!** (blockiert SSL)
