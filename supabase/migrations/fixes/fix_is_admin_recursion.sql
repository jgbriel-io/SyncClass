-- ============================================
-- FIX: Recursão infinita em is_admin()
-- ============================================
-- Problema: is_admin() consulta profiles/user_roles
-- que têm RLS policies que chamam is_admin() novamente
-- Solução: Recriar is_admin() com SECURITY DEFINER
-- e SET search_path para bypassar RLS
-- ============================================

-- ============================================
-- FIX: Recursão infinita em is_admin()
-- ============================================

-- Recriar is_admin() com SECURITY DEFINER para bypassar RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

SELECT '✅ is_admin() corrigida - recursão eliminada' as status;
