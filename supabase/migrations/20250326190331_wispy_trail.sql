/*
  # Fix RLS policies for registration

  1. Changes
    - Drop existing policies
    - Create new policies that allow public access for registration
    - Maintain secure access for other operations
  
  2. Security
    - Enable public access for profile creation during registration
    - Maintain authenticated-only access for other operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
DROP POLICY IF EXISTS "Enable read for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for own profile" ON profiles;

-- Create new policies
CREATE POLICY "Public insert for registration"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Read own profile only"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Update own profile only"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Delete own profile only"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);