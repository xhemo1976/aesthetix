-- Add customer confirmation fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_response TEXT CHECK (customer_response IN ('confirmed', 'declined'));

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_token ON appointments(confirmation_token);

-- Function to generate random confirmation token
CREATE OR REPLACE FUNCTION generate_confirmation_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
