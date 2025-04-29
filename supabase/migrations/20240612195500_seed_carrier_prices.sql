/*
  # Seed carrier_prices table with sample data

  1. Purpose
    - Add initial price data for different subscription types
    - Provide a range of desi values with corresponding prices
    
  2. Details
    - carrier_id 1 represents "Sürat Kargo"
    - Three subscription tiers: BRONZE, GOLD, PREMIUM
    - Prices decrease as subscription tier increases
    - Desi values from 1 to 10 for each subscription type
*/

-- Check if data already exists to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM carrier_prices LIMIT 1) THEN
    -- BRONZE tier prices (standard prices, no discount)
    INSERT INTO carrier_prices (carrier_id, desi, city_price, intercity_price, subscription_type)
    VALUES
      (1, 1.0, 50.00, 75.00, 'BRONZE'),
      (1, 2.0, 60.00, 85.00, 'BRONZE'),
      (1, 3.0, 70.00, 95.00, 'BRONZE'),
      (1, 4.0, 80.00, 105.00, 'BRONZE'),
      (1, 5.0, 90.00, 115.00, 'BRONZE'),
      (1, 6.0, 100.00, 125.00, 'BRONZE'),
      (1, 7.0, 110.00, 135.00, 'BRONZE'),
      (1, 8.0, 120.00, 145.00, 'BRONZE'),
      (1, 9.0, 130.00, 155.00, 'BRONZE'),
      (1, 10.0, 140.00, 165.00, 'BRONZE');

    -- GOLD tier prices (10% discount)
    INSERT INTO carrier_prices (carrier_id, desi, city_price, intercity_price, subscription_type)
    VALUES
      (1, 1.0, 45.00, 67.50, 'GOLD'),
      (1, 2.0, 54.00, 76.50, 'GOLD'),
      (1, 3.0, 63.00, 85.50, 'GOLD'),
      (1, 4.0, 72.00, 94.50, 'GOLD'),
      (1, 5.0, 81.00, 103.50, 'GOLD'),
      (1, 6.0, 90.00, 112.50, 'GOLD'),
      (1, 7.0, 99.00, 121.50, 'GOLD'),
      (1, 8.0, 108.00, 130.50, 'GOLD'),
      (1, 9.0, 117.00, 139.50, 'GOLD'),
      (1, 10.0, 126.00, 148.50, 'GOLD');

    -- PREMIUM tier prices (20% discount)
    INSERT INTO carrier_prices (carrier_id, desi, city_price, intercity_price, subscription_type)
    VALUES
      (1, 1.0, 40.00, 60.00, 'PREMIUM'),
      (1, 2.0, 48.00, 68.00, 'PREMIUM'),
      (1, 3.0, 56.00, 76.00, 'PREMIUM'),
      (1, 4.0, 64.00, 84.00, 'PREMIUM'),
      (1, 5.0, 72.00, 92.00, 'PREMIUM'),
      (1, 6.0, 80.00, 100.00, 'PREMIUM'),
      (1, 7.0, 88.00, 108.00, 'PREMIUM'),
      (1, 8.0, 96.00, 116.00, 'PREMIUM'),
      (1, 9.0, 104.00, 124.00, 'PREMIUM'),
      (1, 10.0, 112.00, 132.00, 'PREMIUM');
  END IF;
END
$$; 