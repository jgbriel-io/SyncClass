-- ============================================================
-- Unicidade de CPF e telefone em teachers e students
-- ============================================================
-- Usa normalização (apenas dígitos) para evitar duplicatas
-- com formatos diferentes (123.456.789-01 vs 12345678901)
-- ============================================================

-- Limpar duplicatas existentes antes de criar índices
-- Mantém o primeiro registro (menor id), zera cpf/phone dos demais
WITH first_teacher_cpf AS (
  SELECT DISTINCT ON (regexp_replace(trim(cpf), '\D', '', 'g')) id
  FROM public.teachers
  WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
  ORDER BY regexp_replace(trim(cpf), '\D', '', 'g'), id
)
UPDATE public.teachers t SET cpf = NULL
WHERE t.cpf IS NOT NULL
  AND length(regexp_replace(trim(t.cpf), '\D', '', 'g')) = 11
  AND t.id NOT IN (SELECT id FROM first_teacher_cpf);

WITH first_teacher_phone AS (
  SELECT DISTINCT ON (regexp_replace(trim(phone), '\D', '', 'g')) id
  FROM public.teachers
  WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
  ORDER BY regexp_replace(trim(phone), '\D', '', 'g'), id
)
UPDATE public.teachers t SET phone = NULL
WHERE t.phone IS NOT NULL
  AND length(regexp_replace(trim(t.phone), '\D', '', 'g')) >= 10
  AND t.id NOT IN (SELECT id FROM first_teacher_phone);

WITH first_student_cpf AS (
  SELECT DISTINCT ON (regexp_replace(trim(cpf), '\D', '', 'g')) id
  FROM public.students
  WHERE cpf IS NOT NULL AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11
  ORDER BY regexp_replace(trim(cpf), '\D', '', 'g'), id
)
UPDATE public.students s SET cpf = NULL
WHERE s.cpf IS NOT NULL
  AND length(regexp_replace(trim(s.cpf), '\D', '', 'g')) = 11
  AND s.id NOT IN (SELECT id FROM first_student_cpf);

WITH first_student_phone AS (
  SELECT DISTINCT ON (regexp_replace(trim(phone), '\D', '', 'g')) id
  FROM public.students
  WHERE phone IS NOT NULL AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10
  ORDER BY regexp_replace(trim(phone), '\D', '', 'g'), id
)
UPDATE public.students s SET phone = NULL
WHERE s.phone IS NOT NULL
  AND length(regexp_replace(trim(s.phone), '\D', '', 'g')) >= 10
  AND s.id NOT IN (SELECT id FROM first_student_phone);

-- TEACHERS: adicionar constraints (não existiam)
CREATE UNIQUE INDEX IF NOT EXISTS teachers_unique_cpf
    ON public.teachers ((regexp_replace(trim(coalesce(cpf, '')), '\D', '', 'g')))
    WHERE cpf IS NOT NULL
      AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11;

CREATE UNIQUE INDEX IF NOT EXISTS teachers_unique_phone
    ON public.teachers ((regexp_replace(trim(coalesce(phone, '')), '\D', '', 'g')))
    WHERE phone IS NOT NULL
      AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10;

-- STUDENTS: recriar com normalização (antes usava valor bruto)
DROP INDEX IF EXISTS public.students_unique_cpf;
DROP INDEX IF EXISTS public.students_unique_phone;

CREATE UNIQUE INDEX students_unique_cpf
    ON public.students ((regexp_replace(trim(coalesce(cpf, '')), '\D', '', 'g')))
    WHERE cpf IS NOT NULL
      AND length(regexp_replace(trim(cpf), '\D', '', 'g')) = 11;

CREATE UNIQUE INDEX students_unique_phone
    ON public.students ((regexp_replace(trim(coalesce(phone, '')), '\D', '', 'g')))
    WHERE phone IS NOT NULL
      AND length(regexp_replace(trim(phone), '\D', '', 'g')) >= 10;
