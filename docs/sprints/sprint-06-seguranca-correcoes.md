# Sprint 6 — Segurança & Correções Críticas
**Período:** 14–18 fevereiro 2026  
**Status:** ✅ Concluída

## Objetivo
Corrigir vulnerabilidades identificadas em auditoria, implementar gestão de faltas, suporte a estrangeiros e consolidar migrations.

## O que foi feito

- Refatoração: migração de lógica de negócio para camada de dados
- Ordenação de aulas, refatoração de regex/máscaras
- Correção de idempotência em operações financeiras
- Adição de exclusão de cobranças
- Sincronização de migrations com estado atual do banco
- **2 rounds de correção de bugs críticos** identificados em auditoria de segurança
- Implementação de gestão de faltas
- Cascade delete de pacotes de aulas
- Regeneração de tipos Supabase e correção de parâmetros RPC
- **Suporte a alunos estrangeiros** (campo `country`, remoção de CPF obrigatório)
- Merge para main (PR #6 e PR #7)

## Migrations aplicadas

| Migration | Descrição |
|-----------|-----------|
| `01_structure` | Tabelas base, tipos, extensões, índices |
| `02_logic_and_views` | Views, triggers, funções LGPD |
| `03_rpcs_and_triggers` | RPCs: create_class_package, mark_as_paid, confirm_payment |
| `04_rls_and_permissions` | RLS em todas as tabelas, 40+ policies |

## Commits

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
