-- Waitlist table for customers waiting for appointments
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Customer info (for guests without customer record)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,

  -- Preferred date range
  preferred_date_from DATE NOT NULL,
  preferred_date_to DATE NOT NULL,

  -- Preferred time range (optional)
  preferred_time_from TIME,
  preferred_time_to TIME,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired', 'canceled')),
  priority INTEGER DEFAULT 0, -- Higher = more priority

  -- Notification tracking
  notified_at TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,
  last_notification_slot TIMESTAMPTZ, -- The slot they were notified about

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-expire entries after preferred_date_to

  -- Constraints
  CONSTRAINT waitlist_contact_required CHECK (customer_email IS NOT NULL OR customer_phone IS NOT NULL)
);

-- Index for efficient querying
CREATE INDEX idx_waitlist_tenant_status ON waitlist(tenant_id, status);
CREATE INDEX idx_waitlist_service ON waitlist(service_id);
CREATE INDEX idx_waitlist_dates ON waitlist(preferred_date_from, preferred_date_to);
CREATE INDEX idx_waitlist_employee ON waitlist(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_waitlist_location ON waitlist(location_id) WHERE location_id IS NOT NULL;

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view waitlist for their tenant"
  ON waitlist FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert waitlist for their tenant"
  ON waitlist FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update waitlist for their tenant"
  ON waitlist FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete waitlist for their tenant"
  ON waitlist FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER waitlist_updated_at
  BEFORE UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

-- Function to auto-expire old waitlist entries
CREATE OR REPLACE FUNCTION expire_old_waitlist_entries()
RETURNS void AS $$
BEGIN
  UPDATE waitlist
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'waiting'
    AND preferred_date_to < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
