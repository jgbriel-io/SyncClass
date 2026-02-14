-- =====================================================
-- CORREÇÃO: Sistema de Auditoria - Audit Logs (V2)
-- Data: 14/02/2026
-- Versão: 2.0 - Remove versões antigas antes de criar
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 0: Remover TODAS as versões antigas das funções
-- =====================================================

-- Remover todas as versões de update_payment_day
DROP FUNCTION IF EXISTS update_payment_day(UUID, INTEGER) CASCADE;

-- Remover todas as versões de mark_as_paid_idempotent
DROP FUNCTION IF EXISTS mark_as_paid_idempotent(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_as_paid_idempotent(UUID, TEXT) CASCADE;

-- Remover todas as versões de create_class_package
DROP FUNCTION IF EXISTS create_class_package(class_log_input[], package_financial_input, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_class_package(class_log_input[], package_financial_input) CASCADE;

-- =====================================================
-- PARTE 1: Criar RPC update_payment_day (CORRIGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_day(
  p_student_id UUID,
  p_new_pay_day INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_new_pay_day < 1 OR p_new_pay_day > 28 THEN
    RAISE EXCEPTION 'Dia de pagamento deve estar entre 1 e 28';
  END IF;
  
  UPDATE students
  SET pay_day = p_new_pay_day, updated_at = NOW()
  WHERE id = p_student_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Dia de pagamento atualizado com sucesso',
    'student_id', p_student_id,
    'new_pay_day', p_new_pay_day
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- CORREÇÃO: Usar action_type + action
    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'update_payment_day_error', 'students', p_student_id,
            jsonb_build_object('error_message', SQLERRM, 'error_detail', SQLSTATE, 'new_pay_day', p_new_pay_day));
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_payment_day IS 'Atualiza o dia de pagamento de um aluno (1-28)';

-- =====================================================
-- PARTE 2: Criar RPC mark_as_paid_idempotent (CORRIGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION mark_as_paid_idempotent(
  p_record_id UUID,
  p_payment_method TEXT,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_old_status payment_status;
  v_idempotency_record RECORD;
  v_result JSONB;
BEGIN
  -- Verificar idempotência
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_idempotency_record FROM idempotency_keys WHERE idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
      IF v_idempotency_record.status = 'completed' THEN
        RETURN v_idempotency_record.response_payload;
      END IF;
      IF v_idempotency_record.status = 'processing' THEN
        RAISE EXCEPTION 'Operação já está sendo processada';
      END IF;
      IF v_idempotency_record.status = 'failed' THEN
        DELETE FROM idempotency_keys WHERE idempotency_key = p_idempotency_key;
      END IF;
    END IF;
    
    INSERT INTO idempotency_keys (idempotency_key, operation, user_id, request_payload, status)
    VALUES (p_idempotency_key, 'mark_as_paid', auth.uid(),
            jsonb_build_object('record_id', p_record_id, 'payment_method', p_payment_method), 'processing');
  END IF;
  
  -- Guardar status antigo
  SELECT status INTO v_old_status FROM financial_records WHERE id = p_record_id;
  
  -- Atualizar registro
  UPDATE financial_records
  SET status = 'pago', 
      payment_method = p_payment_method, 
      paid_at = NOW(), 
      confirmed_by_user_id = auth.uid(), 
      confirmed_at = NOW()
  WHERE id = p_record_id;
  
  -- CORREÇÃO: Usar action_type + action
  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), 'UPDATE', 'mark_as_paid', 'financial_records', p_record_id,
          jsonb_build_object('status', v_old_status),
          jsonb_build_object('status', 'pago', 'payment_method', p_payment_method, 'paid_at', NOW()));
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Pagamento confirmado com sucesso',
    'record_id', p_record_id,
    'old_status', v_old_status,
    'new_status', 'pago'
  );
  
  -- Marcar idempotência como completa
  IF p_idempotency_key IS NOT NULL THEN
    UPDATE idempotency_keys
    SET status = 'completed', response_payload = v_result, completed_at = NOW()
    WHERE idempotency_key = p_idempotency_key;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_as_paid_idempotent IS 'Marca um registro financeiro como pago com suporte a idempotência';

-- =====================================================
-- PARTE 3: Criar RPC create_class_package (CORRIGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION create_class_package(
  p_class_logs class_log_input[],
  p_financial_data package_financial_input,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_student_id UUID;
  v_inserted_logs UUID[];
  v_financial_record_id UUID;
  v_log class_log_input;
  v_overlap_check RECORD;
  v_idempotency_record RECORD;
  v_result JSONB;
  v_start_time TIMESTAMPTZ;
  v_duration_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Validar entrada
  IF array_length(p_class_logs, 1) IS NULL OR array_length(p_class_logs, 1) = 0 THEN
    RAISE EXCEPTION 'Nenhuma aula no pacote';
  END IF;
  
  v_student_id := (p_class_logs[1]).student_id;
  
  -- Validar que todas as aulas são do mesmo aluno
  FOREACH v_log IN ARRAY p_class_logs LOOP
    IF v_log.student_id != v_student_id THEN
      RAISE EXCEPTION 'Todas as aulas do pacote devem ser do mesmo aluno';
    END IF;
  END LOOP;
  
  -- Verificar idempotência
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_idempotency_record FROM idempotency_keys WHERE idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
      IF v_idempotency_record.status = 'completed' THEN
        RETURN v_idempotency_record.response_payload;
      END IF;
      IF v_idempotency_record.status = 'processing' THEN
        RAISE EXCEPTION 'Operação já está sendo processada';
      END IF;
      IF v_idempotency_record.status = 'failed' THEN
        DELETE FROM idempotency_keys WHERE idempotency_key = p_idempotency_key;
      END IF;
    END IF;
    
    INSERT INTO idempotency_keys (idempotency_key, operation, user_id, request_payload, status)
    VALUES (p_idempotency_key, 'create_class_package', auth.uid(),
            jsonb_build_object('class_logs_count', array_length(p_class_logs, 1), 'student_id', v_student_id), 'processing');
  END IF;
  
  -- Validar sobreposição com aulas existentes
  FOREACH v_log IN ARRAY p_class_logs LOOP
    IF v_log.teacher_id IS NOT NULL AND v_log.start_at IS NOT NULL AND v_log.end_at IS NOT NULL THEN
      SELECT cl.id, cl.class_date, cl.start_at, cl.end_at, s.name as student_name
      INTO v_overlap_check
      FROM class_logs cl
      LEFT JOIN students s ON s.id = cl.student_id
      WHERE cl.teacher_id = v_log.teacher_id
        AND cl.class_date = v_log.class_date
        AND cl.id != COALESCE(v_log.student_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND cl.start_at < v_log.end_at
        AND cl.end_at > v_log.start_at
      LIMIT 1;
      
      IF FOUND THEN
        RAISE EXCEPTION 'Professor já tem aula agendada em % das % às %',
          v_overlap_check.class_date, to_char(v_overlap_check.start_at, 'HH24:MI'), to_char(v_overlap_check.end_at, 'HH24:MI');
      END IF;
    END IF;
  END LOOP;
  
  -- Validar sobreposição dentro do próprio pacote
  FOR i IN 1..array_length(p_class_logs, 1) LOOP
    FOR j IN (i+1)..array_length(p_class_logs, 1) LOOP
      IF (p_class_logs[i]).teacher_id IS NOT NULL 
         AND (p_class_logs[i]).teacher_id = (p_class_logs[j]).teacher_id
         AND (p_class_logs[i]).class_date = (p_class_logs[j]).class_date
         AND (p_class_logs[i]).start_at < (p_class_logs[j]).end_at
         AND (p_class_logs[j]).start_at < (p_class_logs[i]).end_at THEN
        RAISE EXCEPTION 'Duas aulas do pacote têm o mesmo professor e horários que se sobrepõem';
      END IF;
    END LOOP;
  END LOOP;
  
  -- Inserir aulas
  v_inserted_logs := ARRAY[]::UUID[];
  
  FOREACH v_log IN ARRAY p_class_logs LOOP
    INSERT INTO class_logs (student_id, teacher_id, class_date, start_at, end_at, attendance, notes)
    VALUES (v_log.student_id, v_log.teacher_id, v_log.class_date, v_log.start_at, v_log.end_at,
            COALESCE(v_log.attendance, true), v_log.notes)
    RETURNING id INTO STRICT v_financial_record_id;
    
    v_inserted_logs := array_append(v_inserted_logs, v_financial_record_id);
  END LOOP;
  
  -- Criar registro financeiro se necessário
  IF p_financial_data.amount > 0 THEN
    INSERT INTO financial_records (student_id, class_log_id, amount, due_date, description, payment_method, status)
    VALUES (v_student_id, NULL, p_financial_data.amount, p_financial_data.due_date,
            COALESCE(p_financial_data.description, 'Pacote mensal - ' || array_length(p_class_logs, 1) || ' aulas'),
            p_financial_data.payment_method, 'pendente')
    RETURNING id INTO STRICT v_financial_record_id;
    
    -- Vincular aulas ao registro financeiro
    FOR i IN 1..array_length(v_inserted_logs, 1) LOOP
      INSERT INTO financial_record_class_logs (financial_record_id, class_log_id)
      VALUES (v_financial_record_id, v_inserted_logs[i]);
    END LOOP;
  ELSE
    v_financial_record_id := NULL;
  END IF;
  
  -- CORREÇÃO: Usar action_type + action
  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'INSERT', 'create_class_package', 'class_logs', v_student_id,
          jsonb_build_object('class_logs_count', array_length(p_class_logs, 1), 'class_log_ids', v_inserted_logs, 'financial_record_id', v_financial_record_id));
  
  v_result := jsonb_build_object(
    'success', true,
    'message', format('%s aula(s) criada(s) com sucesso', array_length(p_class_logs, 1)),
    'class_log_ids', v_inserted_logs,
    'financial_record_id', v_financial_record_id,
    'student_id', v_student_id
  );
  
  -- Marcar idempotência como completa
  IF p_idempotency_key IS NOT NULL THEN
    UPDATE idempotency_keys
    SET status = 'completed', response_payload = v_result, completed_at = NOW()
    WHERE idempotency_key = p_idempotency_key;
  END IF;
  
  -- Log de performance
  v_duration_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
  PERFORM log_performance('create_class_package', v_duration_ms, 
                          jsonb_build_object('class_count', array_length(p_class_logs, 1)));
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Marcar idempotência como falha
    IF p_idempotency_key IS NOT NULL THEN
      UPDATE idempotency_keys
      SET status = 'failed', response_payload = jsonb_build_object('error', SQLERRM), completed_at = NOW()
      WHERE idempotency_key = p_idempotency_key;
    END IF;
    
    -- CORREÇÃO: Usar action_type + action
    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'INSERT', 'create_class_package_error', 'class_logs', v_student_id,
            jsonb_build_object('error_message', SQLERRM, 'class_logs_count', array_length(p_class_logs, 1)));
    
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_class_package IS 'Cria um pacote de aulas com validação de sobreposição e suporte a idempotência';

COMMIT;

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

-- Verificar se as funções foram criadas corretamente
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) LIKE '%action_type%' as has_action_type_fix,
    pronargs as num_args
FROM pg_proc 
WHERE proname IN ('update_payment_day', 'mark_as_paid_idempotent', 'create_class_package')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, pronargs;

-- Resultado esperado: 
-- - update_payment_day: 1 função com has_action_type_fix = true
-- - mark_as_paid_idempotent: 1 função com has_action_type_fix = true
-- - create_class_package: 1 função com has_action_type_fix = true
