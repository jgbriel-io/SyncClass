-- ============================================
-- MIGRATION 23: FIX PAYMENT PROOF REJECTION
-- Corrige bug onde aluno não consegue reenviar comprovante após rejeição
-- Data: 24/02/2026
-- ============================================

-- Problema: Quando professor rejeita comprovante, os campos payment_proof_url
-- e payment_proof_file_name não são limpos, impedindo o aluno de enviar novo comprovante

-- Listar todas as versões da função para identificar assinaturas
DO $$
DECLARE
  func_record RECORD;
BEGIN
  RAISE NOTICE 'Versões existentes de review_payment_proof:';
  FOR func_record IN 
    SELECT 
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'review_payment_proof'
  LOOP
    RAISE NOTICE '  - review_payment_proof(%)', func_record.args;
  END LOOP;
END $$;

-- Dropar TODAS as versões da função
DROP FUNCTION IF EXISTS review_payment_proof(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS review_payment_proof(UUID, BOOLEAN, TEXT);

-- Criar nova versão corrigida
CREATE FUNCTION review_payment_proof(
  p_financial_record_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_teacher_id UUID;
  v_record_teacher_id UUID;
  v_new_status TEXT;
  v_old_proof_url TEXT;
BEGIN
  IF NOT ((SELECT public.is_teacher()) OR (SELECT public.is_admin())) THEN
    RAISE EXCEPTION 'Apenas professores e admins podem revisar comprovantes';
  END IF;

  v_teacher_id := (SELECT public.get_teacher_id());

  SELECT s.teacher_id INTO v_record_teacher_id
  FROM financial_records fr
  JOIN students s ON s.id = fr.student_id
  WHERE fr.id = p_financial_record_id;

  IF v_record_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF NOT (SELECT public.is_admin()) AND v_record_teacher_id != v_teacher_id THEN
    RAISE EXCEPTION 'Esta cobrança não pertence a um aluno seu';
  END IF;

  IF p_approved THEN
    -- APROVAR: Marcar como pago
    v_new_status := 'pago';
    UPDATE financial_records
    SET 
      payment_proof_status = 'approved',
      status = v_new_status,
      paid_at = NOW(),
      confirmed_by_user_id = auth.uid()
    WHERE id = p_financial_record_id;
  ELSE
    -- REJEITAR: Limpar comprovante para permitir reenvio
    v_new_status := 'pendente';
    
    -- Salvar URL antiga para deletar do storage depois
    SELECT payment_proof_url INTO v_old_proof_url
    FROM financial_records
    WHERE id = p_financial_record_id;
    
    UPDATE financial_records
    SET 
      payment_proof_status = 'rejected',
      payment_proof_rejection_reason = p_rejection_reason,
      payment_proof_url = NULL,  -- ✅ Limpar URL
      payment_proof_filename = NULL,  -- ✅ Limpar nome do arquivo
      status = v_new_status,
      paid_at = NULL,  -- ✅ Limpar data de pagamento
      confirmed_by_user_id = NULL  -- ✅ Limpar confirmação
    WHERE id = p_financial_record_id;
    
    -- TODO: Deletar arquivo do storage (implementar cleanup)
    -- Por enquanto, o cleanup automático vai remover arquivos órfãos
  END IF;

  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (
    auth.uid(),
    'UPDATE',
    CASE WHEN p_approved THEN 'approve_payment_proof' ELSE 'reject_payment_proof' END,
    'financial_records',
    p_financial_record_id,
    jsonb_build_object(
      'approved', p_approved,
      'rejection_reason', p_rejection_reason,
      'old_proof_url', v_old_proof_url
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE 
      WHEN p_approved THEN 'Pagamento confirmado com sucesso!'
      ELSE 'Comprovante rejeitado. O aluno pode enviar um novo.'
    END
  );
END;
$$;

COMMENT ON FUNCTION review_payment_proof(UUID, BOOLEAN, TEXT) IS 'Permite professor aprovar ou rejeitar comprovante de pagamento. Ao rejeitar, limpa os campos para permitir reenvio.';

-- ============================================
-- LIMPEZA DE DADOS INCONSISTENTES
-- ============================================

-- Corrigir registros que estão com status rejected mas ainda têm comprovante anexado
UPDATE financial_records
SET 
  payment_proof_url = NULL,
  payment_proof_filename = NULL,
  paid_at = NULL,
  confirmed_by_user_id = NULL
WHERE payment_proof_status = 'rejected'
AND payment_proof_url IS NOT NULL;

-- ============================================
-- NOTIFICAÇÃO DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 23 APLICADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Função review_payment_proof atualizada';
  RAISE NOTICE '✅ Rejeição agora limpa campos de comprovante';
  RAISE NOTICE '✅ Aluno pode reenviar após rejeição';
  RAISE NOTICE '✅ Dados inconsistentes corrigidos';
  RAISE NOTICE '============================================';
END $$;
