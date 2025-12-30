# Esylana - Projektkontext für Claude

## Projekt-Übersicht

**Esylana** ist eine Multi-Tenant SaaS-Plattform für Beautykliniken und Kosmetikstudios.

- **Domain:** https://esylana.de
- **Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase, Traefik
- **Repository:** github.com/xhemo1976/aesthetix

## Hosting-Setup

### VPS (Hostinger KVM 4)
- **IP:** 72.60.36.113
- **Host:** srv970146.hstgr.cloud
- **SSH:** `ssh root@72.60.36.113`
- **Läuft bis:** 2027-08-22

### Dienste auf dem VPS
| Dienst | Port | Manager |
|--------|------|---------|
| Esylana (Next.js) | 3000 | PM2 |
| n8n | 5678 | Docker |
| Traefik (Reverse Proxy) | 80, 443 | Docker |

### Wichtige Pfade auf dem VPS
```
/var/www/esylana/          # App-Verzeichnis
/var/www/esylana/.env.local    # Umgebungsvariablen
/var/www/esylana/.next/standalone/  # Production Build
/root/docker-compose.yml   # Traefik + n8n Config
/etc/traefik/dynamic/      # Traefik Routing
```

## Supabase

- **URL:** https://hccoltgswaqhpyzswvwa.supabase.co
- **Dashboard:** https://supabase.com/dashboard
- **Email Signup:** Aktiviert (Confirm Email: deaktiviert)

## Wichtige Befehle auf dem VPS

```bash
# App Status
pm2 list
pm2 logs esylana

# App neu starten
pm2 restart esylana

# Traefik Logs
docker logs root-traefik-1 --tail 20

# Docker Container
docker ps

# Bei Code-Updates:
cd /var/www/esylana
git pull
npm install
npm run build
cp .env.local .next/standalone/
pm2 restart esylana
```

## Bekannte Lösungen

### "Server Action not found" Fehler
- Server Actions funktionieren nicht gut mit Hostinger
- Lösung: API Routes statt Server Actions verwenden (`/api/auth/signup`, `/api/auth/login`)

### "supabaseKey is required" Fehler
- `.env.local` muss in `.next/standalone/` kopiert werden
- `cp .env.local .next/standalone/`

### SSL Zertifikat Probleme
- AAAA (IPv6) Records bei Hostinger DNS löschen
- Nur A Records für @ und www auf 72.60.36.113
- Traefik nutzt HTTP-Challenge für Let's Encrypt

### Port 3000 belegt
```bash
pm2 delete all
pkill -f "node.*server.js"
pm2 start npm --name "esylana" -- start
pm2 save
```

## Lokale Entwicklung

```bash
cd /home/oem/project/aesthetix
npm run dev
```

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://hccoltgswaqhpyzswvwa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://esylana.de
```

## DNS bei Hostinger

Domain: esylana.de (bis 2027-01-01)

| Typ | Name | Ziel |
|-----|------|------|
| A | @ | 72.60.36.113 |
| A | www | 72.60.36.113 |

**Keine AAAA Records** (IPv6 blockiert SSL-Zertifikat)

## Weitere Domains

- kaigent.de (Shared Hosting, anderes Projekt)
