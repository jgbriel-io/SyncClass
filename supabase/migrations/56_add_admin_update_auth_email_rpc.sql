-- Migration 56: RPC to update email in auth.users
-- Mirrors admin_update_auth_display_name (migration 53) for email field.
-- SECURITY DEFINER runs as postgres; is_admin() guard ensures admin-only.

CREATE OR REPLACE FUNCTION public.admin_update_auth_email(
  p_user_id UUID,
  p_email   TEXT
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
  SET email          = p_email,
      email_confirmed_at = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_auth_email(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_auth_email(UUID, TEXT) TO authenticated;
