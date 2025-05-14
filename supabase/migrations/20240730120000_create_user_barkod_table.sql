-- Use existing barkod_tasarimlari table for user barcode designs

-- Add is_default column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'barkod_tasarimlari' AND column_name = 'is_default') THEN
        ALTER TABLE barkod_tasarimlari ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'barkod_tasarimlari' AND column_name = 'user_id') THEN
        ALTER TABLE barkod_tasarimlari ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_barkod_tasarimlari_user_id') THEN
        CREATE INDEX idx_barkod_tasarimlari_user_id ON barkod_tasarimlari(user_id);
    END IF;
END $$;

-- Sadece bir tane varsayılan tasarım olması için trigger
CREATE OR REPLACE FUNCTION barkod_tasarimi_default_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    -- Aynı kullanıcıya ait diğer tasarımların varsayılan bayrağını kaldır
    UPDATE barkod_tasarimlari
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur (varsa düşür ve yeniden oluştur)
DROP TRIGGER IF EXISTS barkod_tasarimi_default_trigger_insert ON barkod_tasarimlari;
DROP TRIGGER IF EXISTS barkod_tasarimi_default_trigger_update ON barkod_tasarimlari;

CREATE TRIGGER barkod_tasarimi_default_trigger_insert
BEFORE INSERT ON barkod_tasarimlari
FOR EACH ROW
EXECUTE FUNCTION barkod_tasarimi_default_trigger();

CREATE TRIGGER barkod_tasarimi_default_trigger_update
BEFORE UPDATE ON barkod_tasarimlari
FOR EACH ROW
WHEN (OLD.is_default IS DISTINCT FROM NEW.is_default)
EXECUTE FUNCTION barkod_tasarimi_default_trigger();

-- Zaman damgasını otomatik güncellemek için bir tetikleyici işlevi (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Güncelleme zamanı için trigger (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'barkod_tasarimlari_updated_at') THEN
        CREATE TRIGGER barkod_tasarimlari_updated_at
        BEFORE UPDATE ON barkod_tasarimlari
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 