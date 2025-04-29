-- Admin kullanıcıların tüm profilleri görüntüleyebilmesi için SQL fonksiyonu
-- Bu migration dosyası Supabase'e aktarılmalıdır

-- Önce mevcut fonksiyonu kaldırın (varsa)
DROP FUNCTION IF EXISTS public.get_all_profiles();

-- RLS bypass eden ve tüm profilleri döndüren fonksiyonu oluşturun
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF profiles
SECURITY DEFINER
AS $$
BEGIN
  -- Kullanıcının admin olup olmadığını kontrol et
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Admin kullanıcılar tüm profilleri görebilir
    RETURN QUERY SELECT * FROM profiles;
  ELSE
    -- Admin olmayan kullanıcılar sadece kendi profillerini görebilir
    RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonksiyonun kullanılabilmesi için izinler verin
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO service_role;

-- Admin kullanıcılarına tüm kullanıcıları görüntüleme yetkisi veren politika
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Kullanıcı kendi profilini görüntüleyebilir
    auth.uid() = id
    OR
    -- Admin tüm profilleri görüntüleyebilir
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Kullanıcının kendi profilini silme yetkisi
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Admin kullanıcılarına diğer profilleri silme yetkisi
DROP POLICY IF EXISTS "Admin can delete all profiles" ON profiles;
CREATE POLICY "Admin can delete all profiles" ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ); 