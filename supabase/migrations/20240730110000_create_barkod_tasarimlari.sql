-- barkod_tasarimlari tablosunu oluşturur
CREATE TABLE IF NOT EXISTS public.barkod_tasarimlari (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    config jsonb NOT NULL DEFAULT '{}'::jsonb, -- Tüm ayarları içeren JSONB alanı
    is_default boolean NOT NULL DEFAULT false, -- Varsayılan tasarım mı?
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE -- Kullanıcı kimliği
);

-- Varsayılan tasarım için trigger oluştur (bir tane varsayılan olsun)
CREATE OR REPLACE FUNCTION handle_default_barkod_tasarim()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.barkod_tasarimlari
    SET is_default = false
    WHERE id != NEW.id AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_default_barkod_tasarim
BEFORE INSERT OR UPDATE ON public.barkod_tasarimlari
FOR EACH ROW
EXECUTE FUNCTION handle_default_barkod_tasarim();

-- Son güncelleme tarihini otomatik güncellemek için trigger
CREATE OR REPLACE FUNCTION update_barkod_tasarim_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_barkod_tasarim_updated_at
BEFORE UPDATE ON public.barkod_tasarimlari
FOR EACH ROW
EXECUTE FUNCTION update_barkod_tasarim_updated_at();

-- Tablo ve sütunlar üzerine yorum
COMMENT ON TABLE public.barkod_tasarimlari IS 'Kullanıcıların oluşturduğu barkod tasarım şablonlarını saklar.';
COMMENT ON COLUMN public.barkod_tasarimlari.id IS 'Tasarımın benzersiz kimliği.';
COMMENT ON COLUMN public.barkod_tasarimlari.name IS 'Kullanıcının tasarıma verdiği isim.';
COMMENT ON COLUMN public.barkod_tasarimlari.config IS 'Barkod etiketinin tüm yapılandırma ayarları (JSON formatında).';
COMMENT ON COLUMN public.barkod_tasarimlari.is_default IS 'Tasarımın varsayılan olup olmadığını belirtir.';
COMMENT ON COLUMN public.barkod_tasarimlari.created_at IS 'Tasarımın oluşturulma zaman damgası.';
COMMENT ON COLUMN public.barkod_tasarimlari.updated_at IS 'Tasarımın son güncelleme zaman damgası.';
COMMENT ON COLUMN public.barkod_tasarimlari.user_id IS 'Tasarımı oluşturan kullanıcının kimliği.';

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_barkod_tasarimlari_user_id ON public.barkod_tasarimlari (user_id);
CREATE INDEX IF NOT EXISTS idx_barkod_tasarimlari_is_default ON public.barkod_tasarimlari (user_id, is_default);

-- RLS (Row Level Security) etkinleştirme
ALTER TABLE public.barkod_tasarimlari ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Kullanıcılar kendi tasarımlarını görebilir" 
ON public.barkod_tasarimlari FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi tasarımlarını oluşturabilir" 
ON public.barkod_tasarimlari FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi tasarımlarını güncelleyebilir" 
ON public.barkod_tasarimlari FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi tasarımlarını silebilir" 
ON public.barkod_tasarimlari FOR DELETE 
USING (auth.uid() = user_id);

-- Varsayılan bir tasarım oluştur (geliştirme amaçlı)
INSERT INTO public.barkod_tasarimlari (
  name, 
  config, 
  is_default,
  user_id
) VALUES (
  'Varsayılan Tasarım',
  '{
    "logoPosition": "left",
    "showLogo": true,
    "showBarcodeText": true,
    "showGonderiTipi": true,
    "showOdemeTipi": true,
    "showGonderen": true,
    "showAlici": true,
    "showUrunler": true,
    "showKgDesi": true,
    "showPaketBilgisi": true,
    "showAnlasmaTuru": true,
    "fontFamily": "Arial",
    "fontSize": 12,
    "headerColor": "#000000",
    "textColor": "#000000",
    "borderColor": "#cccccc",
    "backgroundColor": "#ffffff",
    "width": 350,
    "height": 500,
    "logoUrl": "",
    "footerText": "SHIPINK © 2025",
    "footerColor": "#777777",
    "barcodeWidth": 200,
    "barcodeHeight": 40
  }'::jsonb,
  true,
  '00000000-0000-0000-0000-000000000000'::uuid
) ON CONFLICT DO NOTHING; 