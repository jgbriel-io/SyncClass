-- ============================================
-- MIGRATION 14: Rate Limiting no Backend
-- Implementa rate limiting usando Postgres
-- Data: 21/02/2026
-- ============================================

-- Tabela para rastrear rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, operation, window_start)
);

CREATE INDEX idx_rate_limit_tracker_user_op ON rate_limit_tracker(user_id, operation, window_start);
CREATE INDEX idx_rate_limit_tracker_window ON rate_limit_tracker(window_start);

COMMENT ON TABLE rate_limit_tracker IS 'Rastreia requisições para rate limiting no backend';

-- Habilitar RLS
ALTER TABLE rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- Política: apenas o próprio usuário pode ver seus registros
CREATE POLICY "rate_limit_tracker_select_policy"
  ON rate_limit_tracker FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política: sistema pode inserir/atualizar
CREATE POLICY "rate_limit_tracker_insert_policy"
  ON rate_limit_tracker FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "rate_limit_tracker_update_policy"
  ON rate_limit_tracker FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_operation TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Calcular início da janela (arredonda para o minuto)
  v_window_start := date_trunc('minute', NOW());
  
  -- Buscar ou criar registro
  INSERT INTO rate_limit_tracker (user_id, operation, window_start, request_count)
  VALUES (v_user_id, p_operation, v_window_start, 1)
  ON CONFLICT (user_id, operation, window_start)
  DO UPDATE SET 
    request_count = rate_limit_tracker.request_count + 1,
    created_at = NOW()
  RETURNING request_count INTO v_current_count;
  
  -- Limpar registros antigos (mais de 1 hora)
  DELETE FROM rate_limit_tracker
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Verificar se excedeu o limite
  IF v_current_count > p_max_requests THEN
    RAISE EXCEPTION 'Rate limit excedido para operação %. Tente novamente em alguns minutos.', p_operation
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION check_rate_limit IS 'Verifica e aplica rate limiting por operação e usuário';

-- Atualizar RPCs críticos para usar rate limiting
CREATE OR REPLACE FUNCTION mark_as_paid_idempotent(
  p_record_id UUID,
  p_payment_method TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idempotency_record RECORD;
  v_result JSONB;
  v_current_status TEXT;
BEGIN
  -- Rate limiting: 10 requisições por minuto
  PERFORM check_rate_limit('mark_as_paid', 10, 1);
  
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
            jsonb_build_object('record_id', p_record_id, 'payment_method', p_payment_method),
            'processing');
  END IF;

  SELECT status INTO v_current_status FROM financial_records WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro financeiro não encontrado';
  END IF;

  IF v_current_status = 'pago' THEN
    v_result := jsonb_build_object('success', true, 'message', 'Pagamento já estava marcado como pago', 'record_id', p_record_id);
  ELSE
    UPDATE financial_records
    SET status = 'pago', payment_method = p_payment_method, paid_at = NOW(), updated_at = NOW()
    WHERE id = p_record_id;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'mark_as_paid', 'financial_records', p_record_id,
            jsonb_build_object('previous_status', v_current_status, 'new_status', 'pago', 'payment_method', p_payment_method));

    v_result := jsonb_build_object('success', true, 'message', 'Pagamento marcado como pago', 'record_id', p_record_id);
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    UPDATE idempotency_keys
    SET status = 'completed', response_payload = v_result, completed_at = NOW()
    WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    IF p_idempotency_key IS NOT NULL THEN
      UPDATE idempotency_keys
      SET status = 'failed', response_payload = jsonb_build_object('error', SQLERRM), completed_at = NOW()
      WHERE idempotency_key = p_idempotency_key;
    END IF;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'mark_as_paid_error', 'financial_records', p_record_id,
            jsonb_build_object('error_message', SQLERRM));
    RAISE;
END;
$$;

-- Atualizar confirm_payment_idempotent
CREATE OR REPLACE FUNCTION confirm_payment_idempotent(
  p_record_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idempotency_record RECORD;
  v_result JSONB;
  v_current_status TEXT;
BEGIN
  -- Rate limiting: 10 requisições por minuto
  PERFORM check_rate_limit('confirm_payment', 10, 1);
  
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
    VALUES (p_idempotency_key, 'confirm_payment', auth.uid(),
            jsonb_build_object('record_id', p_record_id), 'processing');
  END IF;

  SELECT status INTO v_current_status FROM financial_records WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro financeiro não encontrado';
  END IF;

  IF v_current_status = 'pago' THEN
    v_result := jsonb_build_object('success', true, 'message', 'Pagamento já estava confirmado', 'record_id', p_record_id);
  ELSE
    UPDATE financial_records
    SET status = 'pago', paid_at = NOW(), confirmed_by_user_id = auth.uid(), updated_at = NOW()
    WHERE id = p_record_id;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'confirm_payment', 'financial_records', p_record_id,
            jsonb_build_object('previous_status', v_current_status, 'new_status', 'pago'));

    v_result := jsonb_build_object('success', true, 'message', 'Pagamento confirmado com sucesso', 'record_id', p_record_id);
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    UPDATE idempotency_keys
    SET status = 'completed', response_payload = v_result, completed_at = NOW()
    WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    IF p_idempotency_key IS NOT NULL THEN
      UPDATE idempotency_keys
      SET status = 'failed', response_payload = jsonb_build_object('error', SQLERRM), completed_at = NOW()
      WHERE idempotency_key = p_idempotency_key;
    END IF;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'confirm_payment_error', 'financial_records', p_record_id,
            jsonb_build_object('error_message', SQLERRM));
    RAISE;
END;
$$;

-- Atualizar create_class_package
CREATE OR REPLACE FUNCTION create_class_package(
  p_class_logs class_log_input[],
  p_financial_data package_financial_input,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  -- Rate limiting: 5 pacotes por minuto
  PERFORM check_rate_limit('create_class_package', 5, 1);

  -- Validar que há aulas no pacote
  IF array_length(p_class_logs, 1) IS NULL OR array_length(p_class_logs, 1) = 0 THEN
    RAISE EXCEPTION 'Nenhuma aula no pacote';
  END IF;

  -- Todas as aulas devem ser do mesmo aluno
  v_student_id := (p_class_logs[1]).student_id;
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
            jsonb_build_object('class_logs_count', array_length(p_class_logs, 1), 'student_id', v_student_id),
            'processing');
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
        AND cl.start_at < v_log.end_at
        AND cl.end_at > v_log.start_at
      LIMIT 1;

      IF FOUND THEN
        RAISE EXCEPTION 'Professor já tem aula agendada em % das % às %',
          v_overlap_check.class_date,
          to_char(v_overlap_check.start_at, 'HH24:MI'),
          to_char(v_overlap_check.end_at, 'HH24:MI');
      END IF;
    END IF;
  END LOOP;

  -- Inserir todas as aulas
  v_inserted_logs := ARRAY[]::UUID[];
  FOREACH v_log IN ARRAY p_class_logs LOOP
    INSERT INTO class_logs (
      student_id, teacher_id, class_date, start_at, end_at,
      attendance, notes, billed_amount,
      duration_minutes
    )
    VALUES (
      v_log.student_id, v_log.teacher_id, v_log.class_date,
      v_log.start_at, v_log.end_at, v_log.attendance, v_log.notes,
      v_log.billed_amount,
      EXTRACT(EPOCH FROM (v_log.end_at - v_log.start_at)) / 60
    )
    RETURNING id INTO STRICT v_financial_record_id;

    v_inserted_logs := array_append(v_inserted_logs, v_financial_record_id);
  END LOOP;

  -- Criar cobrança do pacote se amount > 0
  IF p_financial_data.amount > 0 THEN
    INSERT INTO financial_records (
      student_id, class_log_id, amount, due_date,
      description, payment_method, status
    )
    VALUES (
      v_student_id, NULL, p_financial_data.amount, p_financial_data.due_date,
      COALESCE(p_financial_data.description, 'Pacote mensal - ' || array_length(p_class_logs, 1) || ' aulas'),
      p_financial_data.payment_method, 'pendente'
    )
    RETURNING id INTO STRICT v_financial_record_id;

    -- Vincular aulas ao pacote
    FOR i IN 1..array_length(v_inserted_logs, 1) LOOP
      INSERT INTO financial_record_class_logs (financial_record_id, class_log_id)
      VALUES (v_financial_record_id, v_inserted_logs[i]);
    END LOOP;
  ELSE
    v_financial_record_id := NULL;
  END IF;

  -- Auditoria
  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'INSERT', 'create_class_package', 'class_logs', v_student_id,
          jsonb_build_object('class_logs_count', array_length(p_class_logs, 1),
                            'class_log_ids', v_inserted_logs,
                            'financial_record_id', v_financial_record_id));

  v_result := jsonb_build_object(
    'success', true,
    'message', format('%s aula(s) criada(s) com sucesso', array_length(p_class_logs, 1)),
    'class_log_ids', v_inserted_logs,
    'financial_record_id', v_financial_record_id,
    'student_id', v_student_id
  );

  IF p_idempotency_key IS NOT NULL THEN
    UPDATE idempotency_keys
    SET status = 'completed', response_payload = v_result, completed_at = NOW()
    WHERE idempotency_key = p_idempotency_key;
  END IF;

  v_duration_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
  PERFORM log_performance('create_class_package', v_duration_ms,
    jsonb_build_object('class_count', array_length(p_class_logs, 1)));

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    IF p_idempotency_key IS NOT NULL THEN
      UPDATE idempotency_keys
      SET status = 'failed', response_payload = jsonb_build_object('error', SQLERRM), completed_at = NOW()
      WHERE idempotency_key = p_idempotency_key;
    END IF;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'INSERT', 'create_class_package_error', 'class_logs', v_student_id,
            jsonb_build_object('error_message', SQLERRM, 'class_logs_count', array_length(p_class_logs, 1)));
    RAISE;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;

-- Notificar sucesso
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RATE LIMITING IMPLEMENTADO NO BACKEND!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ Tabela rate_limit_tracker criada';
  RAISE NOTICE '✓ Função check_rate_limit implementada';
  RAISE NOTICE '✓ RPCs críticos atualizados:';
  RAISE NOTICE '  - mark_as_paid_idempotent (10 req/min)';
  RAISE NOTICE '  - confirm_payment_idempotent (10 req/min)';
  RAISE NOTICE '  - create_class_package (5 req/min)';
  RAISE NOTICE '============================================';
END $$;
