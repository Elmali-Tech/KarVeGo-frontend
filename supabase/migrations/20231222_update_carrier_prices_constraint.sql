/*
  # Update carrier_prices unique constraint

  1. Changes
    - Remove the existing unique constraint between carrier_id and desi
    - Add a new unique constraint for carrier_id, desi, and subscription_type
    - This allows different subscription types to have the same desi value for the same carrier
*/

-- Mevcut unique constraint'i kaldır
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'carrier_prices_carrier_id_desi_key'
  ) THEN
    ALTER TABLE carrier_prices 
      DROP CONSTRAINT carrier_prices_carrier_id_desi_key;
  END IF;
END $$;

-- Yeni unique constraint ekle (carrier_id, desi, subscription_type kombinasyonu için)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'carrier_prices_carrier_id_desi_subscription_type_key'
  ) THEN
    ALTER TABLE carrier_prices 
      ADD CONSTRAINT carrier_prices_carrier_id_desi_subscription_type_key 
      UNIQUE (carrier_id, desi, subscription_type);
  END IF;
END $$; 