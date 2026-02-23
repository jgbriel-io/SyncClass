-- ============================================
-- MIGRATION 16: Corrigir SET search_path em Functions
-- Adiciona proteção contra search path hijacking
-- Data: 22/02/2026
-- ============================================

-- CRÍTICO: Todas as functions DEVEM ter SET search_path = public, pg_temp
-- para prevenir ataques de search path hijacking

-- --------------------------------------------
-- Migration 12: normalize_phone
-- --------------------------------------------

CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  -- Remove tudo exceto dígitos
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

-- --------------------------------------------
-- Migration 12: normalize_student_phone (trigger function)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION normalize_student_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone := normalize_phone(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

-- --------------------------------------------
-- Migration 12: normalize_teacher_phone (trigger function)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION normalize_teacher_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone := normalize_phone(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

-- --------------------------------------------
-- Migration 12: check_phone_exists_platform
-- --------------------------------------------

CREATE OR REPLACE FUNCTION check_phone_exists_platform(p_phone_digits TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normalized_phone TEXT;
BEGIN
  v_normalized_phone := normalize_phone(p_phone_digits);
  
  IF v_normalized_phone IS NULL OR v_normalized_phone = '' THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM students WHERE phone = v_normalized_phone
    UNION ALL
    SELECT 1 FROM teachers WHERE phone = v_normalized_phone
  );
END;
$$;

-- --------------------------------------------
-- Migration 13: anonymize_student
-- --------------------------------------------

CREATE OR REPLACE FUNCTION anonymize_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_name TEXT;
BEGIN
  v_anonymized_name := 'Aluno ' || SUBSTRING(p_student_id::TEXT FROM 1 FOR 8);
  
  UPDATE students
  SET
    name = v_anonymized_name,
    phone = NULL,
    email = NULL,
    birth_date = NULL,
    city = NULL,
    state = NULL,
    origin = NULL,
    anonymized_at = NOW(),
    updated_at = NOW()
  WHERE id = p_student_id
    AND anonymized_at IS NULL;
  
  RAISE NOTICE 'Aluno % anonimizado com sucesso', p_student_id;
END;
$$;

-- --------------------------------------------
-- Migration 13: anonymize_teacher
-- --------------------------------------------

CREATE OR REPLACE FUNCTION anonymize_teacher(p_teacher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_name TEXT;
BEGIN
  v_anonymized_name := 'Professor ' || SUBSTRING(p_teacher_id::TEXT FROM 1 FOR 8);
  
  UPDATE teachers
  SET
    name = v_anonymized_name,
    phone = NULL,
    email = NULL,
    address = NULL,
    pix_key = NULL,
    anonymized_at = NOW(),
    updated_at = NOW()
  WHERE id = p_teacher_id
    AND anonymized_at IS NULL;
  
  RAISE NOTICE 'Professor % anonimizado com sucesso', p_teacher_id;
END;
$$;

-- --------------------------------------------
-- Notificar sucesso
-- --------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEARCH PATH SECURITY CORRIGIDO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ normalize_phone - SET search_path adicionado';
  RAISE NOTICE '✓ normalize_student_phone - SET search_path adicionado';
  RAISE NOTICE '✓ normalize_teacher_phone - SET search_path adicionado';
  RAISE NOTICE '✓ check_phone_exists_platform - SET search_path adicionado';
  RAISE NOTICE '✓ anonymize_student - SET search_path adicionado';
  RAISE NOTICE '✓ anonymize_teacher - SET search_path adicionado';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TODAS AS FUNCTIONS AGORA ESTÃO PROTEGIDAS!';
  RAISE NOTICE '============================================';
END $$;
