/*
  # Add raw_data column to orders table

  1. Changes
    - Add raw_data column to store complete Shopify order data
    
  2. Details
    - Column is JSONB type for efficient JSON storage
    - Used DO block to handle idempotency
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE orders ADD COLUMN raw_data JSONB;
  END IF;
END $$;