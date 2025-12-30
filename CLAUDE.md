# Esylana - Projekt Kontext

## Überblick

**Esylana** ist eine SaaS-Plattform für Schönheitskliniken und Ästhetik-Praxen.
- Multi-Tenant Architektur
- Online-Terminbuchung mit Subdomain-Support
- Luxus-Landingpages für Kunden-Kliniken
- KI-Chatbot für Kundenanfragen

**Repository:** github.com/xhemo1976/aesthetix

## Tech Stack

- **Framework:** Next.js 15 (App Router, Standalone Output)
- **Database:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Hostinger VPS (KVM 4)
- **Process Manager:** PM2
- **Reverse Proxy:** Traefik (mit Let's Encrypt SSL)

## Projekt-Struktur

```
/app
  /api/auth           - Login/Signup API Routes
  /book/[slug]        - Öffentliche Buchungsseite
  /dashboard          - Admin Dashboard (Multi-Tenant)
  /login, /signup     - Auth Seiten
  page.tsx            - Landing (SaaS oder Klinik je nach Subdomain)

/components
  clinic-landing.tsx  - Luxus-Landingpage für Kliniken
  chat-widget.tsx     - KI-Chatbot

/lib
  /actions            - Server Actions
    tenant-domain.ts  - Subdomain → Tenant Mapping
    services.ts       - CRUD für Behandlungen
    public-booking.ts - Buchungs-Logik
  /supabase
    server.ts         - Supabase Client (mit Cookies)
    admin.ts          - Service Role Client

/scripts
  seed-demo-services.ts - Demo-Daten (34 Behandlungen)
```

## Domains & Subdomains

| Domain | Zeigt |
|--------|-------|
| esylana.de | SaaS Landing Page |
| esylana.de/dashboard | Admin Dashboard |
| esylana.de/book/[slug] | Buchungsseite |
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
| `customers` | Endkunden der Kliniken |
| `services` | Behandlungen (mit `category`!) |
| `appointments` | Termine |
| `employees` | Mitarbeiter |
| `locations` | Standorte |
| `packages` | Behandlungs-Pakete |

**RLS:** Aktiv - Service Role Key für Admin-Operationen

## Features Status

### Fertig ✅
- Multi-Tenant Dashboard
- Online-Terminbuchung
- Subdomain-basierte Klinik-Landingpages
- Luxus-Design Template (dark theme, gold accents)
- Kategorie-Filter für Behandlungen (Landing + Booking)
- Warteliste-System
- Email-Bestätigungen
- Mitarbeiter & Standort Verwaltung
- Demo-Klinik mit 34 Behandlungen (3 Kategorien)

### In Arbeit 🚧
- Kunden-Login (Email/Passwort für Endkunden)
- Warenkorb (mehrere Behandlungen buchen)
- Online-Zahlung (Stripe)

### Geplant 📋
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

## Design System (Klinik-Landing)

```
Background:  #0a0a0a (fast schwarz)
Akzent:      amber-400/500/600 (gold)
Text:        white, white/70, white/50
Font:        Light weights, letter-spacing wide
Bilder:      Unsplash high-quality beauty/cosmetic
```

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
