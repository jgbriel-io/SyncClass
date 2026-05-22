# TCC — SyncClass

Trabalho de Conclusão de Curso — Engenharia de Software, FEPI, 8º Período.

**Autor:** João Gabriel Silva Caetano  
**Orientador:** Adriano Malerba  
**Período:** Janeiro–Maio 2026

## Índice de Capítulos

### Versão Técnica (docs/tcc/tecnico/)

| Cap                                    | Título                  | Status | Descrição                                                |
| -------------------------------------- | ----------------------- | ------ | -------------------------------------------------------- |
| [1](./tecnico/cap1-introducao.md)      | Introdução              | ✅     | Contexto, problema, objetivos, justificativa e hipóteses |
| [2](./tecnico/cap2-referencial.md)     | Referencial Teórico     | ✅     | SaaS, BaaS, React, Supabase, TanStack Query, shadcn/ui   |
| [3](./tecnico/cap3-metodologia.md)     | Metodologia             | ✅     | Abordagem, sprints, ferramentas, Git workflow            |
| [4](./tecnico/cap4-requisitos.md)      | Requisitos              | ✅     | RF01-RF30, RNF01-RNF36, RN01-RN59                        |
| [5](./tecnico/cap5-modelagem.md)       | Modelagem               | ✅     | Casos de uso, diagrama ER, arquitetura de camadas        |
| [6](./tecnico/cap6-desenvolvimento.md) | Desenvolvimento         | ✅     | Frontend, backend, banco, segurança                      |
| [7](./tecnico/cap7-qualidade.md)       | Qualidade               | ✅     | Testes, code review, CI/CD, RLS                          |
| [8](./tecnico/cap8-gestao.md)          | Gestão                  | ✅     | Sprints, métricas, lições aprendidas                     |
| [9](./tecnico/cap9-deploy-infra.md)    | Deploy e Infraestrutura | ✅     | Supabase, CI/CD, monitoramento, Edge Functions           |
| [10](./tecnico/cap10-conclusao.md)     | Conclusão               | ✅     | Resultados, hipóteses validadas, trabalhos futuros       |

### Versão Acadêmica (docs/tcc/academico/)

| Cap                                      | Título                  | Status | Descrição                                      |
| ---------------------------------------- | ----------------------- | ------ | ---------------------------------------------- |
| [1](./academico/cap1-introducao.md)      | Introdução              | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [2](./academico/cap2-referencial.md)     | Referencial Teórico     | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [3](./academico/cap3-metodologia.md)     | Metodologia             | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [4](./academico/cap4-requisitos.md)      | Requisitos              | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [5](./academico/cap5-modelagem.md)       | Modelagem               | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [6](./academico/cap6-desenvolvimento.md) | Desenvolvimento         | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [7](./academico/cap7-qualidade.md)       | Qualidade               | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [8](./academico/cap8-gestao.md)          | Gestão                  | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [9](./academico/cap9-deploy-infra.md)    | Deploy e Infraestrutura | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |
| [10](./academico/cap10-conclusao.md)     | Conclusão               | ✅     | Voz impessoal, parágrafos ≤5 linhas, refs ABNT |

**Legenda:** ✅ Completo | 🟠 Parcial | 🔴 Pendente

## Documentos Auxiliares

- [Referências Bibliográficas](./referencias.md) — Referências em formato ABNT
- [Assets Pendentes](./assets-pendentes.md) — Checklist de figuras e tabelas a criar
- [Histórico de Desenvolvimento](./projeto-pratico/historico-de-desenvolvimento-syncclass.md) — 16 sprints implementadas

## Hipóteses do TCC

**H1 — Viabilidade de SaaS Solo com IA:**  
É possível desenvolver uma plataforma SaaS funcional em ~3 meses com auxílio de IA generativa (Claude/GPT).

**H2 — Eficiência do Supabase:**  
Supabase (BaaS) reduz em ≥60% o esforço de desenvolvimento backend comparado a stack tradicional (Node.js + Express + PostgreSQL).

**H3 — Unificação de Processos:**  
Unificar gestão de alunos, aulas e cobranças em uma plataforma reduz tarefas manuais e erros operacionais.

## Métricas do Projeto

| Métrica                        | Valor                                  |
| ------------------------------ | -------------------------------------- |
| **Período de Desenvolvimento** | Jan–Mai 2026 (5 meses)                 |
| **Sprints Implementadas**      | 16                                     |
| **Commits**                    | ~218                                   |
| **Migrations de Banco**        | 21                                     |
| **Edge Functions**             | 5                                      |
| **Hooks Customizados**         | 42                                     |
| **Componentes UI**             | 40+ shadcn/ui + domínio                |
| **Strings UI Centralizadas**   | 900+                                   |
| **Testes Automatizados**       | 161 (32 unitários + 129 design tokens) |
| **RLS Policies**               | 40+                                    |
| **Arquivos de Documentação**   | 53                                     |

## Estrutura do Projeto

```
sync-class-platform/
├── src/                         # Frontend (React + TypeScript)
│   ├── components/              # 40+ shadcn/ui + domínio
│   ├── hooks/                   # 42 hooks (TanStack Query + services)
│   ├── pages/                   # Rotas por role (admin, teacher, student)
│   ├── content/                 # 900+ strings centralizadas
│   └── lib/                     # Utils, design tokens, validação
├── supabase/
│   ├── migrations/              # 21 SQL migrations
│   └── functions/               # 5 Edge Functions (Deno/TS)
└── docs/
    ├── architecture/            # 6 arquivos (overview, flows, patterns, decisions, troubleshooting, debt)
    ├── backend/                 # 5 arquivos (overview, edge-functions, rpcs, integrations, bugs)
    ├── database/                # 4 arquivos (overview, schema, migrations, rls)
    ├── security/                # 3 arquivos (overview, auth-rls, validations)
    ├── frontend/                # 5 arquivos (overview, components, design-tokens, content, hooks)
    ├── git/                     # 3 arquivos (overview, workflow, conventions)
    ├── sprints/                 # 21 sprints (16 implementadas, 5 não implementadas)
    └── tcc/                     # 10 capítulos + referências + assets
```

## Links Úteis

### Documentação Técnica

- [Docs — README Principal](../README.md)
- [Architecture Overview](../architecture/overview.md)
- [Backend Overview](../backend/overview.md)
- [Database Overview](../database/overview.md)
- [Frontend Overview](../frontend/overview.md)
- [Security Overview](../security/overview.md)

### Sprints

- [Sprints — README](../sprints/README.md)
- [Histórico Completo](../sprints/historico-completo.md)
- [Sprint 16 — Docs Organization](../sprints/sprint-16-refactor-docs-architecture-organization.md)

### Archive

- [Requisitos Funcionais](../archive/requisitos/requisitos-funcionais.md) — RF01-RF30
- [Requisitos Não Funcionais](../archive/requisitos/requisitos-nao-funcionais.md) — RNF01-RNF36
- [Regras de Negócio](../archive/regras-de-negocio/regras-de-negocio.md) — RN01-RN59
