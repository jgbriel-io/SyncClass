# Skill: Architecture

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
**Por quê:** Uma instância única, reutilizada em todo projeto. Correto para HTTP clients.  
**Correto:** ✅

```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient(url, anonKey)
// Exportado e importado onde necessário
```

### 2. Strategy
**Uso:** `useOptimisticMutation` vs `useRetryMutation` em `src/hooks/`.  
**Por quê:** Encapsulam estratégias diferentes (otimista vs retry com backoff) com mesma interface.  
**Correto:** ✅

```typescript
// Strategy interface implícita
const { mutate } = useOptimisticMutation({
  mutationFn: updateStudent,
  optimisticUpdate: (old, new) => new,
  onSuccess: () => notify('Atualizado'),
})
```

### 3. Template Method
**Uso:** `useOptimisticMutation` define esqueleto (onMutate → onError → onSuccess → onSettled).  
**Por quê:** Delega customização ao chamador (optimisticUpdate, successMessage).  
**Correto:** ✅

### 4. Repository (Parcial)
**Uso:** Hooks (`useStudents`, `useClassLogs`, `useFinancialRecords`) + services em `src/hooks/*Service.ts`.  
**Por quê:** Abstraem acesso ao Supabase dos componentes.  
**Estado atual:** Services existem (`classLogsService.ts`, `financialRecordsService.ts`, `activitiesService.ts`, `teachersService.ts`, `inviteUserService.ts`) mas convivem com hooks na mesma pasta. Hooks ainda misturam queries com lógica de negócio em alguns casos.  
**Trabalho futuro (TCC Cap. 10):** Mover services para `src/lib/services/` e isolar hooks puros.

### 5. Factory
**Uso:** `createErrorHandler(context)` em `src/lib/security/errorHandler.ts`.  
**Por quê:** Cria handlers de erro pré-configurados com contexto.  
**Correto:** ✅

### 6. Observer
**Uso:** `supabase.auth.onAuthStateChange` no AuthContext.  
**Por quê:** React a mudanças de sessão via padrão nativo do Supabase.  
**Correto:** ✅

## Performance — Regras Críticas

### ❌ Anti-padrão 1: Carregar Tudo, Filtrar no Frontend
```typescript
// ERRADO: Busca 100k registros, filtra no cliente
const { data } = await supabase
  .from('financial_records')
  .select('*')

const filtered = data.filter(r => r.teacher_id === teacherId)
```

**Fix:**
```typescript
// CORRETO: Filtra no banco
const { data } = await supabase
  .from('financial_records')
  .select('*')
  .eq('teacher_id', teacherId)
```

### ❌ Anti-padrão 2: N+1 Queries
```typescript
// ERRADO: Query 1 busca registros, Query 2+ buscam relacionados
const records = await fetchFinancialRecords()
const profiles = await supabase
  .from('profiles')
  .select('*')
  .in('user_id', records.map(r => r.confirmed_by))
```

**Fix:**
```typescript
// CORRETO: Join em uma query
const { data } = await supabase
  .from('financial_records')
  .select(`
    *,
    students(*),
    confirmed_by:profiles(full_name),
    financial_record_class_logs(class_logs(*))
  `)
```

### ❌ Anti-padrão 3: Agregação no Cliente
```typescript
// ERRADO: Calcula totais no frontend
const records = await fetchAllRecords() // 100k+ registros
let totalPaid = 0
records.forEach(r => {
  if (r.status === 'paid') totalPaid += r.amount
})
```

**Fix:**
```typescript
// CORRETO: Agregação no banco via RPC ou materialized view
const { data } = await supabase.rpc('get_financial_summary', {
  p_teacher_id: teacherId
})
// RPC retorna { total_paid, total_pending, ... }
```

## Convenções de Nomes

### Componentes
- **Nome:** PascalCase.
- **Arquivos:** `ComponentName.tsx`.
- **Sufixos comuns:** `Dialog`, `Card`, `Badge`, `Form`, `Tab`, `Box`, `Banner`.
- **Exemplo:** `StudentDialog.tsx`, `ClassLogCard.tsx`, `InstallPWABanner.tsx`.

### Hooks
- **Prefixo:** `use`.
- **Nome:** camelCase.
- **Exemplo:** `useStudents`, `useClassLogs`, `useOptimisticMutation`.

### Services (Lógica de Negócio)
- **Sufixo:** `Service.ts`.
- **Localização atual:** `src/hooks/*Service.ts` (junto com hooks).
- **Exemplo:** `classLogsService.ts`, `financialRecordsService.ts`, `activitiesService.ts`, `teachersService.ts`, `inviteUserService.ts`.

### Variáveis e Constantes
- **Padrão:** camelCase.
- **Constantes:** UPPER_SNAKE_CASE.
- **Exemplo:**
  ```typescript
  const studentCount = 42
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024
  ```

### Queries e Mutations
- **QueryKey:** `[domain, id, filter]`.
- **Exemplo:**
  ```typescript
  queryKey: ['students', teacherId, { page: 1 }]
  queryKey: ['financial', studentId, { status: 'pending' }]
  ```

## Decisões Arquiteturais

### Por que Supabase (BaaS)?
1. **H2 (Hipótese):** Supabase reduz ≥60% esforço backend.
2. **Sem servidor:** Zero overhead de infra.
3. **RLS nativo:** Isolamento de dados automático.
4. **Auth pronta:** JWT, sessions, 2FA.

### Por que TanStack Query?
1. Caching automático de queries.
2. Invalidação simples de dados.
3. Retry e backoff exponencial.
4. DevTools para debugging.

### Por que Monolito Modular (não micro-frontend)?
1. Usuários têm 1–3 roles, não N roles independentes.
2. Compartilham contexto de autenticação.
3. Deploy único, simples.
4. Sem overhead de iframes ou bundle splitting complexo.

## Quando Chamar Esta Skill

- Decidir arquitetura de nova feature.
- Refatorar componente que viola camadas.
- Otimizar query com N+1.
- Implementar novo padrão de design.
- Avaliar impacto de mudança estrutural.
