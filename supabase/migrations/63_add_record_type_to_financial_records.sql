-- Migration 63: add record_type discriminator to financial_records
-- Replaces the implicit NULL-as-discriminator pattern where class_log_id IS NULL
-- was ambiguously used to mean "pacote" (vs manual/orphan).
-- Values: 'avulsa' | 'pacote' | 'manual'

ALTER TABLE public.financial_records
  ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (record_type IN ('avulsa', 'pacote', 'manual'));

-- Backfill: avulsa = has a direct class_log link
UPDATE public.financial_records
  SET record_type = 'avulsa'
  WHERE class_log_id IS NOT NULL;

-- Backfill: pacote = class_log_id IS NULL but has junction rows
UPDATE public.financial_records fr
  SET record_type = 'pacote'
  WHERE fr.class_log_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.financial_record_class_logs frcl
      WHERE frcl.financial_record_id = fr.id
    );

-- Remaining (class_log_id IS NULL, no junction) stay 'manual' via DEFAULT

-- Update create_class_package RPC to explicitly set record_type = 'pacote'
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

  PERFORM check_rate_limit('create_class_package', 5, 1);

  IF array_length(p_class_logs, 1) IS NULL OR array_length(p_class_logs, 1) = 0 THEN
    RAISE EXCEPTION 'Nenhuma aula no pacote';
  END IF;

  v_student_id := (p_class_logs[1]).student_id;
  FOREACH v_log IN ARRAY p_class_logs LOOP
    IF v_log.student_id != v_student_id THEN
      RAISE EXCEPTION 'Todas as aulas do pacote devem ser do mesmo aluno';
    END IF;
  END LOOP;

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

  IF p_financial_data.amount > 0 THEN
    INSERT INTO financial_records (
      student_id, class_log_id, amount, due_date,
      description, payment_method, status, record_type
    )
    VALUES (
      v_student_id, NULL, p_financial_data.amount, p_financial_data.due_date,
      COALESCE(p_financial_data.description, 'Pacote mensal - ' || array_length(p_class_logs, 1) || ' aulas'),
      p_financial_data.payment_method, 'pendente', 'pacote'
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

REVOKE EXECUTE ON FUNCTION public.create_class_package(class_log_input[], package_financial_input, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_class_package(class_log_input[], package_financial_input, text) TO authenticated, service_role;
