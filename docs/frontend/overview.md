# Frontend

Frontend React com TypeScript, Tailwind CSS, shadcn/ui e TanStack Query. SPA (Single Page Application) com Vite.

**Para quem:** Devs que precisam entender estrutura do frontend, adicionar componentes, criar hooks ou trabalhar com design tokens.

## Índice

- [Quando usar](#quando-usar)
- [Stack](#stack)
- [Estrutura](#estrutura)
- [Convenções](#convenções)
- [Documentação detalhada](#documentação-detalhada)
- [Scripts](#scripts)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Adicionar componente (UI, domínio)
- Criar hook (TanStack Query, mutation)
- Trabalhar com design tokens (typography, spacing, icons)
- Centralizar strings UI
- Entender estrutura de pastas

**Não use quando:**

- Procurar schema do banco → [Database Overview](../database/overview.md)
- Procurar Edge Functions → [Backend Edge Functions](../backend/edge-functions.md)
- Procurar padrões de arquitetura → [Architecture Patterns](../architecture/patterns.md)

## Stack

**Core:**

- React 18 + TypeScript 5.8
- Vite 5.4 (dev server porta 5173)
- React Router v6 (SPA, client-side routing)

**UI:**

- Tailwind CSS 3.4
- shadcn/ui (Radix UI primitives)
- Lucide React 0.462 (ícones)
- Sonner 1.7 (toasts)

**Data:**

- TanStack Query v5 (data fetching, cache)
- React Hook Form + Zod (formulários, validação)
- Supabase JS Client (PostgREST, Auth, Storage, Realtime)

**Variáveis obrigatórias:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Estrutura

```
src/
├── components/
│   ├── ui/           # shadcn/ui base + customizados (40+ componentes)
│   ├── students/     # CRUD alunos (lado professor)
│   ├── admin/        # Admin-only views
│   ├── auth/         # ProtectedRoute, AuthRedirect, ChangePasswordDialog
│   ├── layout/       # AdminShell, TeacherShell, StudentShell
│   └── activities/ classes/ dashboard/ financial/ overview/ pwa/ teachers/ users/
├── pages/
│   ├── admin/        # 7 páginas (Dashboard, Students, Teachers, Financial, Classes, Activities, Users)
│   ├── teacher/      # 6 páginas (Home, Students, Financial, Classes, Activities, Overview)
│   └── student/      # 4 páginas (Home, Financial, Activities, History)
├── hooks/            # TanStack Query + services (42 hooks)
├── contexts/         # AuthContext (único context global)
├── content/          # 17 arquivos, 900+ strings centralizadas
├── integrations/supabase/  # client, env, types, signup-client
└── lib/
    ├── design-tokens/  # typography, spacing, icons, modalSizes
    ├── validation/     # Zod schemas
    ├── security/       # errorHandler, sanitize, rateLimit
    └── utils/          # formatters, validators, errorMapper
```

## Convenções

**TypeScript:**

- `strict: true` — sem `any` explícito
- Path alias: `@/*` → `./src/*`

**Nomenclatura:**

- Componentes: PascalCase, arquivo `ComponentName.tsx`
- Hooks: camelCase com prefixo `use` (ex: `useStudents`)
- Services: sufixo `Service.ts` (ex: `classLogsService.ts`)

**Idioma:**

- Código: inglês
- UI e comentários: português brasileiro
- Strings UI: **nunca hardcoded** — centralizar em `src/content/{dominio}.ts`

**Particularidades:**

- Formulários são Dialogs/Modals — não criar rotas separadas
- Inputs usam `id` para identificação (não `name`)
- Subscriptions real-time: sempre limpar no cleanup (`supabase.removeChannel(channel)`)

## Documentação detalhada

### [Componentes](./components.md)

Estrutura, convenções, shadcn/ui e componentes de domínio.

**Conteúdo:**

- shadcn/ui (40+ componentes base)
- Componentes de domínio (students, financial, activities, classes)
- Layouts (AdminShell, TeacherShell, StudentShell)
- Auth (ProtectedRoute, AuthRedirect)
- Convenções de criação

### [Design Tokens](./design-tokens.md)

Typography, spacing, icons e modalSizes.

**Conteúdo:**

- `typography()` — 7 níveis (H1-H4, Body, Small, Tiny)
- `stack()` — 6 níveis (Tight, Compact, Default, Relaxed, Loose, Spacious)
- `iconSize()` — 5 tamanhos (XS, SM, MD, LG, XL)
- `modalSizes()` — 4 tamanhos (SM, MD, LG, XL)
- 129 testes unitários validando tokens

### [Centralização de Strings](./content.md)

900+ strings centralizadas em 17 arquivos.

**Conteúdo:**

- Estrutura de `src/content/` (17 arquivos)
- Padrão de uso (imports, nomenclatura)
- Convenções (type-safe, organização)
- 100% de centralização (0% hardcoding)

### [Hooks e Services](./hooks.md)

TanStack Query, mutations e services.

**Conteúdo:**

- 42 hooks customizados (data fetching, mutations, utilitários)
- Padrão Repository (componentes nunca chamam Supabase direto)
- Mutation wrappers (useOptimisticMutation)
- Services de domínio (classLogsService, financialRecordsService, activitiesService, teachersService, inviteUserService)
- Convenções de criação (query keys, error handling, invalidate)

## Scripts

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run lint         # ESLint
npm run type-check   # TypeScript (hífen obrigatório)
npm run check        # lint + type-check
npm run test         # Vitest (32 testes unitários)
npm run build        # Build produção
```

## Ver também

- [Architecture Overview](../architecture/overview.md) — Visão geral da arquitetura
- [Architecture Patterns](../architecture/patterns.md) — Repository, Strategy, Observer
- [Backend Overview](../backend/overview.md) — Edge Functions, RPCs
- [Database Overview](../database/overview.md) — Schema, migrations
