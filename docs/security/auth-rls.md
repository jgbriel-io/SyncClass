# Autenticação e Autorização

Supabase Auth, roles, RLS e sessões.

## Índice

- [Quando usar](#quando-usar)
- [Autenticação](#autenticação)
- [Roles](#roles)
- [Autorização (RLS)](#autorização-rls)
- [Sessões](#sessões)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Implementar login/logout
- Verificar role do usuário
- Proteger rotas por role
- Debugar "permission denied"

**Não use quando:**

- Procurar validações de input → [Validations](./validations.md)
- Procurar RLS policies detalhadas → [Database RLS](../database/rls.md)

## Autenticação

**Provider:** Supabase Auth (JWT)

**Fluxo:**

1. Usuário faz login (email + senha)
2. Supabase Auth gera JWT
3. JWT armazenado em `localStorage` (Supabase JS Client)
4. JWT enviado em todas as requisições (header `Authorization: Bearer <token>`)
5. PostgREST valida JWT e extrai `auth.uid()`

**Endpoints:**

- `POST /auth/v1/signup` — criar conta
- `POST /auth/v1/token?grant_type=password` — login
- `POST /auth/v1/logout` — logout
- `POST /auth/v1/recover` — reset password

**Frontend:**

```tsx
import { supabase } from "@/integrations/supabase/client";

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});

// Logout
await supabase.auth.signOut();

// Usuário autenticado
const {
  data: { user },
} = await supabase.auth.getUser();
```

## Roles

**Tipos:** `admin`, `teacher`, `student`

**Armazenamento:**

- `profiles.role` — fonte de verdade (migration 45 removeu a tabela `user_roles` e consolidou tudo em `profiles`)

**Fluxo de criação:**

1. Admin convida usuário via Edge Function `invite-user`
2. Edge Function cria registro em `auth.users` (email confirmado automaticamente — sem envio de email)
3. Trigger `on_auth_user_created` cria registro em `profiles` com o `role` correto
4. Admin recebe modal com email + senha gerada
5. Usuário faz login com as credenciais fornecidas

**Verificação de role:**

```tsx
import { useAuth } from "@/contexts/AuthContext";

const { profile } = useAuth();

if (profile?.role === "admin") {
  // Admin-only logic
}
```

## Autorização (RLS)

**Conceito:** Row Level Security — políticas de acesso por linha.

**Todas as tabelas têm RLS habilitado.** Acesso negado por padrão para usuários não autenticados.

**Funções helper:**

- `is_admin()` — verifica se `profiles.role = 'admin'`
- `is_teacher()` — verifica se `profiles.role = 'teacher'`
- `is_student()` — verifica se `profiles.role = 'student'`

**Exemplo de policy:**

```sql
-- Admin pode ver todos os alunos
CREATE POLICY "admin_select_students" ON students
  FOR SELECT USING (is_admin());

-- Professor pode ver seus próprios alunos
CREATE POLICY "teacher_select_students" ON students
  FOR SELECT USING (
    teacher_id IN (
      SELECT teacher_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Aluno pode ver apenas seu próprio registro
CREATE POLICY "student_select_students" ON students
  FOR SELECT USING (
    id IN (
      SELECT student_id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

**Ver políticas detalhadas:** [Database RLS](../database/rls.md)

## Sessões

**Duração:** 1 hora (renovada automaticamente pelo Supabase JS Client)

**Invalidação:**

- Logout manual (`supabase.auth.signOut()`)
- Desativação de conta (`profiles.active = false`)
- Trigger `invalidate_sessions_on_deactivate` deleta sessões ao desativar conta

**Verificação periódica:**
Frontend verifica status da conta a cada 30s via `useActiveUserCheck`:

```tsx
// src/hooks/useActiveUserCheck.ts
export const useActiveUserCheck = (userId?: string) => {
  return useQuery({
    queryKey: ["active-user-check", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("active")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      // Se conta desativada, fazer logout
      if (!data.active) {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }

      return data.active;
    },
    enabled: !!userId,
    refetchInterval: 30 * 1000, // 30s
  });
};
```

## Ver também

- [Security Overview](./overview.md) — Visão geral de segurança
- [Validations](./validations.md) — Validações de input
- [Database RLS](../database/rls.md) — Políticas RLS detalhadas
