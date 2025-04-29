/*
  # Add shopify_store column to products table

  1. Changes
    - Add shopify_store column to store the Shopify store URL
    
  2. Details
    - Column is nullable since not all products come from Shopify
    - Used DO block to handle idempotency
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'shopify_store'
  ) THEN
    ALTER TABLE products ADD COLUMN shopify_store text;
  END IF;
END $$;