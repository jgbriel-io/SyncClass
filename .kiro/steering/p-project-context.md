---
inclusion: always
description: Contexto geral da plataforma JLAC English School — stack, roles, estrutura de pastas, convenções e design tokens
---

# Contexto do Projeto - JLAC English School Platform

Plataforma SaaS para gestão de escola de inglês. Professores gerenciam alunos, aulas, cobranças e atividades. Alunos acessam suas informações e entregam atividades. Admin tem visão global.

## Stack

- React 18 + TypeScript + Vite (porta 8080)
- Tailwind CSS + shadcn/ui (Radix UI)
- React Router v6
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- TanStack Query — data fetching
- React Hook Form + Zod — formulários
- Lucide React — ícones
- Sonner — toasts
- Deploy: Cloudflare Pages

Variáveis obrigatórias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Roles

- `admin` → acesso total, gerencia professores e usuários
- `teacher` → gerencia seus próprios alunos, aulas, cobranças e atividades
- `student` → acessa suas próprias informações, entrega atividades, paga cobranças

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/           # shadcn/ui
│   ├── students/     # StudentsListView, StudentFormDialog, StudentsTableRow
│   ├── admin/        # StudentDetailSheet, componentes admin
│   ├── auth/         # AuthRedirect, ChangePasswordDialog
│   ├── layout/       # AdminShell, TeacherShell, StudentShell
│   └── security/     # errorHandler
├── pages/
│   ├── admin/        # Dashboard, Students, Teachers, Financial, Classes, Activities, Users
│   ├── teacher/      # TeacherHome, TeacherStudents, TeacherFinancial, TeacherClasses, TeacherActivities
│   └── student/      # StudentHome, StudentFinancial, StudentActivities, StudentHistory
├── hooks/            # useStudents, useTeachers, useFinancial, useActivities, useClassLogs...
├── contexts/         # AuthContext
├── integrations/
│   └── supabase/     # client.ts, types gerados
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize()
    └── security/      # errorHandler.ts
```

## Convenções

- TypeScript: `noImplicitAny: false`, `strictNullChecks: false`
- Path alias: `@/*` → `./src/*`
- Componentes: PascalCase
- Hooks: camelCase com prefixo `use`
- Idioma: código em inglês, comentários e UI em português brasileiro

## Design Tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'

// Uso
<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

## Particularidades

- Formulários são Dialogs/Modals, não rotas separadas
- Inputs usam `id` (não `name`) para identificação
- Polling contínuo via Supabase realtime — não usar `networkidle` em testes
- `is_admin()` DEVE ter `SECURITY DEFINER` para evitar recursão com RLS
