# SyncClass — Resumo do Projeto Prático

**TCC — Engenharia de Software, FEPI, 8º Período**
**Aluno:** João Gabriel Silva Caetano
**Orientador:** Adriano Malerba
**Data:** 26/05/2026
**Repositório:** github.com/jgbriel-io/SyncClass

---

## O que é

Plataforma SaaS para professores autônomos de inglês. Substitui planilhas e controles manuais por um sistema unificado com três perfis de acesso:

- **Admin** — visão global de professores, alunos, cobranças e usuários
- **Professor** — gerencia seus próprios alunos, aulas, cobranças e atividades
- **Aluno** — portal mobile-first com histórico, financeiro e atividades

---

## Stack

| Camada   | Tecnologia                                        |
| -------- | ------------------------------------------------- |
| Frontend | React 18.3 + TypeScript 5.8 + Vite 5.4            |
| Estilo   | Tailwind 3.4 + shadcn/ui                          |
| Estado   | TanStack Query v5                                 |
| Backend  | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Deploy   | Cloudflare Pages via GitHub Actions (CI/CD)       |

---

## Métricas

| Métrica                    | Valor                              |
| -------------------------- | ---------------------------------- |
| Período de desenvolvimento | 19 jan – 26 mai 2026 (~18 semanas) |
| Sprints implementadas      | 27                                 |
| Arquivos TypeScript        | 357                                |
| Linhas de código (src)     | ~50.467                            |
| Migrations SQL             | 43                                 |
| Testes automatizados       | 287 (26 suites)                    |
| Strings UI centralizadas   | 860+                               |

---

## Funcionalidades Implementadas

**Alunos:** CRUD completo, validação CPF/telefone, suporte a estrangeiros, upload de foto, soft delete + restauração, API de CEP com autopreenchimento.

**Aulas:** registro individual e pacotes, controle de presença, notas e feedback, atualização em tempo real (Supabase Realtime).

**Financeiro:** cobranças individuais e por pacote, upload de comprovante pelo aluno, QR Code PIX, timeline de transações, fluxo completo de confirmação/rejeição.

**Atividades:** atribuição com prazo, upload de arquivo pelo aluno, correção com nota e arquivo de retorno pelo professor.

**Segurança e Compliance:** RLS em todas as tabelas, anonimização LGPD, exportação de dados pessoais, rate limiting, headers de segurança (CSP, X-Frame-Options).

---

## Qualidade do Código

| Critério             | Resultado                                    |
| -------------------- | -------------------------------------------- |
| Lint                 | ✅ 0 erros, 0 warnings                       |
| Type-check           | ✅ `tsc --noEmit` limpo                      |
| Testes automatizados | ✅ 287/287 passando (26 suites)              |
| Build de produção    | ✅ Vite 5.4, sem erros                       |
| CI/CD                | ✅ lint → type-check → test → build → deploy |
| TypeScript strict    | ✅ sem `any` explícito                       |
| Strings UI           | ✅ 100% centralizadas em `src/content/`      |
| RLS                  | ✅ 43 migrations auditadas (Sprint 24)       |
| LGPD                 | ✅ anonimização + exportação + rate limiting |
| OWASP Top 10         | ✅ auditado (Sprint 26)                      |

---

## Fases de Desenvolvimento

| Fase | Sprints | Período      | Foco                                       |
| ---- | ------- | ------------ | ------------------------------------------ |
| 1    | 1–7     | jan–fev 2026 | MVP funcional (~30 dias úteis)             |
| 2    | 8–17    | mar–mai 2026 | Refatoração, strings, docs                 |
| 3    | 18–20   | mai 2026     | Segurança, LGPD, rate limiting             |
| 4    | 21–27   | mai 2026     | Code review, RLS audit, security audit     |
| 5    | 28      | 26 mai 2026  | QA manual — 116 itens, 20 rotas (pendente) |

---

## Hipóteses do TCC

| Hipótese                                            | Evidência                                                                                          | Status      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- |
| **H1** — SaaS funcional solo em ~3 meses com IA     | 357 arquivos, ~50k linhas, 1 desenvolvedor, 18 semanas                                             | ✅ Validada |
| **H2** — Supabase reduz ≥60% do esforço backend     | 43 migrations gerenciam auth, RLS, RPCs e triggers — equivalente a ~80 endpoints REST + middleware | ✅ Validada |
| **H3** — Plataforma unificada reduz tarefas manuais | Portal único cobre todo o ciclo operacional: alunos, aulas, cobranças, atividades                  | ✅ Validada |

---

## Pendências

| Item                                | Status                                    |
| ----------------------------------- | ----------------------------------------- |
| Sprint 28 — QA manual (116 itens)   | 🔴 Em execução                            |
| Resolução de bugs críticos do QA    | 🔴 Aguarda QA                             |
| Capítulos 2–10 — versão Word ABNT   | 🟠 Rascunhos prontos, formatação pendente |
| Assets visuais (DER, prints, Gantt) | 🟠 Pendente                               |

---

## Features Fora do Escopo (decisão de escopo, não limitação técnica)

- Notificações em tempo real
- Exportação de relatórios em PDF
- Integração com pagamento real (Stripe/PIX API)
- Gamificação do portal do aluno
- Integração Google Calendar
