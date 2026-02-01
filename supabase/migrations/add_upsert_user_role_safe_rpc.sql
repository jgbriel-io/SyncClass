-- ============================================================
-- RPC: upsert_user_role_safe - Sincroniza user_roles sem RLS
-- ============================================================
-- Usado por useUpdateStudent, useUpdateTeacher, useUpdateUserRole, etc.
-- Bypassa RLS (SECURITY DEFINER) após validar permissão do caller.
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_user_role_safe(
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
DECLARE
  v_my_teacher_id UUID;
  v_allowed BOOLEAN := false;
BEGIN
  -- Admin: pode sempre
  IF public.is_admin() THEN
    v_allowed := true;
  END IF;

  -- Professor: pode atualizar user_roles de usuários vinculados aos seus alunos
  IF NOT v_allowed THEN
    v_my_teacher_id := public.get_my_teacher_id();
    IF v_my_teacher_id IS NOT NULL THEN
      v_allowed := EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.students s ON s.id = p.student_id
        WHERE p.user_id = p_user_id AND s.teacher_id = v_my_teacher_id
      ) OR EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.teachers t ON t.id = p.teacher_id
        WHERE p.user_id = p_user_id AND t.id = v_my_teacher_id
      );
    END IF;
  END IF;

  -- Chamador atualizando sua própria role
  IF NOT v_allowed AND p_user_id = auth.uid() THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Sem permissão para atualizar user_roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role, full_name, email)
  VALUES (p_user_id, p_role, p_full_name, p_email)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(UUID, public.app_role, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(UUID, public.app_role, TEXT, TEXT) TO service_role;
