-- Add profile_image_url and bio columns to employees table
-- Run this in Supabase SQL Editor

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create storage bucket for employee images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-images', 'employee-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to employee images
CREATE POLICY IF NOT EXISTS "Public read access for employee images"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-images');

-- Allow authenticated users to upload employee images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload employee images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their employee images
CREATE POLICY IF NOT EXISTS "Authenticated users can update employee images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'employee-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete employee images
CREATE POLICY IF NOT EXISTS "Authenticated users can delete employee images"
ON storage.objects FOR DELETE
USING (bucket_id = 'employee-images' AND auth.role() = 'authenticated');
