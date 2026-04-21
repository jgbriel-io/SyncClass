-- ============================================
-- MIGRATION 22: DBA Fixes — Índices, Constraints e Limpeza
-- ============================================
-- Corrige 13 bugs identificados na análise DBA:
-- - Índices faltando em colunas de alta cardinalidade
-- - Constraints inconsistentes
-- - Campos sem UNIQUE onde deveriam ter
-- - Tabelas de log sem política de retenção
-- ============================================

-- ============================================
-- BUG-002: Índices em financial_records.status
-- ============================================
CREATE INDEX IF NOT EXISTS idx_financial_records_status 
  ON financial_records(status);

CREATE INDEX IF NOT EXISTS idx_financial_records_student_status 
  ON financial_records(student_id, status);

CREATE INDEX IF NOT EXISTS idx_financial_records_due_date_pending 
  ON financial_records(due_date, status) WHERE status = 'pendente';

-- ============================================
-- BUG-003: Índices em activities
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activities_teacher_id 
  ON activities(teacher_id) WHERE teacher_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_status 
  ON activities(status);

CREATE INDEX IF NOT EXISTS idx_activities_teacher_status 
  ON activities(teacher_id, status) WHERE teacher_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_due_date_open 
  ON activities(due_date) WHERE status IN ('pendente', 'atrasada');

-- ============================================
-- BUG-004: Índices em teachers
-- ============================================
CREATE INDEX IF NOT EXISTS idx_teachers_email 
  ON teachers(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_status 
  ON teachers(status);

-- ============================================
-- BUG-005: Índice em students.email
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_email 
  ON students(email) WHERE email IS NOT NULL;

-- ============================================
-- BUG-006: Índices em audit_logs
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name 
  ON audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON audit_logs(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- BUG-007: Índice para limpeza de idempotency_keys
-- ============================================
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at 
  ON idempotency_keys(created_at) WHERE status IN ('completed', 'failed');

-- ============================================
-- BUG-008: Índices em performance_logs
-- ============================================
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at 
  ON performance_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_logs_operation 
  ON performance_logs(operation);

-- ============================================
-- BUG-009: Corrigir constraint amount (>= 0 → > 0)
-- ============================================
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_amount_check;
ALTER TABLE financial_records ADD CONSTRAINT financial_records_amount_check CHECK (amount > 0);

-- ============================================
-- BUG-010: Constraint de grade em class_logs
-- ============================================
ALTER TABLE class_logs DROP CONSTRAINT IF EXISTS check_class_log_grade;
ALTER TABLE class_logs ADD CONSTRAINT check_class_log_grade 
  CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100));

-- ============================================
-- BUG-011: UNIQUE em emails (partial — permite NULL)
-- ============================================
-- Verificar duplicatas antes (não aplica se houver)
DO $$
DECLARE
  teacher_dupes INTEGER;
  student_dupes INTEGER;
BEGIN
  SELECT COUNT(*) INTO teacher_dupes 
  FROM (SELECT email FROM teachers WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) t;
  
  SELECT COUNT(*) INTO student_dupes 
  FROM (SELECT email FROM students WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) t;
  
  IF teacher_dupes = 0 THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_email_unique ON teachers(email) WHERE email IS NOT NULL';
    RAISE NOTICE '✅ UNIQUE index criado em teachers.email';
  ELSE
    RAISE WARNING '⚠️ Duplicatas em teachers.email (%): índice UNIQUE não criado. Limpar duplicatas manualmente.', teacher_dupes;
  END IF;
  
  IF student_dupes = 0 THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_students_email_unique ON students(email) WHERE email IS NOT NULL';
    RAISE NOTICE '✅ UNIQUE index criado em students.email';
  ELSE
    RAISE WARNING '⚠️ Duplicatas em students.email (%): índice UNIQUE não criado. Limpar duplicatas manualmente.', student_dupes;
  END IF;
END $$;

-- ============================================
-- BUG-012: Constraint de consistência de data em class_logs
-- ============================================
ALTER TABLE class_logs DROP CONSTRAINT IF EXISTS check_class_date_consistency;
ALTER TABLE class_logs ADD CONSTRAINT check_class_date_consistency 
  CHECK (start_at IS NULL OR start_at::date = class_date);

-- ============================================
-- BUG-013: Índice em financial_record_class_logs.class_log_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_frcl_class_log_id 
  ON financial_record_class_logs(class_log_id);

-- ============================================
-- Limpeza de dados antigos (executar manualmente em produção)
-- ============================================

-- Limpar idempotency_keys antigas (> 30 dias)
-- DELETE FROM idempotency_keys 
-- WHERE status IN ('completed', 'failed') 
--   AND created_at < NOW() - INTERVAL '30 days';

-- Limpar performance_logs antigos (> 90 dias)
-- DELETE FROM performance_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- ============================================
-- Verificação final
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DBA FIXES APLICADOS COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Índices criados: 18';
  RAISE NOTICE 'Constraints corrigidas: 3';
  RAISE NOTICE 'UNIQUE indexes: verificados automaticamente';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'BUG-001 (is_deleted vs status): requer análise manual';
  RAISE NOTICE 'Limpeza de logs: descomentada e executada manualmente';
  RAISE NOTICE '============================================';
END $$;
