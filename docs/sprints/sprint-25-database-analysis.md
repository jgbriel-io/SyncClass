# Sprint 25 — Database Structural Analysis

**Período:** 25/05/2026  
**Status:** ⬜ Planejada  
**Tipo:** Banco de Dados + Performance

## Contexto

Análise estrutural completa de todas as migrations: índices, CHECK constraints,
nullable incorretos, cascade behavior e integridade referencial. Complementa
Sprint 24 (RLS) e Sprint 23 (backend bugs). Foco em corretude do schema e
performance de queries comuns.

---

## Itens

### DB-001 — `financial_records.amount` CHECK `> 0` quebra cobranças zeradas

**Severidade:** 🔴 Crítica  
**Esforço:** 20min  
**Arquivo:** `supabase/migrations/22_dba_fixes.sql:84`

**Problema:** Migration 22 adicionou `CHECK (amount > 0)` em `financial_records`.
Isso impede registros legítimos com `amount = 0` (ex: cobranças dispensadas,
estornos, aulas sem cobrança). O próprio comentário na migration anterior
(`01_structure.sql:178`) indica que `amount >= 0` era a intenção original.

**Fix:** Alterar constraint para `>= 0`:

```sql
ALTER TABLE public.financial_records
  DROP CONSTRAINT IF EXISTS financial_records_amount_check,
  ADD CONSTRAINT financial_records_amount_check CHECK (amount >= 0);
```

**Critério de aceite:** Inserir `financial_record` com `amount = 0` funciona.
Valor negativo continua sendo rejeitado.

---

### DB-002 — `students.teacher_id` nullable — alunos podem ficar sem professor

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivo:** `supabase/migrations/01_structure.sql:84`

**Problema:** `teacher_id` em `students` é nullable. FK com `ON DELETE SET NULL`
permite alunos orfãos (sem professor). RLS filtra alunos sem `teacher_id` para
todos os roles — alunos orfãos somem da UI sem erro explícito.

**Fix (duas opções):**

1. `NOT NULL` + `ON DELETE RESTRICT` — impede deletar professor com alunos ativos
2. Manter nullable mas adicionar soft-delete check na RLS e UI

Para TCC, opção 1 é mais segura:

```sql
-- migration nova
ALTER TABLE public.students
  ALTER COLUMN teacher_id SET NOT NULL;
-- remover SET NULL do FK, substituir por RESTRICT
```

**Critério de aceite:** Tentar deletar professor com alunos ativos retorna erro.
Nenhum aluno fica sem `teacher_id`.

---

### DB-003 — `duration_minutes` sem CHECK positivo em `class_logs`

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `supabase/migrations/01_structure.sql:133`

**Problema:** `duration_minutes` pode ser 0, negativo ou muito grande — sem
CHECK constraint. Valor calculado via trigger (`EXTRACT EPOCH / 60`) mas se
`start_at = end_at`, resulta em 0 sem erro.

**Fix:**

```sql
ALTER TABLE public.class_logs
  ADD CONSTRAINT class_logs_duration_minutes_check
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);
```

**Critério de aceite:** INSERT de aula com `start_at = end_at` retorna erro de
constraint. NULL ainda permitido (aulas sem horário definido).

---

### DB-004 — `billed_amount` sem CHECK em `class_logs`

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Arquivo:** `supabase/migrations/01_structure.sql:136`

**Problema:** `billed_amount` (valor cobrado por aula individual) pode ser negativo.
Inconsistente com `financial_records.amount` que tem CHECK.

**Fix:**

```sql
ALTER TABLE public.class_logs
  ADD CONSTRAINT class_logs_billed_amount_check
  CHECK (billed_amount IS NULL OR billed_amount >= 0);
```

**Critério de aceite:** `billed_amount = -50` rejeitado. `billed_amount = 0` e NULL aceitos.

---

### DB-005 — `hourly_rate` sem CHECK em `students` e `teachers`

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `supabase/migrations/01_structure.sql:57,79`

**Problema:** `hourly_rate` em `students` e `teachers` sem CHECK — pode ser
negativo ou zero. Dashboard calcula faturamento com base nesse valor; rate
negativo inverte a lógica financeira.

**Fix:**

```sql
ALTER TABLE public.students
  ADD CONSTRAINT students_hourly_rate_check
  CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

ALTER TABLE public.teachers
  ADD CONSTRAINT teachers_hourly_rate_check
  CHECK (hourly_rate IS NULL OR hourly_rate >= 0);
```

**Critério de aceite:** `hourly_rate = -100` rejeitado. `hourly_rate = 0` e NULL aceitos.

---

### DB-006 — `confirmed_by_user_id` FK pode apontar para profile soft-deleted

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Arquivo:** `supabase/migrations/31_confirmed_by_profiles_fk.sql:6`

**Problema:** FK `financial_records.confirmed_by_user_id → profiles.user_id`
com `ON DELETE SET NULL`. Se profile for soft-deleted (`deleted_at IS NOT NULL`),
FK ainda aponta para o profile (não NULL) mas RLS o esconde — registro financeiro
mostra `confirmed_by` invisível, sem erro.

**Fix:** Adicionar view ou JOIN com filtro explícito de soft-delete no select
de `confirmed_by`:

```ts
// no hook, filtrar profile não-deleted
.select(`
  *,
  confirmed_by:profiles!financial_records_confirmed_by_profiles_fkey(
    full_name, deleted_at
  )
`)
// no frontend: mostrar "Usuário removido" se deleted_at IS NOT NULL
```

**Critério de aceite:** Registro confirmado por profile soft-deleted exibe
"Usuário removido" em vez de dado em branco ou erro.

---

### DB-007 — CHECK de `start_at::date = class_date` ignora NULL silenciosamente

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `supabase/migrations/22_dba_fixes.sql:127`

**Problema:** Constraint `CHECK (start_at IS NULL OR start_at::date = class_date)`
permite `start_at = NULL` com `class_date` definida — semanticamente inconsistente.
Se `class_date` está preenchida, `start_at` deveria estar também (ou ambos null).

**Fix:**

```sql
ADD CONSTRAINT class_logs_date_consistency_check
CHECK (
  (start_at IS NULL AND end_at IS NULL)
  OR (start_at IS NOT NULL AND end_at IS NOT NULL AND start_at::date = class_date)
);
```

**Critério de aceite:** INSERT com `class_date` definida mas `start_at = NULL`
rejeitado. INSERT com ambos null aceito.

---

### DB-008 — Índice em `class_logs.teacher_id` não é partial (inclui NULLs)

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `supabase/migrations/01_structure.sql:318`

**Problema:** `idx_class_logs_teacher_id` indexa todas as linhas incluindo
`teacher_id IS NULL`. Aulas sem professor (raras mas possíveis) inflam o índice
sem utilidade nas queries WHERE `teacher_id = $1`.

**Fix:** Substituir por índice partial:

```sql
DROP INDEX IF EXISTS idx_class_logs_teacher_id;
CREATE INDEX idx_class_logs_teacher_id
  ON class_logs(teacher_id)
  WHERE teacher_id IS NOT NULL;
```

**Critério de aceite:** Índice criado com `WHERE teacher_id IS NOT NULL`.
Explain analyze mostra índice usado em queries de listagem por professor.

---

### DB-009 — `financial_records.due_date` sem índice partial para overdue

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Arquivo:** `supabase/migrations/01_structure.sql:327`

**Problema:** Índice em `due_date` existe mas não é partial para o padrão
mais comum: `due_date < NOW() AND status = 'pendente'` (cobranças vencidas).
Com muitos registros pagos, o índice escaneia desnecessariamente.

**Fix:**

```sql
CREATE INDEX idx_financial_records_overdue
  ON financial_records(due_date)
  WHERE status = 'pendente';
```

**Critério de aceite:** Query de cobranças vencidas usa `idx_financial_records_overdue`
(verificar via `EXPLAIN (ANALYZE, BUFFERS)`).

---

## Ordem de Implementação Recomendada

| #   | Item   | Esforço | Risco | Impacto                                         |
| --- | ------ | ------- | ----- | ----------------------------------------------- |
| 1   | DB-001 | 20min   | Alto  | 🔴 Bloqueio de cobranças legítimas (amount = 0) |
| 2   | DB-003 | 15min   | Baixo | CHECK duration_minutes > 0                      |
| 3   | DB-004 | 10min   | Baixo | CHECK billed_amount >= 0                        |
| 4   | DB-005 | 15min   | Baixo | CHECK hourly_rate >= 0                          |
| 5   | DB-007 | 15min   | Baixo | CHECK consistência start_at/class_date          |
| 6   | DB-008 | 15min   | Baixo | Índice partial teacher_id                       |
| 7   | DB-009 | 10min   | Baixo | Índice partial overdue                          |
| 8   | DB-006 | 20min   | Médio | Soft-delete orphan em confirmed_by              |
| 9   | DB-002 | 30min   | Alto  | students.teacher_id NOT NULL                    |

**Total estimado:** ~2h30min

## Dependências

- Todos os itens requerem nova migration SQL
- DB-001: testar se existe `amount = 0` no banco antes de alterar (backup antes)
- DB-002: verificar alunos orfãos existentes antes de `NOT NULL` (migration com UPDATE primeiro)
- DB-007: pode conflitar com dados existentes — rodar `SELECT COUNT(*)` antes para validar
- DB-008/009: DROP + CREATE INDEX é operação online no Postgres 12+ mas ainda trava brevemente

## Referências

- [Sprint 23](./sprint-23-backend-quality-fixes.md) — Backend code review (bugs correlatos)
- [Sprint 24](./sprint-24-rls-audit.md) — RLS audit (segurança de acesso)
- `supabase/migrations/01_structure.sql` — Schema inicial (DB-002 a DB-009)
- `supabase/migrations/22_dba_fixes.sql` — Fixes anteriores de DB (DB-001, DB-007)
- `supabase/migrations/31_confirmed_by_profiles_fk.sql` — DB-006
