---
name: syncclass-database
description: SyncClass database guide — Supabase migrations, PostgreSQL schema (11 tables), TypeScript type generation, RLS policies. Use when creating or modifying tables, columns, indexes, constraints, RLS policies, or generating types after schema changes.
---

# Database — SyncClass

Schema management — Supabase, migrations, type generation.

## Workflow: Atualizar Schema

```bash
# 1. Criar migration
supabase migration create --name add_column_to_students

# 2. Aplicar ao banco remoto
supabase db push

# 3. Gerar tipos TypeScript
supabase gen types --linked > src/integrations/supabase/types.ts

# 4. Verificar drift
supabase db diff --linked
```

Após gerar tipos: atualizar `src/hooks/` e rodar `npm run type-check`.

## Schema Atual — Tabelas Principais

| Tabela | Descrição | Colunas Chave |
|--------|-----------|---------------|
| `teachers` | Professores | id, name, email, hourly_rate, pix_key, status, anonymized_at |
| `students` | Alunos | id, name, email, pay_day, hourly_rate, status, teacher_id, anonymized_at |
| `profiles` | Usuários | id, user_id, full_name, role, student_id, teacher_id, active, deleted_at |
| `user_roles` | Controle acesso | id, user_id, role, email |
| `class_logs` | Aulas | id, student_id, teacher_id, class_date, start_at, end_at, duration_minutes, attendance, grade |
| `financial_records` | Cobranças | id, student_id, amount, due_date, status, paid_at, payment_proof_url |
| `financial_record_class_logs` | N:N aulas-cobranças | financial_record_id, class_log_id |
| `activities` | Atividades | id, student_id, teacher_id, title, due_date, status, file_url, grade |
| `audit_logs` | Auditoria | id, user_id, action_type, table_name, record_id, metadata |
| `idempotency_keys` | Idempotência | id, idempotency_key, operation, status |
| `performance_logs` | Performance | id, user_id, operation, duration_ms, metadata |

Ver: `supabase/migrations/` (25 migrations atualmente).

## RLS (Row Level Security)

```sql
-- Isolamento por professor
CREATE POLICY "Teachers can view own students"
  ON students FOR SELECT
  USING (teacher_id = (
    SELECT teacher_id FROM profiles WHERE user_id = auth.uid()
  ));
```

`is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita e HTTP 500.

## Checklist Antes de Commitar Migration

- [ ] RLS policies aplicadas?
- [ ] Índices em colunas frequentes de filter?
- [ ] Foreign keys com `ON DELETE CASCADE` ou `SET NULL`?
- [ ] Tipos TypeScript atualizados?
- [ ] `npm run type-check` passa?
- [ ] `npm run test` passa?

## Troubleshooting

| Problema | Solução |
|----------|---------|
| MCP tools não conectam | Reconectar MCP em Kiro, fazer login Supabase no browser |
| Migration falha ao push | `supabase migration list`, `supabase db pull` |
| Types desincronizados | `supabase gen types --linked > src/integrations/supabase/types.ts` |
| Data não aparece na UI | Verificar RLS policies via Supabase Studio |
| Schema drift | `supabase db diff --linked` |
