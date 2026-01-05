-- =====================================================
-- ESYLANA - KOMPLETTES DATENBANK-SCHEMA
-- Kopiere ALLES und fuehre es im Supabase SQL Editor aus
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (Multi-Tenant Architecture)
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('beauty_clinic', 'hairdresser', 'gastronomy', 'late_shop')),
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  whatsapp_number TEXT,
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'canceled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Berlin',
  locale TEXT DEFAULT 'de',
  currency TEXT DEFAULT 'EUR',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX idx_tenants_whatsapp ON tenants(whatsapp_number);

-- ============================================
-- USERS (Staff/Employees)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff', 'receptionist')),
  is_active BOOLEAN DEFAULT true,
  job_title TEXT,
  bio TEXT,
  specialties TEXT[],
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  notes TEXT,
  medical_notes TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  sms_consent BOOLEAN DEFAULT false,
  total_appointments INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(first_name, last_name);

-- ============================================
-- EMPLOYEES
-- ============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'stylist',
  specialties TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  commission_percentage NUMERIC(5,2) DEFAULT 0,
  work_schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_is_active ON employees(is_active);

-- ============================================
-- LOCATIONS
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  phone TEXT,
  email TEXT,
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_locations_tenant ON locations(tenant_id);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_active ON locations(is_active);

-- ============================================
-- EMPLOYEE_LOCATIONS
-- ============================================
CREATE TABLE employee_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  work_schedule JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, location_id)
);

CREATE INDEX idx_employee_locations_employee ON employee_locations(employee_id);
CREATE INDEX idx_employee_locations_location ON employee_locations(location_id);

-- ============================================
-- SERVICES / TREATMENTS
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2),
  image_url TEXT,
  staff_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_location ON services(location_id);

-- ============================================
-- APPOINTMENTS / BOOKINGS
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show')),
  price DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  customer_notes TEXT,
  staff_notes TEXT,
  cancellation_reason TEXT,
  reminder_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmation_token TEXT UNIQUE,
  customer_confirmed_at TIMESTAMPTZ,
  customer_response TEXT CHECK (customer_response IN ('confirmed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX idx_appointments_location ON appointments(location_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_confirmation_token ON appointments(confirmation_token);

-- ============================================
-- STAFF SCHEDULES / WORKING HOURS
-- ============================================
CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, staff_id, day_of_week)
);

CREATE INDEX idx_staff_schedules_tenant ON staff_schedules(tenant_id);
CREATE INDEX idx_staff_schedules_staff ON staff_schedules(staff_id);

-- ============================================
-- STAFF TIME OFF / HOLIDAYS
-- ============================================
CREATE TABLE staff_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_time_off_tenant ON staff_time_off(tenant_id);
CREATE INDEX idx_staff_time_off_staff ON staff_time_off(staff_id);
CREATE INDEX idx_staff_time_off_dates ON staff_time_off(start_date, end_date);

-- ============================================
-- WAITLIST
-- ============================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  preferred_date_from DATE NOT NULL,
  preferred_date_to DATE NOT NULL,
  preferred_time_from TIME,
  preferred_time_to TIME,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired', 'canceled')),
  priority INTEGER DEFAULT 0,
  notified_at TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,
  last_notification_slot TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT waitlist_contact_required CHECK (customer_email IS NOT NULL OR customer_phone IS NOT NULL)
);

CREATE INDEX idx_waitlist_tenant_status ON waitlist(tenant_id, status);
CREATE INDEX idx_waitlist_service ON waitlist(service_id);
CREATE INDEX idx_waitlist_dates ON waitlist(preferred_date_from, preferred_date_to);
CREATE INDEX idx_waitlist_employee ON waitlist(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_waitlist_location ON waitlist(location_id) WHERE location_id IS NOT NULL;

-- ============================================
-- PACKAGES
-- ============================================
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  package_type TEXT NOT NULL DEFAULT 'bundle' CHECK (package_type IN ('bundle', 'multiuse')),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  total_uses INTEGER DEFAULT 1,
  original_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  validity_days INTEGER,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  max_purchases INTEGER,
  max_per_customer INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE package_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  UNIQUE(package_id, service_id)
);

CREATE TABLE customer_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  total_uses INTEGER NOT NULL,
  uses_remaining INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'fully_used', 'canceled', 'refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE package_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_package_id UUID NOT NULL REFERENCES customer_packages(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  package_item_id UUID REFERENCES package_items(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX idx_packages_tenant ON packages(tenant_id);
CREATE INDEX idx_packages_active ON packages(tenant_id, is_active);
CREATE INDEX idx_customer_packages_customer ON customer_packages(customer_id);
CREATE INDEX idx_customer_packages_status ON customer_packages(status);
CREATE INDEX idx_package_redemptions_customer_package ON package_redemptions(customer_package_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER customer_packages_updated_at BEFORE UPDATE ON customer_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
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

CREATE OR REPLACE FUNCTION expire_old_waitlist_entries()
RETURNS void AS $$
BEGIN
  UPDATE waitlist
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'waiting'
    AND preferred_date_to < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_redemptions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

-- TENANTS
CREATE POLICY "Users can view their own tenant" ON tenants FOR SELECT
  USING (id = public.user_tenant_id());
CREATE POLICY "Owners can update their tenant" ON tenants FOR UPDATE
  USING (id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "Authenticated users can create tenants" ON tenants FOR INSERT
  TO authenticated WITH CHECK (true);

-- USERS
CREATE POLICY "Users can view users in their tenant" ON users FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "Admins can manage users in their tenant" ON users FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- CUSTOMERS
CREATE POLICY "Users can view customers in their tenant" ON customers FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Users can manage customers in their tenant" ON customers FOR ALL
  USING (tenant_id = public.user_tenant_id());

-- SERVICES
CREATE POLICY "Users can view services in their tenant" ON services FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Admins can manage services in their tenant" ON services FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- APPOINTMENTS
CREATE POLICY "Users can view appointments in their tenant" ON appointments FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Users can manage appointments in their tenant" ON appointments FOR ALL
  USING (tenant_id = public.user_tenant_id());

-- STAFF SCHEDULES
CREATE POLICY "Users can view schedules in their tenant" ON staff_schedules FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Users can manage their own schedule" ON staff_schedules FOR ALL
  USING (staff_id = auth.uid());
CREATE POLICY "Admins can manage all schedules in their tenant" ON staff_schedules FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- STAFF TIME OFF
CREATE POLICY "Users can view time off in their tenant" ON staff_time_off FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Staff can manage their own time off" ON staff_time_off FOR ALL
  USING (staff_id = auth.uid());
CREATE POLICY "Admins can manage all time off in their tenant" ON staff_time_off FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- EMPLOYEES
CREATE POLICY "Users can view employees in their tenant" ON employees FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Admins can manage employees in their tenant" ON employees FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- LOCATIONS
CREATE POLICY "Users can view locations in their tenant" ON locations FOR SELECT
  USING (tenant_id = public.user_tenant_id());
CREATE POLICY "Admins can manage locations in their tenant" ON locations FOR ALL
  USING (tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- EMPLOYEE_LOCATIONS
CREATE POLICY "Users can view employee locations in their tenant" ON employee_locations FOR SELECT
  USING (EXISTS (SELECT 1 FROM locations l WHERE l.id = location_id AND l.tenant_id = public.user_tenant_id()));
CREATE POLICY "Admins can manage employee locations in their tenant" ON employee_locations FOR ALL
  USING (EXISTS (SELECT 1 FROM locations l WHERE l.id = location_id AND l.tenant_id = public.user_tenant_id() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))));

-- WAITLIST
CREATE POLICY "Users can view waitlist for their tenant" ON waitlist FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert waitlist for their tenant" ON waitlist FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update waitlist for their tenant" ON waitlist FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete waitlist for their tenant" ON waitlist FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- PACKAGES
CREATE POLICY "Users can view packages for their tenant" ON packages FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage packages for their tenant" ON packages FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- PACKAGE_ITEMS
CREATE POLICY "Users can view package items for their tenant" ON package_items FOR SELECT
  USING (package_id IN (SELECT id FROM packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage package items for their tenant" ON package_items FOR ALL
  USING (package_id IN (SELECT id FROM packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- CUSTOMER_PACKAGES
CREATE POLICY "Users can view customer packages for their tenant" ON customer_packages FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage customer packages for their tenant" ON customer_packages FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- PACKAGE_REDEMPTIONS
CREATE POLICY "Users can view redemptions for their tenant" ON package_redemptions FOR SELECT
  USING (customer_package_id IN (SELECT id FROM customer_packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage redemptions for their tenant" ON package_redemptions FOR ALL
  USING (customer_package_id IN (SELECT id FROM customer_packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- ============================================
-- DONE!
-- ============================================
