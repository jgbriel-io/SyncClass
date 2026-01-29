# ✅ Checklist Rápido: Corrigir Profiles

## 🎯 Problema
Usuários aparecem em `user_roles` mas NÃO em `profiles` após signup.

## 🚀 Solução Rápida (5 minutos)

### 1️⃣ Acesse o Supabase SQL Editor
- Dashboard do Supabase → SQL Editor

### 2️⃣ Execute o Diagnóstico
Cole e execute:
```sql
-- Ver usuários órfãos
SELECT 
    ur.user_id,
    ur.email,
    ur.full_name,
    ur.role
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE p.id IS NULL;
```

**Anote quantos usuários sem profile existem:** ___________

### 3️⃣ Aplicar Correção da Policy
Cole e execute:
```sql
-- Corrigir policy de INSERT
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem criar seu próprio perfil" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid() = user_id
    );
```

✅ **Resultado esperado:** `SUCCESS`

### 4️⃣ Corrigir Usuários Existentes
Cole e execute:
```sql
-- Criar profiles para usuários órfãos
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
```

✅ **Resultado esperado:** `INSERT X` (onde X = número de órfãos do passo 2)

### 5️⃣ Validar Correção
Cole e execute:
```sql
-- Confirmar que não há mais órfãos
SELECT COUNT(*) as usuarios_sem_profile
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE p.id IS NULL;
```

✅ **Resultado esperado:** `0`

### 6️⃣ Testar Novo Signup
1. Faça logout da aplicação
2. Crie uma nova conta de teste
3. Verifique se o usuário aparece em **Usuários** (aba profiles)

✅ **Sucesso!** O novo usuário deve aparecer imediatamente.

---

## 📄 Arquivos Criados

- ✅ `fix_profiles_trigger_rls.sql` - Script completo com diagnóstico e correção
- ✅ `TROUBLESHOOTING_PROFILES.md` - Documentação técnica detalhada
- ✅ `consolidated_schema.sql` - Atualizado com a correção

---

## 🔍 Se Ainda Não Funcionar

Execute este diagnóstico completo:
```sql
-- Verificar trigger
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verificar função
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Ver todas as policies de profiles
SELECT polname, pg_get_expr(polwithcheck, polrelid) 
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass;
```

**Compartilhe os resultados dessas queries para diagnóstico avançado.**

---

**Tempo estimado:** 5 minutos  
**Nível de risco:** Baixo (apenas adiciona permissão para service_role)
