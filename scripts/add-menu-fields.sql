-- Migration: Add menu-specific fields to services table
-- Run this in Supabase SQL Editor

-- Add image_url for dish photos
ALTER TABLE services
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add allergens as JSONB array for flexibility
-- Example: ["gluten", "lactose", "nuts"]
ALTER TABLE services
ADD COLUMN IF NOT EXISTS allergens TEXT[];

-- Add additional gastro-specific fields
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT false;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT false;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_spicy BOOLEAN DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN services.image_url IS 'URL to dish image in Supabase Storage';
COMMENT ON COLUMN services.allergens IS 'Array of allergen codes: gluten, lactose, eggs, nuts, peanuts, soy, fish, shellfish, celery, mustard, sesame, sulfites';
COMMENT ON COLUMN services.is_vegetarian IS 'Dish is vegetarian';
COMMENT ON COLUMN services.is_vegan IS 'Dish is vegan (also vegetarian)';
COMMENT ON COLUMN services.is_spicy IS 'Dish is spicy';

-- Create storage bucket for dish images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-images', 'dish-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for dish images
CREATE POLICY "Public read dish images" ON storage.objects
FOR SELECT USING (bucket_id = 'dish-images');

CREATE POLICY "Auth upload dish images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'dish-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete dish images" ON storage.objects
FOR DELETE USING (bucket_id = 'dish-images' AND auth.role() = 'authenticated');
