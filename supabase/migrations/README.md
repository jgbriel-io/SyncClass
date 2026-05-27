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

## Pós-refatoração (22–29)

- 22_dba_fixes - Correções de DBA: constraints, índices, funções
- 23_security_rls_fixes - RLS: fix policies de segurança
- 24_incorporate_fixes - Incorpora fixes acumulados
- 25_drop_dead_functions - Remove funções mortas/obsoletas
- 26_sprint18_fixes - Fixes do Sprint 18 (LGPD, rate limiting)
- 27_financial_summary_rpc - RPC: resumo financeiro por professor
- 28_rate_limit_summary_rpc - RPC: dashboard de rate limiting
- 29_class_logs_summary_rpc - RPC: resumo de aulas por aluno

## Qualidade e idempotência (30–34)

- 30_fix_create_class_package_idempotency_race - Fix race condition em pacotes de aulas
- 31_confirmed_by_profiles_fk - FK confirmed_by → profiles
- 32_fix_rls_ownership_policies - Fix policies de ownership (teacher_id)
- 33_fix_class_logs_summary_attendance - Fix presença no resumo de aulas
- 34_fix_class_package_variable_name - Fix nome de variável em create_class_package

## Auditoria RLS e banco (35–36)

- 35_sprint24_rls_audit_fixes - Sprint 24: correções da auditoria RLS completa
- 36_sprint25_db_schema_fixes - Sprint 25: análise estrutural do banco (constraints, índices)

## Segurança final (37–43)

- 37_sprint27_revoke_anon_and_indexes - Revoga permissões de anon, índices de performance
- 38_sprint_remaining_fixes - Fixes remanescentes de segurança
- 39_fix_security_definer_grants - Corrige GRANTS em funções SECURITY DEFINER
- 40_fix_explicit_role_grants - GRANTS explícitos por role (authenticated, service_role)
- 41_fix_avatars_bucket_listing_policy - Policy de listagem do bucket de avatares
- 42_fix_students_rls_duplicate_policies - Remove policies RLS duplicadas em students
- 43_fix_students_rls_merge_admin_into_policies - Consolida policies de admin em students

## Notas

- Total: 43 migrations aplicadas em ordem sequencial
- Migration 19 desabilita trigger corrigido em 18 — pode ser revertida após confirmar estabilidade
- Todas as migrations têm RLS habilitado nas tabelas afetadas
