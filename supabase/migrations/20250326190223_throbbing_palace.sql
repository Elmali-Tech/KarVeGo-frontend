/*
  # Fix RLS policies for profiles table

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create separate policies for each operation type
    - Add policy for public insert during registration
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Allow public insert for initial profile creation
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON profiles;

-- Create separate policies for each operation
CREATE POLICY "Enable insert for registration"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read for own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);