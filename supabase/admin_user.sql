-- Admin kullanıcısı oluştur
SELECT admin_create_user(
  'admin@karvego.com', -- E-posta
  'admin123',          -- Şifre
  'admin'              -- Rol
);

-- Veritabanı tablolarının hazır olduğundan emin ol
-- Eğer profiles tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS (Row Level Security) politikaları ekle
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılarının her şeyi görebilmesi için politika
CREATE POLICY admin_all_access ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin'); 