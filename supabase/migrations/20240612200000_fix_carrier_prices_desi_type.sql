/*
  # Fix carrier_prices desi column type

  1. Changes
    - Change the data type of desi column from integer to numeric(10,2)
    
  2. Reason
    - The application needs to support decimal desi values (e.g. 4.2)
    - Current integer type causes "invalid input syntax for type integer" errors
*/

-- Change data type of desi column in carrier_prices table
ALTER TABLE carrier_prices 
  ALTER COLUMN desi TYPE numeric(10,2);

COMMENT ON COLUMN carrier_prices.desi IS 'Desi value with decimal precision (e.g. 4.2)'; 