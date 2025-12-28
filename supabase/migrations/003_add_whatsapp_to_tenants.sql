-- Add WhatsApp number field to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add index for WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_tenants_whatsapp ON tenants(whatsapp_number);
