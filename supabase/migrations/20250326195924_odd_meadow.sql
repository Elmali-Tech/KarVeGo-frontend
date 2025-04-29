/*
  # Create addresses table

  1. New Tables
    - `addresses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text): Address name/title
      - `phone` (text): Contact phone number
      - `city` (text): City name
      - `district` (text): District name
      - `address` (text): Full address
      - `is_default` (boolean): Whether this is the default address
      - `type` (text): Address type (BILLING/SHIPPING)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  city text NOT NULL,
  district text NOT NULL,
  address text NOT NULL,
  is_default boolean DEFAULT false,
  type text NOT NULL CHECK (type IN ('BILLING', 'SHIPPING')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create addresses"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON addresses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();