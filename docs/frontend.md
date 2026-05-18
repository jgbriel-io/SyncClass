# Frontend

Documentação de componentes, hooks, centralização de strings e padrões de UI.

## Stack

- React 18 + TypeScript 5.8
- Vite 5.4 (dev server porta 5173)
- Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- React Router v6
- TanStack Query v5 — data fetching
- React Hook Form + Zod — formulários e validação
- Lucide React 0.462 — ícones
- Sonner 1.7 — toasts

## Estrutura de pastas

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
├── content/          # I18n — 17 arquivos por domínio + index.ts
│                     # import { ui, students, financial } from '@/content'
├── integrations/
│   └── supabase/     # client.ts, env.ts, types.ts, signup-client.ts
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize(), modalSizes()
    ├── validation/   # Zod schemas
    ├── security/     # errorHandler, sanitize, rateLimit
    └── utils/        # formatters, validators, errorMapper
```

## Convenções

- TypeScript: `strict: true` — sem `any` explícito
- Path alias: `@/*` → `./src/*`
- Componentes: PascalCase, arquivo `ComponentName.tsx`
- Hooks: camelCase com prefixo `use` (ex: `useStudents`)
- Services: sufixo `Service.ts` (ex: `classLogsService.ts`)
- Idioma: código em inglês, UI e comentários em português brasileiro
- Strings UI: **nunca hardcoded** — centralizar em `src/content/{dominio}.ts`

## Design tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'

<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

## Centralização de strings

Sprint 23 alcançou **100% de centralização** — 0% hardcoding.

### Estrutura

```
src/content/
├── index.ts                 # Exports centralizados
├── common.ts               # Strings genéricas (150+ strings)
├── auth.ts                 # Autenticação (40+ strings)
├── layout.ts               # Layout/shells (30+ strings)
├── dashboard.ts            # Dashboard (50+ strings)
├── activities.ts           # Atividades (100+ strings)
├── classes.ts              # Aulas (60+ strings)
├── financial.ts            # Financeiro (50+ strings)
├── students.ts             # Alunos (60+ strings)
├── teachers.ts             # Professores (40+ strings)
├── users.ts                # Usuários (80+ strings)
├── overview.ts             # Visões gerais (40+ strings)
├── student-portal.ts       # Portal do aluno (100+ strings)
├── validation.ts           # Validação (30+ strings)
├── ui.ts                   # UI genérica (25+ strings)
├── pwa.ts                  # PWA (15+ strings)
└── filters.ts              # Filtros (20+ strings)
```

**Total:** 17 arquivos | 900+ strings centralizadas

### Padrão de uso

```tsx
// ✅ CORRETO - Centralizado
import { students, common } from "@/content";

export const StudentCard = ({ student }) => {
  return (
    <div>
      <h2>{student.name}</h2>
      <button title={common.tooltips.edit}>
        {common.buttons.edit}
      </button>
      <input placeholder={students.placeholders.searchStudent} />
    </div>
  );
};
```

### Convenções

1. **Imports:** `import { domain } from "@/content"` ou `import { common } from "@/content"`
2. **Nomenclatura:** `content.category.subcategory_descriptor`
3. **Separação:** Generic em `common.ts`, domain-specific em arquivos temáticos
4. **Type Safety:** Todas as chaves são type-safe via TypeScript `as const`
5. **Organização:** Strings agrupadas por contexto (labels, buttons, placeholders, etc)

### Guia completo

Ver `docs/archive/sprint-23/string-centralization-guide.md` para guia detalhado.

## Particularidades

- Formulários são Dialogs/Modals — não criar rotas separadas
- Inputs usam `id` para identificação (não `name`)
- `is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita com RLS
- Subscriptions real-time: sempre limpar no cleanup (`supabase.removeChannel(channel)`)
- Polling via Supabase realtime — não usar `networkidle` em testes

## Scripts

```bash
npm run dev          # Vite (localhost:5173)
npm run lint         # ESLint
npm run type-check   # TypeScript (hífen obrigatório)
npm run check        # lint + type-check
npm run test         # Vitest
npm run build        # build produção
```
