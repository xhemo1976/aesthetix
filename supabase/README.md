# Supabase Setup für Aesthetix

## 🚀 Schnellstart

### 1. Supabase Account erstellen

1. Gehe zu [https://supabase.com](https://supabase.com)
2. Klicke auf "Start your project"
3. Melde dich an (GitHub OAuth empfohlen)

### 2. Neues Projekt erstellen

1. Klicke auf "New Project"
2. Wähle eine Organisation (oder erstelle eine neue)
3. Projekt-Details:
   - **Name:** Aesthetix
   - **Database Password:** (Sichere das Passwort!)
   - **Region:** Frankfurt (eu-central-1) - Deutschland
   - **Pricing Plan:** Free Tier zum Testen

### 3. Datenbank Schema ausführen

1. In Supabase Dashboard: Gehe zu **SQL Editor**
2. Klicke auf "New Query"
3. Kopiere den kompletten Inhalt aus `migrations/001_initial_schema.sql`
4. Füge ihn in den SQL Editor ein
5. Klicke auf **RUN** (oder Strg+Enter)

✅ Du solltest die Nachricht sehen: "Success. No rows returned"

### 4. API Keys kopieren

1. Gehe zu **Project Settings** (Zahnrad-Symbol)
2. Klicke auf **API** im Seitenmenü
3. Kopiere folgende Werte:

   - **Project URL** → NEXT_PUBLIC_SUPABASE_URL
   - **anon/public key** → NEXT_PUBLIC_SUPABASE_ANON_KEY

### 5. Environment Variables einrichten

Erstelle eine `.env.local` Datei im Projekt-Root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

### 6. Dev Server neustarten

```bash
# Strg+C im Terminal um den Server zu stoppen
npm run dev
```

## 📊 Datenbank Struktur

### Multi-Tenant Architektur

Jede Klinik/Business ist ein eigener "Tenant" mit komplett getrennten Daten.

**Haupttabellen:**

- `tenants` - Kliniken/Businesses
- `users` - Mitarbeiter (Staff)
- `customers` - Kunden
- `services` - Behandlungen/Services
- `appointments` - Termine/Buchungen
- `staff_schedules` - Arbeitszeiten
- `staff_time_off` - Urlaub/Abwesenheiten

### Row Level Security (RLS)

Alle Tabellen sind mit RLS geschützt:
- Jeder Nutzer sieht nur Daten seines eigenen Tenants
- Automatische Filterung auf Datenbank-Ebene
- Keine Chance auf Datenlecks zwischen Tenants

## 🧪 Test-Daten einfügen (Optional)

Um die App zu testen, kannst du Test-Daten einfügen:

```sql
-- Test Tenant erstellen
INSERT INTO tenants (name, slug, business_type)
VALUES ('Beauty Clinic Test', 'beauty-test', 'beauty_clinic');

-- Services hinzufügen
INSERT INTO services (tenant_id, name, description, price, duration_minutes)
SELECT
  (SELECT id FROM tenants WHERE slug = 'beauty-test'),
  'Gesichtsbehandlung',
  'Entspannende Gesichtsbehandlung',
  89.00,
  60;
```

## 🔐 Authentication Setup

Später aktivieren wir in Supabase:
- Email/Password Auth
- OAuth (Google, Apple)
- Magic Links

## 📝 Nächste Schritte

- [ ] .env.local Datei erstellen
- [ ] API Keys einfügen
- [ ] Server neustarten
- [ ] Auth UI bauen
- [ ] Dashboard entwickeln
