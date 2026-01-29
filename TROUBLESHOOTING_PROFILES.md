# 🔧 Troubleshooting: Usuários sem Profile

## 📋 Problema Identificado

**Sintoma:** Usuários aparecem em `auth.users` e `user_roles`, mas NÃO em `profiles`.

**Causa raiz:** A policy de INSERT em `profiles` bloqueia o trigger `handle_new_user()` porque verifica `auth.uid() = user_id`, mas no momento do trigger o usuário ainda não está autenticado.

**Por que `user_roles` funciona:** A tabela `user_roles` tem uma policy adicional que permite `auth.role() = 'service_role'`, permitindo que o trigger funcione.

## 🎯 Solução em 4 Passos

### **Passo 1: Diagnóstico** 

Acesse o SQL Editor do Supabase e execute as queries da **PARTE 1** do arquivo:
```
supabase/migrations/fix_profiles_trigger_rls.sql
```

**O que verificar:**

1. **Query 1.1** - Confirmar que o trigger `on_auth_user_created` existe e está habilitado
   - ✅ Esperado: 1 linha mostrando o trigger

2. **Query 1.2** - Confirmar que a função `handle_new_user()` existe
   - ✅ Esperado: 1 linha com `is_security_definer = true`

3. **Query 1.3** - Ver as policies em `profiles`
   - ❌ Problema: Policy "Usuários podem criar seu próprio perfil" **NÃO** contém `auth.role() = 'service_role'`

4. **Query 1.4** - Comparar com policies de `user_roles`
   - ✅ Referência: Deve ter policies permitindo `service_role`

5. **Query 1.5** - Listar usuários órfãos (em `user_roles` mas não em `profiles`)
   - 📊 Resultado: Lista dos usuários que precisam ser corrigidos

---

### **Passo 2: Aplicar Correção**

Execute a **PARTE 2** do script SQL:

```sql
-- 2.1 Remover a policy antiga
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;

-- 2.2 Criar nova policy que permite service_role
CREATE POLICY "Usuários podem criar seu próprio perfil" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid() = user_id
    );
```

**O que isso faz:**
- Remove a policy restritiva antiga
- Cria uma nova que permite tanto `service_role` (para triggers) quanto `auth.uid() = user_id` (para usuários autenticados)

---

### **Passo 3: Correção Retroativa**

Execute a **PARTE 3** para criar profiles dos usuários órfãos:

```sql
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

**O que isso faz:**
- Encontra todos os usuários em `user_roles` que não têm profile
- Cria os profiles faltantes com os dados de `user_roles`

---

### **Passo 4: Validação**

Execute a **PARTE 4** para confirmar que tudo está OK:

```sql
-- 4.1 Verificar a nova policy
SELECT polname, pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass
AND polname = 'Usuários podem criar seu próprio perfil';

-- 4.2 Confirmar que não há mais órfãos
SELECT COUNT(*) as usuarios_sem_profile
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE p.id IS NULL;

-- 4.3 Verificar sincronização total
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.user_roles) as total_user_roles,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles;
```

**Resultados esperados:**
- 4.1: Deve mostrar a nova policy com `auth.role() = 'service_role'`
- 4.2: Deve retornar `0` (sem órfãos)
- 4.3: Os três números devem ser iguais

---

## 🧪 Teste Final

Crie um novo usuário de teste via signup:

1. Faça logout da aplicação
2. Crie uma nova conta
3. Execute esta query no SQL Editor:

```sql
SELECT 
    u.email,
    ur.role,
    p.full_name as profile_name,
    p.created_at
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id
INNER JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'seu-email-teste@example.com'
ORDER BY u.created_at DESC
LIMIT 1;
```

**✅ Sucesso:** Se retornar 1 linha com dados em todas as colunas, o problema está resolvido!

---

## 📝 Explicação Técnica

### Por que isso aconteceu?

O trigger `handle_new_user()` é executado **IMEDIATAMENTE** após a criação do usuário em `auth.users`, antes mesmo de qualquer autenticação ocorrer. Nesse momento:

- ✅ `auth.role()` = `'service_role'` (o trigger roda com privilégios de serviço)
- ❌ `auth.uid()` = `NULL` (usuário ainda não autenticado)

A policy antiga verificava apenas `auth.uid() = user_id`, que sempre falhava no contexto do trigger.

### Solução implementada

A nova policy permite **DUAS** formas de inserção:
1. `auth.role() = 'service_role'` → Para triggers e funções do sistema
2. `auth.uid() = user_id` → Para usuários autenticados criando/editando seu próprio perfil

Isso é uma prática padrão no Supabase para permitir que triggers funcionem corretamente com RLS habilitado.

---

## 🔄 Atualização do Schema Consolidado

Após aplicar a correção, atualize o arquivo `supabase/migrations/consolidated_schema.sql`:

**Substitua as linhas 304-307:**

```sql
CREATE POLICY "Usuários podem criar seu próprio perfil" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
```

**Por:**

```sql
CREATE POLICY "Usuários podem criar seu próprio perfil" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid() = user_id
    );
```

---

## 📞 Suporte

Se o problema persistir após aplicar todos os passos:

1. Verifique os logs do Supabase (Dashboard → Logs → Postgres Logs)
2. Procure por erros relacionados a `handle_new_user` ou `profiles`
3. Confirme que todas as policies foram aplicadas corretamente
4. Tente criar um usuário de teste e monitore os logs em tempo real

---

**Última atualização:** 29/01/2026
