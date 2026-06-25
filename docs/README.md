# Documentação — SyncClass

Plataforma SaaS para gestão de professores autônomos de inglês. Projeto de TCC — Engenharia de Software, FEPI, 8º período.

## Visão Geral

**Novo no projeto?** Comece por [docs/project/overview.md](./project/overview.md) — contexto completo do que é o SyncClass, problema, solução, stack e status.

## Dois contextos nesta pasta

```
docs/                       ← projeto prático (documentação técnica do código)
  architecture/ backend/ database/ frontend/ git/ project/ security/ sprints/

docs/tcc-8-periodo/         ← TCC acadêmico (faculdade FEPI)
  gestao-projeto/ projeto-pratico/ projeto-escrito/ assets/ material-faculdade/
```

---

## Estrutura — Projeto Prático

### [project/](./project/)

Contexto geral do projeto — o que é, para quem, problema, solução, stack, status.

- [overview.md](./project/overview.md) — visão executiva completa

### [architecture/](./architecture/)

Arquitetura e padrões — camadas, fluxos, decisões, troubleshooting.

- [overview.md](./architecture/overview.md) — visão geral da arquitetura
- [flows.md](./architecture/flows.md) — fluxos de requisição e autenticação
- [patterns.md](./architecture/patterns.md) — design patterns aplicados
- [decisions.md](./architecture/decisions.md) — ADRs documentados
- [troubleshooting.md](./architecture/troubleshooting.md) — erros comuns
- [technical-debt.md](./architecture/technical-debt.md) — débitos priorizados

### [backend/](./backend/)

Backend e integrações — Supabase, Edge Functions, RPCs.

- [overview.md](./backend/overview.md) — visão geral do backend
- [edge-functions.md](./backend/edge-functions.md) — 7 functions detalhadas
- [rpcs.md](./backend/rpcs.md) — RPCs, triggers, views
- [integrations.md](./backend/integrations.md) — Storage, rate limiting, idempotência
- [bugs.md](./backend/bugs.md) — bugs identificados e corrigidos

### [database/](./database/)

Banco de dados — schema, migrations, RLS.

- [overview.md](./database/overview.md) — visão geral do banco
- [schema.md](./database/schema.md) — 11 tabelas, relacionamentos
- [migrations.md](./database/migrations.md) — 70 migrations aplicadas
- [rls.md](./database/rls.md) — funções helper, políticas, troubleshooting
- [analise-banco.md](./database/analise-banco.md) — análise estrutural (Sprint 25)

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
- [content.md](./frontend/content.md) — 860+ strings centralizadas
- [hooks.md](./frontend/hooks.md) — 37 hooks, TanStack Query, services

### [git/](./git/)

Git e workflow — branches, commits, convenções.

- [overview.md](./git/overview.md) — visão geral do Git
- [workflow.md](./git/workflow.md) — feature branch, code review, merge
- [conventions.md](./git/conventions.md) — Conventional Commits, branches

### [sprints/](./sprints/)

Desenvolvimento iterativo — 31 iterações documentadas.

- [README.md](./sprints/README.md) — índice de iterações
- Sprint 01–07 — MVP (CRUD, auth, dashboard, mobile, segurança)
- Sprint 08–17 — Refactor (hooks, strings, docs)
- Sprint 18–20 — Segurança e LGPD
- Sprint 21–27 — Qualidade final (code review, RLS, security audit)
- Sprint 28 — QA manual (116 itens, 20 rotas)
- Sprint 29–31 — Fixes pós-QA, AbacatePay, filtros server-side

---

## Estrutura — TCC Acadêmico

### [tcc-8-periodo/](./tcc-8-periodo/)

Documentação acadêmica do TCC FEPI — 8º período.

- [README.md](./tcc-8-periodo/README.md) — índice geral do TCC

#### [tcc-8-periodo/projeto-escrito/](./tcc-8-periodo/projeto-escrito/)

Texto final e decisões de escrita.

- [capitulos-final/](./tcc-8-periodo/projeto-escrito/capitulos-final/) — capítulos 1–5 (`.md`), apêndices, referências, listas
- [capitulos-guia/](./tcc-8-periodo/projeto-escrito/capitulos-guia/) — guias de escrita por capítulo
- [decisoes/](./tcc-8-periodo/projeto-escrito/decisoes/) — `decisoes-transversais.md` (valores canônicos), `decisoes-escrita.md`
- [revisoes/](./tcc-8-periodo/projeto-escrito/revisoes/) — parecer de banca simulado, revisão do orientador
- [pendencias-manuais/](./tcc-8-periodo/projeto-escrito/pendencias-manuais/) — assets pendentes, guia Word, próximos passos

#### [tcc-8-periodo/gestao-projeto/](./tcc-8-periodo/gestao-projeto/)

Requisitos, regras de negócio, validação de sprints.

#### [tcc-8-periodo/projeto-pratico/](./tcc-8-periodo/projeto-pratico/)

Histórico de desenvolvimento, resumo executivo, métricas extraídas do código.

#### [tcc-8-periodo/assets/](./tcc-8-periodo/assets/)

Diagramas HTML interativos (H1/H2/H3, arquitetura, RLS, metodologia) + briefing de slides + guia de apresentação.

---

## Status

| Domínio       | Arquivos       | Status |
| ------------- | -------------- | ------ |
| Project       | 1              | ✅     |
| Architecture  | 6              | ✅     |
| Backend       | 5              | ✅     |
| Database      | 5              | ✅     |
| Security      | 3              | ✅     |
| Frontend      | 5              | ✅     |
| Git           | 3              | ✅     |
| Sprints       | 31             | ✅     |
| TCC acadêmico | tcc-8-periodo/ | ✅     |

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
npm run test         # Vitest (301 testes)
npm run build        # build produção
```

### Estrutura

```
src/
├── components/      # UI por domínio (shadcn/ui + domínio)
├── hooks/           # 37 hooks (TanStack Query + services)
├── pages/           # rotas por role (admin, teacher, student)
├── content/         # 860+ strings centralizadas
├── lib/             # utils, design tokens, validação, security
└── integrations/    # Supabase client

supabase/
├── migrations/      # 70 SQL migrations
└── functions/       # Edge Functions (Deno/TS)

docs/
├── project/         # visão executiva
├── architecture/    # 6 arquivos
├── backend/         # 5 arquivos
├── database/        # 5 arquivos
├── security/        # 3 arquivos
├── frontend/        # 5 arquivos
├── git/             # 3 arquivos
├── sprints/         # 31 iterações
└── tcc-8-periodo/   # TCC acadêmico (FEPI)
```

### Roles

- `admin` → acesso total, gerencia professores e usuários
- `teacher` → gerencia seus próprios alunos, aulas, cobranças e atividades
- `student` → acessa suas próprias informações, entrega atividades

### Métricas (valores canônicos — fonte: `decisoes-transversais.md`)

| Grandeza               | Valor   |
| ---------------------- | ------- |
| Commits (branch main)  | 152     |
| Iterações (sprints)    | 31      |
| Migrations SQL         | 70      |
| Arquivos TypeScript    | 329     |
| Componentes React      | 181     |
| Hooks customizados     | 37      |
| Testes automatizados   | 301     |
| Linhas de código (src) | ~50.000 |
| Strings UI             | 860+    |
| Tabelas no banco       | 11      |
| RF implementados       | 32      |

## Convenções

- Código em inglês, UI e comentários em português
- Strings UI centralizadas em `src/content/`
- TypeScript strict mode (sem `any`)
- Componentes < 200 linhas
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`)

## Links úteis

- [Visão executiva](./project/overview.md) — comece aqui
- [Iterações](./sprints/README.md) — histórico de desenvolvimento
- [Valores canônicos do TCC](./tcc-8-periodo/projeto-escrito/decisoes/decisoes-transversais.md)
- [Assets de slides pendentes](./tcc-8-periodo/projeto-escrito/pendencias-manuais/assets-pendentes.md)
