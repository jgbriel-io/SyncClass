# Documentação — SyncClass

Plataforma SaaS para gestão de professores autônomos de inglês. Projeto de TCC — Engenharia de Software, FEPI, 8º período.

## Índice

- [Arquitetura](./architecture.md) — camadas, fluxos, padrões
- [Backend](./backend.md) — Supabase, Edge Functions, integrações
- [Banco de dados](./database.md) — schema, migrations, índices
- [Segurança](./security.md) — RLS, autenticação, validações
- [Frontend](./frontend.md) — componentes, hooks, centralização de strings
- [Sprints](./sprints/) — histórico de desenvolvimento
- [TCC](./tcc/) — capítulos do trabalho acadêmico
- [Arquivo](./archive/) — reports e documentos históricos

## Status

| Doc | Última revisão | Status |
|-----|----------------|--------|
| architecture.md | 2026-05-18 | ✅ |
| backend.md | 2026-05-18 | ✅ |
| database.md | 2026-05-18 | ✅ |
| security.md | 2026-05-18 | ✅ |
| frontend.md | 2026-05-18 | ✅ |
| sprints/ | 2026-05-18 | ✅ |
| tcc/ | 2026-05-18 | 🟠 |

## Guia rápido

### Stack

- React 18 + TypeScript 5.8 + Vite 5.4
- Tailwind CSS 3.4 + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage)
- TanStack Query v5

### Comandos

```bash
npm run dev          # dev server (localhost:5173)
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run check        # lint + type-check
npm run test         # Vitest
npm run build        # build produção
```

### Estrutura

```
src/
├── components/      # UI por domínio
├── hooks/           # TanStack Query + services
├── pages/           # rotas por role
├── content/         # strings centralizadas (i18n)
├── lib/             # utils, design tokens, validação
└── integrations/    # Supabase client

supabase/
├── migrations/      # 25 SQL migrations
└── functions/       # 5 Edge Functions
```

### Roles

- `admin` → acesso total
- `teacher` → gerencia seus alunos
- `student` → acessa suas informações

## Convenções

- Código em inglês, UI e comentários em português
- Strings UI centralizadas em `src/content/`
- TypeScript strict mode (sem `any`)
- Componentes < 200 linhas
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`)

## Links úteis

- [Guia rápido](./CLAUDE.md)
- [Histórico completo](./sprints/historico-completo.md)
- [Assets pendentes](./tcc/assets-pendentes.md)
