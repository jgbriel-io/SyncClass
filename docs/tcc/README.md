# TCC — SyncClass

Trabalho de Conclusão de Curso — Engenharia de Software, FEPI, 8º Período.

**Autor:** João Gabriel Silva Caetano  
**Orientador:** Adriano Malerba  
**Período:** Janeiro–Maio 2026

## Índice de Capítulos

| Cap                                      | Título                  | Status | Descrição                                                |
| ---------------------------------------- | ----------------------- | ------ | -------------------------------------------------------- |
| [1](./capitulos/cap1-introducao.md)      | Introdução              | 🟠     | Contexto, problema, objetivos, justificativa e hipóteses |
| [2](./capitulos/cap2-referencial.md)     | Referencial Teórico     | 🟠     | SaaS, BaaS, React, Supabase, TanStack Query, shadcn/ui   |
| [3](./capitulos/cap3-metodologia.md)     | Metodologia             | 🟠     | Abordagem, sprints, ferramentas, Git workflow            |
| [4](./capitulos/cap4-requisitos.md)      | Requisitos              | 🟠     | RF01-RF30, RNF01-RNF36, RN01-RN59                        |
| [5](./capitulos/cap5-modelagem.md)       | Modelagem               | 🟠     | Decisões arquiteturais, diagrama ER, camadas             |
| [6](./capitulos/cap6-desenvolvimento.md) | Desenvolvimento         | 🟠     | Frontend, backend, banco, segurança                      |
| [7](./capitulos/cap7-qualidade.md)       | Qualidade               | 🟠     | Testes, code review, CI/CD, RLS                          |
| [8](./capitulos/cap8-gestao.md)          | Gestão                  | 🟠     | Sprints, métricas, lições aprendidas                     |
| [9](./capitulos/cap9-deploy-infra.md)    | Deploy e Infraestrutura | 🟠     | Supabase, CI/CD, monitoramento, Edge Functions           |
| [10](./capitulos/cap10-conclusao.md)     | Conclusão               | 🟠     | Resultados, hipóteses validadas, trabalhos futuros       |

**Legenda:** ✅ Concluído (ABNT pronto) | 🟠 Rascunho | 🔴 Pendente

## Documentos Auxiliares

- [Referências Bibliográficas](./projeto-escrito/referencias-bibliograficas.md) — Referências em formato ABNT
- [Assets Pendentes](./projeto-escrito/assets-pendentes.md) — Checklist de figuras e tabelas a criar
- [Guia de Normatização](./projeto-escrito/guia-de-normatizacao-e-estrutura-final.md) — Normas FEPI/ABNT 2026
- [Conclusão do Desenvolvimento](./projeto-pratico/conclusao-desenvolvimento.md) — Status final do código
- [Histórico de Desenvolvimento](./projeto-pratico/historico-de-desenvolvimento-syncclass.md) — 31 sprints documentadas

## Hipóteses do TCC

**H1 — Viabilidade de SaaS Solo com IA:**  
É possível desenvolver uma plataforma SaaS funcional em ~3 meses com auxílio de IA generativa (Claude/GPT).

**H2 — Eficiência do Supabase:**  
Supabase (BaaS) reduz em ≥60% o esforço de desenvolvimento backend comparado a stack tradicional (Node.js + Express + PostgreSQL).

**H3 — Unificação de Processos:**  
Unificar gestão de alunos, aulas e cobranças em uma plataforma reduz tarefas manuais e erros operacionais.

## Métricas do Projeto

| Métrica                        | Valor                              |
| ------------------------------ | ---------------------------------- |
| **Período de Desenvolvimento** | 19 jan – 26 mai 2026 (~18 semanas) |
| **Sprints Implementadas**      | 31                                 |
| **Commits**                    | 60+                                |
| **Arquivos TypeScript**        | 359                                |
| **Linhas de Código (src)**     | ~50.467                            |
| **Migrations de Banco**        | 70                                 |
| **Suites de Teste**            | 28                                 |
| **Testes Automatizados**       | 304+                               |
| **Strings UI Centralizadas**   | 860+                               |
| **RLS Policies**               | 43+                                |

## Estrutura do Projeto

```
sync-class-platform/
├── src/                         # Frontend (React + TypeScript)
│   ├── components/              # shadcn/ui + componentes de domínio
│   ├── hooks/                   # TanStack Query + services
│   ├── pages/                   # Rotas por role (admin, teacher, student)
│   ├── content/                 # 860+ strings UI centralizadas
│   └── lib/                     # Utils, design tokens, validação
├── supabase/
│   ├── migrations/              # 70 SQL migrations
│   └── functions/               # Edge Functions (Deno/TS) — 9 funções
└── docs/
    ├── sprints/                 # 31 sprints documentadas + 4 NAO-IMPLEMENTADA
    └── tcc/
        ├── capitulos/           # cap1–cap10 (rascunhos)
        ├── projeto-escrito/     # Normas, assets pendentes, referências
        ├── projeto-pratico/     # Conclusão do desenvolvimento, histórico
        └── archive/             # Requisitos, regras de negócio, gestão
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

### Archive

- [Requisitos Funcionais](./archive/requisitos/requisitos-funcionais.md) — RF01-RF30
- [Requisitos Não Funcionais](./archive/requisitos/requisitos-nao-funcionais.md) — RNF01-RNF36
- [Regras de Negócio](./archive/regras-de-negocio/regras-de-negocio.md) — RN01-RN59
- [Histórico de Desenvolvimento](./archive/gestao-projeto/historico-desenvolvimento.md) — 165 commits originais
- [Validação Sprints 1–15](./archive/gestao-projeto/validacao-sprints-1-15.md) — 97.8% validados
