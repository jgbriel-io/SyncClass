# Arquitetura

Documentação da arquitetura em camadas do SyncClass, fluxo de requisições e padrões de código.

## Tipo de arquitetura

**Layered Architecture** com padrão **BFF implícito** via Supabase.

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

## Camadas do frontend

| Camada | Localização | Responsabilidade |
|--------|-------------|-----------------|
| Pages | `src/pages/` | Roteamento, composição de views por role |
| Views | `src/components/*/View.tsx` | Layout de página, orquestração de estado |
| Components | `src/components/*/` | UI pura, formulários, tabelas, dialogs |
| Hooks | `src/hooks/` | Lógica de negócio, TanStack Query, mutations |
| Context | `src/contexts/` | Estado global (apenas AuthContext) |
| Lib | `src/lib/` | Utilitários, design tokens, validações, segurança |
| Integrations | `src/integrations/supabase/` | Client Supabase, tipos gerados |

## Fluxo de requisição

Exemplo: Professor cria uma cobrança

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

## Fluxo de autenticação

```
1. Login → supabase.auth.signInWithPassword()
2. JWT retornado → armazenado em localStorage (sb-* keys)
3. AuthContext.fetchUserRole() → busca em user_roles → fallback profiles
4. Verifica active/deleted_at → logout se inativo
5. Redireciona para /admin, /teacher ou /student
6. Verificação periódica a cada 30s (checkAccountStatus)
7. onAuthStateChange listener → atualiza estado em tempo real
```

## Módulos e conexões

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

## Rotas

### Públicas
`/login`, `/esqueci-senha`, `/redefinir-senha`, `/policies`

### Admin
`/admin` — Dashboard  
`/admin/students`, `/admin/teachers`, `/admin/financial`, `/admin/classes`, `/admin/activities`, `/admin/users`, `/admin/overview`

### Professor
`/teacher` — Home  
`/teacher/students`, `/teacher/financial`, `/teacher/classes`, `/teacher/activities`, `/teacher/overview`

### Aluno
`/student` — Home  
`/student/financial`, `/student/activities`, `/student/history`  
`/student/financial/checkout/:recordId`

## Design patterns identificados

### Singleton
`supabase` client em `src/integrations/supabase/client.ts` — instância única exportada e reutilizada em todo o projeto.

### Strategy
`useOptimisticMutation` e `useRetryMutation` — encapsulam estratégias diferentes de mutation (otimista vs retry com backoff exponencial) com a mesma interface.

### Template method
`useOptimisticMutation` define o esqueleto do fluxo (onMutate → onError rollback → onSuccess → onSettled invalidate) e delega callbacks para o chamador.

### Repository
Os hooks (`useStudents`, `useFinancialRecords`, `useActivities`) funcionam como repositories — abstraem o acesso ao Supabase dos componentes.

### Factory
`createErrorHandler(context)` em `src/lib/security/errorHandler.ts` — factory que cria handlers de erro pré-configurados com contexto.

### Observer
`supabase.auth.onAuthStateChange` no `AuthContext` — padrão Observer nativo do Supabase para reagir a mudanças de sessão.

## Problemas arquiteturais identificados

### ARQ-001: God hook
**Severidade:** Alta  
**Local:** `useUpdateStudent`

Hook tem 200+ linhas com lógica de negócio complexa misturada com data fetching. Sincroniza profiles, user_roles, valida telefone, atualiza pay_day via RPC, tudo em uma única função `mutationFn`.

**Fix:** Extrair lógica de sincronização para RPC no banco:
```sql
CREATE OR REPLACE FUNCTION update_student_with_sync(
  p_student_id UUID,
  p_updates JSONB
) RETURNS JSONB ...
```

### ARQ-002: Agregação no cliente
**Severidade:** Alta  
**Local:** `useFinancialSummary`

Busca TODOS os registros financeiros sem paginação para calcular totais no frontend. Com crescimento, vai degradar performance.

**Fix:** Mover cálculo para o banco via RPC ou view materializada:
```sql
SELECT * FROM financial_dashboard WHERE teacher_id = $1;
```

### ARQ-003: Query keys inconsistentes
**Severidade:** Média  
**Local:** TanStack Query

Falta de padronização nas query keys. Existem 3+ padrões diferentes para a mesma entidade, causando invalidações inconsistentes.

**Fix:** Centralizar query keys em `src/lib/queryKeys.ts`:
```ts
export const QUERY_KEYS = {
  students: {
    all: () => ["students"] as const,
    paginated: (page: number, filters: StudentsListFilters) => 
      ["students", "paginated", page, filters] as const,
  },
} as const;
```

### ARQ-004: Invalidações excessivas
**Severidade:** Média  
**Local:** `useUpdateStudent.onSuccess`

Invalida 8 query keys diferentes, incluindo queries não relacionadas (`users`, `profiles`). Causa refetch desnecessário.

**Fix:** Invalidar apenas o que mudou. Usar `setQueryData` para atualização otimista.

### ARQ-005: N+1 queries
**Severidade:** Média  
**Local:** `useFinancialRecords`

Faz N+1 queries para buscar nomes de usuários confirmadores e aulas de pacotes.

**Fix:** Usar JOIN no Supabase:
```ts
const { data } = await supabase
  .from("financial_records")
  .select(`
    *,
    students!inner(name, teacher_id),
    confirmed_by:profiles!confirmed_by_user_id(full_name),
    financial_record_class_logs(class_logs(id, class_date, title))
  `)
  .range(from, to);
```

### ARQ-006: God file
**Severidade:** Baixa  
**Local:** `useUserMutations.ts`

Arquivo tem 600+ linhas com lógica de criação de usuário, fallback para Edge Function, geração de senha, validação de email, criação de student/teacher — tudo misturado.

**Fix:** Separar em módulos menores em `src/hooks/users/`.

## Refatorações identificadas

### REFORMA-001: Duplicação de sanitizeErrorMessage
**Severidade:** Alta

Existe em dois arquivos com lógica diferente:
- `src/lib/security/errorHandler.ts` — versão simples
- `src/lib/utils/errorMessages.ts` — versão completa

Hooks importam de fontes diferentes, causando comportamento inconsistente.

**Fix:** Consolidar em um único arquivo.

### REFORMA-002: God function em useUpdateClassLog
**Severidade:** Alta

`mutationFn` tem complexidade ciclomática ~12 com 4 níveis de aninhamento.

**Fix:** Extrair para funções auxiliares.

### REFORMA-003: Duplicação de detecção de overlap
**Severidade:** Alta

Padrão de detecção de overlap duplicado em 3 hooks diferentes com lógica idêntica.

**Fix:** Extrair para `src/lib/utils/classTime.ts`:
```ts
export function isClassOverlapError(error: unknown): boolean { ... }
export const CLASS_OVERLAP_MESSAGE = "Já existe outra aula...";
```

### REFORMA-004: N+1 em useClassLogs
**Severidade:** Média

Faz query separada para buscar `student_ids` do professor e depois filtra.

**Fix:** Usar JOIN direto via PostgREST.

### REFORMA-005: Agregação no cliente em useClassLogsSummary
**Severidade:** Média

Carrega todos os registros de aulas para calcular estatísticas no frontend.

**Fix:** Mover para RPC.

### REFORMA-006: Queries sequenciais em useAvailableClassLogsForStudent
**Severidade:** Média

Faz 3 queries sequenciais (waterfall).

**Fix:** Paralelizar com `Promise.all()`.

### REFORMA-007: Mutação direta em enrichWithPackageFinancial
**Severidade:** Baixa

Função modifica array passado por referência, violando imutabilidade.

**Fix:** Retornar novo array com `.map()`.

### REFORMA-008: Inconsistência de validação de nota
**Severidade:** Baixa

`gradeSchema` define nota máxima como 10, mas o banco tem `CHECK (grade <= 100)`.

**Fix:** Alinhar validação frontend com constraint do banco.

## Pontos positivos

- Lazy loading de todas as páginas via `React.lazy()` — bundle inicial pequeno
- TanStack Query com `placeholderData: keepPreviousData` — UX suave na paginação
- `useOptimisticMutation` customizado para mark_as_paid e mark_as_delivered
- Rate limiting no frontend (`checkRateLimit`) como primeira linha de defesa
- Design tokens centralizados (`typography()`, `stack()`, `iconSize()`)
- Error boundary em todas as seções (`SectionErrorBoundary`)
- Sanitização de erros antes de exibir ao usuário (`sanitizeErrorMessage`)

## Particularidades

- Formulários são Dialogs/Modals — não há rotas separadas para forms
- Inputs usam `id` (não `name`) para identificação
- Polling contínuo via Supabase realtime — não usar `networkidle` em testes E2E
- `supabaseSignupClient` isolado com `memoryStorage` para criação de usuários sem afetar sessão principal
