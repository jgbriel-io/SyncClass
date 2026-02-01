-- ============================================================
-- Validação platform-wide: CPF e telefone únicos em students + teachers
-- ============================================================
-- CPF e telefone devem ser únicos na plataforma inteira, não só na aba
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_cpf_exists_platform(p_cpf_digits TEXT)
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
  ) OR EXISTS (
    SELECT 1 FROM public.teachers
    WHERE cpf IS NOT NULL
      AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
      AND regexp_replace(trim(cpf), '\D', '', 'g') = p_cpf_digits
  );
$$;

CREATE OR REPLACE FUNCTION public.check_phone_exists_platform(p_phone_digits TEXT)
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
  ) OR EXISTS (
    SELECT 1 FROM public.teachers
    WHERE phone IS NOT NULL
      AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
      AND regexp_replace(trim(phone), '\D', '', 'g') = p_phone_digits
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_cpf_exists_platform(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_cpf_exists_platform(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_phone_exists_platform(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_phone_exists_platform(TEXT) TO authenticated;

-- ============================================================
-- TRIGGERS: Bloqueiam insert/update se CPF ou telefone já existir
-- em students OU teachers (segurança no banco, não só na aplicação)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_cpf_phone_platform_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cpf_digits TEXT;
  v_phone_digits TEXT;
  v_exists BOOLEAN;
  v_excluding_id UUID;
BEGIN
  v_cpf_digits := regexp_replace(trim(COALESCE(NEW.cpf, '')), '\D', '', 'g');
  v_phone_digits := regexp_replace(trim(COALESCE(NEW.phone, '')), '\D', '', 'g');
  v_excluding_id := NEW.id;

  IF length(v_cpf_digits) = 11 THEN
    -- Verifica em students (excluindo o próprio registro se for update)
    IF TG_TABLE_NAME = 'students' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.students
        WHERE id IS DISTINCT FROM v_excluding_id
          AND cpf IS NOT NULL
          AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
          AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits
      ) OR EXISTS (
        SELECT 1 FROM public.teachers
        WHERE cpf IS NOT NULL
          AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
          AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits
      ) INTO v_exists;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.teachers
        WHERE id IS DISTINCT FROM v_excluding_id
          AND cpf IS NOT NULL
          AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
          AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits
      ) OR EXISTS (
        SELECT 1 FROM public.students
        WHERE cpf IS NOT NULL
          AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
          AND regexp_replace(trim(cpf), '\D', '', 'g') = v_cpf_digits
      ) INTO v_exists;
    END IF;
    IF v_exists THEN
      RAISE EXCEPTION 'CPF já cadastrado na plataforma';
    END IF;
  END IF;

  IF length(v_phone_digits) >= 10 THEN
    IF TG_TABLE_NAME = 'students' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.students
        WHERE id IS DISTINCT FROM v_excluding_id
          AND phone IS NOT NULL
          AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
          AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits
      ) OR EXISTS (
        SELECT 1 FROM public.teachers
        WHERE phone IS NOT NULL
          AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
          AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits
      ) INTO v_exists;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.teachers
        WHERE id IS DISTINCT FROM v_excluding_id
          AND phone IS NOT NULL
          AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
          AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits
      ) OR EXISTS (
        SELECT 1 FROM public.students
        WHERE phone IS NOT NULL
          AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
          AND regexp_replace(trim(phone), '\D', '', 'g') = v_phone_digits
      ) INTO v_exists;
    END IF;
    IF v_exists THEN
      RAISE EXCEPTION 'Telefone já cadastrado na plataforma';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_cpf_phone_platform_students ON public.students;
CREATE TRIGGER trg_check_cpf_phone_platform_students
  BEFORE INSERT OR UPDATE OF cpf, phone ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.check_cpf_phone_platform_trigger();

DROP TRIGGER IF EXISTS trg_check_cpf_phone_platform_teachers ON public.teachers;
CREATE TRIGGER trg_check_cpf_phone_platform_teachers
  BEFORE INSERT OR UPDATE OF cpf, phone ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.check_cpf_phone_platform_trigger();
