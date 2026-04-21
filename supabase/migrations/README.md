# Migrations

Aplicar em ordem sequencial. Cada migration depende das anteriores.

## Estrutura base (01-04)
- 01_structure - Tabelas, tipos, extensões, índices
- 02_logic_and_views - Views, triggers de updated_at, funções de anonimização (LGPD)
- 03_rpcs_and_triggers - RPCs (create_class_package, mark_as_paid, confirm_payment, undo_payment)
- 04_rls_and_permissions - RLS habilitado, funções helper (is_admin, is_teacher, is_student), 40+ policies

## Melhorias (05-16)
- 05_cpf_removal_and_country - Remove CPF, adiciona country, soft delete em profiles
- 06_fix_anonymization_functions - Corrige funções de anonimização (remove refs a CPF)
- 07_add_rate_limiting - Rate limiting (10 req/min), tabela rate_limit_tracker
- 08_add_must_change_password - Campo must_change_password em profiles
- 09_fix_search_path_security - SET search_path em todas as funções (anti-hijacking)
- 10_security_improvements - Constraint notas 0-100, soft delete activities, pgcrypto
- 11_fix_views_security_invoker - Views com SECURITY INVOKER, limpeza de storage
- 12_consistency_improvements - Validação de email, índices para soft delete
- 13_encrypt_pix_keys - View teachers_with_pix_restricted, is_valid_pix_key()
- 14_invalidate_sessions_on_deactivate - Trigger invalida sessões ao desativar conta
- 15_create_materialized_views - Materialized views (activities_dashboard, financial_dashboard)
- 16_fix_payment_proof_rejection - Fix: aluno pode reenviar comprovante após rejeição

## Correções de produção (17-20)
- 17_fix_rls_policies_uuid_cast - Cast ::uuid explícito em policies de profiles/user_roles
- 18_fix_production_uuid_and_triggers - Consolidação: funções helper + trigger + RLS com cast
- 19_disable_sessions_trigger_temp - Desabilita trigger de sessões (temporário, corrigido em 18)
- 20_confirm_all_users - Confirma email de todos os usuários (dev/homolog)

## Correções críticas (21)
- 21_fix_critical_bugs - 4 fixes críticos:
  1. is_admin() com SECURITY DEFINER (evita recursão infinita)
  2. validate_financial_logic() com CASE+ELSE (evita "case not found")
  3. Vincula profiles.teacher_id/student_id por email
  4. Sincroniza roles entre profiles e user_roles

## Notas
- Gaps nos números originais (05-11, 24-29, 31-35, 38-41) foram consolidados nas migrations renomeadas
- A pasta `fixes/` contém os scripts originais antes da consolidação
- Migration 19 desabilita trigger que foi corrigido em 18 - pode ser revertida após confirmar 18 funcionando
