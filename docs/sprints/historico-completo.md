# Histórico de Desenvolvimento — SyncClass

> Documento retroativo para TCC. Reconstruído a partir do histórico git (branches `homolog-old` e `main`).
>
> **Contexto do gap:** A `main` original tinha ~218 commits. A `homolog-old` preservou 185 commits (até 18/fev). Os ~33 commits restantes (fev–abr 2026) foram perdidos no histórico git durante um reset, mas o **código foi preservado** via `chore: restore full codebase` (21/abr/2026). Este documento reconstrói esse período a partir das migrations, arquivos e docs presentes no código atual.

---

## Linha do Tempo Geral

```
19 jan 2026   → Commit inicial (remix)
19–23 jan     → Sprint 1: Fundação
26–29 jan     → Sprint 2: Autenticação & Usuários
29–30 jan     → Sprint 3: Qualidade & Infraestrutura
31 jan–08 fev → Sprint 4: Features Avançadas
09–13 fev     → Sprint 5: Estabilização & UX
14–18 fev     → Sprint 6: Segurança & Correções Críticas
              → [GAP: ~33 commits perdidos do histórico git]
19 fev–11 mar → Sprint 7: Auditorias, Migrations & Refatoração (reconstruída)
10–11 mar     → Sprint 8: Reestruturação do Projeto (novo repo)
21 abr 2026   → Restore do codebase + organização para TCC
              → Sprint 9: TCC & Pendências (em andamento)
```

---

## Sprint 1 — Fundação
**Período:** 19–23 janeiro 2026
**Commits:** `53d4c41` → `86475d8`
**Status:** ✅ Concluída

### O que foi feito
- Commit inicial a partir de template Remix/Vite
- Organização das relações financeiras no banco
- Vinculação entre aulas e cobranças
- CRUD de pagamentos: criar, editar, novo pagamento
- Regex para valores monetários e datas
- Página de professores (estrutura inicial)
- Schema do banco de dados inicial
- Integração com API de CEP (IBGE) para preenchimento automático de endereço
- Calculadora de valor de aulas
- Detalhes de aluno (primeira versão)

### Commits relevantes
| Hash | Data | Descrição |
|------|------|-----------|
| `53d4c41` | 19/01 | Initial commit from remix |
| `82202e2` | 19/01 | Organize finances relations |
| `6750c32` | 19/01 | Link class and charge |
| `62adcb2` | 19/01 | fix: create payment |
| `6373a99` | 19/01 | feat: regex value amount |
| `7617f6f` | 19/01 | feat: regex date |
| `d16736d` | 20/01 | feat: big changes on frontend/backend |
| `6ce2914` | 20/01 | feat: teachers role |
| `047e10c` | 20/01 | feat: teacher page |
| `0633252` | 26/01 | feat: bd schema |
| `86475d8` | 23/01 | feat: ibge cep api |
| `dc0a119` | 23/01 | feat: value calculator |
| `76c4201` | 23/01 | feat: student details |

---

## Sprint 2 — Autenticação & Usuários
**Período:** 26–29 janeiro 2026
**Commits:** `daaf414` → `ffcb662`
**Status:** ✅ Concluída

### O que foi feito
- Criação de alunos com conta de usuário vinculada
- Criação de professores com role correto no Supabase Auth
- Seleção de professor ao cadastrar aluno
- Fluxo de usuários e datas com máscaras de input
- Campos únicos na criação de usuário (email, telefone)
- Correção de criação automática de profiles ao cadastrar alunos/professores (PR #1)
- Migração de tabelas manuais para componentes shadcn/ui
- Migração de páginas para `PageContainer` e `EmptyState` padronizados
- Criação de views compartilhadas entre admin e professor:
  - `FinancialView` — financeiro unificado
  - `DashboardView` — dashboard compartilhado
  - `ClassesView` — aulas com suporte a tabela (admin) e cards (teacher)
- Integração de formulários completos de aluno e professor na aba Usuários
- Sincronização homolog → main (PR #2)
- Remoção de `.env` do repositório + adição de `.env.example`
- Guia de segurança e rotação de chaves

### Commits relevantes
| Hash | Data | Descrição |
|------|------|-----------|
| `daaf414` | 26/01 | fix: create student |
| `73b51e3` | 27/01 | fix: create teacher with right role |
| `1959e3a` | 27/01 | feat: unique fields for user creation |
| `c491add` | 29/01 | security: remove .env do repositório |
| `4b0917e` | 29/01 | fix: corrige criação automática de profiles |
| `2f57881` | 29/01 | feat: cria FinancialView compartilhado |
| `51d9178` | 29/01 | feat: cria DashboardView compartilhado |
| `b33b14a` | 29/01 | feat: cria ClassesView compartilhado |
| `542f61d` | 29/01 | feat(ui): padroniza componentes e cria guia de UI |
| `c92c8c7` | 29/01 | refactor(ui): migra tabelas para shadcn |
| `f1a35ee` | 29/01 | refactor(ui): migra páginas para PageContainer |
| `14ab585` | 29/01 | feat: integra formulários de aluno e professor |
| `ffcb662` | 29/01 | Merge pull request #2 |

---

## Sprint 3 — Qualidade & Infraestrutura
**Período:** 29–30 janeiro 2026
**Commits:** `43f0213` → `200d63f`
**Status:** ✅ Concluída

### O que foi feito
- CI/CD com GitHub Actions (lint + type-check + build + testes)
- Soft delete de alunos: arquivar em vez de deletar permanentemente
  - Hook `useSoftDeleteStudent()` e `useRestoreStudent()`
  - UI muda de "Deletar" para "Arquivar"
  - Preserva histórico de aulas e cobranças
- Índices compostos no banco para performance 10x melhor
- Design tokens centralizados (`lib/utils/design-tokens.ts`)
  - Remove 20 cores hardcoded
  - Tokens: `success`, `destructive`, `warning`
  - Sistema preparado para Dark Mode
- Formatters centralizados (`lib/utils/formatters.ts`)
  - Remove 11 duplicações de `formatCurrency`
  - Formatters: currency, date, CPF, phone, percentage
- Loading states e skeletons (`TableSkeleton`, `DashboardSkeleton`)
  - Elimina Cumulative Layout Shift (CLS)
- PWA completo com `vite-plugin-pwa`
  - Logo SVG com identidade visual
  - 8 tamanhos de ícones (72px–512px)
  - Service worker funcional e instalável
- Empty States personalizados com ilustrações SVG
  - EmptyStudents, Classes, Financial, History, Search
  - CTAs contextuais por módulo
- Auditoria completa de frontend e UI/UX (score 7.0/10)
  - Identificados 50+ cores hardcoded
  - Problemas de responsividade mobile documentados
- Migrations do banco de dados (estado inicial consolidado)
- Edge function para criação de usuário (`invite-user`)

### Commits relevantes
| Hash | Data | Descrição |
|------|------|-----------|
| `ceb9f89` | 30/01 | feat: implementa CI com GitHub Actions |
| `89bb4a8` | 30/01 | feat: implementa soft delete no frontend |
| `5a6477a` | 30/01 | fix: adiciona índices compostos e soft delete |
| `df17bf5` | 30/01 | feat(P1): centraliza formatters e loading states |
| `e314e38` | 30/01 | feat(P1): integra TableSkeleton em tabelas |
| `fa3fb71` | 30/01 | feat(P1): substitui cores hardcoded por design tokens |
| `e5092c5` | 30/01 | feat(PWA): adiciona vite-plugin-pwa e ícones |
| `659faea` | 30/01 | feat(P0): App View mobile-first para portal do aluno |
| `2be6feb` | 30/01 | feat(P2): Empty States personalizados |
| `200d63f` | 30/01 | feat: db migrations |
| `9a4354a` | 31/01 | feat: edge function on user creation |

---

## Sprint 4 — Features Avançadas
**Período:** 31 janeiro – 08 fevereiro 2026
**Commits:** `6d09289` → `7db810b`
**Status:** ✅ Concluída

### O que foi feito
- Dashboard com gráfico de crescimento (filtros: 1/3/6/12 meses, visão diária)
- Página de histórico do aluno (`StudentHistory`)
- Upload de foto de perfil
- Reset de senha pelo próprio usuário
- Hard delete e soft delete de professores com visual consistente
- Ícone de reativar conta, exclusão definitiva, dialogs padronizados
- Hard delete sincroniza exclusão entre abas alunos e usuários
- Edge function `admin-delete-user` tolerante a registro já removido
- Unificação de `admin-reset-password` e `teacher-reset-password` em `reset-password` única
- Professor pode resetar senha de aluno vinculado
- Fluxo de ativação/reativação de contas
- Logout automático ao mudar senha
- Correção de toast duplicado no contexto de senha
- Remoção de ban/unban do reset-password
- Search bar global
- Validação de email com whitelist de provedores reais
- Rate limiting e verificação de duplicados na criação de usuário
- Cards de previsão de faturamento, financeiro e estatísticas de alunos
- Auditoria e histórico de pagamento para admin
- Cards nas abas usuários/professores para admin
- Unificação de Extrato e Financeiro com timeline
- Card de histórico de aulas

### Commits relevantes
| Hash | Data | Descrição |
|------|------|-----------|
| `6d09289` | 01/02 | feat(dashboard): gráfico de crescimento |
| `1530a06` | 03/02 | feat: student historic page |
| `3532a28` | 01/02 | feat: upload profile pic |
| `240258f` | 02/02 | feat: reset password |
| `68bb98a` | 06/02 | feat: hard delete e visual consistente |
| `71d9c14` | 06/02 | refactor: unifica reset-password |
| `75ff132` | 06/02 | feat: professor pode resetar senha de aluno |
| `4516b99` | 06/02 | feat: usuario resetar a propria senha |
| `19d22ac` | 05/02 | feat: search bar |
| `4ed7965` | 07/02 | feat: cards de previsão de faturamento |
| `2caef87` | 07/02 | feat: auditoria e histórico de pagamento |
| `74d823e` | 08/02 | feat: cards nas abas usuarios/professores |
| `0735220` | 08/02 | Unifica Extrato e Financeiro |
| `7db810b` | 08/02 | feat: card histórico de aulas |

---

## Sprint 5 — Estabilização & UX
**Período:** 09–13 fevereiro 2026
**Commits:** `8544ada` → `c844c80`
**Status:** ✅ Concluída

### O que foi feito
- Responsividade tablet/mobile completa
  - Scroll horizontal nas tabelas com `overflow-x-auto`
  - Títulos/subtítulos e células padronizados
  - UI do estudante mobile-first
- Auditoria de pagamento via modal
- Módulo de atividades professor/aluno
  - Badges de status, UX completa
- Atividades com prazo e admin RLS
- Pacote de aulas (fixo/dinâmico) com financeiro integrado
- QR code para o aluno (pagamento PIX)
- Nota na correção de atividades
- Calendário em datas, paginação e filtros na aba exercícios
- Correção de feedback obrigatório na avaliação
- Correção de status financeiro na aba aulas
- Correção de aulas concluídas/atrasadas sumindo da tabela
- Paginação em 10 itens por página
- 32 testes unitários com Vitest passando
- Design tokens completo com 129 testes (score 9.2)
- Sanitização de conteúdo do usuário finalizada em todo o projeto (DOMPurify)

### Commits relevantes
| Hash | Data | Descrição |
|------|------|-----------|
| `8544ada` | 09/02 | ui: responsividade tablet/mobile |
| `36135ab` | 09/02 | feat(atividades): módulo professor/aluno |
| `e316944` | 10/02 | feat(atividades): nota na correção, calendário |
| `d72ab41` | 11/02 | feat: atividades com prazo e pacote de aulas |
| `0b84ce6` | 11/02 | feat: qr para o aluno |
| `b41532c` | 13/02 | test: 32 testes unitários com Vitest |
| `bfda10a` | 13/02 | feat: design tokens com 129 testes |
| `2b35c36` | 13/02 | security: sanitização de conteúdo finalizada |
| `f73313c` | 13/02 | ui: design tokens, acessibilidade (Score 9.2) |
| `7177757` | 13/02 | ui: componentes atômicos e refinamento UX |
| `08ff0ae` | 13/02 | feat: melhorias em tabelas, filtros e detail sheets |

---

## Sprint 6 — Segurança & Correções Críticas
**Período:** 14–18 fevereiro 2026
**Commits:** `f14024c` → `e4b0e39`
**Status:** ✅ Concluída

### O que foi feito
- Refatoração: migração de lógica de negócio para camada de dados
- Ordenação de aulas, refatoração de regex/máscaras
- Correção de idempotência em operações financeiras
- Adição de exclusão de cobranças
- Sincronização de migrations com estado atual do banco
- Correção de bugs críticos identificados em auditoria de segurança (2 rounds)
- Implementação de gestão de faltas
- Cascade delete de pacotes de aulas
- Regeneração de tipos Supabase e correção de parâmetros RPC
- Suporte a alunos estrangeiros (campo `country`, remoção de CPF obrigatório)
- Merge para main (PR #6 e PR #7)
- Início da branch `dev-teste-white-label` com infraestrutura White-Label

### Migrations aplicadas nesta sprint
| Migration | Descrição |
|-----------|-----------|
| `01_structure` | Tabelas base, tipos, extensões, índices |
| `02_logic_and_views` | Views, triggers, funções LGPD |
| `03_rpcs_and_triggers` | RPCs: create_class_package, mark_as_paid, confirm_payment |
| `04_rls_and_permissions` | RLS em todas as tabelas, 40+ policies |

### Commits relevantes
| Hash | Data | Descrição |
|------|------|-----------|
| `f14024c` | 14/02 | refactor: migração de lógica para camada de dados |
| `5c58f24` | 14/02 | feat: ordenação de aulas, idempotência |
| `4ce9117` | 14/02 | feat: exclusão de cobranças |
| `3f828a7` | 15/02 | feat: sincroniza migrations e corrige bugs críticos |
| `205a4c8` | 16/02 | feat: gestão de faltas, cascade delete |
| `41a2596` | 16/02 | fix: regenera tipos Supabase |
| `919df1c` | 17/02 | fix: corrige riscos críticos (auditoria) |
| `85e76de` | 17/02 | fix: corrige riscos críticos (auditoria) |
| `fce7043` | 17/02 | fix: bugs críticos e melhorias de UX |
| `04cb154` | 17/02 | feat: suporte a alunos estrangeiros |
| `a848106` | 17/02 | Merge pull request #7 |

---

## Sprint 7 — Auditorias, Migrations & Refatoração
**Período:** 19 fevereiro – 11 março 2026
**Status:** ✅ Concluída
> ⚠️ **GAP:** ~33 commits perdidos do histórico git. Reconstruído a partir do código atual (migrations 05–23, docs, arquivos de segurança).

### Migrations de segurança e correção (05–21)
| Migration | Descrição |
|-----------|-----------|
| `05_cpf_removal_and_country` | Remove CPF, adiciona `country`, soft delete em profiles |
| `06_fix_anonymization_functions` | Corrige funções de anonimização após remoção do CPF |
| `07_add_rate_limiting` | Tabela `rate_limit_tracker`, `check_rate_limit()` (10 req/min) |
| `08_add_must_change_password` | Campo `must_change_password` em profiles |
| `09_fix_search_path_security` | `SET search_path` em todas as funções (anti search_path hijacking) |
| `10_security_improvements` | Constraint grade 0–100, soft delete em activities, pgcrypto |
| `11_fix_views_security_invoker` | Views com SECURITY INVOKER, funções de limpeza de storage |
| `12_consistency_improvements` | Validação de email (`is_valid_email`), índices para soft delete |
| `13_encrypt_pix_keys` | View `teachers_with_pix_restricted`, `is_valid_pix_key()` |
| `14_invalidate_sessions_on_deactivate` | Trigger invalida sessões ao desativar conta |
| `15_create_materialized_views` | Materialized views: `activities_dashboard`, `financial_dashboard` |
| `16_fix_payment_proof_rejection` | Fix: aluno pode reenviar comprovante após rejeição |
| `17_fix_rls_policies_uuid_cast` | Cast `::uuid` explícito em policies de profiles e user_roles |
| `18_fix_production_uuid_and_triggers` | Consolida: funções helper + trigger + RLS com cast correto |
| `19_disable_sessions_trigger_temp` | Desabilita trigger de sessões temporariamente |
| `20_confirm_all_users` | Confirma email de todos os usuários (dev/homolog) |
| `21_fix_critical_bugs` | 4 fixes críticos: `is_admin()` SECURITY DEFINER, `validate_financial_logic()`, vincula profiles, sincroniza roles |

### Auditorias realizadas
- Auditoria completa de frontend — 8 bugs identificados (2 críticos, 3 médios, 3 baixos)
- Análise de segurança RLS — 8 vulnerabilidades (3 críticas BOLA/IDOR)
- Auditoria de migrations e histórico de segurança
- Análise DBA do schema — 13 bugs (4 altos, 5 médios, 4 baixos)
- Auditoria de backend e integrações — 7 bugs (1 crítico, 3 altos, 2 médios, 1 baixo)
- Análise de clean code e design patterns — 8 refatorações identificadas

### Novos arquivos criados no gap
| Arquivo | Descrição |
|---------|-----------|
| `src/components/auth/ChangePasswordDialog.tsx` | Modal de troca obrigatória de senha |
| `src/hooks/useActiveUserCheck.ts` | Verificação periódica de status da conta |
| `src/lib/security/errorHandler.ts` | Sanitização de erros (factory pattern) |
| `src/lib/utils/format-phone.ts` | Formatação de telefone |
| `src/lib/utils/storage.ts` | Monitoramento de quota do localStorage |
| `src/lib/utils/testRLS.ts` | Utilitário de teste de RLS |
| `src/lib/validate-phone-platform.ts` | Validação de telefone (substitui validate-cpf-phone) |

### Documentação criada
| Arquivo | Descrição |
|---------|-----------|
| `docs/architecture/overview.md` | Arquitetura completa do sistema |
| `docs/architecture/clean-code.md` | Design patterns e sprint de refatoração |
| `docs/back/integrations-and-scheduling.md` | Integrações e fluxos de backend |
| `docs/back/supabase-cli.md` | Guia de uso do Supabase CLI |
| `docs/back/supabase.md` | Configuração e RPCs do backend |
| `docs/banco/migrations.md` | Sequência e dependências das migrations |
| `docs/banco/schema.md` | Schema completo com análise DBA |
| `docs/front/frontend-audit.md` | Auditoria completa do frontend |
| `docs/security/rls-analysis.md` | Análise de vulnerabilidades RLS |
| `docs/security/security-audit-migrations.md` | Histórico de segurança |
| `docs/security/seguranca.md` | Documentação de segurança geral |

---

## Sprint 8 — Reestruturação do Projeto
**Período:** 10–11 março 2026
**Commits:** `8a21e8e`, `0768405`
**Status:** ✅ Concluída

### O que foi feito
- Criação de novo repositório limpo (`Initial commit - SyncClass`)
  - Renomeação do projeto de `syncclass` para `syncclass`
  - Limpeza do histórico git (reset intencional para organização do TCC)
- Simplificação do onboarding: remoção da troca obrigatória de senha no primeiro acesso
- Configuração de regras do projeto (`.kiro/steering/`)
  - `p-project-context.md` — contexto e stack
  - `p-behavior.md` — comportamento do assistente
  - `p-architecture.md` — padrões arquiteturais

---

## Sprint 9 — Restore & Organização para TCC
**Período:** 21 abril 2026
**Commits:** `efc89d4`, `7f94c85`
**Status:** ✅ Concluída (base) / 🔄 Em andamento (pendências)

### O que foi feito
- Restore completo do codebase (`chore: restore full codebase`)
- Migrations 22 e 23 incluídas:
  - `22_dba_fixes.sql` — 13 correções de banco (índices, constraints, consistência)
  - `23_security_rls_fixes.sql` — 6 correções críticas de RLS (BOLA/IDOR)
- Configuração de MCP servers, skills e hooks do Kiro
- Validação do estado do projeto vs auditorias
- Correção de lint errors

### Pendências identificadas (Sprint 10)
| ID | Severidade | Descrição |
|----|-----------|-----------|
| BUG-FRONT-001 | Alta | `sendDefaultPii: true` no Sentry — envia email do usuário (LGPD) |
| BUG-FRONT-002 | Alta | `useNewStudentsByMonth` carrega todos os registros sem paginação |
| BUG-FRONT-004 | Média | `App.tsx` sem `ErrorBoundary` global |
| BUG-BACK-002 | Alta | Timezone bug em `getDateRangeForPeriod` |
| BUG-BACK-003 | Alta | Timezone bug em `isOverdue` |
| BUG-BACK-004 | Alta | Mistura DATE e TIMESTAMPTZ em `classTime.ts` |
| REFORMA-001 | Alta | Dois `sanitizeErrorMessage` coexistindo com lógica diferente |
| REFORMA-003 | Alta | Detecção de overlap duplicada em 3 hooks |
| REFORMA-008 | Baixa | `gradeSchema` com `max(10)` mas banco aceita 0–100 |

---

## Sprint 10 — Correções & TCC (Planejada)
**Período:** Abril 2026 →
**Status:** 🔄 Em andamento

### Objetivos
- Resolver pendências das auditorias (tabela acima)
- Documentação retroativa completa para TCC
- Definição de metodologia (Kanban via GitHub Projects)
- Testes E2E com Playwright
- Documentação técnica final

---

## Resumo Quantitativo

| Métrica | Valor |
|---------|-------|
| Total de commits (histórico real estimado) | ~218 |
| Commits preservados (homolog-old) | 185 |
| Commits do gap (reconstruídos por inferência) | ~33 |
| Migrations aplicadas | 23 |
| Arquivos no projeto (src/) | ~300+ |
| Testes unitários | 32 (Vitest) + 129 (design tokens) |
| Bugs identificados nas auditorias | 36 |
| Bugs corrigidos (migrations 21–23) | ~20 |
| Bugs pendentes | 9 |
| Edge Functions | 5 |
| Tabelas no banco | 11 principais |
| RLS Policies | 40+ |

