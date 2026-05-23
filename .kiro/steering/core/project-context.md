---
inclusion: always
description: Contexto geral do SyncClass — plataforma SaaS para gestão de professores autônomos de inglês, TCC FEPI 8º período, stack, roles, estrutura de pastas e design tokens
---

# Contexto do Projeto — SyncClass

Plataforma SaaS para gestão de professores autônomos de inglês. Projeto de TCC — Engenharia de Software, FEPI, 8º período. Professores gerenciam alunos, aulas, cobranças e atividades. Alunos acessam suas informações e entregam atividades. Admin tem visão global.

## TCC

- **Autor:** João Gabriel Silva Caetano
- **Orientador:** Adriano Malerba
- **Instituição:** FEPI — Engenharia de Software, 8º Período
- **Hipóteses:** H1 (SaaS solo em ~3 meses com IA) | H2 (Supabase ≥60% menos esforço backend) | H3 (unificação reduz tarefas manuais)
- **Capítulos:** `docs/tcc/cap{N}-{slug}.md`
- **Referências:** `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md`

## Stack

- React 18 + TypeScript 5.8 + Vite 5.4 (porta 5173)
- Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- React Router v6
- Supabase (PostgreSQL 15 + Auth + Storage + Edge Functions)
- TanStack Query v5 — data fetching
- React Hook Form + Zod — formulários e validação
- Lucide React 0.462 — ícones
- Sonner 1.7 — toasts
- Sentry 10.38 — monitoring
- Testes: Vitest (unitários)
- Deploy: TBD (Lovable/Vercel/Netlify)

Variáveis obrigatórias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Roles

- `admin` → acesso total, gerencia professores e usuários
- `teacher` → gerencia seus próprios alunos, aulas, cobranças e atividades
- `student` → acessa suas próprias informações, entrega atividades

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/           # shadcn/ui base + customizados
│   ├── students/     # CRUD alunos (lado professor)
│   ├── admin/        # Admin-only views
│   ├── auth/         # ProtectedRoute, AuthRedirect, ChangePasswordDialog
│   ├── layout/       # AdminShell, TeacherShell, StudentShell
│   ├── activities/  classes/  dashboard/  filters/
│   ├── financial/   overview/  pwa/  student/  teachers/  users/
├── pages/
│   ├── admin/        # Dashboard, Students, Teachers, Financial, Classes, Activities, Users
│   ├── teacher/      # TeacherHome, TeacherStudents, TeacherFinancial, TeacherClasses, TeacherActivities
│   └── student/      # StudentHome, StudentFinancial, StudentActivities, StudentHistory
├── hooks/            # TanStack Query + services (mistura intencional)
│                     # ex: useStudents.ts, classLogsService.ts
├── contexts/         # AuthContext
├── content/          # I18n — 16 arquivos por domínio + index.ts
│                     # import { ui, students, financial } from '@/content'
├── integrations/
│   └── supabase/     # client.ts, env.ts, types.ts, signup-client.ts
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize(), modalSizes()
    ├── validation/   # Zod schemas
    ├── security/     # errorHandler, sanitize, rateLimit
    └── utils/        # formatters, validators, errorMapper

supabase/
├── migrations/       # 25 SQL migrations
└── functions/        # 5 Edge Functions (Deno/TS)
                      # invite-user, reset-password, admin-delete-user,
                      # cleanup-storage, cleanup-old-records
```

**Nota:** Não existe `src/lib/services/`. Services convivem com hooks em `src/hooks/*Service.ts`.

## Convenções

- TypeScript: `strict: true` — sem `any` explícito
- Path alias: `@/*` → `./src/*`
- Componentes: PascalCase, arquivo `ComponentName.tsx`
- Hooks: camelCase com prefixo `use` (ex: `useStudents`)
- Services: sufixo `Service.ts` (ex: `classLogsService.ts`)
- Idioma: código em inglês, UI e comentários em português brasileiro
- Strings UI: **nunca hardcoded** — centralizar em `src/content/{dominio}.ts`

## Design Tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'

<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

## Scripts

```bash
npm run dev          # Vite (localhost:5173)
npm run lint         # ESLint
npm run type-check   # TypeScript (hífen obrigatório)
npm run check        # lint + type-check
npm run test         # Vitest
npm run build        # build produção
```

## Particularidades Críticas

- Formulários são Dialogs/Modals — não criar rotas separadas
- Inputs usam `id` para identificação (não `name`)
- `is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita com RLS
- Subscriptions real-time: sempre limpar no cleanup (`supabase.removeChannel(channel)`)
- Polling via Supabase realtime — não usar `networkidle` em testes
