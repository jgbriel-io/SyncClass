# Sprint 3 — Qualidade & Infraestrutura
**Período:** 29–30 janeiro 2026  
**Status:** ✅ Concluída

> Sprint intensa — 20+ commits em um único dia.

## Objetivo
Estabelecer infraestrutura de qualidade: CI/CD, soft delete, design tokens, PWA, formatters centralizados e empty states.

## O que foi feito

- **CI/CD:** GitHub Actions com lint + type-check + build + testes
- **Soft delete de alunos:** arquivar em vez de deletar permanentemente
  - `useSoftDeleteStudent()` e `useRestoreStudent()`
  - UI muda de "Deletar" para "Arquivar"
  - Preserva histórico de aulas e cobranças
- **Índices compostos** no banco para performance 10x melhor
- **Design tokens centralizados** (`lib/utils/design-tokens.ts`)
  - Remove 20 cores hardcoded
  - Tokens semânticos: `success`, `destructive`, `warning`
  - Sistema preparado para Dark Mode
- **Formatters centralizados** (`lib/utils/formatters.ts`)
  - Remove 11 duplicações de `formatCurrency`
  - Formatters: currency, date, CPF, phone, percentage
- **Skeletons** (`TableSkeleton`, `DashboardSkeleton`) — elimina CLS
- **PWA** com `vite-plugin-pwa`
  - Logo SVG com identidade visual
  - 8 tamanhos de ícones (72px–512px)
  - Service worker funcional e instalável
- **Empty States** personalizados com ilustrações SVG
  - EmptyStudents, Classes, Financial, History, Search
  - CTAs contextuais por módulo
- **Portal do aluno mobile-first:** `StudentClassCard`, `StudentFinancialCard`, `StudentMetricCard`
- Auditoria de frontend documentada (score 7.0/10)
- Migrations do banco consolidadas
- Edge function `invite-user` (criação de usuário)

## Commits

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
