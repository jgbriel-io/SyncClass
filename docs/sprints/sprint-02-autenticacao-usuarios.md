# Sprint 2 — Autenticação & Usuários
**Período:** 26–29 janeiro 2026  
**Status:** ✅ Concluída

## Objetivo
Implementar autenticação por role, criação de contas vinculadas, views compartilhadas entre admin e professor, e padronização de UI com shadcn/ui.

## O que foi feito

- Criação de alunos com conta de usuário vinculada
- Criação de professores com role correto no Supabase Auth
- Seleção de professor ao cadastrar aluno
- Fluxo de usuários e datas com máscaras de input
- Campos únicos na criação de usuário (email, telefone)
- Correção de criação automática de profiles ao cadastrar alunos/professores (PR #1)
- Migração de tabelas manuais para componentes shadcn/ui
- Migração de páginas para `PageContainer` e `EmptyState` padronizados
- Views compartilhadas entre admin e professor:
  - `FinancialView` — financeiro unificado
  - `DashboardView` — dashboard compartilhado
  - `ClassesView` — aulas com suporte a tabela (admin) e cards (teacher)
- Integração de formulários completos de aluno e professor na aba Usuários
- Remoção de `.env` do repositório + adição de `.env.example`
- Guia de segurança e rotação de chaves

## Commits

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
