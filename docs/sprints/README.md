# Sprints — Documentação Oficial

**Última Atualização:** 2026-05-26

## Contexto

Sprints documentam desenvolvimento incremental do SyncClass. Cada sprint = conjunto de features/refatorações implementadas em período específico.

**Características:**

- Documentação retroativa (escrita após implementação)
- Validada contra commits reais (97.8% evidência)
- Estrutura padronizada (Problem → Requirements → Tasks → Results)
- Foco em decisões técnicas e lições aprendidas

**Quando usar:**

- Entender evolução de feature específica
- Ver decisões técnicas e trade-offs
- Aprender com lições (o que funcionou, o que melhorar)
- Referência para Cap8 (Gestão de Projeto)

---

## Histórico de Desenvolvimento

| Sprint    | Período            | Foco                                                     | Status          | Arquivo                                                             |
| --------- | ------------------ | -------------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| Sprint 1  | 19–23 jan 2026     | MVP: CRUD Básico & Financeiro                            | ✅ Implementada | [sprint-01](./sprint-01-mvp-crud-basico-financeiro.md)              |
| Sprint 2  | 26–29 jan 2026     | MVP: Auth, Roles & Profiles                              | ✅ Implementada | [sprint-02](./sprint-02-mvp-auth-roles-profiles.md)                 |
| Sprint 3  | 29–30 jan 2026     | MVP: CI, Soft Delete & Design Tokens                     | ✅ Implementada | [sprint-03](./sprint-03-mvp-ci-soft-delete-design-tokens.md)        |
| Sprint 4  | 31 jan–08 fev 2026 | MVP: Dashboard, Histórico & Reset Senha                  | ✅ Implementada | [sprint-04](./sprint-04-mvp-dashboard-historico-reset-senha.md)     |
| Sprint 5  | 09–13 fev 2026     | MVP: Mobile, Atividades, Pacotes & PIX                   | ✅ Implementada | [sprint-05](./sprint-05-mvp-mobile-atividades-pacotes-pix.md)       |
| Sprint 6  | 14–18 fev 2026     | MVP: Idempotência, Faltas & Estrangeiros                 | ✅ Implementada | [sprint-06](./sprint-06-mvp-idempotencia-faltas-estrangeiros.md)    |
| Sprint 7  | 19 fev–11 mar 2026 | MVP: Hardening, RLS & Rate Limit                         | ✅ Implementada | [sprint-07](./sprint-07-mvp-hardening-rls-rate-limit.md)            |
| Sprint 8  | 11 mar–21 abr 2026 | Refactor: Supabase/Hooks Separation                      | ✅ Implementada | [sprint-08](./sprint-08-refactor-supabase-hooks-separation.md)      |
| Sprint 9  | 21 abr 2026        | Refactor: Split Large Files                              | ✅ Implementada | [sprint-09](./sprint-09-refactor-split-large-files.md)              |
| Sprint 10 | 21 abr 2026        | Refactor: Remove Duplicate Queries                       | ✅ Implementada | [sprint-10](./sprint-10-refactor-remove-duplicate-queries.md)       |
| Sprint 11 | 21 abr 2026        | Fix: Timezone & Error Boundary                           | ✅ Implementada | [sprint-11](./sprint-11-fix-timezone-error-boundary.md)             |
| Sprint 12 | 21 abr–20 mai 2026 | Refactor: Content Structure (I18n Prep)                  | ✅ Implementada | [sprint-12](./sprint-12-refactor-content-structure-i18n-prep.md)    |
| Sprint 13 | 20 mai 2026        | Refactor: Centralize UI Strings                          | ✅ Implementada | [sprint-13](./sprint-13-refactor-centralize-ui-strings.md)          |
| Sprint 14 | 20 mai 2026        | Refactor: Remove Hardcoded Strings                       | ✅ Implementada | [sprint-14](./sprint-14-refactor-remove-hardcoded-strings.md)       |
| Sprint 15 | 20 mai 2026        | Refactor: Final String Audit                             | ✅ Implementada | [sprint-15](./sprint-15-refactor-final-string-audit.md)             |
| Sprint 16 | 21 mai 2026        | Refactor: Docs Architecture Organization                 | ✅ Implementada | [sprint-16](./sprint-16-refactor-docs-architecture-organization.md) |
| Sprint 17 | 21 mai 2026        | Refactor: TCC Documentation Review                       | ✅ Implementada | [sprint-17](./sprint-17-refactor-tcc-documentation-review.md)       |
| Sprint 18 | 22 mai 2026        | Consolidação & Code Review                               | ✅ Implementada | [sprint-18](./sprint-18-consolidacao-problemas-identificados.md)    |
| Sprint 19 | 22–23 mai 2026     | Security: LGPD Anonymization + Rate Limiting             | ✅ Implementada | [sprint-19](./sprint-19-lgpd-rate-limiting.md)                      |
| Sprint 20 | 23–25 mai 2026     | Feature: LGPD Export + Rate Limit Dashboard              | ✅ Implementada | [sprint-20](./sprint-20-lgpd-export-rate-limit-dashboard.md)        |
| Sprint 21 | 24 mai 2026        | Refactor: Tech Debt Backlog (pós-MVP)                    | ✅ Implementada | [sprint-21](./sprint-21-tech-debt-backlog.md)                       |
| Sprint 22 | 25 mai 2026        | Fix: Frontend Quality (code review)                      | ✅ Implementada | [sprint-22](./sprint-22-frontend-quality-fixes.md)                  |
| Sprint 23 | 25 mai 2026        | Fix: Backend Quality (code review)                       | ✅ Implementada | [sprint-23](./sprint-23-backend-quality-fixes.md)                   |
| Sprint 24 | 25 mai 2026        | Security: RLS Full Audit                                 | ✅ Implementada | [sprint-24](./sprint-24-rls-audit.md)                               |
| Sprint 25 | 25 mai 2026        | DB: Database Structural Analysis                         | ✅ Implementada | [sprint-25](./sprint-25-database-analysis.md)                       |
| Sprint 26 | 25 mai 2026        | Security: Full Security Audit                            | ✅ Implementada | [sprint-26](./sprint-26-security-audit.md)                          |
| Sprint 27 | 25 mai 2026        | Security: Supabase Advisors + npm audit                  | ✅ Implementada | [sprint-27](./sprint-27-supabase-advisors.md)                       |
| Sprint 28 | 26 mai 2026        | QA: Testes Manuais — 214 itens, 20 rotas                 | 🟡 Em andamento | [sprint-28](./sprint-28-testes-manuais.md)                          |
| Sprint 29 | 31 mai 2026        | Fix: Correções do painel admin e propagação entre visões | ✅ Implementada | [sprint-29](./sprint-29-fix-correcoes-painel-admin.md)              |
| Sprint 30 | 01 jun 2026        | Feature: AbacatePay Integration (PIX Automático)         | ✅ Implementada | [sprint-30](./sprint-30-abacatepay-integration.md)                  |
| Sprint 31 | 01 jun 2026        | Fix: Correções encontradas durante QA — teachers         | ✅ Implementada | [sprint-31](./sprint-31-fix-qa-teachers.md)                         |

**Resumo:**

- **Implementadas:** 31 sprints (1–31) — desenvolvimento concluído
- **Total:** 31 sprints documentadas

---

## Organização por Tipo

### MVP (Sprints 1–7)

Features principais do produto. CRUD, auth, financeiro, atividades, segurança.

### Refactor (Sprints 8–17)

Melhorias de código. Separação de responsabilidades, remoção de duplicação, centralização de strings, organização de docs.

### Fix (Sprints 11, 22, 23, 29, 31)

Correções críticas. Timezone, error boundary, code review frontend/backend, painel admin, QA teachers.

### Security + Compliance (Sprints 19–20, 24–27)

LGPD anonymization, rate limiting server-side, exportação de dados, dashboard de monitoramento, RLS audit, DB analysis, security audit, Supabase advisors.

### Feature (Sprint 30)

Integração AbacatePay — pagamento PIX automático, webhook, reembolso.

---

## Sprints Não Implementadas

Features planejadas mas fora do escopo do TCC. Documentadas para extensão futura.

| Foco                                                                                              | Arquivo                                                              |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Notificações em tempo real                                                                        | [sprint-notificacoes](./sprint-notificacoes-NAO-IMPLEMENTADA.md)     |
| Exportação de relatórios em PDF                                                                   | [sprint-exportacao-pdf](./sprint-exportacao-pdf-NAO-IMPLEMENTADA.md) |
| ~~Integração com pagamento real (Stripe/Pix API)~~ — **Implementado via AbacatePay na Sprint 30** | ✅ Implementado                                                      |
| Gamificação do portal do aluno                                                                    | [sprint-gamificacao](./sprint-gamificacao-NAO-IMPLEMENTADA.md)       |

---

## Validação de Hipóteses do TCC

| Hipótese                                    | Sprints Relacionadas | Evidência                                                                                                 | Status      |
| ------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| **H1:** SaaS solo com IA em prazo acadêmico | 01–31 (todas)        | 152 commits, 31 sprints, 4,5 meses, 1 desenvolvedor                                                       | ✅ Validada |
| **H2:** Supabase reduz ≥60% esforço backend | 01, 02, 07           | 70 migrations SQL (sprint 07 tinha 23); RLS elimina middleware de auth; sem servidor de aplicação próprio | ✅ Validada |
| **H3:** Unificação reduz tarefas manuais    | 04, 05, 12–15        | Portal unificado (aluno + professor); i18n prep centraliza 170+ strings                                   | ✅ Validada |

### Detalhamento por Hipótese

**H1 — Produtividade com IA:**

- Sprints 01–07: MVP completo em ~30 dias (19/jan–18/fev)
- Sprints 08–11: Refactoring + fixes em ~2 meses (mar–abr)
- Sprints 12–15: Centralização de strings em 1 dia (20/mai)
- Assistência de IA (Claude, Anthropic) em 100% das sprints

**H2 — Supabase como BaaS:**

- Sprint 01: Schema inicial + RLS em 5 dias vs ~2 semanas para backend tradicional
- Sprint 02: Auth por role em 4 dias (Supabase Auth + policies)
- Sprint 07: 17 migrations de segurança (RLS, triggers, RPCs) — complexidade gerenciada pelo Supabase

**H3 — Unificação de Plataforma:**

- Sprint 04: Dashboard unificado (métricas de alunos, aulas, financeiro)
- Sprint 05: Portal do aluno (histórico, financeiro, atividades em 1 lugar)
- Sprints 12–15: Estrutura `src/content/` prepara i18n sem duplicação

---

## Referências

- **Banco de dados:** `docs/database/analise-banco.md` — tabelas, views, functions ativas
