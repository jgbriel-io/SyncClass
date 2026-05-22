---
name: syncclass-code
description: SyncClass development guide — React 18 + TypeScript + Supabase. Use when implementing components, hooks, pages, forms, or Supabase integrations. Reference for stack versions, folder structure, naming conventions, data fetching patterns, and performance rules.
---

# Code — SyncClass

Desenvolvimento do SyncClass — React + TypeScript + Supabase.

## Stack Técnica

- React 18 + React Router v6 | TypeScript 5.8+ | Vite 5.4+
- Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- React Hook Form + Zod | TanStack Query v5
- Lucide React 0.462 | Sonner 1.7 | Sentry 10.38
- Supabase (PostgreSQL 15 + Auth + Storage + Edge Functions)
- Vitest (unitários) — **sem Playwright/E2E ainda**

## Estrutura de Pastas

```
src/
├── components/              # UI por domínio
│   ├── ui/                  # shadcn/ui base + customizados
│   ├── admin/  auth/  activities/  classes/  dashboard/
│   ├── financial/  filters/  layout/  overview/  pwa/
│   ├── student/  students/  teachers/  users/
├── hooks/                   # TanStack Query + services (mistura intencional)
│   ├── use*.ts              # Custom hooks (useStudents, useClassLogs)
│   └── *Service.ts          # Services (classLogsService, financialRecordsService)
├── pages/                   # Rotas (admin/, teacher/, student/, public)
├── contexts/                # AuthContext
├── integrations/supabase/   # client.ts, env.ts, signup-client.ts, types.ts
├── lib/
│   ├── design-tokens/       # typography(), stack(), iconSize(), modalSizes()
│   ├── validation/          # Zod schemas
│   ├── security/            # errorHandler, sanitize, rateLimit
│   └── utils/               # formatters, patterns, errorMapper
└── content/                 # i18n por domínio (16 arquivos + index.ts)

supabase/
├── migrations/              # 25 SQL migrations
└── functions/               # 5 Edge Functions: invite-user, reset-password,
                             # admin-delete-user, cleanup-storage, cleanup-old-records
```

**Nota:** Não existe `src/lib/services/`. Services estão em `src/hooks/*Service.ts`.

## Convenções de Código

### Strings de UI
**REGRA:** Centralizar em `src/content/{dominio}.ts`. NUNCA hardcode em componentes.
```typescript
// ❌ Errado
<button>Salvar</button>

// ✅ Correto
import { ui } from '@/content'
<button>{ui.actions.save}</button>
```

### Validação
Zod em `lib/validation/schemas.ts`. Nunca duplicar schemas.

### Comentários
Zero comentários óbvios. Apenas WHY não-óbvio. Uma linha máximo. Em português.

### TypeScript
`strict: true`. Sem `any` explícito. Usar types gerados do Supabase.

## Data Fetching

```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['students', filter],
  queryFn: () => fetchStudents(filter),
})

// Mutation
const { mutate } = useMutation({
  mutationFn: (data) => createStudent(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
})
```

Performance: NUNCA carregar sem paginação. NUNCA filtrar/agregar no frontend. Usar JOINs e RPCs.

## Testes

```bash
npm run test          # Vitest (run once)
npm run test:watch    # Vitest watch
npm run lint          # ESLint
npm run type-check    # TypeScript (hífen obrigatório)
npm run check         # lint + type-check
npm run ci            # npm ci && check && build
```

Hooks com testes: `useStudents`, `useTeachers`, `useClassLogs`, `useDebouncedValue`, `useOptimisticMutation`.
E2E: ❌ Não implementado — trabalho futuro (Playwright planejado).

## Commits

```
feat(students): add CRUD operations
fix(financial): RLS policy for payment records
refactor(components): extract StudentDialog subcomponents
```
