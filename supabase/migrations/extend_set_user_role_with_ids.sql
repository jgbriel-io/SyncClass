-- ============================================================
-- Estende set_user_role para aceitar teacher_id e student_id
-- ============================================================
-- Resolve: professor aparece como aluno na aba usuários porque
-- teacher_id não era definido quando a Edge Function falhava e
-- usávamos o fallback RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role public.app_role,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL
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

  -- Atualiza profiles: role, full_name, email e vínculos teacher/student
  UPDATE public.profiles
  SET
    role = p_role::TEXT,
    full_name = COALESCE(p_full_name, full_name),
    email = COALESCE(p_email, email),
    teacher_id = CASE
      WHEN p_role = 'teacher' THEN p_teacher_id
      ELSE NULL
    END,
    student_id = CASE
      WHEN p_role = 'student' THEN p_student_id
      ELSE NULL
    END
  WHERE user_id = p_user_id;

  UPDATE public.user_roles
  SET role = p_role,
      full_name = COALESCE(p_full_name, full_name),
      email = COALESCE(p_email, email)
  WHERE user_id = p_user_id;
END;
$$;

-- Nova assinatura - grants
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role, TEXT, TEXT, UUID, UUID) TO service_role;
