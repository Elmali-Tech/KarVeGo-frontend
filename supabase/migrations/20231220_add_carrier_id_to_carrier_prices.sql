/*
  # Update carrier_prices table with carrier_id field

  1. Changes
    - Add carrier_id column to carrier_prices table as foreign key to carriers.id
    - Update existing records to link to a default carrier if available
*/

-- Önce carrier_id sütununun var olup olmadığını kontrol et
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carrier_prices' AND column_name = 'carrier_id'
  ) THEN
    -- carrier_id sütununu ekle
    ALTER TABLE carrier_prices 
      ADD COLUMN carrier_id uuid REFERENCES carriers(id) ON DELETE CASCADE;
      
    -- Eğer carriers tablosunda kayıt varsa, mevcut fiyatları ilk kargo firmasına bağla
    DO $$
    DECLARE
      default_carrier_id uuid;
    BEGIN
      SELECT id INTO default_carrier_id FROM carriers LIMIT 1;
      
      IF default_carrier_id IS NOT NULL THEN
        UPDATE carrier_prices SET carrier_id = default_carrier_id;
      END IF;
    END $$;
    
    -- carrier_id sütununu NOT NULL yap (eğer carriers tablosunda kayıt varsa)
    IF EXISTS (SELECT 1 FROM carriers LIMIT 1) THEN
      ALTER TABLE carrier_prices 
        ALTER COLUMN carrier_id SET NOT NULL;
    END IF;
  END IF;
END $$; 