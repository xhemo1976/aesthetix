-- Fix RLS policies to allow signup

-- Allow authenticated users to INSERT their first tenant
CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to INSERT their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
