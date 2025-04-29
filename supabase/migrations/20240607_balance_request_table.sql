-- Balance Requests Tablosu Migrasyonu
BEGIN;

-- Profiles tablosuna balance alanı ekleme (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'balance'
    ) THEN
        ALTER TABLE profiles ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- Balance Requests (bakiye talepleri) tablosunu oluşturma
CREATE TABLE IF NOT EXISTS balance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    proof_document TEXT, -- Belge dosyasının supabase storage URL'i
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at alanını otomatik güncelleme için trigger
CREATE OR REPLACE FUNCTION update_balance_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER balance_requests_updated_at
BEFORE UPDATE ON balance_requests
FOR EACH ROW
EXECUTE PROCEDURE update_balance_request_updated_at();

-- RLS (Row Level Security) Ayarları
ALTER TABLE balance_requests ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi bakiye taleplerini görebilir
CREATE POLICY "Users can view their own balance requests"
ON balance_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi bakiye taleplerini oluşturabilir
CREATE POLICY "Users can insert their own balance requests"
ON balance_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin kullanıcıları tüm talepleri görebilir ve düzenleyebilir
CREATE POLICY "Admins can select all balance requests"
ON balance_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can update all balance requests"
ON balance_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Storage Bucket için izinler (eğer yoksa)
-- Bakiye talepleri için belge yükleme storage bucket'ı
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'documents'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', TRUE);
    END IF;
END $$;

-- Storage için RLS politikaları
-- Kullanıcılar kendi belgelerini yükleyebilirler
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'balance-proof' AND
    position(auth.uid()::text in name) > 0
);

-- Kullanıcılar kendi belgelerini görebilirler
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'balance-proof' AND
    position(auth.uid()::text in name) > 0
);

-- Admin kullanıcıları tüm belgeleri görebilir
CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

COMMIT; 