-- ============================================================
-- DIAGNÓSTICO E CORREÇÃO: Profiles não criados no signup
-- ============================================================
-- Problema: RLS bloqueia trigger handle_new_user() ao inserir em profiles
-- Solução: Permitir service_role na policy de INSERT
-- ============================================================

-- PARTE 1: DIAGNÓSTICO (Execute estas queries para verificar o problema)
-- ============================================================

-- 1.1 Verificar se o trigger existe
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 1.2 Verificar se a função existe
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 1.3 Verificar policies atuais em profiles
SELECT 
    polname as policy_name,
    polcmd as command_type,
    polpermissive as permissive,
    polroles::regrole[] as roles,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass
ORDER BY polname;

-- 1.4 Verificar policies atuais em user_roles (para comparação)
SELECT 
    polname as policy_name,
    polcmd as command_type,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy 
WHERE polrelid = 'public.user_roles'::regclass
ORDER BY polname;

-- 1.5 Testar se há registros órfãos (em user_roles mas não em profiles)
SELECT 
    ur.user_id,
    ur.email,
    ur.full_name,
    ur.role,
    p.id as profile_exists
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE p.id IS NULL;


-- ============================================================
-- PARTE 2: CORREÇÃO (Execute após confirmar o diagnóstico)
-- ============================================================

-- 2.1 Remover a policy antiga de INSERT
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;

-- 2.2 Criar nova policy de INSERT que permite service_role
CREATE POLICY "Usuários podem criar seu próprio perfil" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid() = user_id
    );

-- 2.3 Criar policy de SELECT para service_role (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Service role can read all profiles' 
        AND polrelid = 'public.profiles'::regclass
    ) THEN
        CREATE POLICY "Service role can read all profiles"
            ON public.profiles FOR SELECT
            USING (auth.role() = 'service_role' OR auth.uid() = user_id OR public.is_admin());
    END IF;
END $$;


-- ============================================================
-- PARTE 3: CORREÇÃO RETROATIVA (Criar profiles para usuários órfãos)
-- ============================================================

-- 3.1 Inserir profiles para usuários que só têm user_roles
INSERT INTO public.profiles (user_id, full_name, email, role)
SELECT 
    ur.user_id,
    ur.full_name,
    ur.email,
    CAST(ur.role AS TEXT)
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- PARTE 4: VALIDAÇÃO (Execute para confirmar que tudo está OK)
-- ============================================================

-- 4.1 Verificar a nova policy
SELECT 
    polname as policy_name,
    polcmd as command_type,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass
AND polname = 'Usuários podem criar seu próprio perfil';

-- 4.2 Confirmar que não há mais órfãos
SELECT COUNT(*) as usuarios_sem_profile
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE p.id IS NULL;

-- 4.3 Verificar total de registros sincronizados
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.user_roles) as total_user_roles,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles;


-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================
-- 
-- 1. Execute PARTE 1 (diagnóstico) no SQL Editor do Supabase
-- 2. Analise os resultados:
--    - Query 1.1: Deve mostrar o trigger habilitado
--    - Query 1.3: Deve mostrar a policy problemática sem 'service_role'
--    - Query 1.5: Deve listar usuários órfãos (sem profile)
-- 
-- 3. Execute PARTE 2 (correção) para ajustar as policies
-- 
-- 4. Execute PARTE 3 (correção retroativa) para criar profiles dos órfãos
-- 
-- 5. Execute PARTE 4 (validação) para confirmar sucesso
-- 
-- 6. Teste criando um novo usuário via signup e verifique se aparece em profiles
-- 
-- ============================================================
