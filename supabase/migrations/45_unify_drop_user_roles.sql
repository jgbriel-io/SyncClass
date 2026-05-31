-- Migration 45: Unify user_roles into profiles.role
-- profiles.role is already the source of truth; user_roles is redundant.
-- 1. Rewrite upsert_user_role_safe to operate on profiles only
-- 2. Rewrite handle_new_user to not insert into user_roles
-- 3. Drop user_roles table

-- 1. Rewrite upsert_user_role_safe
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
    IF p_role NOT IN ('admin', 'student', 'teacher') THEN
        RAISE EXCEPTION 'Role inválido: %. Deve ser admin, student ou teacher', p_role;
    END IF;

    UPDATE public.profiles
    SET role = p_role,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'upsert_user_role', 'profiles', p_user_id,
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
        VALUES (auth.uid(), 'UPDATE', 'upsert_user_role_error', 'profiles', p_user_id,
                jsonb_build_object('error_message', SQLERRM, 'role', p_role));
        RAISE;
END;
$$;

COMMENT ON FUNCTION upsert_user_role_safe IS 'Atualiza role em profiles de forma segura com auditoria';

-- 2. Rewrite handle_new_user — remove INSERT into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_full_name TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

    IF user_role NOT IN ('admin', 'student', 'teacher') THEN
        user_role := 'student';
    END IF;

    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

    INSERT INTO public.profiles (user_id, full_name, email, role, active)
    VALUES (NEW.id, user_full_name, NEW.email, user_role, true)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 'Cria profile automaticamente ao criar usuário no auth';

-- 3. Drop user_roles (CASCADE removes dependent policies and FKs)
DROP TABLE IF EXISTS public.user_roles CASCADE;
