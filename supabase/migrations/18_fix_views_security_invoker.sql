-- ============================================
-- MIGRATION 18: Correção de Segurança em Views e Storage
-- Sprint 1 - Task 1.1 e 1.2
-- Data: 23/02/2026
-- ============================================

-- ============================================
-- TASK 1.1: CORRIGIR SECURITY_INVOKER EM VIEWS
-- ============================================

-- PROBLEMA: View activities_active não tem security_invoker
-- RISCO: Pode bypassar RLS da tabela activities

-- Recriar view activities_active com security_invoker
DROP VIEW IF EXISTS activities_active CASCADE;
CREATE VIEW activities_active
WITH (security_invoker = true) AS
SELECT * FROM activities WHERE deleted_at IS NULL;

COMMENT ON VIEW activities_active IS 'Atividades não deletadas (soft delete) - RLS aplicado via security_invoker';

-- Verificar que todas as outras views já têm security_invoker
-- (students_masked, teachers_masked, students_with_stats, etc já foram corrigidas na migration 12)

-- ============================================
-- TASK 1.2: FUNÇÃO DE LIMPEZA DE STORAGE ÓRFÃO
-- ============================================

-- Função para buscar arquivos órfãos de atividades deletadas há mais de 90 dias
CREATE OR REPLACE FUNCTION get_orphaned_activity_files()
RETURNS TABLE (
  activity_id UUID,
  file_url TEXT,
  response_file_url TEXT,
  correction_file_url TEXT,
  deleted_at TIMESTAMPTZ,
  days_since_deletion INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS activity_id,
    a.file_url,
    a.response_file_url,
    a.correction_file_url,
    a.deleted_at,
    EXTRACT(DAY FROM NOW() - a.deleted_at)::INTEGER AS days_since_deletion
  FROM activities a
  WHERE a.deleted_at < NOW() - INTERVAL '90 days'
  AND (
    a.file_url IS NOT NULL OR 
    a.response_file_url IS NOT NULL OR 
    a.correction_file_url IS NOT NULL
  )
  ORDER BY a.deleted_at ASC;
END;
$$;

COMMENT ON FUNCTION get_orphaned_activity_files IS 'Retorna arquivos de atividades deletadas há mais de 90 dias para limpeza';

-- Função para marcar arquivos como limpos (após deletar do storage)
CREATE OR REPLACE FUNCTION mark_activity_files_cleaned(p_activity_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE activities
  SET 
    file_url = NULL,
    file_name = NULL,
    file_size = NULL,
    file_type = NULL,
    response_file_url = NULL,
    response_file_name = NULL,
    response_file_size = NULL,
    response_file_type = NULL,
    correction_file_url = NULL,
    correction_file_name = NULL,
    updated_at = NOW()
  WHERE id = p_activity_id;
  
  RAISE NOTICE 'Arquivos da atividade % marcados como limpos', p_activity_id;
END;
$$;

COMMENT ON FUNCTION mark_activity_files_cleaned IS 'Marca arquivos de uma atividade como limpos após deletar do storage';

-- Função para hard delete de atividades antigas (após limpar arquivos)
CREATE OR REPLACE FUNCTION hard_delete_old_activities()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Deletar atividades deletadas há mais de 90 dias SEM arquivos
  DELETE FROM activities
  WHERE deleted_at < NOW() - INTERVAL '90 days'
  AND file_url IS NULL
  AND response_file_url IS NULL
  AND correction_file_url IS NULL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Hard delete: % atividades antigas removidas', v_deleted_count;
  
  -- Registrar na auditoria
  INSERT INTO audit_logs (action_type, action, table_name, metadata)
  VALUES (
    'DELETE',
    'Hard delete de atividades antigas',
    'activities',
    jsonb_build_object('deleted_count', v_deleted_count, 'retention_days', 90)
  );
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION hard_delete_old_activities IS 'Remove permanentemente atividades deletadas há mais de 90 dias (após limpar arquivos)';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para queries de limpeza de storage (sem NOW() no predicate)
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at_cleanup 
ON activities(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Índice para verificar arquivos órfãos
CREATE INDEX IF NOT EXISTS idx_activities_files 
ON activities(file_url, response_file_url, correction_file_url) 
WHERE deleted_at IS NOT NULL;

-- ============================================
-- NOTIFICAÇÃO DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 18 APLICADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ View activities_active corrigida (security_invoker = true)';
  RAISE NOTICE '✅ Função get_orphaned_activity_files() criada';
  RAISE NOTICE '✅ Função mark_activity_files_cleaned() criada';
  RAISE NOTICE '✅ Função hard_delete_old_activities() criada';
  RAISE NOTICE '✅ Índices de performance criados';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMO PASSO: Deploy da Edge Function cleanup-storage';
  RAISE NOTICE '============================================';
END;
$$;
