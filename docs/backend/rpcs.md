# RPCs, Triggers e Views

Operações complexas no banco via RPCs, triggers automáticos e views otimizadas.

## Índice

- [Quando usar](#quando-usar)
- [RPCs principais](#rpcs-principais)
- [Triggers ativos](#triggers-ativos)
- [Views](#views)
- [Materialized Views](#materialized-views) _(removidas — ver nota)_
- [RPCs adicionais](#rpcs-adicionais)
- [Ver também](#ver-também)

## Quando usar

**Use RPC quando:**

- Operação complexa (múltiplas queries, transação atômica)
- Lógica de negócio no banco (validação, cálculo)
- Performance crítica (evitar N+1 queries)
- Idempotência (operações financeiras)

**Use Trigger quando:**

- Ação automática em INSERT/UPDATE/DELETE
- Validação antes de salvar (BEFORE trigger)
- Auditoria/log após salvar (AFTER trigger)
- Atualizar campos derivados (updated_at, totais)

**Use View quando:**

- Query complexa reutilizada em múltiplos lugares
- Agregação de dados (totais, estatísticas)
- Simplificar queries do frontend
- Ocultar colunas sensíveis (LGPD)

## RPCs principais

### create_class_package

**Responsabilidade:** Criar pacote de aulas (múltiplas aulas + cobrança) em transação atômica.

**Arquivo:** `supabase/migrations/14_class_packages.sql`

**Assinatura:**

```sql
create_class_package(
  p_teacher_id UUID,
  p_student_id UUID,
  p_classes JSONB,      -- array de { class_date, start_at, end_at, title, notes }
  p_financial JSONB     -- { amount, due_date, payment_method, notes }
) RETURNS JSONB
```

**Fluxo:**

1. Valida que todas as aulas são do mesmo professor e aluno
2. Insere todas as aulas em `class_logs`
3. Insere cobrança em `financial_records`
4. Vincula aulas à cobrança via `financial_record_class_logs`
5. Retorna `{ package_id, class_ids, financial_record_id }`

**Rollback:** Se qualquer passo falha, toda a transação é revertida.

**Chamada:**

```ts
const { data, error } = await supabase.rpc("create_class_package", {
  p_teacher_id: teacherId,
  p_student_id: studentId,
  p_classes: [
    {
      class_date: "2026-05-25",
      start_at: "2026-05-25T10:00:00Z",
      end_at: "2026-05-25T11:00:00Z",
      title: "Aula 1",
    },
    {
      class_date: "2026-05-27",
      start_at: "2026-05-27T10:00:00Z",
      end_at: "2026-05-27T11:00:00Z",
      title: "Aula 2",
    },
  ],
  p_financial: { amount: 100, due_date: "2026-06-05", payment_method: "pix" },
});
```

### mark_as_paid_idempotent

> **Nota Sprint 30:** Com a integração AbacatePay, pagamentos são confirmados automaticamente via webhook (`abacate-webhook` Edge Function → `UPDATE status='pago'`). Esta RPC continua existindo no banco mas não é mais o caminho primário para cobranças `payment_provider='abacate_pay'`.

**Responsabilidade:** Marcar cobrança como paga (idempotente).

**Arquivo:** `supabase/migrations/06_idempotency.sql`

**Assinatura:**

```sql
mark_as_paid_idempotent(
  p_financial_record_id UUID,
  p_payment_method TEXT,
  p_idempotency_key TEXT
) RETURNS JSONB
```

**Fluxo:**

1. Verifica se `idempotency_key` já existe
2. Se existe, retorna resultado anterior (idempotente)
3. Se não existe, atualiza `status='pago'`, `payment_method`, `paid_at=NOW()`
4. Insere `idempotency_key` com resultado
5. Retorna `{ success: true, financial_record_id }`

**Chamada:**

```ts
const idempotencyKey = crypto.randomUUID();
const { data, error } = await supabase.rpc("mark_as_paid_idempotent", {
  p_financial_record_id: recordId,
  p_payment_method: "pix",
  p_idempotency_key: idempotencyKey,
});
```

### confirm_payment_idempotent

**Responsabilidade:** Confirmar pagamento (aprovar comprovante enviado pelo aluno).

**Arquivo:** `supabase/migrations/06_idempotency.sql`

**Assinatura:**

```sql
confirm_payment_idempotent(
  p_financial_record_id UUID,
  p_idempotency_key TEXT
) RETURNS JSONB
```

**Fluxo:**

1. Verifica idempotência
2. Atualiza `status='pago'`, `payment_proof_status='approved'`, `confirmed_by_user_id=auth.uid()`, `paid_at=NOW()`
3. Retorna `{ success: true }`

### undo_payment_idempotent

> **Nota Sprint 30:** O botão "Desfazer" foi removido da UI (`FinancialUndoDialog` deletado, `useUndoFinancialPayment` removido). Para cobranças AbacatePay, o reembolso usa a Edge Function `refund-abacate-payment` (não esta RPC). Esta RPC permanece no banco para compatibilidade mas não tem chamador na UI atual.

**Responsabilidade:** Desfazer pagamento (voltar para pendente).

**Arquivo:** `supabase/migrations/06_idempotency.sql`

**Assinatura:**

```sql
undo_payment_idempotent(
  p_financial_record_id UUID,
  p_idempotency_key TEXT
) RETURNS JSONB
```

**Fluxo:**

1. Verifica idempotência
2. Atualiza `status='pendente'`, `paid_at=NULL`, `confirmed_by_user_id=NULL`
3. Retorna `{ success: true }`

### update_student_payment_day

**Responsabilidade:** Recalcular `due_date` de todas as cobranças pendentes quando `students.pay_day` muda.

**Arquivo:** `supabase/migrations/08_update_payment_day.sql`

**Assinatura:**

```sql
update_student_payment_day(
  p_student_id UUID,
  p_new_pay_day INTEGER
) RETURNS VOID
```

**Fluxo:**

1. Atualiza `students.pay_day`
2. Recalcula `due_date` de todas as cobranças pendentes do aluno
3. Mantém mês/ano, muda apenas o dia

**Chamada:**

```ts
await supabase.rpc("update_student_payment_day", {
  p_student_id: studentId,
  p_new_pay_day: 15,
});
```

### check_rate_limit

**Responsabilidade:** Verificar rate limit (10 req/min por usuário).

**Arquivo:** `supabase/migrations/07_rate_limiting.sql`

**Assinatura:**

```sql
check_rate_limit(
  p_operation TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN
```

**Fluxo:**

1. Conta requisições do usuário na janela de tempo
2. Se < max_requests, insere novo registro e retorna TRUE
3. Se >= max_requests, retorna FALSE

**Chamada:**

```ts
const { data: allowed } = await supabase.rpc("check_rate_limit", {
  p_operation: "create_student",
  p_max_requests: 10,
  p_window_minutes: 1,
});

if (!allowed) {
  throw new Error("Rate limit excedido. Aguarde 1 minuto.");
}
```

## Triggers ativos

| Tabela              | Trigger                                     | Quando                      | Ação                                                               |
| ------------------- | ------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `financial_records` | `trigger_validate_financial_logic`          | BEFORE INSERT/UPDATE        | Valida `amount > 0`, `status IN ('pendente', 'pago', 'cancelado')` |
| `profiles`          | `trigger_invalidate_sessions_on_deactivate` | AFTER UPDATE (active=false) | Invalida todas as sessões do usuário                               |
| `teachers`          | `trigger_set_updated_at`                    | BEFORE UPDATE               | Atualiza `updated_at=NOW()`                                        |
| `students`          | `trigger_set_updated_at`                    | BEFORE UPDATE               | Atualiza `updated_at=NOW()`                                        |
| `profiles`          | `trigger_set_updated_at`                    | BEFORE UPDATE               | Atualiza `updated_at=NOW()`                                        |
| `class_logs`        | `trigger_set_updated_at`                    | BEFORE UPDATE               | Atualiza `updated_at=NOW()`                                        |
| `financial_records` | `trigger_set_updated_at`                    | BEFORE UPDATE               | Atualiza `updated_at=NOW()`                                        |
| `activities`        | `trigger_set_updated_at`                    | BEFORE UPDATE               | Atualiza `updated_at=NOW()`                                        |

**Padrão:** Todos os triggers `set_updated_at` usam função genérica `update_updated_at_column()`.

## Views

### students_with_stats

**Responsabilidade:** Alunos com total de aulas e valores do mês atual.

**Arquivo:** `supabase/migrations/09_views.sql`

**Colunas:**

- Todas de `students`
- `total_classes` — total de aulas concluídas
- `total_amount_this_month` — soma de cobranças do mês atual

**Uso:**

```ts
const { data } = await supabase.from("students_with_stats").select("*");
```

### students_active

**Responsabilidade:** Alunos ativos (não deletados, status=ativo).

**Arquivo:** `supabase/migrations/09_views.sql`

**Filtro:** `is_deleted=false AND status='ativo'`

**Uso:**

```ts
const { data } = await supabase.from("students_active").select("*");
```

### students_masked

**Responsabilidade:** Dados anonimizados para LGPD (oculta CPF, telefone, endereço).

**Arquivo:** `supabase/migrations/10_lgpd.sql`

**Colunas ocultas:** `cpf`, `phone`, `address`, `city`, `state`, `zip_code`

**Uso:**

```ts
const { data } = await supabase.from("students_masked").select("*");
```

### teachers_with_pix_restricted

**Responsabilidade:** Dados PIX visíveis apenas para admin.

**Arquivo:** `supabase/migrations/10_lgpd.sql`

**RLS:** `is_admin()` — apenas admin vê `pix_key`, `pix_key_type`

**Uso:**

```ts
const { data } = await supabase
  .from("teachers_with_pix_restricted")
  .select("*");
```

### class_logs_with_billing

**Responsabilidade:** Aulas com valores calculados (hourly_rate \* duration).

**Arquivo:** `supabase/migrations/09_views.sql`

**Colunas adicionais:**

- `calculated_amount` — `hourly_rate * (duration_minutes / 60)`
- `student_name` — join com `students`
- `teacher_name` — join com `teachers`

**Uso:**

```ts
const { data } = await supabase.from("class_logs_with_billing").select("*");
```

### activities_active

**Responsabilidade:** Atividades não deletadas.

**Arquivo:** `supabase/migrations/11_activities.sql`

**Filtro:** `deleted_at IS NULL`

**Security:** `SECURITY INVOKER` — herda permissões do usuário autenticado

**Uso:**

```ts
const { data } = await supabase.from("activities_active").select("*");
```

## Materialized Views

> **Removidas.** As materialized views `activities_dashboard` e `financial_dashboard` foram criadas na migration 15 e **dropadas na migration 44** (`44_drop_unused_materialized_views.sql`) — nunca foram consultadas pelo frontend. Não existem no banco atual.

## RPCs adicionais

### admin_update_auth_display_name

**Responsabilidade:** Atualiza `raw_user_meta_data.full_name` em `auth.users` para refletir renomeações feitas pelo admin.

**Arquivo:** `supabase/migrations/53_add_admin_update_auth_display_name_rpc.sql`

**Assinatura:**

```sql
admin_update_auth_display_name(
  p_user_id UUID,
  p_full_name TEXT
) RETURNS void
```

**Segurança:** `SECURITY DEFINER` (acessa `auth.users`). Requer `is_admin()` — lança exceção se não for admin.

**Chamada:**

```ts
await supabase.rpc("admin_update_auth_display_name", {
  p_user_id: userId,
  p_full_name: fullName,
});
```

**Contexto de uso:** Chamado em `useUpdateUserProfile` após atualizar `profiles.full_name`. Também chamado em `useUpdateTeacher` quando admin edita nome de professor via `/admin/users`.

---

### admin_update_auth_email

**Responsabilidade:** Atualiza `email` em `auth.users` quando admin edita email de um usuário. Seta `email_confirmed_at = NOW()` para evitar re-confirmação.

**Arquivo:** `supabase/migrations/56_add_admin_update_auth_email_rpc.sql`

**Assinatura:**

```sql
admin_update_auth_email(
  p_user_id UUID,
  p_email   TEXT
) RETURNS void
```

**Segurança:** `SECURITY DEFINER` (acessa `auth.users`). Requer `is_admin()` — lança exceção se não for admin.

**Chamada:**

```ts
await supabase.rpc("admin_update_auth_email", {
  p_user_id: userId,
  p_email: normalizedEmail,
});
```

**Contexto de uso:** Chamado em `useUpdateTeacher` quando `normalizedEmail` está presente no update. Garante que `auth.users.email` fique sincronizado com `teachers.email` e `profiles.email`.

---

### teacher_sync_student_display_name

**Responsabilidade:** Sincroniza nome do aluno em `profiles.full_name` + `auth.users` metadata quando professor edita o nome via portal `/teacher/students`.

**Arquivo:** `supabase/migrations/54_add_teacher_sync_student_display_name_rpc.sql`

**Assinatura:**

```sql
teacher_sync_student_display_name(
  p_student_id UUID,
  p_name TEXT
) RETURNS void
```

**Segurança:** `SECURITY DEFINER` (bypassa `profiles_select_policy` que bloqueia professor de ler profiles de outros usuários). Valida que o aluno pertence ao professor chamador (ou que é admin).

**Chamada:**

```ts
await supabase.rpc("teacher_sync_student_display_name", {
  p_student_id: studentId,
  p_name: newName,
});
```

**Contexto de uso:** Chamado em `useUpdateStudent` após update bem-sucedido na tabela `students`, quando `name` está presente no update. Resolve inconsistência onde `students.name` atualizava mas `profiles.full_name` e `auth.users` ficavam stale.

---

### user_update_own_email

**Responsabilidade:** Permite que usuário autenticado atualize o próprio email sem disparar o fluxo de confirmação por email do Supabase.

**Arquivo:** `supabase/migrations/57_add_user_update_own_email_rpc.sql`

**Assinatura:**

```sql
user_update_own_email(p_email TEXT) RETURNS void
```

**Segurança:** `SECURITY DEFINER`. Valida que o caller tem profile ativo antes de prosseguir. Atualiza `auth.users.email` + `email_confirmed_at` + `profiles.email` atomicamente.

**Contexto de uso:** Chamado em `useUpdateProfileEmail` para alunos e admins que editam o próprio email via Configurações. Professores têm o campo bloqueado (nome e email são admin-only).

---

### encrypt_sensitive_data / decrypt_sensitive_data

**Responsabilidade:** Criptografar e descriptografar dados sensíveis em repouso usando `pgcrypto`. Usados para armazenar a API key AbacatePay do professor com segurança.

**Arquivo:** `supabase/migrations/10_security_improvements.sql` + `61_grant_encrypt_functions_authenticated.sql`

**Assinatura:**

```sql
encrypt_sensitive_data(data_input TEXT) RETURNS TEXT
decrypt_sensitive_data(encrypted_input TEXT) RETURNS TEXT
```

**Segurança:** `SECURITY DEFINER`. Grant para `authenticated` (migration 61). A chave de criptografia é derivada do `SUPABASE_DB_PASSWORD` (nunca exposta ao frontend).

**Uso:**

```ts
// Criptografar ao salvar
const { data: encrypted } = await supabase.rpc("encrypt_sensitive_data", {
  data_input: apiKey,
});

// Descriptografar (apenas em Edge Functions com SERVICE_ROLE_KEY)
const { data: decrypted } = await serviceClient.rpc("decrypt_sensitive_data", {
  encrypted_input: teacher.abacate_pay_api_key,
});
```

**Contexto:** API key nunca chega ao frontend em texto claro. Descriptografia ocorre apenas dentro de Edge Functions com `serviceClient`.

---

### submit_payment_proof

> **Nota Sprint 30:** O fluxo de upload de comprovante foi removido da UI com a integração AbacatePay (`usePaymentProof` deletado, `FinancialPaymentHistoryDialog` simplificado). Esta RPC permanece no banco mas não tem chamador na UI atual.

**Responsabilidade:** Registra comprovante de pagamento enviado pelo aluno e transiciona a cobrança para `status = 'validando'`.

**Arquivo:** `supabase/migrations/03_rpcs_and_triggers.sql` (atualizada em migration 58)

**Assinatura:**

```sql
submit_payment_proof(
  p_financial_record_id UUID,
  p_proof_url TEXT,
  p_proof_filename TEXT
) RETURNS JSONB
```

**Segurança:** `SECURITY DEFINER`. Requer `is_student()` e valida ownership da cobrança.

**Efeito:** Seta `payment_proof_url`, `payment_proof_filename`, `payment_proof_uploaded_at`, `payment_proof_status = 'pending'`, **`status = 'validando'`**.

**Fluxo:** `pendente → validando (upload) → pago (aprovado) | pendente (rejeitado por `review_payment_proof`)`

---

### review_payment_proof

> **Nota Sprint 30:** Aprovação de comprovante removida da UI com a integração AbacatePay. Esta RPC permanece no banco mas não tem chamador na UI atual.

**Responsabilidade:** Professor ou admin aprova/rejeita comprovante de pagamento.

**Arquivo:** `supabase/migrations/03_rpcs_and_triggers.sql`

**Assinatura:**

```sql
review_payment_proof(
  p_financial_record_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS JSONB
```

**Segurança:** `SECURITY DEFINER`. Requer `is_teacher()` ou `is_admin()`. Professor valida ownership (cobrança pertence a aluno seu).

**Efeito:**

- Aprovado: `status = 'pago'`, `payment_proof_status = 'approved'`, `paid_at = NOW()`
- Rejeitado: `status = 'pendente'`, `payment_proof_status = 'rejected'`, proof URL/filename limpos (aluno pode reenviar)

---

## Ver também

- [Backend Overview](./overview.md) — Visão geral do backend
- [Edge Functions](./edge-functions.md) — Alternativa a RPCs (mais flexível)
- [Database Overview](../database/overview.md) — Schema, migrations
- [Security Overview](../security/overview.md) — RLS policies
