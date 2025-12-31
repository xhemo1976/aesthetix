-- Chat events table for n8n integration
CREATE TABLE IF NOT EXISTS chat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'new_conversation', 'booking_intent', 'consultation_request', 'complaint', 'lead_captured'
  user_message TEXT NOT NULL,
  assistant_reply TEXT NOT NULL,
  intent TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS chat_events_tenant_idx ON chat_events(tenant_id);
CREATE INDEX IF NOT EXISTS chat_events_type_idx ON chat_events(event_type);
CREATE INDEX IF NOT EXISTS chat_events_processed_idx ON chat_events(processed);
CREATE INDEX IF NOT EXISTS chat_events_created_idx ON chat_events(created_at DESC);

-- RLS policies
ALTER TABLE chat_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage chat_events" ON chat_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tenant admins can view their events
CREATE POLICY "Tenant admins can view chat_events" ON chat_events
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Leads table for captured contact information
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'chat', -- 'chat', 'website', 'referral'
  interest TEXT, -- what they're interested in
  notes TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_tenant_idx ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC);

-- RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage leads" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tenant admins can manage leads" ON leads
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
