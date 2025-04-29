/*
  # Update carrier_prices table with subscription_type field

  1. Changes
    - Add subscription_type column to carrier_prices table
    - Set default value to 'BRONZE'
    - Update existing records to have subscription_type 'BRONZE'
    - Make subscription_type NOT NULL
*/

-- Önce subscription_type sütununun var olup olmadığını kontrol et
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carrier_prices' AND column_name = 'subscription_type'
  ) THEN
    -- subscription_type sütununu ekle
    ALTER TABLE carrier_prices 
      ADD COLUMN subscription_type text DEFAULT 'BRONZE';
      
    -- Mevcut kayıtları BRONZE tipine ayarla
    UPDATE carrier_prices SET subscription_type = 'BRONZE';
    
    -- subscription_type sütununu NOT NULL yap
    ALTER TABLE carrier_prices 
      ALTER COLUMN subscription_type SET NOT NULL;
  END IF;
END $$; 