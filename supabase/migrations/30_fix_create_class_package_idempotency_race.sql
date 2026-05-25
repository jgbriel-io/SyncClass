-- Fix BUG-SEC-008: race condition in create_class_package idempotency check.
-- Replace SELECT-then-INSERT pattern with atomic INSERT ON CONFLICT DO UPDATE,
-- eliminating the window where two concurrent requests both see no existing key
-- and both attempt to INSERT, causing unique violation on the second.
CREATE OR REPLACE FUNCTION public.create_class_package(
  p_class_logs class_log_input[],
  p_financial_data package_financial_input,
  p_idempotency_key text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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

  -- Verificar idempotência (race-safe via ON CONFLICT DO UPDATE)
  -- Two concurrent requests with same key: first INSERT wins, second hits conflict.
  -- ON CONFLICT keeps existing status unless it was 'failed' (allow retry).
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO idempotency_keys (idempotency_key, operation, user_id, request_payload, status)
    VALUES (
      p_idempotency_key,
      'create_class_package',
      auth.uid(),
      jsonb_build_object('class_logs_count', array_length(p_class_logs, 1), 'student_id', v_student_id),
      'processing'
    )
    ON CONFLICT (idempotency_key) DO UPDATE
      SET status = CASE
        WHEN idempotency_keys.status = 'failed' THEN 'processing'
        ELSE idempotency_keys.status
      END;

    SELECT * INTO v_idempotency_record
    FROM idempotency_keys
    WHERE idempotency_key = p_idempotency_key;

    IF v_idempotency_record.status = 'completed' THEN
      RETURN v_idempotency_record.response_payload;
    END IF;
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

    FOR i IN 1..array_length(v_inserted_logs, 1) LOOP
      INSERT INTO financial_record_class_logs (financial_record_id, class_log_id)
      VALUES (v_financial_record_id, v_inserted_logs[i]);
    END LOOP;
  ELSE
    v_financial_record_id := NULL;
  END IF;

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
$function$;
