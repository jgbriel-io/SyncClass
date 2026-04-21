-- Migration 30: Fix DEFINITIVO - Cast explícito em TODAS as RLS policies
-- O problema é que quando o frontend faz .eq("user_id", userId), o Postgres
-- compara o filtro (string) com a coluna user_id (uuid) ANTES de aplicar a policy
-- Solução: garantir que TODAS as comparações nas policies usem cast explícito

-- ============================================
-- PROFILES - Recriar policies com cast
-- ============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin()) 
    OR user_id = (auth.uid())::uuid
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin()) 
    OR user_id = (auth.uid())::uuid
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin()) 
    OR user_id = (auth.uid())::uuid
  );

-- ============================================
-- USER_ROLES - Recriar policies com cast
-- ============================================

DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
CREATE POLICY "user_roles_select_policy"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin()) 
    OR user_id = (auth.uid())::uuid
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
-- COMENTÁRIOS
-- ============================================

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 
'Permite que admins vejam todos os profiles e usuários vejam apenas o próprio. Cast explícito para evitar erro de tipo UUID.';

COMMENT ON POLICY "profiles_update_policy" ON profiles IS 
'Permite que admins atualizem qualquer profile e usuários atualizem apenas o próprio. Cast explícito para evitar erro de tipo UUID.';

COMMENT ON POLICY "profiles_insert_policy" ON profiles IS 
'Permite que admins criem profiles e usuários criem apenas o próprio. Cast explícito para evitar erro de tipo UUID.';
