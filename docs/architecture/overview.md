# Arquitetura do Sistema

## Tipo de Arquitetura

**Layered Architecture (Arquitetura em Camadas)** com padrão **BFF implícito** via Supabase.

Não há servidor de aplicação próprio. O Supabase atua como backend completo (PostgreSQL + Auth + Storage + Edge Functions). O frontend consome diretamente via SDK.

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                      │
│  Pages (admin/ teacher/ student/)                    │
│    └── Components (UI + domain)                      │
│         └── Hooks (TanStack Query + mutations)       │
│              └── Supabase JS Client                  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────┐
│                   SUPABASE (BaaS)                    │
│                                                      │
│  Auth (JWT)  │  PostgREST (REST API)  │  Storage     │
│              │                        │              │
│              └──── PostgreSQL ────────┘              │
│                   RLS Policies                       │
│                   Triggers / RPCs                    │
│                   Edge Functions (Deno)              │
└─────────────────────────────────────────────────────┘
```

## Camadas do Frontend

| Camada | Localização | Responsabilidade |
|--------|-------------|-----------------|
| **Pages** | `src/pages/` | Roteamento, composição de views por role |
| **Views** | `src/components/*/View.tsx` | Layout de página, orquestração de estado |
| **Components** | `src/components/*/` | UI pura, formulários, tabelas, dialogs |
| **Hooks** | `src/hooks/` | Lógica de negócio, TanStack Query, mutations |
| **Context** | `src/contexts/` | Estado global (apenas AuthContext) |
| **Lib** | `src/lib/` | Utilitários, design tokens, validações, segurança |
| **Integrations** | `src/integrations/supabase/` | Client Supabase, tipos gerados |

## Fluxo de uma Requisição

### Exemplo: Professor cria uma cobrança

```
1. USUÁRIO
   Clica em "Nova Cobrança" no FinancialView

2. COMPONENT (FinancialFormDialog.tsx)
   Valida formulário via React Hook Form + Zod
   Chama: useCreateFinancialRecord().mutate(data)

3. HOOK (useFinancialRecords.ts → useCreateFinancialRecord)
   Verifica rate limit (3 req/min)
   Chama: supabase.from("financial_records").insert(record)

4. SUPABASE JS CLIENT
   Adiciona JWT do usuário no header Authorization
   Envia POST para PostgREST: /rest/v1/financial_records

5. POSTGREST
   Extrai user_id do JWT
   Aplica RLS policy "financial_records_insert_policy"
   Verifica: is_teacher() AND student_id IN (SELECT id FROM students WHERE teacher_id = get_teacher_id())

6. POSTGRESQL
   Executa INSERT
   Trigger validate_financial_logic() valida amount e status
   Retorna registro criado

7. HOOK (onSuccess)
   Invalida queries: financial_records, financial_summary, students_paginated...
   toast.success("Cobrança criada com sucesso!")

8. TANSTACK QUERY
   Refetch automático das queries invalidadas
   UI atualiza com novo dado
```

### Fluxo de autenticação

```
1. Login → supabase.auth.signInWithPassword()
2. JWT retornado → armazenado em localStorage (sb-* keys)
3. AuthContext.fetchUserRole() → busca em user_roles → fallback profiles
4. Verifica active/deleted_at → logout se inativo
5. Redireciona para /admin, /teacher ou /student
6. Verificação periódica a cada 30s (checkAccountStatus)
7. onAuthStateChange listener → atualiza estado em tempo real
```

## Módulos e Conexões

```
AuthContext ──────────────────────────────────────────┐
     │                                                 │
     ├── AuthRedirect (redireciona por role)           │
     └── ChangePasswordDialog (must_change_password)   │
                                                       │
Pages (admin/teacher/student)                          │
     │                                                 │
     └── Views (StudentsListView, FinancialView...)    │
          │                                            │
          ├── Hooks (useStudents, useFinancial...)  ───┘
          │    └── supabase client → PostgREST/RPC
          │
          └── Components (Forms, Tables, Dialogs)
               └── Hooks (mutations)
```

---

## Sprint de Correção — Problemas Arquiteturais

### PROBLEMA-ARQ-001
**SEVERIDADE:** ALTA  
**DIAGNÓSTICO:** `useUpdateStudent` tem 200+ linhas com lógica de negócio complexa misturada com data fetching. O hook sincroniza profiles, user_roles, valida telefone, atualiza pay_day via RPC, tudo em uma única função `mutationFn`. Isso viola a separação de responsabilidades e torna o hook impossível de testar unitariamente.

```ts
// Atual: tudo em um mutationFn de 80+ linhas
mutationFn: async ({ id, ...updates }) => {
  // 1. Sanitizar updates
  // 2. Validar telefone (import dinâmico!)
  // 3. Buscar dados atuais para comparar
  // 4. Fazer UPDATE no banco
  // 5. Sincronizar profiles
  // 6. Sincronizar user_roles via RPC
  // 7. Atualizar pay_day via outra RPC
  // ...
}
```

**FIX:** Extrair lógica de sincronização para funções auxiliares ou uma RPC no banco:
```sql
-- Criar RPC que faz tudo atomicamente no banco
CREATE OR REPLACE FUNCTION update_student_with_sync(
  p_student_id UUID,
  p_updates JSONB
) RETURNS JSONB ...
```
```ts
// Hook simplificado
mutationFn: async ({ id, ...updates }) => {
  const { data, error } = await supabase.rpc('update_student_with_sync', {
    p_student_id: id,
    p_updates: updates
  });
  if (error) throw error;
  return data;
}
```

---

### PROBLEMA-ARQ-002
**SEVERIDADE:** ALTA  
**DIAGNÓSTICO:** `useFinancialSummary` busca TODOS os registros financeiros sem paginação para calcular totais no frontend:

```ts
// Busca todos os registros (pode ser 100k+ linhas)
const { data, error } = await supabase
  .from("financial_records")
  .select("amount, status, due_date, students(teacher_id)");

// Filtra no frontend
if (teacherId) {
  records = records.filter((r) => r.students?.teacher_id === teacherId);
}
```

Isso é um N+1 implícito — carrega dados desnecessários e filtra no cliente. Com crescimento, vai degradar performance e aumentar custo de transferência.

**FIX:** Mover cálculo para o banco via RPC ou view materializada:
```sql
-- Usar a materialized view já existente
SELECT * FROM financial_dashboard WHERE teacher_id = $1;

-- Ou criar RPC específica
CREATE OR REPLACE FUNCTION get_financial_summary(p_teacher_id UUID DEFAULT NULL)
RETURNS TABLE(total_pending NUMERIC, total_paid NUMERIC, total_overdue NUMERIC, ...)
```

---

### PROBLEMA-ARQ-003
**SEVERIDADE:** MÉDIA  
**DIAGNÓSTICO:** Falta de padronização nas query keys do TanStack Query. Existem pelo menos 3 padrões diferentes para a mesma entidade:

```ts
// Padrão 1: string simples
queryKey: ["students"]

// Padrão 2: com parâmetros inline
queryKey: ["students_paginated", page, pageSize, filters]

// Padrão 3: com objeto de filtros
queryKey: ["financial_records", teacherId, page, pageSize, filters]

// Padrão 4: com sufixo
queryKey: ["financial_records_by_student_ids", studentIds]
```

Isso causa invalidações inconsistentes — `invalidateQueries({ queryKey: ["students"] })` não invalida `["students_paginated"]`.

**FIX:** Centralizar query keys em um arquivo:
```ts
// src/lib/queryKeys.ts
export const QUERY_KEYS = {
  students: {
    all: () => ["students"] as const,
    paginated: (page: number, filters: StudentsListFilters) => 
      ["students", "paginated", page, filters] as const,
    byTeacher: (teacherId: string) => 
      ["students", "byTeacher", teacherId] as const,
  },
  financial: {
    all: () => ["financial_records"] as const,
    paginated: (teacherId: string, page: number, filters: FinancialRecordsFilters) =>
      ["financial_records", "paginated", teacherId, page, filters] as const,
    summary: (teacherId?: string) => 
      ["financial_records", "summary", teacherId] as const,
  },
  // ...
} as const;
```

---

### PROBLEMA-ARQ-004
**SEVERIDADE:** MÉDIA  
**DIAGNÓSTICO:** `useUpdateStudent.onSuccess` invalida 8 query keys diferentes, incluindo queries não relacionadas (`users`, `profiles`). Isso causa refetch desnecessário de dados que não mudaram, gerando requisições extras ao banco.

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["students"] });
  queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
  queryClient.invalidateQueries({ queryKey: ["users"] });           // ← necessário?
  queryClient.invalidateQueries({ queryKey: ["users_paginated"] }); // ← necessário?
  queryClient.invalidateQueries({ queryKey: ["profiles"] });        // ← necessário?
  queryClient.invalidateQueries({ queryKey: ["financial_records"] }); // ← necessário?
  queryClient.invalidateQueries({ queryKey: ["student_statement"] });
  toast.success("Aluno atualizado com sucesso!");
},
```

**FIX:** Invalidar apenas o que realmente mudou. Usar `setQueryData` para atualização otimista quando possível:
```ts
onSuccess: (updatedStudent) => {
  // Atualização otimista direta
  queryClient.setQueryData(["students"], (old: Student[]) =>
    old?.map(s => s.id === updatedStudent.id ? updatedStudent : s)
  );
  // Invalidar apenas queries que dependem do aluno atualizado
  queryClient.invalidateQueries({ queryKey: ["students", "paginated"] });
  if (payDayChanged) {
    queryClient.invalidateQueries({ queryKey: ["financial_records"] });
  }
}
```

---

### PROBLEMA-ARQ-005
**SEVERIDADE:** MÉDIA  
**DIAGNÓSTICO:** `useFinancialRecords` faz N+1 queries para buscar nomes de usuários confirmadores e aulas de pacotes:

```ts
// Query 1: busca financial_records
const { data } = await q.range(from, to);

// Query 2: busca profiles para confirmed_by (N registros)
const { data: profiles } = await supabase
  .from("profiles")
  .select("user_id, full_name")
  .in("user_id", confirmedByUserIds);

// Query 3: busca package_classes (N registros)
const { data: packageLinks } = await supabase
  .from("financial_record_class_logs")
  .select("financial_record_id, class_logs(...)")
  .in("financial_record_id", packageRecordIds);
```

**FIX:** Usar JOIN no Supabase para trazer tudo em uma query:
```ts
const { data } = await supabase
  .from("financial_records")
  .select(`
    *,
    students!inner(name, teacher_id),
    class_logs(id, class_date, attendance, grade, feedback, title),
    confirmed_by:profiles!confirmed_by_user_id(full_name),
    financial_record_class_logs(
      class_logs(id, class_date, title)
    )
  `)
  .range(from, to);
```

---

### PROBLEMA-ARQ-006
**SEVERIDADE:** BAIXA  
**DIAGNÓSTICO:** `useUserMutations.ts` tem 600+ linhas com lógica de criação de usuário, fallback para Edge Function, geração de senha, validação de email, criação de student/teacher — tudo misturado. É o arquivo mais complexo do projeto e o mais difícil de manter.

**FIX:** Separar em módulos menores:
```
src/hooks/users/
  useCreateUser.ts      # mutation principal
  useUpdateUserRole.ts  # mutation de role
  useDeleteUser.ts      # soft/hard delete
  useResetPassword.ts   # reset de senha
  useInviteUser.ts      # convite via Edge Function
  _helpers.ts           # generateRandomPassword, validateEmail, etc.
```

---

## Pontos Positivos da Arquitetura

- Lazy loading de todas as páginas via `React.lazy()` — bundle inicial pequeno
- TanStack Query com `placeholderData: keepPreviousData` — UX suave na paginação
- `useOptimisticMutation` customizado para mark_as_paid e mark_as_delivered
- Rate limiting no frontend (`checkRateLimit`) como primeira linha de defesa
- Design tokens centralizados (`typography()`, `stack()`, `iconSize()`)
- Error boundary em todas as seções (`SectionErrorBoundary`)
- Sanitização de erros antes de exibir ao usuário (`sanitizeErrorMessage`)

---

## Rotas

### Públicas
- `/login`, `/esqueci-senha`, `/redefinir-senha`, `/policies`

### Admin (`/admin/*`)
- `/admin` — Dashboard
- `/admin/students`, `/admin/teachers`, `/admin/financial`, `/admin/classes`, `/admin/activities`, `/admin/users`, `/admin/overview`

### Professor (`/teacher/*`)
- `/teacher` — Home
- `/teacher/students`, `/teacher/financial`, `/teacher/classes`, `/teacher/activities`, `/teacher/overview`

### Aluno (`/student/*`)
- `/student` — Home
- `/student/financial`, `/student/activities`, `/student/history`
- `/student/financial/checkout/:recordId`

## Design Tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'
```

## Particularidades

- Formulários são Dialogs/Modals — não há rotas separadas para forms
- Inputs usam `id` (não `name`) para identificação
- Polling contínuo via Supabase realtime — não usar `networkidle` em testes E2E
- `supabaseSignupClient` isolado com `memoryStorage` para criação de usuários sem afetar sessão principal
