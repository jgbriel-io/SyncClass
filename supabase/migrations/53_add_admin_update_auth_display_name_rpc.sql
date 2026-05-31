-- Migration 53: RPC to update full_name in auth.users metadata
-- SECURITY DEFINER runs as postgres which has access to auth.users
-- is_admin() check ensures only admins can call this

CREATE OR REPLACE FUNCTION public.admin_update_auth_display_name(
  p_user_id UUID,
  p_full_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', p_full_name)
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_auth_display_name(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_auth_display_name(UUID, TEXT) TO authenticated;
