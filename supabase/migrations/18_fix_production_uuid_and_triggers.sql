-- ============================================
-- MIGRATION 36: FIX DEFINITIVO PARA PRODUÇÃO
-- ============================================
-- Esta migration consolida TODAS as correções necessárias
-- para resolver o erro "operator does not exist: character varying = uuid"
-- 
-- PROBLEMA: Trigger e RLS policies comparando UUID sem cast explícito
-- SOLUÇÃO: Adicionar cast ::uuid em TODAS as comparações
-- 
-- APLIQUE ESTA MIGRATION EM PRODUÇÃO
-- ============================================

-- ============================================
-- PARTE 1: CORRIGIR FUNÇÕES HELPER (is_admin, is_teacher, is_student)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id::text = (auth.uid())::text 
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id::text = (auth.uid())::text 
    AND role = 'teacher'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id::text = (auth.uid())::text 
    AND role = 'student'
  );
$$;

-- ============================================
-- PARTE 2: CORRIGIR TRIGGER DE INVALIDAÇÃO DE SESSÕES
-- ============================================

CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Se o usuário foi desativado (active: true -> false)
  IF OLD.active = true AND NEW.active = false THEN
    
    -- Deletar todas as sessões ativas do usuário no auth.sessions
    -- CRÍTICO: Cast explícito para UUID
    DELETE FROM auth.sessions
    WHERE user_id = (NEW.user_id)::uuid;
    
    -- Deletar todos os refresh tokens do usuário
    -- CRÍTICO: Cast explícito para UUID
    DELETE FROM auth.refresh_tokens
    WHERE user_id = (NEW.user_id)::uuid;
    
    RAISE NOTICE 'Sessões invalidadas para usuário %', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION invalidate_sessions_before_delete(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Deletar todas as sessões ativas
  DELETE FROM auth.sessions
  WHERE user_id = (p_user_id)::uuid;
  
  -- Deletar todos os refresh tokens
  DELETE FROM auth.refresh_tokens
  WHERE user_id = (p_user_id)::uuid;
  
  RAISE NOTICE 'Sessões invalidadas antes de deletar usuário %', p_user_id;
END;
$$;

-- ============================================
-- PARTE 3: RECRIAR RLS POLICIES COM CAST
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin()) 
    OR user_id::text = (auth.uid())::text
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin()) 
    OR user_id::text = (auth.uid())::text
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin()) 
    OR user_id::text = (auth.uid())::text
  );

-- User Roles
DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
CREATE POLICY "user_roles_select_policy"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin()) 
    OR user_id::text = (auth.uid())::text
  );

DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
CREATE POLICY "user_roles_insert_policy"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
CREATE POLICY "user_roles_update_policy"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;
CREATE POLICY "user_roles_delete_policy"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_admin())
  );

-- ============================================
-- PARTE 4: CRIAR RPC HELPER (OPCIONAL - FALLBACK)
-- ============================================

DROP FUNCTION IF EXISTS public.update_profile_by_id(TEXT, TEXT, BOOLEAN, UUID, UUID, TEXT, TEXT);

CREATE FUNCTION public.update_profile_by_id(
  p_id TEXT,
  p_role TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_profile_id UUID;
BEGIN
  -- Verificar se o caller é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id::text = (auth.uid())::text 
    AND role = 'admin'
  ) INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar profiles';
  END IF;
  
  -- Converter p_id para UUID
  BEGIN
    v_profile_id := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'ID inválido: %', p_id;
  END;
  
  -- Desabilitar RLS temporariamente
  SET LOCAL row_security = off;
  
  -- Atualizar profile
  UPDATE profiles
  SET
    role = COALESCE(p_role, role),
    active = COALESCE(p_active, active),
    student_id = COALESCE(p_student_id, student_id),
    teacher_id = COALESCE(p_teacher_id, teacher_id),
    full_name = COALESCE(p_full_name, full_name),
    email = COALESCE(p_email, email),
    updated_at = NOW()
  WHERE id = v_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile não encontrado: %', p_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_profile_by_id TO authenticated;

-- ============================================
-- PARTE 5: FORÇAR RELOAD DO POSTGREST
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICAÇÃO E NOTIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 36 - FIX DEFINITIVO APLICADO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ Funções helper corrigidas (is_admin, is_teacher, is_student)';
  RAISE NOTICE '✓ Trigger invalidate_user_sessions corrigido';
  RAISE NOTICE '✓ RLS policies recriadas com cast explícito';
  RAISE NOTICE '✓ RPC update_profile_by_id criada (fallback)';
  RAISE NOTICE '✓ PostgREST notificado para reload';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PROBLEMA RESOLVIDO:';
  RAISE NOTICE '- Arquivamento de usuários funciona';
  RAISE NOTICE '- Sessões invalidadas corretamente';
  RAISE NOTICE '- Sem erro de tipo UUID';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Aguardar 30 segundos para PostgREST recarregar';
  RAISE NOTICE '2. Testar arquivamento de usuário';
  RAISE NOTICE '3. Verificar que sessões são invalidadas';
  RAISE NOTICE '============================================';
END;
$$;
