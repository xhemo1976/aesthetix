-- Create categories table for gastronomy menu categories with images
-- Run this in Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique category names per tenant
  UNIQUE(tenant_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(tenant_id, sort_order);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view categories of their tenant
CREATE POLICY "Users can view own tenant categories" ON categories
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can insert categories for their tenant
CREATE POLICY "Users can insert own tenant categories" ON categories
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update categories of their tenant
CREATE POLICY "Users can update own tenant categories" ON categories
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete categories of their tenant
CREATE POLICY "Users can delete own tenant categories" ON categories
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Public can view active categories (for public menu pages)
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = true);

-- Add category_id to services table (optional foreign key)
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);

-- Also add the diet_labels, other_labels, cross_contamination columns if not exists
ALTER TABLE services ADD COLUMN IF NOT EXISTS diet_labels TEXT[] DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS other_labels TEXT[] DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cross_contamination TEXT[] DEFAULT NULL;

-- Add comments
COMMENT ON TABLE categories IS 'Menu categories for gastronomy with images';
COMMENT ON COLUMN categories.sort_order IS 'Display order (lower = first)';
COMMENT ON COLUMN services.category_id IS 'Optional reference to categories table';
