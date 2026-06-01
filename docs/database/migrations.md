# Migrations

Histórico de migrations, sequência de aplicação e dependências.

## Índice

- [Quando usar](#quando-usar)
- [Sequência](#sequência)
- [Dependências críticas](#dependências-críticas)
- [Como aplicar](#como-aplicar)
- [Ver também](#ver-também)

## Quando usar

**Use migrations quando:**

- Criar/alterar tabelas, colunas, constraints
- Criar/alterar funções, triggers, views
- Criar/alterar índices
- Alterar RLS policies

**Não use quando:**

- Inserir dados (usar seeds ou scripts separados)
- Alterar dados existentes (usar data migrations separadas)

## Sequência

Localizadas em `supabase/migrations/`, aplicar em ordem sequencial.

| #   | Arquivo                                         | O que faz                                                                                                                                                     |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | structure                                       | Tabelas base, tipos customizados, extensões, índices                                                                                                          |
| 02  | logic_and_views                                 | Views, triggers de updated_at, funções de anonimização LGPD                                                                                                   |
| 03  | rpcs_and_triggers                               | RPCs: create_class_package, mark_as_paid, confirm_payment, undo_payment                                                                                       |
| 04  | rls_and_permissions                             | RLS habilitado em todas as tabelas, funções helper, 40+ policies                                                                                              |
| 05  | cpf_removal_and_country                         | Remove CPF, adiciona coluna country, soft delete em profiles                                                                                                  |
| 06  | fix_anonymization_functions                     | Corrige funções de anonimização após remoção do CPF                                                                                                           |
| 07  | add_rate_limiting                               | Tabela rate_limit_tracker, função check_rate_limit() (10 req/min)                                                                                             |
| 08  | add_must_change_password                        | Campo must_change_password em profiles                                                                                                                        |
| 09  | fix_search_path_security                        | SET search_path em todas as funções (anti search_path hijacking)                                                                                              |
| 10  | security_improvements                           | Constraint grade 0-100, soft delete em activities, pgcrypto                                                                                                   |
| 11  | fix_views_security_invoker                      | Views com SECURITY INVOKER, funções de limpeza de storage                                                                                                     |
| 12  | consistency_improvements                        | Validação de email (is_valid_email), índices para soft delete                                                                                                 |
| 13  | encrypt_pix_keys                                | View teachers_with_pix_restricted, função is_valid_pix_key()                                                                                                  |
| 14  | invalidate_sessions_on_deactivate               | Trigger invalida sessões ao desativar conta                                                                                                                   |
| 15  | create_materialized_views                       | Materialized views: activities_dashboard, financial_dashboard                                                                                                 |
| 16  | fix_payment_proof_rejection                     | Fix: aluno pode reenviar comprovante após rejeição                                                                                                            |
| 17  | fix_rls_policies_uuid_cast                      | Cast ::uuid explícito em policies de profiles e user_roles                                                                                                    |
| 18  | fix_production_uuid_and_triggers                | Consolida: funções helper + trigger + RLS com cast correto                                                                                                    |
| 19  | disable_sessions_trigger_temp                   | Desabilita trigger de sessões (corrigido em 18, pode ser revertido)                                                                                           |
| 20  | confirm_all_users                               | Confirma email de todos os usuários (usar apenas em dev/homolog)                                                                                              |
| 21  | fix_critical_bugs                               | 4 fixes críticos: is_admin() SECURITY DEFINER, validate_financial_logic() CASE+ELSE, vincula profiles com teachers/students, sincroniza roles                 |
| 22  | dba_fixes                                       | Correções de banco: triggers, funções, constraints identificadas em auditoria DBA                                                                             |
| 23  | security_rls_fixes                              | Correções de segurança e RLS após auditoria (Sprint 16–17)                                                                                                    |
| 24  | incorporate_fixes                               | Incorpora fixes adicionais das auditorias de segurança                                                                                                        |
| 25  | drop_dead_functions                             | Remove funções SQL obsoletas e não utilizadas                                                                                                                 |
| 26  | sprint18_fixes                                  | Correções gerais da Sprint 18 (RLS, triggers, constraints)                                                                                                    |
| 27  | financial_summary_rpc                           | RPC `get_financial_summary` — resumo financeiro consolidado por professor                                                                                     |
| 28  | rate_limit_summary_rpc                          | RPC `get_rate_limit_summary` — monitoramento de rate limits                                                                                                   |
| 29  | class_logs_summary_rpc                          | RPC `get_class_logs_summary` — resumo de aulas com estatísticas de presença                                                                                   |
| 30  | fix_create_class_package_idempotency_race       | Fix: race condition em `create_class_package` com idempotency_keys                                                                                            |
| 31  | confirmed_by_profiles_fk                        | FK `confirmed_by` → `profiles(id)` em financial_records                                                                                                       |
| 32  | fix_rls_ownership_policies                      | Corrige políticas RLS de ownership (teacher vê apenas seus dados)                                                                                             |
| 33  | fix_class_logs_summary_attendance               | Fix: contagem de presença no RPC `get_class_logs_summary`                                                                                                     |
| 34  | fix_class_package_variable_name                 | Fix: nome de variável interno em `create_class_package`                                                                                                       |
| 35  | sprint24_rls_audit_fixes                        | Correções de RLS da auditoria Sprint 24 (políticas ausentes ou incorretas)                                                                                    |
| 36  | sprint25_db_schema_fixes                        | Correções de schema da Sprint 25 (tipos, constraints, defaults)                                                                                               |
| 37  | sprint27_revoke_anon_and_indexes                | Revoga permissões da role `anon` em tabelas protegidas; adiciona índices compostos                                                                            |
| 38  | sprint_remaining_fixes                          | Correções remanescentes das sprints (fixes menores pós-auditoria)                                                                                             |
| 39  | fix_security_definer_grants                     | Garante GRANT correto em funções com SECURITY DEFINER                                                                                                         |
| 40  | fix_explicit_role_grants                        | Grants explícitos por role (authenticated, anon) em funções e views                                                                                           |
| 41  | fix_avatars_bucket_listing_policy               | Corrige política de listagem do bucket `avatars` no Storage                                                                                                   |
| 42  | fix_students_rls_duplicate_policies             | Remove políticas RLS duplicadas na tabela `students`                                                                                                          |
| 43  | fix_students_rls_merge_admin_into_policies      | Unifica policies de admin com as policies gerais em `students` (simplifica RLS)                                                                               |
| 44  | drop_unused_materialized_views                  | Remove materialized views não utilizadas (activities_dashboard, financial_dashboard de migration 15)                                                          |
| 45  | unify_drop_user_roles                           | Drop da tabela `user_roles`; role consolidado em `profiles.role` como fonte de verdade única                                                                  |
| 46  | fix_normalize_phone                             | Corrige função de normalização de telefone (strip de formatação, aceita formatos internacionais)                                                              |
| 47  | fix_get_student_id_lookup_via_profile           | Reescreve `get_student_id()`: body anterior comparava `students.id = auth.uid()` (nunca coincidem) → corrigido para `profiles WHERE user_id = auth.uid()`     |
| 48  | fix_sanitize_html_function                      | Recria `sanitize_html(text)` com `regexp_replace` — função tinha sido removida em migration anterior, bloqueando UPDATE em class_logs                         |
| 49  | fix_invalidate_sessions_refresh_tokens_cast     | Corrige trigger `invalidate_user_sessions_before`: cast `NEW.user_id::text` para comparar com `auth.refresh_tokens.user_id` (varchar)                         |
| 50  | fix_allow_future_class_dates                    | Remove validação `class_date > CURRENT_DATE` do trigger `validate_class_log_data` — bloqueava criação de aulas agendadas                                      |
| 51  | fix_get_teacher_id_and_get_student_id_text_cast | Adiciona `::text` cast em `get_teacher_id()` e `get_student_id()`: `user_id = auth.uid()` sem cast retornava NULL silenciosamente                             |
| 52  | fix_is_teacher_is_admin_correct_profiles_lookup | Reescreve `is_teacher()` (body errado: `FROM teachers WHERE id = auth.uid()`) e `is_admin()` (sem cast). RLS do professor 100% quebrado                       |
| 53  | add_admin_update_auth_display_name_rpc          | RPC `admin_update_auth_display_name(user_id, full_name)`: atualiza `auth.users.raw_user_meta_data.full_name` via SECURITY DEFINER (admin only)                |
| 54  | add_teacher_sync_student_display_name_rpc       | RPC `teacher_sync_student_display_name(student_id, name)`: sincroniza `profiles.full_name` + `auth.users` metadata para alunos; valida ownership do professor |
| 55  | fix_anonymized_names_alphanumeric               | Backfill de nomes anonimizados (`Aluno/Professor XXXXXXXX`) para garantir padrão alfanumérico — `id.slice(0,8)` podia gerar segmentos all-digits              |
| 56  | add_admin_update_auth_email_rpc                 | RPC `admin_update_auth_email(user_id, email)`: atualiza `auth.users.email` + `email_confirmed_at` via SECURITY DEFINER (admin only)                           |
| 57  | add_user_update_own_email_rpc                   | RPC `user_update_own_email(email)`: aluno/admin atualiza próprio email sem trigger de confirmação Supabase; atualiza `auth.users` + `profiles.email`          |
| 58  | financial_validando_status                      | Adiciona `validando` aos constraints de `financial_records.status`; atualiza `submit_payment_proof` para setar `status = 'validando'` atomicamente            |

## Dependências críticas

**04 depende de 02:**

- 04 cria RLS policies que usam funções helper criadas em 02
- Sem 02, 04 falha com "function does not exist"

**07 depende de 03:**

- 07 atualiza RPCs criadas em 03 para adicionar rate limiting
- Sem 03, 07 falha com "function does not exist"

**14 depende de 04:**

- 14 cria trigger em `profiles` que depende de RLS habilitado em 04
- Sem 04, 14 pode causar recursão infinita

**17 e 18 corrigem bugs introduzidos em 04:**

- 04 criou policies com cast UUID incorreto
- 17 e 18 corrigem essas policies
- Sem 17/18, queries em `profiles` e `user_roles` falham com "invalid input syntax for type uuid"

**21 deve ser aplicada após 04 e 10:**

- 21 corrige bugs introduzidos em 04 (is_admin() sem SECURITY DEFINER)
- 21 corrige bugs introduzidos em 10 (validate_financial_logic() sem ELSE)
- Sem 21, RLS causa recursão infinita e HTTP 500

## Como aplicar

### Aplicar todas as migrations pendentes

```bash
npx supabase db push
```

### Aplicar arquivo específico

```bash
npx supabase db execute --file supabase/migrations/21_fix_critical_bugs.sql
```

### Verificar migrations aplicadas

```bash
npx supabase db list-migrations
```

### Criar nova migration

```bash
npx supabase migration new nome_da_migration
```

## Ver também

- [Database Overview](./overview.md) — Visão geral do banco
- [Schema](./schema.md) — Tabelas e relacionamentos
- [RLS](./rls.md) — Row Level Security
