-- Packages/Offers table for service bundles and multi-use packages
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Package info
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Package type: 'bundle' (multiple services) or 'multiuse' (same service X times)
  package_type TEXT NOT NULL DEFAULT 'bundle' CHECK (package_type IN ('bundle', 'multiuse')),

  -- For multiuse packages: which service and how many uses
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  total_uses INTEGER DEFAULT 1, -- e.g., 10 for a "10x Massage" package

  -- Pricing
  original_price DECIMAL(10,2) NOT NULL, -- Sum of individual services
  sale_price DECIMAL(10,2) NOT NULL, -- Discounted package price
  discount_percentage DECIMAL(5,2), -- Calculated discount %

  -- Validity
  validity_days INTEGER, -- How long the package is valid after purchase (NULL = unlimited)
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Show prominently

  -- Limits
  max_purchases INTEGER, -- Max total purchases (NULL = unlimited)
  max_per_customer INTEGER DEFAULT 1, -- Max per customer

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package items (services included in a bundle package)
CREATE TABLE IF NOT EXISTS package_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1, -- How many of this service in the package

  UNIQUE(package_id, service_id)
);

-- Customer package purchases
CREATE TABLE IF NOT EXISTS customer_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,

  -- Purchase info
  purchase_price DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validity
  expires_at TIMESTAMPTZ, -- Calculated from package validity_days

  -- Usage tracking (for multiuse packages)
  total_uses INTEGER NOT NULL, -- Copied from package at purchase time
  uses_remaining INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'fully_used', 'canceled', 'refunded')),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package redemptions (tracks each use of a package)
CREATE TABLE IF NOT EXISTS package_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_package_id UUID NOT NULL REFERENCES customer_packages(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,

  -- For bundle packages: which item was redeemed
  package_item_id UUID REFERENCES package_items(id) ON DELETE SET NULL,

  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Staff who processed

  notes TEXT
);

-- Indexes
CREATE INDEX idx_packages_tenant ON packages(tenant_id);
CREATE INDEX idx_packages_active ON packages(tenant_id, is_active);
CREATE INDEX idx_customer_packages_customer ON customer_packages(customer_id);
CREATE INDEX idx_customer_packages_status ON customer_packages(status);
CREATE INDEX idx_package_redemptions_customer_package ON package_redemptions(customer_package_id);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Users can view packages for their tenant"
  ON packages FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage packages for their tenant"
  ON packages FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- RLS Policies for package_items
CREATE POLICY "Users can view package items for their tenant"
  ON package_items FOR SELECT
  USING (package_id IN (SELECT id FROM packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage package items for their tenant"
  ON package_items FOR ALL
  USING (package_id IN (SELECT id FROM packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- RLS Policies for customer_packages
CREATE POLICY "Users can view customer packages for their tenant"
  ON customer_packages FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage customer packages for their tenant"
  ON customer_packages FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- RLS Policies for package_redemptions
CREATE POLICY "Users can view redemptions for their tenant"
  ON package_redemptions FOR SELECT
  USING (customer_package_id IN (SELECT id FROM customer_packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage redemptions for their tenant"
  ON package_redemptions FOR ALL
  USING (customer_package_id IN (SELECT id FROM customer_packages WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at();

CREATE TRIGGER customer_packages_updated_at
  BEFORE UPDATE ON customer_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at();
