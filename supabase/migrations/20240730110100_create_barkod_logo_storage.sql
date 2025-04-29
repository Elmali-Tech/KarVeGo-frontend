-- Logo depolaması için storage bucket oluşturma
-- "assets" bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)  -- Genel erişilebilir bucket
ON CONFLICT (id) DO NOTHING;

-- Bucket içinde "barkod-logos" klasörü için RLS politikaları
-- Dosya yükleme politikası
CREATE POLICY "Kullanıcılar logo yükleyebilir" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assets' AND
  ((storage.foldername(name))[1] = 'barkod-logos') AND
  (auth.uid() = owner)
);

-- Dosya görüntüleme politikası - kimlik doğrulaması gerekmez (public)
CREATE POLICY "Herkes logoları görebilir" ON storage.objects
FOR SELECT USING (
  bucket_id = 'assets' AND
  ((storage.foldername(name))[1] = 'barkod-logos')
);

-- Dosya silme politikası
CREATE POLICY "Kullanıcılar kendi logolarını silebilir" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assets' AND
  ((storage.foldername(name))[1] = 'barkod-logos') AND
  (auth.uid() = owner)
);

-- Dosya güncelleme politikası
CREATE POLICY "Kullanıcılar kendi logolarını güncelleyebilir" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assets' AND
  ((storage.foldername(name))[1] = 'barkod-logos') AND
  (auth.uid() = owner)
); 