-- ============================================================
-- RPC: set_user_role - Atualiza role em profiles e user_roles
-- ============================================================
-- Roda como SECURITY DEFINER para garantir que a atualização
-- funcione (evita bloqueio por RLS). Apenas admin pode chamar.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role public.app_role,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar roles';
  END IF;

  UPDATE public.profiles
  SET role = p_role::TEXT,
      full_name = COALESCE(p_full_name, full_name),
      email = COALESCE(p_email, email)
  WHERE user_id = p_user_id;

  UPDATE public.user_roles
  SET role = p_role,
      full_name = COALESCE(p_full_name, full_name),
      email = COALESCE(p_email, email)
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT, TEXT) TO service_role;
