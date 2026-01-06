-- Social Media Fields für tenants Tabelle
-- Führe dieses Script in Supabase SQL Editor aus

-- Instagram URL
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Facebook URL
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Google Place/Maps URL
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_place_url TEXT;

-- Website URL
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS website_url TEXT;

-- WhatsApp Number (falls noch nicht vorhanden)
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Kommentar hinzufügen
COMMENT ON COLUMN tenants.instagram_url IS 'Instagram Profil URL';
COMMENT ON COLUMN tenants.facebook_url IS 'Facebook Seiten URL';
COMMENT ON COLUMN tenants.google_place_url IS 'Google Maps/Business URL für Bewertungen';
COMMENT ON COLUMN tenants.website_url IS 'Eigene Website URL';
