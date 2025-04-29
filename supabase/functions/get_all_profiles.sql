-- Tüm kullanıcı profillerini getiren bir fonksiyon
-- Bu fonksiyon admin kullanıcıları için RLS politikalarını atlayarak çalışır
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles
SECURITY DEFINER
-- Güvenlik için fonksiyonu hangi kullanıcı çağırırsa çağırsın auth.uid() = id kontrolü olmadan tüm profilleri döndürür
AS $$
BEGIN
  -- Kullanıcının admin olup olmadığını kontrol et
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Admin kullanıcı için tüm profilleri getir
    RETURN QUERY SELECT * FROM profiles;
  ELSE
    -- Admin değilse sadece kendi profilini getir (güvenlik kontrolü)
    RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql; 