/*
  # Fix RLS policies for profiles table

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new unified policies for CRUD operations
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new unified policies
CREATE POLICY "Enable all operations for users based on user_id"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);