-- ============================================================
-- ADMIN FUNCTIONS - Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. UPDATE: get_admin_users_data - tambahkan is_superadmin, category_count, template_count
-- DROP fungsi lama jika ada, lalu buat ulang
DROP FUNCTION IF EXISTS get_admin_users_data();

CREATE OR REPLACE FUNCTION get_admin_users_data()
RETURNS TABLE (
  id UUID,
  username TEXT,
  is_superadmin BOOLEAN,
  transaction_count BIGINT,
  category_count BIGINT,
  template_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hanya superadmin yang bisa memanggil fungsi ini
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_superadmin = true
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya superadmin';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.is_superadmin,
    COUNT(DISTINCT t.id) AS transaction_count,
    COUNT(DISTINCT c.id) AS category_count,
    COUNT(DISTINCT tpl.id) AS template_count
  FROM public.profiles p
  LEFT JOIN public.transactions t ON t.user_id = p.id
  LEFT JOIN public.categories c ON c.user_id = p.id
  LEFT JOIN public.templates tpl ON tpl.user_id = p.id
  GROUP BY p.id, p.username, p.is_superadmin
  ORDER BY p.username;
END;
$$;

-- 2. BARU: admin_delete_user - hapus user dari auth.users (cascade ke semua tabel)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_id UUID;
  is_admin BOOLEAN;
  target_is_admin BOOLEAN;
BEGIN
  -- Dapatkan ID pemanggil
  calling_user_id := auth.uid();
  
  -- Periksa apakah pemanggil adalah superadmin
  SELECT is_superadmin INTO is_admin
  FROM public.profiles 
  WHERE id = calling_user_id;
  
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya superadmin yang dapat menghapus pengguna';
  END IF;
  
  -- Jangan izinkan hapus diri sendiri
  IF calling_user_id = target_user_id THEN
    RAISE EXCEPTION 'Tidak dapat menghapus akun sendiri';
  END IF;
  
  -- Pastikan target bukan superadmin lain
  SELECT is_superadmin INTO target_is_admin
  FROM public.profiles 
  WHERE id = target_user_id;
  
  IF COALESCE(target_is_admin, false) THEN
    RAISE EXCEPTION 'Tidak dapat menghapus akun superadmin lain';
  END IF;
  
  -- Hapus dari auth.users (ON DELETE CASCADE akan menghapus semua data terkait)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 3. Grant eksekusi ke authenticated users (RLS sudah handle keamanan di dalam fungsi)
GRANT EXECUTE ON FUNCTION get_admin_users_data() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
