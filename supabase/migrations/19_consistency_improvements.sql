-- ============================================
-- MIGRATION 19: MELHORIAS DE CONSISTÊNCIA
-- Sprint 2 - Consistência de Dados
-- Data: 23/02/2026
-- ============================================

-- ============================================
-- TASK 2.2: VALIDAÇÃO DE EMAIL NO BANCO
-- ============================================

-- Função de validação de email (IMMUTABLE para uso em constraints)
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validação básica de formato de email
  -- Permite: letras, números, pontos, hífens, underscores antes do @
  -- Domínio: letras, números, pontos, hífens
  -- TLD: mínimo 2 caracteres
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

COMMENT ON FUNCTION is_valid_email(TEXT) IS 'Valida formato de email (RFC 5322 simplificado)';

-- Constraint em students
ALTER TABLE students 
ADD CONSTRAINT students_email_format 
CHECK (email IS NULL OR is_valid_email(email));

-- Constraint em teachers
ALTER TABLE teachers 
ADD CONSTRAINT teachers_email_format 
CHECK (email IS NULL OR is_valid_email(email));

-- ============================================
-- TASK 2.3: ÍNDICES PARA SOFT DELETE
-- ============================================

-- Índice parcial para activities não deletadas (mais comum)
CREATE INDEX IF NOT EXISTS idx_activities_active 
ON activities(deleted_at) 
WHERE deleted_at IS NULL;

-- Índices compostos para queries comuns com soft delete
CREATE INDEX IF NOT EXISTS idx_activities_student_active 
ON activities(student_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_teacher_active 
ON activities(teacher_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_status_active 
ON activities(status, deleted_at) 
WHERE deleted_at IS NULL;

-- Índice para queries de cleanup (atividades deletadas)
-- Já existe: idx_activities_deleted_at_cleanup (criado na migration 17)

-- ============================================
-- VERIFICAÇÕES E NOTIFICAÇÕES
-- ============================================

DO $$
DECLARE
  v_invalid_students INT;
  v_invalid_teachers INT;
BEGIN
  -- Verificar emails inválidos em students
  SELECT COUNT(*) INTO v_invalid_students
  FROM students
  WHERE email IS NOT NULL AND NOT is_valid_email(email);
  
  -- Verificar emails inválidos em teachers
  SELECT COUNT(*) INTO v_invalid_teachers
  FROM teachers
  WHERE email IS NOT NULL AND NOT is_valid_email(email);
  
  IF v_invalid_students > 0 THEN
    RAISE WARNING '⚠️  % alunos com email inválido detectados', v_invalid_students;
    RAISE NOTICE 'Execute: SELECT id, name, email FROM students WHERE email IS NOT NULL AND NOT is_valid_email(email);';
  END IF;
  
  IF v_invalid_teachers > 0 THEN
    RAISE WARNING '⚠️  % professores com email inválido detectados', v_invalid_teachers;
    RAISE NOTICE 'Execute: SELECT id, name, email FROM teachers WHERE email IS NOT NULL AND NOT is_valid_email(email);';
  END IF;
  
  IF v_invalid_students = 0 AND v_invalid_teachers = 0 THEN
    RAISE NOTICE '✅ Todos os emails existentes são válidos';
  END IF;
END;
$$;

-- ============================================
-- NOTIFICAÇÃO DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 19 APLICADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Validação de email adicionada (students, teachers)';
  RAISE NOTICE '✅ Índices de soft delete criados (4 índices)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Corrigir emails inválidos (se houver)';
  RAISE NOTICE '2. Atualizar frontend para escala 0-100';
  RAISE NOTICE '3. Testar performance das queries';
  RAISE NOTICE '============================================';
END;
$$;
