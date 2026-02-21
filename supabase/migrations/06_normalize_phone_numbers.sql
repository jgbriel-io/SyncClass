-- Migration: Normalize phone numbers to digits only
-- Remove máscaras, espaços, parênteses, hífens, etc
-- Mantém apenas dígitos para garantir unicidade

-- Função para normalizar telefone (apenas dígitos)
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  -- Remove tudo exceto dígitos
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASSO 1: Identificar e resolver duplicatas em students
-- Manter apenas o registro mais antigo, limpar telefone dos duplicados
WITH duplicates AS (
  SELECT 
    id,
    phone,
    normalize_phone(phone) as normalized_phone,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY normalize_phone(phone) 
      ORDER BY created_at ASC
    ) as rn
  FROM students
  WHERE phone IS NOT NULL 
    AND phone != ''
    AND normalize_phone(phone) IS NOT NULL
)
UPDATE students
SET phone = NULL
FROM duplicates
WHERE students.id = duplicates.id
  AND duplicates.rn > 1
  AND duplicates.normalized_phone IN (
    SELECT normalized_phone 
    FROM duplicates 
    GROUP BY normalized_phone 
    HAVING COUNT(*) > 1
  );

-- PASSO 2: Normalizar telefones restantes em students
UPDATE students
SET phone = normalize_phone(phone)
WHERE phone IS NOT NULL AND phone != '';

-- PASSO 3: Identificar e resolver duplicatas em teachers
WITH duplicates AS (
  SELECT 
    id,
    phone,
    normalize_phone(phone) as normalized_phone,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY normalize_phone(phone) 
      ORDER BY created_at ASC
    ) as rn
  FROM teachers
  WHERE phone IS NOT NULL 
    AND phone != ''
    AND normalize_phone(phone) IS NOT NULL
)
UPDATE teachers
SET phone = NULL
FROM duplicates
WHERE teachers.id = duplicates.id
  AND duplicates.rn > 1
  AND duplicates.normalized_phone IN (
    SELECT normalized_phone 
    FROM duplicates 
    GROUP BY normalized_phone 
    HAVING COUNT(*) > 1
  );

-- PASSO 4: Normalizar telefones restantes em teachers
UPDATE teachers
SET phone = normalize_phone(phone)
WHERE phone IS NOT NULL AND phone != '';

-- Trigger para normalizar telefone automaticamente ao inserir/atualizar students
CREATE OR REPLACE FUNCTION normalize_student_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_student_phone ON students;
CREATE TRIGGER trigger_normalize_student_phone
  BEFORE INSERT OR UPDATE OF phone ON students
  FOR EACH ROW
  EXECUTE FUNCTION normalize_student_phone();

-- Trigger para normalizar telefone automaticamente ao inserir/atualizar teachers
CREATE OR REPLACE FUNCTION normalize_teacher_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_teacher_phone ON teachers;
CREATE TRIGGER trigger_normalize_teacher_phone
  BEFORE INSERT OR UPDATE OF phone ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION normalize_teacher_phone();

COMMENT ON FUNCTION normalize_phone IS 
'Normaliza telefone removendo máscaras e mantendo apenas dígitos';

COMMENT ON TRIGGER trigger_normalize_student_phone ON students IS 
'Normaliza telefone automaticamente antes de inserir/atualizar';

COMMENT ON TRIGGER trigger_normalize_teacher_phone ON teachers IS 
'Normaliza telefone automaticamente antes de inserir/atualizar';
