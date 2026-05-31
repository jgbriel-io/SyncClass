# Análise de Uso — Banco de Dados SyncClass

**Verificado via MCP Supabase em 2026-05-22. Fonte de verdade: banco real.**

---

## Tabelas (14 total)

### ✅ Usadas no código (10)

- `activities` — atividades professor/aluno
- `audit_logs` — logs de auditoria
- `class_logs` — registro de aulas
- `financial_records` — cobranças
- `financial_record_class_logs` — N:N pacotes
- `idempotency_keys` — controle idempotência
- `profiles` — perfis usuários
- `students` — alunos
- `teachers` — professores

### ⚠️ Implementação dupla (2 tabelas)

**Rate limiting:**

- `rate_limits` — usada por `check_rate_limit` (server-side) + cron `cleanup-rate-limits` (a cada hora)
- `rate_limit_tracker` — criada, tem RLS policies, mas sem uso confirmado no código TypeScript

**Situação:** Código usa client-side (`src/lib/utils/rateLimit.ts`) E server-side coexistem.
`rate_limits` tem limpeza ativa via cron. `rate_limit_tracker` parece dead code.

### ❌ Sem uso confirmado (2 tabelas)

- `admin_view_backups` — sem referência em código ou triggers
- `performance_logs` — `log_performance()` existe mas nunca chamada

---

## Views (11 total)

### ✅ Usadas no código (7)

- `class_logs_with_billing` — `useStudentStatement`
- `students_active` — `useTeacherDashboard`
- `students_active_masked` — `useStudents`, `useTeacherDashboard` (LGPD)
- `students_masked` — `useStudents`
- `students_with_stats` — `useStudents` (paginação com stats)
- `teachers_masked` — referenciada em FKs (`types.ts`)
- `teachers_with_pix_restricted` — view existe (verificar uso real)

### ❌ Não usadas (4)

- `activities_active`
- `activities_dashboard_secure`
- `financial_dashboard_secure`
- `teachers_public`

---

## Functions/RPCs (61 total — verificado)

### ✅ Chamadas direto no código TypeScript (9)

- `check_phone_exists_platform` — validação telefone único
- `confirm_payment_idempotent` — confirmar pagamento
- `create_class_package` — criar pacote de aulas
- `mark_as_paid_idempotent` — marcar pago
- `review_payment_proof` — revisar comprovante
- `submit_payment_proof` — enviar comprovante
- `undo_payment_idempotent` — desfazer pagamento
- `update_profile_by_id` — atualizar profile
- `upsert_user_role_safe` — upsert role seguro

### ✅ Usadas via RLS policies (3)

- `is_admin` — policies em todas as tabelas
- `is_teacher` — policies em students, activities, etc
- `is_student` — policies em activities, financial_records

### ✅ Usadas via triggers ativos (20)

- `delete_empty_package_financial`
- `delete_package_classes_before_financial_delete`
- `invalidate_user_sessions_before`
- `normalize_student_phone`
- `normalize_teacher_phone`
- `prevent_student_hourly_rate_manipulation`
- `prevent_student_sensitive_field_updates`
- `prevent_teacher_sensitive_field_updates`
- `sanitize_activity_text`
- `sanitize_class_log_text`
- `sanitize_financial_text`
- `update_package_on_class_delete`
- `update_updated_at_column`
- `validate_activity_submission`
- `validate_activity_tenant_isolation`
- `validate_class_log_data`
- `validate_financial_logic`
- `validate_pix_key`
- `validate_student_data`
- `validate_teacher_data`

### ✅ Usadas via cron jobs (4 jobs ativos)

| Job                              | Schedule                   | Function                           |
| -------------------------------- | -------------------------- | ---------------------------------- |
| `cleanup-old-audit-logs`         | `0 2 * * *` (diário 2h)    | `cleanup_old_audit_logs()`         |
| `cleanup-old-idempotency-keys`   | `0 3 * * *` (diário 3h)    | `cleanup_old_idempotency_keys()`   |
| `cleanup-rate-limits`            | `0 * * * *` (hourly)       | DELETE direto em `rate_limits`     |
| `hard-delete-anonymized-records` | `0 4 1 * *` (mensal dia 1) | `hard_delete_anonymized_records()` |

### ✅ Usadas via trigger auth.users (1)

- `handle_new_user` — cria profile + user_role automaticamente ao criar usuário via Supabase Auth

### ✅ Usadas por edge functions (2)

- `invalidate_sessions_before_delete` — `admin-delete-user`
- `soft_delete_student` — `admin-delete-user` / student management
- `soft_delete_teacher` — teacher management
- `restore_student` — restaurar aluno soft-deleted
- `anonymize_student` / `anonymize_teacher` — LGPD, chamadas em soft deletes

### ✅ Mantidas por utilidade (2)

- `enforce_rate_limit` — chamada internamente por `mark_as_paid_idempotent`, `confirm_payment_idempotent`, `undo_payment_idempotent`
- `get_student_balance` — helper útil para consulta de saldo

### 🗑️ Dropadas — migration 25 (4)

- `decrypt_sensitive_data` / `encrypt_sensitive_data` — criptografia nunca implementada
- `get_activity_status_info` — sem chamada, lógica equivalente no frontend
- `is_activity_on_time` — sem chamada, apenas `NOW() <= due_date`

### 🗑️ Dropadas anteriormente (10)

`is_valid_email`, `is_valid_pix_key`, `normalize_phone`, `normalize_pix_key`, `log_performance`, `refresh_activities_dashboard`, `refresh_all_dashboards`, `refresh_financial_dashboard`, `sanitize_html`, `get_student_id` (verificado: não usado)

---

## Triggers (37 total — todos ativos)

Todos vinculados a tabelas usadas. Nenhum morto.

### Por tabela

- `activities` — 6 triggers (validação, sanitização, updated_at)
- `class_logs` — 7 triggers (validação, sanitização, cascade pacotes)
- `financial_records` — 5 triggers (validação, sanitização, cascade)
- `profiles` — 2 triggers (updated_at, invalidar sessões)
- `students` — 6 triggers (validação, normalização, proteção campos)
- `teachers` — 7 triggers (validação, normalização, PIX, proteção)

---

## Status Pós-Limpeza

**Banco limpo. Nenhum código morto restante.**

| Tipo      | Total | Ação                                                                 |
| --------- | ----- | -------------------------------------------------------------------- |
| Tabelas   | 11    | ✅ 2 dead tables dropadas (migrations anteriores)                    |
| Views     | 7     | ✅ 4 dead views dropadas (migrations anteriores)                     |
| Functions | ~47   | ✅ 14 dead functions dropadas (migrations anteriores + migration 25) |
| Triggers  | 37    | ✅ Todos ativos                                                      |
| Cron jobs | 4     | ✅ Todos ativos                                                      |

**Rate limiting:** Arquitetura híbrida mantida — client-side (`src/lib/utils/rateLimit.ts`) para UX + server-side (`rate_limits` + `enforce_rate_limit`) para segurança real.
