-- ============================================
-- MIGRATION 18 V2: Correção FORÇADA de security_invoker
-- A migration anterior não aplicou security_invoker corretamente
-- Data: 23/02/2026
-- ============================================

-- SOLUÇÃO: Dropar e recriar a view com security_invoker
DROP VIEW IF EXISTS activities_active CASCADE;

CREATE VIEW activities_active
WITH (security_invoker = true) AS
SELECT 
  id,
  student_id,
  teacher_id,
  title,
  description,
  due_date,
  status,
  delivery_date,
  correction,
  grade,
  created_at,
  updated_at,
  file_name,
  response_file_name,
  file_size,
  response_file_size,
  file_type,
  response_file_type,
  file_url,
  response_file_url,
  delivered_at,
  corrected_at,
  student_response_file_name,
  student_response_text,
  feedback,
  correction_file_url,
  correction_file_name,
  deleted_at,
  deleted_by
FROM activities 
WHERE deleted_at IS NULL;

COMMENT ON VIEW activities_active IS 'Atividades não deletadas (soft delete) - RLS aplicado via security_invoker';

-- Verificar que foi aplicado corretamente
DO $$
DECLARE
  v_options TEXT;
BEGIN
  SELECT reloptions::TEXT INTO v_options
  FROM pg_class
  WHERE relname = 'activities_active' AND relkind = 'v';
  
  IF v_options LIKE '%security_invoker=true%' THEN
    RAISE NOTICE '✅ View activities_active tem security_invoker = true';
  ELSE
    RAISE EXCEPTION '❌ FALHA: View activities_active NÃO tem security_invoker!';
  END IF;
END;
$$;

-- ============================================
-- NOTIFICAÇÃO DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 18 V2 APLICADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ View activities_active CORRIGIDA com security_invoker = true';
  RAISE NOTICE '============================================';
END;
$$;
