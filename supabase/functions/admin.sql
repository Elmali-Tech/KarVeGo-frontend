-- admin_create_user fonksiyonu
-- Bu fonksiyon bir kullanıcı oluşturur ve ona bir rol atar
CREATE OR REPLACE FUNCTION public.admin_create_user(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Kullanıcıyı auth.users tablosuna ekle
  INSERT INTO auth.users (
    email,
    raw_user_meta_data,
    role,
    email_confirmed_at
  ) VALUES (
    user_email,
    jsonb_build_object('role', user_role),
    user_role,
    NOW()
  )
  RETURNING id INTO new_user_id;
  
  -- Kullanıcı şifresini ayarla
  UPDATE auth.users
  SET encrypted_password = crypt(user_password, gen_salt('bf'))
  WHERE id = new_user_id;
  
  -- Profil tablosuna bir giriş ekle
  INSERT INTO public.profiles (
    id,
    email,
    role,
    created_at,
    is_active
  ) VALUES (
    new_user_id,
    user_email,
    user_role,
    NOW(),
    TRUE
  );
END;
$$;

-- admin_get_users fonksiyonu
-- Bu fonksiyon tüm kullanıcıları getirir
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    au.role::TEXT,
    COALESCE(p.is_active, FALSE) AS is_active
  FROM
    auth.users au
  LEFT JOIN
    public.profiles p ON au.id = p.id
  ORDER BY
    au.created_at DESC;
END;
$$;

-- admin_update_user_status fonksiyonu
-- Bu fonksiyon bir kullanıcının aktif/pasif durumunu değiştirir
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  user_id UUID,
  is_active BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kullanıcının profil tablosundaki durumunu güncelle
  UPDATE public.profiles
  SET is_active = admin_update_user_status.is_active
  WHERE id = user_id;
  
  -- Auth tablosunda da güncelleme yap
  IF is_active = FALSE THEN
    UPDATE auth.users
    SET disabled = TRUE
    WHERE id = user_id;
  ELSE
    UPDATE auth.users
    SET disabled = FALSE
    WHERE id = user_id;
  END IF;
END;
$$;

-- admin_update_user_role fonksiyonu
-- Bu fonksiyon bir kullanıcının rolünü değiştirir
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  user_id UUID,
  role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auth tablosundaki rolü güncelle
  UPDATE auth.users
  SET 
    role = admin_update_user_role.role,
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(admin_update_user_role.role)
    )
  WHERE id = user_id;
  
  -- Profil tablosundaki rolü güncelle
  UPDATE public.profiles
  SET role = admin_update_user_role.role
  WHERE id = user_id;
END;
$$; 