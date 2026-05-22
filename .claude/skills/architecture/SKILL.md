---
name: syncclass-architecture
description: SyncClass architecture guide — layered architecture, 6 frontend layers, design patterns (Singleton, Strategy, Repository, Factory, Observer), performance anti-patterns (N+1, client-side aggregation). Use when deciding feature architecture, refactoring layer violations, or optimizing queries.
---

# Architecture — SyncClass

Arquitetura SyncClass — camadas, padrões, design decisions.

## Tipo de Arquitetura

**Layered Architecture** (em camadas) com padrão **BFF implícito** via Supabase.

Sem servidor de aplicação próprio. Supabase é backend completo: PostgreSQL + Auth + Storage + Edge Functions. Frontend consome diretamente via SDK.

```
┌─────────────────────────────────────────────────────┐
│             FRONTEND (React + Vite)                  │
│                                                      │
│  Pages (admin/, teacher/, student/)                  │
│    └── Components (UI + domínio)                    │
│         └── Hooks (TanStack Query + mutations)       │
│              └── Supabase JS Client (SDK)            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────┐
│              SUPABASE (BaaS)                         │
│                                                      │
│  Auth (JWT)  │  PostgREST (REST API)  │  Storage    │
│              │                        │             │
│              └──── PostgreSQL ────────┘             │
│                  RLS Policies                       │
│                  Triggers / Edge Functions          │
└─────────────────────────────────────────────────────┘
```

## Camadas do Frontend

| Camada | Localização | Responsabilidade | Exemplo |
|--------|-------------|------------------|---------|
| **Pages** | `src/pages/` | Roteamento, composição por role, layout | `/admin/students`, `/teacher/classes` |
| **Components** | `src/components/{domínio}/` | UI pura, sem lógica, props-driven | `StudentDialog`, `ClassLogCard` |
| **Hooks (queries)** | `src/hooks/use*.ts` | TanStack Query + mutations | `useStudents`, `useClassLogs` |
| **Hooks (services)** | `src/hooks/*Service.ts` | Lógica de domínio (acesso direto Supabase) | `classLogsService`, `financialRecordsService` |
| **Context** | `src/contexts/` | Estado global (apenas AuthContext) | AuthContext (user, role, logout) |
| **Lib** | `src/lib/` | Utilitários, schemas, design tokens, dados estáticos | Zod, formatters, typography(), countries.ts |
| **Content** | `src/content/` | i18n por domínio (16 arquivos + index.ts) | `ui.ts`, `students.ts`, `financial.ts` |
| **Integrations** | `src/integrations/supabase/` | Cliente, env, types gerados, signup-client | `client.ts`, `types.ts` |

**Nota importante:** Não existe pasta `src/lib/services/`. Services convivem com hooks em `src/hooks/`.

## Design Patterns Implementados

### 1. Singleton
**Uso:** Supabase client em `src/integrations/supabase/client.ts`.
**Por quê:** Uma instância única, reutilizada em todo projeto.

```typescript
export const supabase = createClient(url, anonKey)
```

### 2. Strategy
**Uso:** `useOptimisticMutation` vs `useRetryMutation` em `src/hooks/`.
**Por quê:** Encapsulam estratégias diferentes (otimista vs retry com backoff) com mesma interface.

### 3. Template Method
**Uso:** `useOptimisticMutation` define esqueleto (onMutate → onError → onSuccess → onSettled).

### 4. Repository (Parcial)
**Uso:** Hooks + services em `src/hooks/*Service.ts`.
Services existentes: `classLogsService.ts`, `financialRecordsService.ts`, `activitiesService.ts`, `teachersService.ts`, `inviteUserService.ts`.

### 5. Factory
**Uso:** `createErrorHandler(context)` em `src/lib/security/errorHandler.ts`.

### 6. Observer
**Uso:** `supabase.auth.onAuthStateChange` no AuthContext.

## Performance — Regras Críticas

### ❌ Anti-padrão 1: Carregar Tudo, Filtrar no Frontend
```typescript
// ERRADO
const { data } = await supabase.from('financial_records').select('*')
const filtered = data.filter(r => r.teacher_id === teacherId)

// CORRETO
const { data } = await supabase
  .from('financial_records').select('*').eq('teacher_id', teacherId)
```

### ❌ Anti-padrão 2: N+1 Queries
```typescript
// CORRETO: Join em uma query
const { data } = await supabase
  .from('financial_records')
  .select(`*, students(*), confirmed_by:profiles(full_name), financial_record_class_logs(class_logs(*))`)
```

### ❌ Anti-padrão 3: Agregação no Cliente
```typescript
// CORRETO: Agregação no banco via RPC
const { data } = await supabase.rpc('get_financial_summary', { p_teacher_id: teacherId })
```

## Convenções de Nomes

- **Componentes:** PascalCase, `ComponentName.tsx`. Sufixos: `Dialog`, `Card`, `Badge`, `Form`, `Tab`, `Box`, `Banner`.
- **Hooks:** prefixo `use`, camelCase. Ex: `useStudents`, `useClassLogs`.
- **Services:** sufixo `Service.ts`. Ex: `classLogsService.ts`.
- **QueryKey:** `[domain, id, filter]`. Ex: `['students', teacherId, { page: 1 }]`.

## Decisões Arquiteturais

- **Supabase (BaaS):** H2 hipótese, zero infra overhead, RLS nativo, auth pronta.
- **TanStack Query:** Caching, invalidação, retry/backoff, DevTools.
- **Monolito Modular:** Usuários têm 1–3 roles com contexto compartilhado, deploy único.
