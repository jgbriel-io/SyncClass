-- ============================================================
-- Funções para verificar CPF/telefone antes de criar usuário
-- Usadas pela invite-user para validar ANTES de criar auth user
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_student_cpf_exists(p_cpf_digits TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE cpf IS NOT NULL
      AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
      AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits
  );
$$;

CREATE OR REPLACE FUNCTION public.check_student_phone_exists(p_phone_digits TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE phone IS NOT NULL
      AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
      AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits
  );
$$;

CREATE OR REPLACE FUNCTION public.check_teacher_cpf_exists(p_cpf_digits TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers
    WHERE cpf IS NOT NULL
      AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
      AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits
  );
$$;

CREATE OR REPLACE FUNCTION public.check_teacher_phone_exists(p_phone_digits TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers
    WHERE phone IS NOT NULL
      AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
      AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_student_cpf_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_student_phone_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_teacher_cpf_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_teacher_phone_exists(TEXT) TO service_role;
