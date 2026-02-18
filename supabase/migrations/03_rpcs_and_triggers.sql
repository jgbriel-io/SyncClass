-- ============================================
-- EDUCORE DATABASE - 03 RPCS AND TRIGGERS
-- Automação: RPCs de Negócio e Triggers
-- Data: 15/02/2026
-- ============================================

-- --------------------------------------------
-- RPC: create_class_package
-- Cria múltiplas aulas em lote com cobrança única
-- --------------------------------------------

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

COMMENT ON FUNCTION create_class_package IS 'Cria pacote de aulas com validação de sobreposição e cobrança única';

-- --------------------------------------------
-- RPC: mark_as_paid_idempotent
-- Marca cobrança como paga
-- --------------------------------------------

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

COMMENT ON FUNCTION mark_as_paid_idempotent IS 'Marca cobrança como paga sem confirmação de usuário';

-- --------------------------------------------
-- RPC: confirm_payment_idempotent
-- Confirma pagamento (com usuário confirmador)
-- --------------------------------------------

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

COMMENT ON FUNCTION confirm_payment_idempotent IS 'Confirma pagamento registrando usuário confirmador';

-- --------------------------------------------
-- RPC: undo_payment_idempotent
-- Desfaz pagamento (volta para pendente)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION undo_payment_idempotent(
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
    VALUES (p_idempotency_key, 'undo_payment', auth.uid(),
            jsonb_build_object('record_id', p_record_id), 'processing');
  END IF;

  SELECT status INTO v_current_status FROM financial_records WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro financeiro não encontrado';
  END IF;

  IF v_current_status != 'pago' THEN
    v_result := jsonb_build_object('success', true, 'message', 'Pagamento já estava pendente', 'record_id', p_record_id);
  ELSE
    UPDATE financial_records
    SET status = 'pendente', paid_at = NULL, confirmed_by_user_id = NULL, updated_at = NOW()
    WHERE id = p_record_id;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'undo_payment', 'financial_records', p_record_id,
            jsonb_build_object('previous_status', v_current_status, 'new_status', 'pendente'));

    v_result := jsonb_build_object('success', true, 'message', 'Pagamento desfeito com sucesso', 'record_id', p_record_id);
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
    VALUES (auth.uid(), 'UPDATE', 'undo_payment_error', 'financial_records', p_record_id,
            jsonb_build_object('error_message', SQLERRM));
    RAISE;
END;
$$;

COMMENT ON FUNCTION undo_payment_idempotent IS 'Desfaz pagamento voltando status para pendente';

-- --------------------------------------------
-- TRIGGER: Atualizar pacote ao deletar aula
-- --------------------------------------------

CREATE OR REPLACE FUNCTION update_package_on_class_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_financial_record_id UUID;
  v_remaining_classes INTEGER;
  v_deleted_class_amount NUMERIC;
  v_current_package_amount NUMERIC;
  v_new_package_amount NUMERIC;
  v_current_description TEXT;
  v_base_description TEXT;
BEGIN
  -- Buscar o registro financeiro vinculado
  BEGIN
    SELECT frcl.financial_record_id
    INTO v_financial_record_id
    FROM financial_record_class_logs frcl
    WHERE frcl.class_log_id = OLD.id
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN OLD;
  END;

  IF v_financial_record_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Contar aulas restantes
  SELECT COUNT(*)
  INTO v_remaining_classes
  FROM financial_record_class_logs frcl
  WHERE frcl.financial_record_id = v_financial_record_id
    AND frcl.class_log_id != OLD.id;

  -- Se não sobrou nenhuma aula, deletar o pacote
  IF v_remaining_classes = 0 THEN
    BEGIN
      DELETE FROM financial_record_class_logs WHERE financial_record_id = v_financial_record_id;
      DELETE FROM financial_records WHERE id = v_financial_record_id;

      INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
      VALUES (auth.uid(), 'DELETE', 'delete_empty_package', 'financial_records', v_financial_record_id,
              jsonb_build_object('reason', 'Todas as aulas do pacote foram removidas', 'deleted_class_id', OLD.id));
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erro ao deletar pacote vazio: %', SQLERRM;
    END;

    RETURN OLD;
  END IF;

  -- Atualizar o pacote
  BEGIN
    SELECT amount, description
    INTO v_current_package_amount, v_current_description
    FROM financial_records
    WHERE id = v_financial_record_id;

    -- Se o registro financeiro não existe mais, sair silenciosamente
    IF NOT FOUND THEN
      RETURN OLD;
    END IF;

    IF OLD.billed_amount IS NOT NULL THEN
      v_deleted_class_amount := OLD.billed_amount;
    ELSE
      v_deleted_class_amount := v_current_package_amount / (v_remaining_classes + 1);
    END IF;

    v_new_package_amount := GREATEST(v_current_package_amount - v_deleted_class_amount, 0);

    v_base_description := TRIM(regexp_replace(v_current_description, '\s*\([^)]*\)\s*', '', 'g'));
    v_base_description := regexp_replace(v_base_description, '\d+\s+aula\(s\)', v_remaining_classes || ' aula(s)');
    v_base_description := v_base_description || ' (Restam ' || v_remaining_classes || ')';

    UPDATE financial_records
    SET amount = v_new_package_amount, description = v_base_description, updated_at = NOW()
    WHERE id = v_financial_record_id;

    DELETE FROM financial_record_class_logs
    WHERE financial_record_id = v_financial_record_id AND class_log_id = OLD.id;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'update_package_on_class_delete', 'financial_records', v_financial_record_id,
            jsonb_build_object('deleted_class_id', OLD.id, 'remaining_classes', v_remaining_classes));
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao atualizar pacote: %', SQLERRM;
  END;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_update_package_on_class_delete
  BEFORE DELETE ON class_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_package_on_class_delete();

COMMENT ON FUNCTION update_package_on_class_delete IS 'Atualiza valor e descrição do pacote ao deletar aula';

-- --------------------------------------------
-- FINALIZAÇÃO
-- --------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RPCS E TRIGGERS CRIADOS COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RPCs de negócio: 4';
  RAISE NOTICE 'Triggers de automação: 1';
  RAISE NOTICE '============================================';
END $$;


-- --------------------------------------------
-- TRIGGER: handle_new_user
-- Cria profile e user_role automaticamente ao criar auth.user
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_full_name TEXT;
BEGIN
    -- Try to get role from user metadata, default to 'student' if not provided
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

    -- Ensure role is valid
    IF user_role NOT IN ('admin', 'student', 'teacher') THEN
        user_role := 'student';
    END IF;

    -- Get full name from metadata
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

    -- Insert into profiles (only if doesn't exist)
    INSERT INTO public.profiles (user_id, full_name, email, role, active)
    VALUES (NEW.id, user_full_name, NEW.email, user_role, true)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert into user_roles (only user_id and role exist in this table)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Cria profile e user_role automaticamente ao criar usuário no auth';

-- --------------------------------------------
-- RPC: upsert_user_role_safe
-- Insere ou atualiza user_role de forma segura
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_user_role_safe(
  p_user_id UUID,
  p_role TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validar role
  IF p_role NOT IN ('admin', 'student', 'teacher') THEN
    RAISE EXCEPTION 'Role inválido: %. Deve ser admin, student ou teacher', p_role;
  END IF;

  -- Upsert em user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role, updated_at = NOW();

  -- Auditoria
  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'UPDATE', 'upsert_user_role', 'user_roles', p_user_id,
          jsonb_build_object('role', p_role, 'email', p_email, 'full_name', p_full_name));

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Role atualizado com sucesso',
    'user_id', p_user_id,
    'role', p_role
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'upsert_user_role_error', 'user_roles', p_user_id,
            jsonb_build_object('error_message', SQLERRM, 'role', p_role));
    RAISE;
END;
$$;

COMMENT ON FUNCTION upsert_user_role_safe IS 'Insere ou atualiza user_role de forma segura com auditoria';



-- --------------------------------------------
-- RPC: soft_delete_student
-- Marca aluno como inativo (soft delete)
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.soft_delete_student(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
DECLARE
  v_result JSONB;
BEGIN
  UPDATE students
  SET status = 'inativo', is_deleted = true, updated_at = NOW()
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'UPDATE', 'soft_delete_student', 'students', p_student_id,
          jsonb_build_object('status', 'inativo'));

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Aluno arquivado com sucesso',
    'student_id', p_student_id
  );

  RETURN v_result;
END;
$;

COMMENT ON FUNCTION soft_delete_student IS 'Marca aluno como inativo (soft delete)';

-- --------------------------------------------
-- RPC: restore_student
-- Restaura aluno inativo
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.restore_student(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
DECLARE
  v_result JSONB;
BEGIN
  UPDATE students
  SET status = 'ativo', is_deleted = false, updated_at = NOW()
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'UPDATE', 'restore_student', 'students', p_student_id,
          jsonb_build_object('status', 'ativo'));

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Aluno restaurado com sucesso',
    'student_id', p_student_id
  );

  RETURN v_result;
END;
$;

COMMENT ON FUNCTION restore_student IS 'Restaura aluno inativo';

-- --------------------------------------------
-- RPC: update_student_payment_day
-- Atualiza dia de pagamento do aluno
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.update_student_payment_day(
  p_student_id UUID,
  p_pay_day INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
DECLARE
  v_result JSONB;
BEGIN
  -- Validar pay_day
  IF p_pay_day < 1 OR p_pay_day > 31 THEN
    RAISE EXCEPTION 'Dia de pagamento deve estar entre 1 e 31';
  END IF;

  UPDATE students
  SET pay_day = p_pay_day, updated_at = NOW()
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'UPDATE', 'update_student_payment_day', 'students', p_student_id,
          jsonb_build_object('pay_day', p_pay_day));

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Dia de pagamento atualizado com sucesso',
    'student_id', p_student_id,
    'pay_day', p_pay_day
  );

  RETURN v_result;
END;
$;

COMMENT ON FUNCTION update_student_payment_day IS 'Atualiza dia de pagamento do aluno';

-- ============================================
-- FUNÇÃO: upsert_user_role_safe
-- Insere ou atualiza user_role de forma segura com auditoria
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_user_role_safe(
  p_user_id UUID,
  p_role TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validar role
  IF p_role NOT IN ('admin', 'student', 'teacher') THEN
    RAISE EXCEPTION 'Role inválido: %. Deve ser admin, student ou teacher', p_role;
  END IF;

  -- Upsert em user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role, updated_at = NOW();

  -- Auditoria
  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'UPDATE', 'upsert_user_role', 'user_roles', p_user_id,
          jsonb_build_object('role', p_role, 'email', p_email, 'full_name', p_full_name));

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Role atualizado com sucesso',
    'user_id', p_user_id,
    'role', p_role
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'upsert_user_role_error', 'user_roles', p_user_id,
            jsonb_build_object('error_message', SQLERRM, 'role', p_role));
    RAISE;
END;
$$;

COMMENT ON FUNCTION upsert_user_role_safe IS 'Insere ou atualiza user_role de forma segura com auditoria';

-- ============================================
-- TRIGGER: Prevenir aulas sobrepostas do mesmo professor
-- ============================================

CREATE OR REPLACE FUNCTION check_class_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overlap_record RECORD;
BEGIN
  -- Só valida se tiver professor e horários definidos
  IF NEW.teacher_id IS NOT NULL AND NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL THEN
    -- Busca aulas do mesmo professor no mesmo dia que se sobrepõem
    SELECT cl.id, cl.class_date, cl.start_at, cl.end_at, s.name as student_name
    INTO v_overlap_record
    FROM class_logs cl
    LEFT JOIN students s ON s.id = cl.student_id
    WHERE cl.teacher_id = NEW.teacher_id
      AND cl.class_date = NEW.class_date
      AND cl.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND cl.start_at < NEW.end_at
      AND cl.end_at > NEW.start_at
    LIMIT 1;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Professor já tem aula agendada em % das % às % com %',
        v_overlap_record.class_date,
        to_char(v_overlap_record.start_at, 'HH24:MI'),
        to_char(v_overlap_record.end_at, 'HH24:MI'),
        COALESCE(v_overlap_record.student_name, 'aluno não identificado');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_class_overlap
  BEFORE INSERT OR UPDATE ON class_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_class_overlap();

COMMENT ON FUNCTION check_class_overlap() IS 'Previne que um professor tenha duas aulas no mesmo horário';

-- ============================================
-- TRIGGERS: Cascade delete de pacotes
-- ============================================

-- Function para deletar aulas quando deletar cobrança de pacote
CREATE OR REPLACE FUNCTION delete_package_classes_before_financial_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_log_ids UUID[];
BEGIN
  -- Captura os IDs das aulas vinculadas
  SELECT ARRAY_AGG(class_log_id) INTO v_class_log_ids
  FROM financial_record_class_logs
  WHERE financial_record_id = OLD.id;
  
  -- Se não tem aulas vinculadas, não faz nada
  IF v_class_log_ids IS NULL OR array_length(v_class_log_ids, 1) = 0 THEN
    RETURN OLD;
  END IF;
  
  -- Primeiro, deleta os links manualmente
  DELETE FROM financial_record_class_logs
  WHERE financial_record_id = OLD.id;
  
  -- Depois, deleta as aulas
  DELETE FROM class_logs
  WHERE id = ANY(v_class_log_ids);
  
  RAISE NOTICE 'Deleted % class_logs for financial_record %', array_length(v_class_log_ids, 1), OLD.id;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_delete_package_classes_on_financial_delete
  BEFORE DELETE ON financial_records
  FOR EACH ROW
  EXECUTE FUNCTION delete_package_classes_before_financial_delete();

COMMENT ON FUNCTION delete_package_classes_before_financial_delete() IS 'Deleta as aulas de pacote quando o financial_record é deletado';

-- Function para deletar cobrança quando deletar todas as aulas do pacote
CREATE OR REPLACE FUNCTION delete_empty_package_financial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_financial_record_id UUID;
  v_remaining_classes INT;
BEGIN
  -- Busca o financial_record_id vinculado à aula deletada
  SELECT financial_record_id INTO v_financial_record_id
  FROM financial_record_class_logs
  WHERE class_log_id = OLD.id
  LIMIT 1;
  
  -- Se não tem financial_record vinculado, não faz nada
  IF v_financial_record_id IS NULL THEN
    RETURN OLD;
  END IF;
  
  -- Conta quantas aulas ainda restam neste pacote
  -- (a linha em financial_record_class_logs já foi deletada pelo CASCADE)
  SELECT COUNT(*) INTO v_remaining_classes
  FROM financial_record_class_logs
  WHERE financial_record_id = v_financial_record_id;
  
  -- Se não restam mais aulas, deleta o financial_record
  IF v_remaining_classes = 0 THEN
    DELETE FROM financial_records
    WHERE id = v_financial_record_id;
    
    RAISE NOTICE 'Deleted financial_record % (no classes remaining)', v_financial_record_id;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_delete_empty_package_financial
  AFTER DELETE ON class_logs
  FOR EACH ROW
  EXECUTE FUNCTION delete_empty_package_financial();

COMMENT ON FUNCTION delete_empty_package_financial() IS 'Deleta automaticamente a cobrança de pacote quando todas as aulas do pacote forem deletadas manualmente';


-- ============================================
-- RPCS: Sistema de Comprovante de Pagamento
-- ============================================

-- RPC para aluno enviar comprovante
CREATE OR REPLACE FUNCTION submit_payment_proof(
  p_financial_record_id UUID,
  p_proof_url TEXT,
  p_proof_filename TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student_id UUID;
  v_record_student_id UUID;
BEGIN
  IF NOT (SELECT public.is_student()) THEN
    RAISE EXCEPTION 'Apenas alunos podem enviar comprovantes';
  END IF;

  v_student_id := (SELECT public.get_student_id());

  SELECT student_id INTO v_record_student_id
  FROM financial_records
  WHERE id = p_financial_record_id;

  IF v_record_student_id IS NULL THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF v_record_student_id != v_student_id THEN
    RAISE EXCEPTION 'Esta cobrança não pertence a você';
  END IF;

  UPDATE financial_records
  SET 
    payment_proof_url = p_proof_url,
    payment_proof_filename = p_proof_filename,
    payment_proof_uploaded_at = NOW(),
    payment_proof_status = 'pending'
  WHERE id = p_financial_record_id;

  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (
    auth.uid(),
    'UPDATE',
    'submit_payment_proof',
    'financial_records',
    p_financial_record_id,
    jsonb_build_object('filename', p_proof_filename)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Comprovante enviado com sucesso! Aguarde a confirmação do professor.'
  );
END;
$$;

COMMENT ON FUNCTION submit_payment_proof IS 'Permite aluno enviar comprovante de pagamento';

-- RPC para professor aprovar/rejeitar comprovante
CREATE OR REPLACE FUNCTION review_payment_proof(
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
    v_new_status := 'pago';
    UPDATE financial_records
    SET 
      payment_proof_status = 'approved',
      status = v_new_status,
      paid_at = NOW(),
      confirmed_by_user_id = auth.uid()
    WHERE id = p_financial_record_id;
  ELSE
    v_new_status := 'pendente';
    UPDATE financial_records
    SET 
      payment_proof_status = 'rejected',
      payment_proof_rejection_reason = p_rejection_reason,
      status = v_new_status
    WHERE id = p_financial_record_id;
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
      'rejection_reason', p_rejection_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE 
      WHEN p_approved THEN 'Pagamento confirmado com sucesso!'
      ELSE 'Comprovante rejeitado. O aluno foi notificado.'
    END
  );
END;
$$;

COMMENT ON FUNCTION review_payment_proof IS 'Permite professor aprovar ou rejeitar comprovante de pagamento';



-- ============================================
-- SUPORTE A ALUNOS ESTRANGEIROS
-- Funções de validação platform-wide
-- ============================================

-- Verificar se CPF já existe (students + teachers)
CREATE OR REPLACE FUNCTION check_cpf_exists_platform(p_cpf_digits TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM students WHERE cpf = p_cpf_digits
    UNION ALL
    SELECT 1 FROM teachers WHERE cpf = p_cpf_digits
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION check_cpf_exists_platform IS 'Verifica se CPF já existe em students ou teachers (platform-wide)';

-- Verificar se telefone já existe (students + teachers)
CREATE OR REPLACE FUNCTION check_phone_exists_platform(p_phone_digits TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM students WHERE phone = p_phone_digits
    UNION ALL
    SELECT 1 FROM teachers WHERE phone = p_phone_digits
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION check_phone_exists_platform IS 'Verifica se telefone já existe em students ou teachers (platform-wide)';

-- Permissões
GRANT EXECUTE ON FUNCTION check_cpf_exists_platform TO authenticated;
GRANT EXECUTE ON FUNCTION check_phone_exists_platform TO authenticated;
