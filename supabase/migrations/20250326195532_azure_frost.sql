/*
  # Create sender profiles table

  1. New Tables
    - `sender_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text): Sender/Brand name
      - `website` (text): Website URL
      - `instagram` (text): Instagram handle
      - `logo_url` (text): Logo image URL
      - `sms_enabled` (boolean): SMS notifications enabled
      - `allow_customer_returns` (boolean): Allow customers to create return codes
      - `status` (text): Profile status (PENDING/APPROVED)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS sender_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  instagram text,
  logo_url text,
  sms_enabled boolean DEFAULT false,
  allow_customer_returns boolean DEFAULT false,
  status text DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sender_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own sender profiles"
  ON sender_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sender profiles"
  ON sender_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sender profiles"
  ON sender_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sender profiles"
  ON sender_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_sender_profiles_updated_at
  BEFORE UPDATE ON sender_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();