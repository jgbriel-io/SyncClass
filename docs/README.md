# Documentação — SyncClass

Plataforma SaaS para gestão de professores autônomos de inglês. Projeto de TCC — Engenharia de Software, FEPI, 8º período.

## Visão Geral

**Novo no projeto?** Comece por [docs/project/overview.md](./project/overview.md) — contexto completo do que é o SyncClass, problema, solução, stack e status.

## Estrutura

### [project/](./project/)

Contexto geral do projeto — o que é, para quem, problema, solução, stack, status.

- [overview.md](./project/overview.md) — visão executiva completa

### [architecture/](./architecture/)

Arquitetura e padrões — camadas, fluxos, decisões, troubleshooting.

- [overview.md](./architecture/overview.md) — visão geral da arquitetura
- [flows.md](./architecture/flows.md) — fluxos de requisição e autenticação
- [patterns.md](./architecture/patterns.md) — 6 design patterns aplicados
- [decisions.md](./architecture/decisions.md) — 7 ADRs documentados
- [troubleshooting.md](./architecture/troubleshooting.md) — 5 erros comuns
- [technical-debt.md](./architecture/technical-debt.md) — débitos priorizados

### [backend/](./backend/)

Backend e integrações — Supabase, Edge Functions, RPCs.

- [overview.md](./backend/overview.md) — visão geral do backend
- [edge-functions.md](./backend/edge-functions.md) — 5 functions detalhadas
- [rpcs.md](./backend/rpcs.md) — RPCs, triggers, views
- [integrations.md](./backend/integrations.md) — Storage, rate limiting, idempotência
- [bugs.md](./backend/bugs.md) — 7 bugs identificados e corrigidos

### [database/](./database/)

Banco de dados — schema, migrations, RLS.

- [overview.md](./database/overview.md) — visão geral do banco
- [schema.md](./database/schema.md) — tabelas, relacionamentos, bugs
- [migrations.md](./database/migrations.md) — 21 migrations aplicadas
- [rls.md](./database/rls.md) — funções helper, políticas, troubleshooting

### [security/](./security/)

Segurança — autenticação, RLS, validações.

- [overview.md](./security/overview.md) — visão geral de segurança
- [auth-rls.md](./security/auth-rls.md) — autenticação, roles, sessões
- [validations.md](./security/validations.md) — validações banco/frontend, rate limiting

### [frontend/](./frontend/)

Frontend — componentes, hooks, design tokens.

- [overview.md](./frontend/overview.md) — visão geral do frontend
- [components.md](./frontend/components.md) — shadcn/ui, componentes de domínio
- [design-tokens.md](./frontend/design-tokens.md) — typography, spacing, icons
- [content.md](./frontend/content.md) — 900+ strings centralizadas
- [hooks.md](./frontend/hooks.md) — 42 hooks, TanStack Query, services

### [git/](./git/)

Git e workflow — branches, commits, convenções.

- [overview.md](./git/overview.md) — visão geral do Git
- [workflow.md](./git/workflow.md) — feature branch, code review, merge
- [conventions.md](./git/conventions.md) — Conventional Commits, branches

### [sprints/](./sprints/)

Desenvolvimento — 16 sprints implementadas.

- [README.md](./sprints/README.md) — índice de sprints
- [historico-completo.md](./sprints/historico-completo.md) — linha do tempo
- Sprint 01-07 — MVP (CRUD, auth, dashboard, mobile, segurança)
- Sprint 08-15 — Refactor (hooks, strings, docs)
- Sprint 16-17 — Docs organization

### [tcc/](./tcc/)

TCC — capítulos do trabalho acadêmico.

- [README.md](./tcc/README.md) — índice de capítulos
- Cap 1-10 — Introdução, Referencial, Metodologia, Requisitos, Modelagem, Desenvolvimento, Qualidade, Gestão, Deploy, Conclusão

### [archive/](./archive/)

Archive — requisitos, regras de negócio, gestão de projeto (referência histórica).

- [README.md](./archive/README.md) — índice do archive
- [requisitos/](./archive/requisitos/) — RF01-RF30, RNF01-RNF36
- [regras-de-negocio/](./archive/regras-de-negocio/) — RN01-RN59
- [gestao-projeto/](./archive/gestao-projeto/) — histórico, validação de sprints

## Status

| Domínio      | Arquivos | Status |
| ------------ | -------- | ------ |
| Project      | 1        | ✅     |
| Architecture | 6        | ✅     |
| Backend      | 5        | ✅     |
| Database     | 4        | ✅     |
| Security     | 3        | ✅     |
| Frontend     | 5        | ✅     |
| Git          | 3        | ✅     |
| Sprints      | 21       | ✅     |
| TCC          | 10       | ✅     |
| Archive      | 6        | ✅     |
| **Total**    | **54**   | **✅** |

## Guia rápido

### Stack

- React 18 + TypeScript 5.8 + Vite 5.4
- Tailwind CSS 3.4 + shadcn/ui
- Supabase (PostgreSQL 15 + Auth + Storage + Edge Functions)
- TanStack Query v5

### Comandos

```bash
npm run dev          # dev server (localhost:5173)
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run check        # lint + type-check
npm run test         # Vitest (32 testes)
npm run build        # build produção
```

### Estrutura

```
src/
├── components/      # UI por domínio (40+ shadcn/ui + domínio)
├── hooks/           # 42 hooks (TanStack Query + services)
├── pages/           # rotas por role (admin, teacher, student)
├── content/         # 900+ strings centralizadas (17 arquivos)
├── lib/             # utils, design tokens, validação, security
└── integrations/    # Supabase client

supabase/
├── migrations/      # 21 SQL migrations
└── functions/       # 5 Edge Functions (Deno/TS)

docs/
├── project/         # 1 arquivo (overview)
├── architecture/    # 6 arquivos (overview, flows, patterns, decisions, troubleshooting, debt)
├── backend/         # 5 arquivos (overview, edge-functions, rpcs, integrations, bugs)
├── database/        # 4 arquivos (overview, schema, migrations, rls)
├── security/        # 3 arquivos (overview, auth-rls, validations)
├── frontend/        # 5 arquivos (overview, components, design-tokens, content, hooks)
├── git/             # 3 arquivos (overview, workflow, conventions)
├── sprints/         # 21 sprints (16 implementadas, 5 não implementadas)
├── tcc/             # 10 capítulos
└── archive/         # requisitos, regras, gestão
```

### Roles

- `admin` → acesso total, gerencia professores e usuários
- `teacher` → gerencia seus próprios alunos, aulas, cobranças e atividades
- `student` → acessa suas próprias informações, entrega atividades

### Métricas

- **Commits:** ~218
- **Sprints:** 16 implementadas
- **Migrations:** 21
- **Edge Functions:** 5
- **Hooks:** 42
- **Componentes:** 40+ shadcn/ui + domínio
- **Strings UI:** 900+ centralizadas
- **Testes:** 161 (32 unitários + 129 design tokens)
- **RLS Policies:** 40+
- **Arquivos de Docs:** 54

## Convenções

- Código em inglês, UI e comentários em português
- Strings UI centralizadas em `src/content/`
- TypeScript strict mode (sem `any`)
- Componentes < 200 linhas
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`)

## Links úteis

- [Contexto do Projeto](./project/overview.md) — comece aqui
- [Histórico completo](./sprints/historico-completo.md)
- [Assets pendentes](./tcc/assets-pendentes.md)
