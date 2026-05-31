-- Migration 57: RPC for users to update their own email without triggering
-- Supabase's email-confirmation flow.
-- SECURITY DEFINER runs as postgres (direct auth.users write).
-- Validates that the caller has an active profile before allowing the update.

CREATE OR REPLACE FUNCTION public.user_update_own_email(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  UPDATE auth.users
  SET email              = p_email,
      email_confirmed_at = NOW()
  WHERE id = auth.uid();

  UPDATE public.profiles
  SET email = p_email
  WHERE user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.user_update_own_email(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_update_own_email(TEXT) TO authenticated;
