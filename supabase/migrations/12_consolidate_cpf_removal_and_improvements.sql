-- ============================================
-- MIGRATION 12: Consolidação de Melhorias
-- - Remove CPF de students e teachers
-- - Adiciona coluna country
-- - Adiciona soft delete em profiles (deleted_at)
-- - Normaliza telefones automaticamente
-- - Atualiza views e índices
-- Data: 21/02/2026
-- ============================================

-- --------------------------------------------
-- 1. ADICIONAR COLUNA COUNTRY
-- --------------------------------------------

-- Adicionar country em students (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE students ADD COLUMN country VARCHAR(100);
    COMMENT ON COLUMN students.country IS 'País do aluno (ex: Brasil, Estados Unidos, Portugal)';
    RAISE NOTICE '✓ Coluna country adicionada em students';
  ELSE
    RAISE NOTICE '⊘ Coluna country já existe em students';
  END IF;
END $$;

-- Adicionar country em teachers (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE teachers ADD COLUMN country VARCHAR(100);
    COMMENT ON COLUMN teachers.country IS 'País do professor (ex: Brasil, Estados Unidos, Portugal)';
    RAISE NOTICE '✓ Coluna country adicionada em teachers';
  ELSE
    RAISE NOTICE '⊘ Coluna country já existe em teachers';
  END IF;
END $$;

-- --------------------------------------------
-- 2. ADICIONAR SOFT DELETE EM PROFILES
-- --------------------------------------------

-- Adicionar deleted_at em profiles (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp quando profile foi soft deleted (oculto da UI mas preservado para auditoria)';
    RAISE NOTICE '✓ Coluna deleted_at adicionada em profiles';
  ELSE
    RAISE NOTICE '⊘ Coluna deleted_at já existe em profiles';
  END IF;
END $$;

-- Criar índice para deleted_at (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_deleted_at'
  ) THEN
    CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;
    RAISE NOTICE '✓ Índice idx_profiles_deleted_at criado';
  ELSE
    RAISE NOTICE '⊘ Índice idx_profiles_deleted_at já existe';
  END IF;
END $$;

-- --------------------------------------------
-- 3. DROPAR VIEWS TEMPORARIAMENTE (para permitir remoção de CPF)
-- --------------------------------------------

DROP VIEW IF EXISTS students_with_stats CASCADE;
DROP VIEW IF EXISTS students_active CASCADE;
DROP VIEW IF EXISTS students_masked CASCADE;
DROP VIEW IF EXISTS students_active_masked CASCADE;
DROP VIEW IF EXISTS teachers_masked CASCADE;

-- --------------------------------------------
-- 4. REMOVER CPF DE STUDENTS E TEACHERS
-- --------------------------------------------

-- Remover CPF de students (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'cpf'
  ) THEN
    -- Remover índice único de CPF primeiro
    DROP INDEX IF EXISTS idx_students_cpf_unique;
    DROP INDEX IF EXISTS idx_students_cpf;
    
    -- Remover coluna
    ALTER TABLE students DROP COLUMN cpf;
    RAISE NOTICE '✓ Coluna cpf removida de students';
  ELSE
    RAISE NOTICE '⊘ Coluna cpf já foi removida de students';
  END IF;
END $$;

-- Remover CPF de teachers (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'cpf'
  ) THEN
    -- Remover índice único de CPF primeiro
    DROP INDEX IF EXISTS idx_teachers_cpf_unique;
    DROP INDEX IF EXISTS idx_teachers_cpf;
    
    -- Remover coluna
    ALTER TABLE teachers DROP COLUMN cpf;
    RAISE NOTICE '✓ Coluna cpf removida de teachers';
  ELSE
    RAISE NOTICE '⊘ Coluna cpf já foi removida de teachers';
  END IF;
END $$;

-- --------------------------------------------
-- 5. FUNÇÕES DE NORMALIZAÇÃO DE TELEFONE
-- --------------------------------------------

-- Função para normalizar telefone (apenas dígitos)
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  -- Remove tudo exceto dígitos
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

COMMENT ON FUNCTION normalize_phone IS 'Normaliza telefone removendo máscaras e mantendo apenas dígitos';

-- --------------------------------------------
-- 6. NORMALIZAR TELEFONES EXISTENTES
-- --------------------------------------------

-- Normalizar telefones em students
UPDATE students 
SET phone = normalize_phone(phone)
WHERE phone IS NOT NULL AND phone != '';

-- Normalizar telefones em teachers
UPDATE teachers 
SET phone = normalize_phone(phone)
WHERE phone IS NOT NULL AND phone != '';

-- --------------------------------------------
-- 7. TRATAR TELEFONES DUPLICADOS
-- --------------------------------------------

-- Identificar e limpar duplicados em students (manter o mais antigo, limpar os outros)
DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  -- Contar duplicados
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT phone, COUNT(*) as cnt
    FROM students
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE NOTICE 'Encontrados % telefones duplicados em students. Limpando...', v_duplicate_count;
    
    -- Para cada telefone duplicado, manter apenas o registro mais antigo
    UPDATE students s1
    SET phone = NULL
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND EXISTS (
        SELECT 1 
        FROM students s2 
        WHERE s2.phone = s1.phone 
          AND s2.created_at < s1.created_at
      );
    
    RAISE NOTICE '✓ Telefones duplicados limpos em students';
  ELSE
    RAISE NOTICE '⊘ Nenhum telefone duplicado em students';
  END IF;
END $$;

-- Identificar e limpar duplicados em teachers (manter o mais antigo, limpar os outros)
DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  -- Contar duplicados
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT phone, COUNT(*) as cnt
    FROM teachers
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE NOTICE 'Encontrados % telefones duplicados em teachers. Limpando...', v_duplicate_count;
    
    -- Para cada telefone duplicado, manter apenas o registro mais antigo
    UPDATE teachers t1
    SET phone = NULL
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND EXISTS (
        SELECT 1 
        FROM teachers t2 
        WHERE t2.phone = t1.phone 
          AND t2.created_at < t1.created_at
      );
    
    RAISE NOTICE '✓ Telefones duplicados limpos em teachers';
  ELSE
    RAISE NOTICE '⊘ Nenhum telefone duplicado em teachers';
  END IF;
END $$;

-- --------------------------------------------
-- 8. CRIAR TRIGGERS DE NORMALIZAÇÃO
-- --------------------------------------------

-- Trigger para normalizar telefone automaticamente em students
CREATE OR REPLACE FUNCTION normalize_student_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_normalize_student_phone ON students;
CREATE TRIGGER trigger_normalize_student_phone
  BEFORE INSERT OR UPDATE OF phone ON students
  FOR EACH ROW
  EXECUTE FUNCTION normalize_student_phone();

COMMENT ON TRIGGER trigger_normalize_student_phone ON students IS 'Normaliza telefone automaticamente antes de inserir/atualizar';

-- Trigger para normalizar telefone automaticamente em teachers
CREATE OR REPLACE FUNCTION normalize_teacher_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_normalize_teacher_phone ON teachers;
CREATE TRIGGER trigger_normalize_teacher_phone
  BEFORE INSERT OR UPDATE OF phone ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION normalize_teacher_phone();

COMMENT ON TRIGGER trigger_normalize_teacher_phone ON teachers IS 'Normaliza telefone automaticamente antes de inserir/atualizar';

-- --------------------------------------------
-- 9. ÍNDICES ÚNICOS PARA TELEFONE
-- --------------------------------------------

-- Criar índice único parcial para telefone em students (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'students' 
    AND indexname = 'idx_students_phone_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_students_phone_unique 
      ON students(phone) 
      WHERE phone IS NOT NULL AND phone != '';
    COMMENT ON INDEX idx_students_phone_unique IS 'Índice único parcial - permite múltiplos NULL';
    RAISE NOTICE '✓ Índice único de telefone criado em students';
  ELSE
    RAISE NOTICE '⊘ Índice único de telefone já existe em students';
  END IF;
END $$;

-- Criar índice único parcial para telefone em teachers (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'teachers' 
    AND indexname = 'idx_teachers_phone_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_teachers_phone_unique 
      ON teachers(phone) 
      WHERE phone IS NOT NULL AND phone != '';
    COMMENT ON INDEX idx_teachers_phone_unique IS 'Índice único parcial - permite múltiplos NULL';
    RAISE NOTICE '✓ Índice único de telefone criado em teachers';
  ELSE
    RAISE NOTICE '⊘ Índice único de telefone já existe em teachers';
  END IF;
END $$;

-- --------------------------------------------
-- 10. RECRIAR VIEWS (REMOVER CPF, ADICIONAR COUNTRY)
-- --------------------------------------------

-- Recriar students_masked sem CPF e com country
CREATE OR REPLACE VIEW students_masked
WITH (security_invoker = true) AS
SELECT 
  id,
  CASE 
    WHEN anonymized_at IS NOT NULL THEN name
    ELSE name
  END AS name,
  country,
  phone,
  email,
  pay_day,
  hourly_rate,
  is_deleted,
  status,
  teacher_id,
  birth_date,
  city,
  state,
  origin,
  created_at,
  updated_at,
  anonymized_at
FROM students;

COMMENT ON VIEW students_masked IS 'Alunos com nome anonimizado se aplicável (LGPD)';

-- Recriar teachers_masked sem CPF e com country
CREATE OR REPLACE VIEW teachers_masked
WITH (security_invoker = true) AS
SELECT 
  id,
  CASE 
    WHEN anonymized_at IS NOT NULL THEN name
    ELSE name
  END AS name,
  country,
  phone,
  email,
  address,
  hourly_rate,
  pix_key,
  created_at,
  updated_at,
  anonymized_at,
  COALESCE(status, 'ativo') AS status
FROM teachers;

COMMENT ON VIEW teachers_masked IS 'Professores com nome anonimizado se aplicável (LGPD)';

-- Recriar students_with_stats com country
CREATE OR REPLACE VIEW students_with_stats
WITH (security_invoker = true) AS
SELECT 
  s.id,
  s.name,
  s.country,
  s.phone,
  s.email,
  s.pay_day,
  s.hourly_rate,
  s.is_deleted,
  s.status,
  s.teacher_id,
  s.birth_date,
  s.city,
  s.state,
  s.origin,
  s.created_at,
  s.updated_at,
  s.anonymized_at,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance = true) as total_classes_attended,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance = false) as total_classes_missed,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance IS NULL) as total_classes_pending,
  COALESCE(SUM(fr.amount) FILTER (WHERE fr.status = 'pendente'), 0) as total_pending_amount,
  COALESCE(SUM(fr.amount) FILTER (WHERE fr.status = 'pago'), 0) as total_paid_amount,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'pendente') as total_activities_pending,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'entregue') as total_activities_delivered,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'corrigida') as total_activities_corrected
FROM students s
LEFT JOIN class_logs cl ON cl.student_id = s.id
LEFT JOIN financial_records fr ON fr.student_id = s.id
LEFT JOIN activities a ON a.student_id = s.id
GROUP BY s.id;

COMMENT ON VIEW students_with_stats IS 'Alunos com estatísticas agregadas de aulas, cobranças e atividades';

-- Recriar students_active
CREATE OR REPLACE VIEW students_active
WITH (security_invoker = true) AS
SELECT * FROM students WHERE is_deleted = false OR status = 'ativo';

COMMENT ON VIEW students_active IS 'Apenas alunos ativos (is_deleted = false ou status = ativo)';

-- Recriar students_active_masked
CREATE OR REPLACE VIEW students_active_masked
WITH (security_invoker = true) AS
SELECT * FROM students_masked WHERE status = 'ativo' AND (anonymized_at IS NULL OR anonymized_at > NOW() - INTERVAL '5 years');

COMMENT ON VIEW students_active_masked IS 'Alunos ativos';

-- --------------------------------------------
-- 11. ATUALIZAR FUNÇÕES DE ANONIMIZAÇÃO
-- --------------------------------------------

-- Atualizar função de anonimização de aluno (remover CPF)
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

COMMENT ON FUNCTION anonymize_student IS 'Anonimiza dados pessoais de um aluno mantendo dados fiscais para auditoria (LGPD Art. 16, I)';

-- Atualizar função de anonimização de professor (remover CPF)
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

COMMENT ON FUNCTION anonymize_teacher IS 'Anonimiza dados pessoais de um professor mantendo dados fiscais para auditoria (LGPD Art. 16, I)';

-- --------------------------------------------
-- 12. ATUALIZAR FUNÇÃO DE VALIDAÇÃO DE TELEFONE
-- --------------------------------------------

-- Atualizar função de telefone para normalizar antes de comparar
CREATE OR REPLACE FUNCTION check_phone_exists_platform(p_phone_digits TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
  v_normalized_input TEXT;
BEGIN
  -- Normalizar o input (remover tudo exceto dígitos)
  v_normalized_input := regexp_replace(p_phone_digits, '[^0-9]', '', 'g');

  -- Se vazio após normalização, retornar false
  IF v_normalized_input IS NULL OR v_normalized_input = '' THEN
    RETURN FALSE;
  END IF;

  -- Buscar comparando telefones normalizados
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE phone IS NOT NULL
      AND phone != ''
      AND regexp_replace(phone, '[^0-9]', '', 'g') = v_normalized_input
    UNION ALL
    SELECT 1 FROM teachers
    WHERE phone IS NOT NULL
      AND phone != ''
      AND regexp_replace(phone, '[^0-9]', '', 'g') = v_normalized_input
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION check_phone_exists_platform IS 
'Verifica se telefone já existe em students ou teachers (platform-wide). Normaliza telefones antes de comparar para detectar duplicados independente de máscaras.';

-- Garantir permissões
GRANT EXECUTE ON FUNCTION check_phone_exists_platform TO authenticated;

-- --------------------------------------------
-- 13. REMOVER FUNÇÕES OBSOLETAS DE VALIDAÇÃO DE CPF
-- --------------------------------------------

-- Remover função de validação de CPF platform-wide (se existir)
DROP FUNCTION IF EXISTS check_cpf_exists_platform(TEXT);

-- --------------------------------------------
-- FINALIZAÇÃO
-- --------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 12 APLICADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ CPF removido de students e teachers';
  RAISE NOTICE '✓ Coluna country adicionada';
  RAISE NOTICE '✓ Soft delete (deleted_at) em profiles';
  RAISE NOTICE '✓ Normalização automática de telefones';
  RAISE NOTICE '✓ Índices únicos para telefone';
  RAISE NOTICE '✓ Views atualizadas';
  RAISE NOTICE '✓ Funções de anonimização atualizadas';
  RAISE NOTICE '✓ Função check_phone_exists_platform atualizada';
  RAISE NOTICE '============================================';
END $$;
