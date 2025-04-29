/*
  # Create shipping_labels table

  1. New Table
    - `shipping_labels`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `tracking_number` (text)
      - `kargo_takip_no` (text)
      - `zpl_code` (text)
      - `carrier` (text)
      - `customer_id` (uuid, references profiles)
      - `subscription_type` (text)
      - `created_at` (timestamp)
      - `shipping_price` (numeric)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS shipping_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number text,
  kargo_takip_no text,
  zpl_code text,
  carrier text,
  customer_id uuid REFERENCES profiles(id),
  subscription_type text CHECK (subscription_type IN ('BRONZE', 'GOLD', 'PREMIUM')),
  created_at timestamptz DEFAULT now(),
  shipping_price numeric(10,2) DEFAULT 0
);

ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own shipping labels"
  ON shipping_labels
  FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own shipping labels"
  ON shipping_labels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own shipping labels"
  ON shipping_labels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own shipping labels"
  ON shipping_labels
  FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);

-- Admin policy for all operations on shipping_labels
CREATE POLICY "Admins can do all operations on shipping_labels"
  ON shipping_labels
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

COMMENT ON TABLE shipping_labels IS 'Kargo etiketlerini saklamak için kullanılan tablo'; 