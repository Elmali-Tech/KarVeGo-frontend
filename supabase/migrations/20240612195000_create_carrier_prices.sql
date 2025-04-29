/*
  # Create carrier_prices table

  1. New Table
    - `carrier_prices`
      - `id` (uuid, primary key)
      - `carrier_id` (integer)
      - `desi` (numeric(10,2))
      - `city_price` (numeric(10,2))
      - `intercity_price` (numeric(10,2))
      - `subscription_type` (text): BRONZE, GOLD, PREMIUM
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS carrier_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id integer NOT NULL,
  desi numeric(10,2) NOT NULL,
  city_price numeric(10,2) NOT NULL DEFAULT 0,
  intercity_price numeric(10,2) NOT NULL DEFAULT 0,
  subscription_type text NOT NULL CHECK (subscription_type IN ('BRONZE', 'GOLD', 'PREMIUM')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for carrier_id, desi, and subscription_type
ALTER TABLE carrier_prices
  ADD CONSTRAINT carrier_prices_carrier_id_desi_subscription_type_key
  UNIQUE (carrier_id, desi, subscription_type);

-- Enable RLS
ALTER TABLE carrier_prices ENABLE ROW LEVEL SECURITY;

-- Policies for regular users (view only)
CREATE POLICY "Public users can view carrier prices"
  ON carrier_prices
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for admins (full access)
CREATE POLICY "Admins can manage carrier prices"
  ON carrier_prices
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_carrier_prices_updated_at
  BEFORE UPDATE ON carrier_prices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

COMMENT ON TABLE carrier_prices IS 'Kargo fiyatlarını abonelik tiplerine göre saklayan tablo'; 