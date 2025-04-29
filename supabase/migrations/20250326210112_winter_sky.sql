/*
  # Add Shopify Integration Settings

  1. New Tables
    - `integrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, integration type)
      - `shop_url` (text, Shopify shop URL)
      - `access_token` (text, Shopify access token)
      - `webhook_id` (text, Shopify webhook ID)
      - `is_active` (boolean, integration status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  shop_url text,
  access_token text,
  webhook_id text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT type_check CHECK (type IN ('SHOPIFY')),
  CONSTRAINT shop_url_format CHECK (shop_url ~ '^[a-zA-Z0-9-]+\.myshopify\.com$')
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own integrations"
  ON integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create integrations"
  ON integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();