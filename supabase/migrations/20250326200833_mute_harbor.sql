/*
  # Create orders and related tables

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `customer_id` (uuid, references customers)
      - `sender_profile_id` (uuid, references sender_profiles)
      - `address_id` (uuid, references addresses)
      - `status` (text, order status)
      - `shipping_method` (text, shipping method)
      - `payment_method` (text, payment method)
      - `total_weight` (numeric, total weight in kg)
      - `tracking_number` (text, shipping tracking number)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_services`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `service_type` (text)
      - `price` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  sender_profile_id uuid REFERENCES sender_profiles(id) ON DELETE SET NULL,
  address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'NEW',
  shipping_method text,
  payment_method text,
  total_weight numeric(10,2),
  tracking_number text,
  package_height numeric(10,2),
  package_width numeric(10,2),
  package_length numeric(10,2),
  package_weight numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('NEW', 'READY', 'IN_TRANSIT', 'PROBLEM', 'DELIVERED'))
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order services table
CREATE TABLE IF NOT EXISTS order_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  price numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT service_type_check CHECK (
    service_type IN (
      'SMS_TRACKING',
      'SMS_DELIVERY',
      'CASH_ON_DELIVERY',
      'SMS_DELIVERED',
      'CONTROLLED_DELIVERY'
    )
  )
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_services ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for order items
CREATE POLICY "Users can manage their own order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policies for order services
CREATE POLICY "Users can manage their own order services"
  ON order_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_services.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_order_services_updated_at
  BEFORE UPDATE ON order_services
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();