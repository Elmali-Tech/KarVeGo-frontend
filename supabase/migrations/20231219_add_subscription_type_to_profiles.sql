/*
  # Update profiles table with subscription_type field

  1. Changes
    - Add subscription_type column to profiles table
    - Set default value to 'BRONZE'
    - Update existing records to have subscription_type 'BRONZE'
*/

-- Önce subscription_type sütununun var olup olmadığını kontrol et
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_type'
  ) THEN
    -- subscription_type sütununu ekle
    ALTER TABLE profiles 
      ADD COLUMN subscription_type text DEFAULT 'BRONZE';
      
    -- Mevcut kayıtları BRONZE tipine ayarla
    UPDATE profiles SET subscription_type = 'BRONZE';
  END IF;
END $$; 