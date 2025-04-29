/*
  # Update profiles table with additional fields

  1. Changes
    - Add new columns for account information:
      - phone (text): User's phone number
      - tax_number (text): Tax number for corporate accounts
      - tax_office (text): Tax office location
      - national_id (text): National ID number
      - account_type (text): Type of account (INDIVIDUAL/CORPORATE)
      - balance (numeric): Account balance
      - status (text): Account status (PENDING/APPROVED/REJECTED)

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles 
      ADD COLUMN phone text,
      ADD COLUMN tax_number text,
      ADD COLUMN tax_office text,
      ADD COLUMN national_id text,
      ADD COLUMN account_type text DEFAULT 'INDIVIDUAL',
      ADD COLUMN balance numeric(10,2) DEFAULT 0,
      ADD COLUMN status text DEFAULT 'PENDING';
  END IF;
END $$;