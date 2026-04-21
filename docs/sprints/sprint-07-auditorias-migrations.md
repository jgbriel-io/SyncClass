# Sprint 7 — Auditorias, Migrations & Refatoração
**Período:** 19 fevereiro – 11 março 2026  
**Status:** ✅ Concluída

> ⚠️ ~33 commits perdidos do histórico git. Reconstruído a partir do código atual (migrations 05–21, docs, arquivos).

## Objetivo
Hardening de segurança com 17 migrations, 6 auditorias técnicas e documentação completa do sistema.

## O que foi feito

### Migrations de segurança (05–21)

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
| `21_fix_critical_bugs` | `is_admin()` SECURITY DEFINER, `validate_financial_logic()`, vincula profiles, sincroniza roles |

### Auditorias realizadas

| Auditoria | Bugs encontrados |
|-----------|-----------------|
| Frontend completo | 8 (2 críticos, 3 médios, 3 baixos) |
| Segurança RLS | 8 (3 críticas BOLA/IDOR) |
| Migrations e histórico de segurança | — |
| DBA do schema | 13 (4 altos, 5 médios, 4 baixos) |
| Backend e integrações | 7 (1 crítico, 3 altos, 2 médios, 1 baixo) |
| Clean code e design patterns | 8 refatorações identificadas |

### Novos arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/auth/ChangePasswordDialog.tsx` | Modal de troca obrigatória de senha |
| `src/hooks/useActiveUserCheck.ts` | Verificação periódica de status da conta |
| `src/lib/security/errorHandler.ts` | Sanitização de erros (factory pattern) |
| `src/lib/utils/format-phone.ts` | Formatação de telefone internacional |
| `src/lib/utils/storage.ts` | Monitoramento de quota do localStorage |
| `src/lib/validate-phone-platform.ts` | Validação de telefone (substitui validate-cpf-phone) |

### Documentação criada

| Arquivo | Descrição |
|---------|-----------|
| `docs/architecture/overview.md` | Arquitetura completa do sistema |
| `docs/architecture/clean-code.md` | Design patterns e sprint de refatoração |
| `docs/back/integrations-and-scheduling.md` | Integrações e fluxos de backend |
| `docs/banco/schema.md` | Schema completo com análise DBA |
| `docs/front/frontend-audit.md` | Auditoria completa do frontend |
| `docs/security/rls-analysis.md` | Análise de vulnerabilidades RLS |
