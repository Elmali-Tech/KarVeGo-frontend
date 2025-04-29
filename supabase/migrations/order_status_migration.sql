-- Sipariş durumlarını güncelleme migration scripti
BEGIN;

-- Enum tipi güncelleme veya yeniden oluşturma (veritabanı tasarımına bağlı)
-- Eğer enum tipi kullanıyorsanız aşağıdaki komutu çalıştırın:
/*
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PRINTED';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'SHIPPED';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PROBLEMATIC';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'COMPLETED';
*/

-- Mevcut durumları yeni durumlara eşleştirme
-- BARCODE -> NEW
UPDATE orders 
SET status = 'NEW' 
WHERE status = 'BARCODE';

-- BARCODE_PRINTED -> PRINTED
UPDATE orders 
SET status = 'PRINTED' 
WHERE status = 'BARCODE_PRINTED';

-- IN_TRANSIT -> SHIPPED
UPDATE orders 
SET status = 'SHIPPED' 
WHERE status = 'IN_TRANSIT';

-- RETURN -> PROBLEMATIC
UPDATE orders 
SET status = 'PROBLEMATIC' 
WHERE status = 'RETURN';

-- DELIVERED -> COMPLETED
UPDATE orders 
SET status = 'COMPLETED' 
WHERE status = 'DELIVERED';

-- İleride yeni durumu olan bir siparişi olmayan kullanıcılar için
-- Eksik durumları temsil eden örnek siparişler oluşturalım
-- (bu kısmı opsiyonel, gerekirse çalıştırabilirsiniz)
/*
-- Önce her kullanıcı için farklı durumlarda siparişlerin olup olmadığını kontrol et
WITH missing_statuses AS (
  SELECT 
    user_id,
    'NEW' AS missing_status
  FROM 
    users u
  WHERE 
    NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'NEW')
  
  UNION ALL
  
  SELECT 
    user_id,
    'READY' AS missing_status
  FROM 
    users u
  WHERE 
    NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'READY')
    
  -- Diğer durumlar için de benzer sorgular eklenebilir
)
-- Eksik durumlar için örnek siparişler oluştur
INSERT INTO orders (
  user_id, 
  status, 
  customer, 
  products,
  order_created_at,
  shipping_address
)
SELECT 
  m.user_id,
  m.missing_status,
  '{"name": "Örnek Müşteri"}'::jsonb,
  '[{"name": "Örnek Ürün", "quantity": 1}]'::jsonb,
  NOW(),
  '{"address1": "Örnek Adres", "city": "İstanbul", "country": "Turkey"}'::jsonb
FROM 
  missing_statuses m;
*/

-- Eski statüsleri tamamen kaldırmak için gerekirse aşağıdaki komutları çalıştırabilirsiniz
/*
ALTER TYPE order_status DROP VALUE IF EXISTS 'BARCODE';
ALTER TYPE order_status DROP VALUE IF EXISTS 'BARCODE_PRINTED';
ALTER TYPE order_status DROP VALUE IF EXISTS 'IN_TRANSIT';
ALTER TYPE order_status DROP VALUE IF EXISTS 'RETURN';
ALTER TYPE order_status DROP VALUE IF EXISTS 'DELIVERED';
*/

COMMIT; 