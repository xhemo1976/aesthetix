-- ============================================
-- LOCATIONS (Multi-Location Support)
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- For booking URL: /book/[tenant-slug]/[location-slug]

  -- Contact Info
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  phone TEXT,
  email TEXT,
  whatsapp_number TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Primary/default location

  -- Opening hours as JSON
  opening_hours JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_locations_tenant ON locations(tenant_id);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_active ON locations(is_active);

-- ============================================
-- EMPLOYEE_LOCATIONS (Many-to-Many)
-- ============================================
CREATE TABLE employee_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Optional: different work schedule per location
  work_schedule JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, location_id)
);

CREATE INDEX idx_employee_locations_employee ON employee_locations(employee_id);
CREATE INDEX idx_employee_locations_location ON employee_locations(location_id);

-- ============================================
-- ADD LOCATION_ID TO SERVICES
-- ============================================
ALTER TABLE services ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
CREATE INDEX idx_services_location ON services(location_id);

-- ============================================
-- ADD LOCATION_ID TO APPOINTMENTS
-- ============================================
ALTER TABLE appointments ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX idx_appointments_location ON appointments(location_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;

-- LOCATIONS Policies
CREATE POLICY "Users can view locations in their tenant"
  ON locations FOR SELECT
  USING (tenant_id = public.user_tenant_id());

CREATE POLICY "Admins can manage locations in their tenant"
  ON locations FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- EMPLOYEE_LOCATIONS Policies
CREATE POLICY "Users can view employee locations in their tenant"
  ON employee_locations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM locations l WHERE l.id = location_id AND l.tenant_id = public.user_tenant_id()
  ));

CREATE POLICY "Admins can manage employee locations in their tenant"
  ON employee_locations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = location_id
    AND l.tenant_id = public.user_tenant_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  ));

-- ============================================
-- MIGRATE EXISTING DATA
-- Create a default location for each tenant that has employees/services
-- ============================================
INSERT INTO locations (tenant_id, name, slug, address, city, postal_code, phone, email, whatsapp_number, is_primary, is_active)
SELECT
  t.id,
  'Hauptstandort',
  'main',
  t.address,
  t.city,
  t.postal_code,
  t.contact_phone,
  t.contact_email,
  t.whatsapp_number,
  true,
  true
FROM tenants t
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.tenant_id = t.id)
   OR EXISTS (SELECT 1 FROM services s WHERE s.tenant_id = t.id);

-- Assign existing employees to the default location
INSERT INTO employee_locations (employee_id, location_id)
SELECT e.id, l.id
FROM employees e
JOIN locations l ON l.tenant_id = e.tenant_id AND l.is_primary = true;

-- Assign existing services to the default location
UPDATE services s
SET location_id = l.id
FROM locations l
WHERE l.tenant_id = s.tenant_id AND l.is_primary = true AND s.location_id IS NULL;

-- Assign existing appointments to the default location
UPDATE appointments a
SET location_id = l.id
FROM locations l
WHERE l.tenant_id = a.tenant_id AND l.is_primary = true AND a.location_id IS NULL;
