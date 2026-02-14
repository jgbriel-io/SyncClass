-- ============================================================
-- MIGRATION UNIFICADA - PARTE 2: SEGURANÇA E SPRINTS
-- ============================================================
-- Consolidação de TODAS as migrations da pasta supabase/migrations
-- Data: 2026-02-14
-- 
-- IMPORTANTE: Esta é a PARTE 2 de 2
-- Execute APÓS a PARTE_1
-- 
-- Contém:
-- - Sistema de Audit Logs
-- - Idempotência em Pagamentos
-- - Sistema de Convites
-- - RLS Reforçado
-- - Segurança de Webhooks
-- - Sprints 1-4 (Views financeiras, Atomicidade, Validações, Performance)
-- ============================================================

-- ============================================================
-- SISTEMA DE AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    action TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT
  USING ((SELECT public.is_admin()));

CREATE POLICY "audit_logs_no_modify" ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "audit_logs_no_delete" ON public.audit_logs FOR DELETE
  USING (false);

CREATE POLICY "audit_logs_trigger_insert" ON public.audit_logs FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_user_id UUID;
    v_user_role TEXT;
BEGIN
    v_user_id := auth.uid();
    v_user_role := (SELECT role FROM public.user_roles WHERE user_id = v_user_id LIMIT 1);

    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_changed_fields := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        SELECT array_agg(key)
        INTO v_changed_fields
        FROM jsonb_each(v_new_data)
        WHERE v_new_data->key IS DISTINCT FROM v_old_data->key;
    ELSIF (TG_OP = 'INSERT') THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_changed_fields := NULL;
    END IF;

    v_old_data := v_old_data - 'password' - 'encrypted_password' - 'reset_token';
    v_new_data := v_new_data - 'password' - 'encrypted_password' - 'reset_token';

    INSERT INTO public.audit_logs (
        table_name, record_id, action_type, old_data, new_data, changed_fields,
        user_id, user_role, ip_address, user_agent
    ) VALUES (
        TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, v_old_data, v_new_data, v_changed_fields,
        v_user_id, v_user_role, inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica triggers em tabelas críticas
CREATE TRIGGER audit_students_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_teachers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_financial_records_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.financial_records
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_class_logs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.class_logs
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- View para facilitar consultas de auditoria
CREATE OR REPLACE VIEW public.audit_logs_readable AS
SELECT 
    al.id, al.table_name, al.record_id, al.action_type, al.changed_fields,
    al.user_id, ur.full_name as user_name, al.user_role, al.created_at,
    al.old_data, al.new_data
FROM public.audit_logs al
LEFT JOIN public.user_roles ur ON ur.user_id = al.user_id
ORDER BY al.created_at DESC;

-- ============================================================
-- IDEMPOTÊNCIA EM PAGAMENTOS
-- ============================================================

-- Função RPC para confirmar pagamento (idempotente)
CREATE OR REPLACE FUNCTION public.confirm_payment_idempotent(
    p_record_id UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_record public.financial_records;
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    SELECT * INTO v_record FROM public.financial_records WHERE id = p_record_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro financeiro não encontrado';
    END IF;

    IF NOT (
        (SELECT public.is_admin())
        OR v_record.student_id IN (
            SELECT id FROM public.students 
            WHERE teacher_id = (SELECT public.get_my_teacher_id())
        )
    ) THEN
        RAISE EXCEPTION 'Sem permissão para confirmar este pagamento';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.financial_records 
            WHERE idempotency_key = p_idempotency_key 
            AND id != p_record_id
        ) THEN
            SELECT jsonb_build_object(
                'success', true,
                'message', 'Operação já processada (idempotente)',
                'record_id', id,
                'status', status
            ) INTO v_result
            FROM public.financial_records
            WHERE idempotency_key = p_idempotency_key;
            
            RETURN v_result;
        END IF;
    END IF;

    IF v_record.status = 'pago' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Pagamento já confirmado anteriormente',
            'record_id', v_record.id,
            'status', 'pago',
            'confirmed_at', v_record.confirmed_at,
            'confirmed_by', v_record.confirmed_by_user_id
        );
    END IF;

    UPDATE public.financial_records
    SET 
        status = 'pago',
        confirmed_by_user_id = v_user_id,
        confirmed_at = now(),
        idempotency_key = p_idempotency_key,
        last_status_change_at = now(),
        updated_at = now()
    WHERE id = p_record_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pagamento confirmado com sucesso',
        'record_id', p_record_id,
        'status', 'pago',
        'confirmed_at', now(),
        'confirmed_by', v_user_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função RPC para desfazer pagamento (idempotente)
CREATE OR REPLACE FUNCTION public.undo_payment_idempotent(
    p_record_id UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_record public.financial_records;
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    SELECT * INTO v_record FROM public.financial_records WHERE id = p_record_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro financeiro não encontrado';
    END IF;

    IF NOT (
        (SELECT public.is_admin())
        OR v_record.student_id IN (
            SELECT id FROM public.students 
            WHERE teacher_id = (SELECT public.get_my_teacher_id())
        )
    ) THEN
        RAISE EXCEPTION 'Sem permissão para desfazer este pagamento';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.financial_records 
            WHERE idempotency_key = p_idempotency_key 
            AND id != p_record_id
        ) THEN
            SELECT jsonb_build_object(
                'success', true,
                'message', 'Operação já processada (idempotente)',
                'record_id', id,
                'status', status
            ) INTO v_result
            FROM public.financial_records
            WHERE idempotency_key = p_idempotency_key;
            
            RETURN v_result;
        END IF;
    END IF;

    IF v_record.status = 'pendente' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Pagamento já estava pendente',
            'record_id', v_record.id,
            'status', 'pendente'
        );
    END IF;

    UPDATE public.financial_records
    SET 
        status = 'pendente',
        confirmed_by_user_id = NULL,
        confirmed_at = NULL,
        idempotency_key = p_idempotency_key,
        last_status_change_at = now(),
        updated_at = now()
    WHERE id = p_record_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pagamento desfeito com sucesso',
        'record_id', p_record_id,
        'status', 'pendente'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.confirm_payment_idempotent TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_payment_idempotent TO authenticated;


-- ============================================================
-- SISTEMA DE CONVITES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role public.app_role NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT invites_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_invites_expires_at ON public.invites(expires_at);
CREATE INDEX idx_invites_used_at ON public.invites(used_at);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_create" ON public.invites FOR INSERT
  WITH CHECK (
    (SELECT public.is_admin())
    OR (SELECT public.get_my_teacher_id()) IS NOT NULL
  );

CREATE POLICY "invites_select" ON public.invites FOR SELECT
  USING (
    (SELECT public.is_admin())
    OR created_by_user_id = auth.uid()
  );

CREATE POLICY "invites_delete" ON public.invites FOR DELETE
  USING ((SELECT public.is_admin()));

CREATE POLICY "invites_no_update" ON public.invites FOR UPDATE
  USING (false);

-- Funções para gerenciar convites
CREATE OR REPLACE FUNCTION public.create_invite(
    p_email TEXT,
    p_role public.app_role,
    p_student_id UUID DEFAULT NULL,
    p_teacher_id UUID DEFAULT NULL,
    p_expires_in_hours INTEGER DEFAULT 72
)
RETURNS JSONB AS $$
DECLARE
    v_token TEXT;
    v_invite_id UUID;
    v_user_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    IF NOT (
        (SELECT public.is_admin())
        OR (SELECT public.get_my_teacher_id()) IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Sem permissão para criar convites';
    END IF;

    IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Email inválido';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.invites
        WHERE email = p_email
        AND used_at IS NULL
        AND expires_at > now()
    ) THEN
        RAISE EXCEPTION 'Já existe um convite ativo para este email';
    END IF;

    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := now() + (p_expires_in_hours || ' hours')::interval;

    INSERT INTO public.invites (
        email, role, token, expires_at, created_by_user_id, student_id, teacher_id
    ) VALUES (
        lower(p_email), p_role, v_token, v_expires_at, v_user_id, p_student_id, p_teacher_id
    ) RETURNING id INTO v_invite_id;

    RETURN jsonb_build_object(
        'success', true,
        'invite_id', v_invite_id,
        'token', v_token,
        'expires_at', v_expires_at,
        'invite_url', format('https://your-domain.com/signup?token=%s', v_token)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.validate_invite(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_invite public.invites;
BEGIN
    SELECT * INTO v_invite FROM public.invites WHERE token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Convite não encontrado');
    END IF;

    IF v_invite.used_at IS NOT NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Convite já foi utilizado', 'used_at', v_invite.used_at);
    END IF;

    IF v_invite.expires_at < now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Convite expirado', 'expired_at', v_invite.expires_at);
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'email', v_invite.email,
        'role', v_invite.role,
        'student_id', v_invite.student_id,
        'teacher_id', v_invite.teacher_id,
        'expires_at', v_invite.expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_invite_used(p_token TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_invite_id UUID;
BEGIN
    UPDATE public.invites
    SET used_at = now(), used_by_user_id = p_user_id, updated_at = now()
    WHERE token = p_token AND used_at IS NULL AND expires_at > now()
    RETURNING id INTO v_invite_id;

    IF v_invite_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou já utilizado');
    END IF;

    RETURN jsonb_build_object('success', true, 'invite_id', v_invite_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_invite TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invite_used TO service_role;

-- ============================================================
-- SEGURANÇA DE WEBHOOKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'sha256',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.webhook_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_secrets_service_only" ON public.webhook_secrets
  USING ((SELECT auth.role()) = 'service_role');

CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT,
    payload JSONB NOT NULL,
    signature TEXT,
    signature_valid BOOLEAN,
    ip_address INET,
    user_agent TEXT,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_webhook_logs_provider ON public.webhook_logs(provider);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed) WHERE NOT processed;

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_logs_admin_select" ON public.webhook_logs FOR SELECT
  USING ((SELECT public.is_admin()));

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_log(identifier, endpoint, window_end);
CREATE INDEX idx_rate_limit_window_end ON public.rate_limit_log(window_end);

-- Funções para webhooks
CREATE OR REPLACE FUNCTION public.validate_webhook_signature(
    p_provider TEXT,
    p_payload TEXT,
    p_signature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_secret TEXT;
    v_algorithm TEXT;
    v_computed_signature TEXT;
BEGIN
    SELECT secret_key, algorithm INTO v_secret, v_algorithm
    FROM public.webhook_secrets
    WHERE provider = p_provider AND active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Provider não configurado: %', p_provider;
    END IF;

    v_computed_signature := encode(
        hmac(p_payload::bytea, v_secret::bytea, v_algorithm),
        'hex'
    );

    RETURN v_computed_signature = p_signature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
    v_current_count INTEGER;
BEGIN
    v_window_start := date_trunc('minute', now());
    v_window_end := v_window_start + (p_window_minutes || ' minutes')::interval;

    SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
    FROM public.rate_limit_log
    WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_end > now();

    IF v_current_count >= p_max_requests THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'current_count', v_current_count,
            'max_requests', p_max_requests,
            'retry_after', v_window_end
        );
    END IF;

    INSERT INTO public.rate_limit_log (
        identifier, endpoint, request_count, window_start, window_end
    ) VALUES (
        p_identifier, p_endpoint, 1, v_window_start, v_window_end
    )
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET request_count = rate_limit_log.request_count + 1;

    RETURN jsonb_build_object(
        'allowed', true,
        'current_count', v_current_count + 1,
        'max_requests', p_max_requests,
        'remaining', p_max_requests - v_current_count - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_webhook(
    p_provider TEXT,
    p_event_type TEXT,
    p_payload JSONB,
    p_signature TEXT DEFAULT NULL,
    p_signature_valid BOOLEAN DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.webhook_logs (
        provider, event_type, payload, signature, signature_valid, ip_address, user_agent
    ) VALUES (
        p_provider, p_event_type, p_payload, p_signature, p_signature_valid,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.webhook_logs WHERE created_at < now() - interval '30 days';
    DELETE FROM public.rate_limit_log WHERE window_end < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_webhook_signature TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.log_webhook TO service_role;

