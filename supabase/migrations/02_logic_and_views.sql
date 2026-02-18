-- ============================================
-- EDUCORE DATABASE - 02 LOGIC AND VIEWS
-- Inteligência: Views, Funções de Suporte
-- Data: 15/02/2026
-- ============================================

-- --------------------------------------------
-- LIMPEZA DE VIEWS ANTIGAS
-- --------------------------------------------

DROP VIEW IF EXISTS students_with_stats CASCADE;
DROP VIEW IF EXISTS students_active CASCADE;
DROP VIEW IF EXISTS students_masked CASCADE;
DROP VIEW IF EXISTS students_active_masked CASCADE;
DROP VIEW IF EXISTS teachers_masked CASCADE;
DROP VIEW IF EXISTS class_logs_with_billing CASCADE;

-- --------------------------------------------
-- FUNÇÕES DE SUPORTE
-- --------------------------------------------

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Aplicar trigger em todas as tabelas com updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON teachers;
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_class_logs_updated_at ON class_logs;
CREATE TRIGGER trg_class_logs_updated_at BEFORE UPDATE ON class_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_financial_records_updated_at ON financial_records;
CREATE TRIGGER trg_financial_records_updated_at BEFORE UPDATE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_activities_updated_at ON activities;
CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON user_roles;
CREATE TRIGGER trg_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para log de performance
CREATE OR REPLACE FUNCTION log_performance(
  p_operation TEXT,
  p_duration_ms INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO performance_logs (user_id, operation, duration_ms, metadata)
  VALUES (auth.uid(), p_operation, p_duration_ms, p_metadata);
END;
$$;

COMMENT ON FUNCTION log_performance IS 'Registra métricas de performance';

-- --------------------------------------------
-- FUNÇÕES DE ANONIMIZAÇÃO (LGPD)
-- --------------------------------------------

-- Função para anonimizar aluno
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
    cpf = NULL,
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

-- Função para anonimizar professor
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
    cpf = NULL,
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

-- Função para exclusão completa após 5 anos
CREATE OR REPLACE FUNCTION hard_delete_anonymized_records()
RETURNS TABLE(
  deleted_students INTEGER,
  deleted_teachers INTEGER,
  deleted_class_logs INTEGER,
  deleted_financial_records INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_students INTEGER := 0;
  v_deleted_teachers INTEGER := 0;
  v_deleted_class_logs INTEGER := 0;
  v_deleted_financial_records INTEGER := 0;
BEGIN
  v_cutoff_date := NOW() - INTERVAL '5 years';
  
  WITH deleted_fr AS (
    DELETE FROM financial_records
    WHERE student_id IN (
      SELECT id FROM students 
      WHERE anonymized_at IS NOT NULL 
        AND anonymized_at < v_cutoff_date
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_financial_records FROM deleted_fr;
  
  WITH deleted_cl AS (
    DELETE FROM class_logs
    WHERE student_id IN (
      SELECT id FROM students 
      WHERE anonymized_at IS NOT NULL 
        AND anonymized_at < v_cutoff_date
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_class_logs FROM deleted_cl;
  
  WITH deleted_s AS (
    DELETE FROM students
    WHERE anonymized_at IS NOT NULL 
      AND anonymized_at < v_cutoff_date
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_students FROM deleted_s;
  
  WITH deleted_t AS (
    DELETE FROM teachers
    WHERE anonymized_at IS NOT NULL 
      AND anonymized_at < v_cutoff_date
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_teachers FROM deleted_t;
  
  RAISE NOTICE 'Limpeza concluída: % alunos, % professores, % aulas, % cobranças',
    v_deleted_students, v_deleted_teachers, v_deleted_class_logs, v_deleted_financial_records;
  
  RETURN QUERY SELECT 
    v_deleted_students,
    v_deleted_teachers,
    v_deleted_class_logs,
    v_deleted_financial_records;
END;
$$;

COMMENT ON FUNCTION hard_delete_anonymized_records IS 'Remove registros anonimizados há mais de 5 anos (após período de retenção fiscal). Executar anualmente.';

-- --------------------------------------------
-- VIEWS DE DASHBOARD
-- --------------------------------------------

-- VIEW: students_with_stats
-- Alunos com estatísticas agregadas
CREATE OR REPLACE VIEW students_with_stats
WITH (security_invoker = true) AS
SELECT 
  s.id,
  s.name,
  s.cpf,
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

-- VIEW: students_active
-- Apenas alunos ativos
CREATE OR REPLACE VIEW students_active
WITH (security_invoker = true) AS
SELECT * FROM students WHERE is_deleted = false OR status = 'ativo';

COMMENT ON VIEW students_active IS 'Apenas alunos ativos (is_deleted = false ou status = ativo)';

-- VIEW: students_masked
-- Alunos com dados sensíveis mascarados (LGPD) - apenas CPF
CREATE OR REPLACE VIEW students_masked
WITH (security_invoker = true) AS
SELECT 
  id,
  CASE 
    WHEN anonymized_at IS NOT NULL THEN name
    ELSE name
  END AS name,
  CASE 
    WHEN cpf IS NOT NULL THEN '***.' || SUBSTRING(cpf FROM LENGTH(cpf) - 5 FOR 3) || '-**'
    ELSE NULL
  END as cpf,
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

COMMENT ON VIEW students_masked IS 'Alunos com CPF mascarado e nome anonimizado se aplicável (LGPD)';

-- VIEW: students_active_masked
-- Alunos ativos com dados mascarados
CREATE OR REPLACE VIEW students_active_masked
WITH (security_invoker = true) AS
SELECT * FROM students_masked WHERE status = 'ativo' AND (anonymized_at IS NULL OR anonymized_at > NOW() - INTERVAL '5 years');

COMMENT ON VIEW students_active_masked IS 'Alunos ativos com CPF mascarado';

-- VIEW: teachers_masked
-- Professores com dados sensíveis mascarados (apenas CPF)
CREATE OR REPLACE VIEW teachers_masked
WITH (security_invoker = true) AS
SELECT 
  id,
  CASE 
    WHEN anonymized_at IS NOT NULL THEN name
    ELSE name
  END AS name,
  CASE 
    WHEN cpf IS NOT NULL THEN '***.' || SUBSTRING(cpf FROM LENGTH(cpf) - 5 FOR 3) || '-**'
    ELSE NULL
  END as cpf,
  phone,
  email,
  address,
  hourly_rate,
  pix_key,
  created_at,
  updated_at,
  anonymized_at,
  'ativo'::TEXT AS status
FROM teachers;

COMMENT ON VIEW teachers_masked IS 'Professores com CPF mascarado e nome anonimizado se aplicável (LGPD)';

-- VIEW: class_logs_with_billing
-- Aulas com informações de cobrança
CREATE OR REPLACE VIEW class_logs_with_billing
WITH (security_invoker = true) AS
SELECT 
  cl.*,
  fr.id as financial_record_id,
  fr.amount as financial_amount,
  fr.status as financial_status,
  fr.due_date as financial_due_date,
  fr.paid_at as financial_paid_at,
  CASE 
    WHEN frcl.id IS NOT NULL THEN true
    ELSE false
  END as is_package
FROM class_logs cl
LEFT JOIN financial_records fr ON fr.class_log_id = cl.id
LEFT JOIN financial_record_class_logs frcl ON frcl.class_log_id = cl.id;

COMMENT ON VIEW class_logs_with_billing IS 'Aulas com informações de cobrança vinculadas';

-- --------------------------------------------
-- FINALIZAÇÃO
-- --------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'LÓGICA E VIEWS CRIADAS COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Funções de suporte: 2';
  RAISE NOTICE 'Triggers: 7';
  RAISE NOTICE 'Views: 7';
  RAISE NOTICE '============================================';
END $$;
