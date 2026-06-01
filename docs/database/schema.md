# Schema

Tabelas, relacionamentos e integridade referencial.

## Índice

- [Diagrama de relacionamentos](#diagrama-de-relacionamentos)
- [Tabelas principais](#tabelas-principais)
- [Relacionamentos](#relacionamentos)
- [Integridade referencial](#integridade-referencial)
- [Bugs identificados](#bugs-identificados)
- [Ver também](#ver-também)

## Diagrama de relacionamentos

```
auth.users (Supabase Auth)
    │
    └──1:1── profiles (role, teacher_id, student_id, active)

teachers
    │
    └──1:N── students (teacher_id → SET NULL on delete)
                 │
                 ├──1:N── class_logs (student_id → CASCADE)
                 │            │
                 │            └──N:N── financial_record_class_logs ──N:1── financial_records
                 │
                 ├──1:N── financial_records (student_id → CASCADE)
                 │
                 └──1:N── activities (student_id → CASCADE)
```

## Tabelas principais

| Tabela                      | Responsabilidade                           | Linhas estimadas  |
| --------------------------- | ------------------------------------------ | ----------------- |
| teachers                    | Cadastro de professores                    | Baixo (< 100)     |
| students                    | Cadastro de alunos                         | Médio (< 10k)     |
| profiles                    | Vínculo auth.users ↔ teacher/student       | = users           |
| class_logs                  | Registro de aulas ministradas              | Alto (> 100k)     |
| financial_records           | Cobranças (individuais ou pacotes)         | Alto (> 50k)      |
| financial_record_class_logs | N:N aulas ↔ cobranças de pacote            | Médio             |
| activities                  | Tarefas atribuídas a alunos                | Alto (> 50k)      |
| audit_logs                  | Auditoria de operações                     | Muito alto        |
| idempotency_keys            | Controle de operações duplicadas           | Médio (TTL curto) |
| performance_logs            | Métricas de performance                    | Muito alto        |
| webhook_processing_log      | Idempotência de eventos webhook AbacatePay | Baixo (TTL curto) |

### Campos AbacatePay (Sprint 30)

**`financial_records` — colunas adicionadas (migration 59):**

| Coluna                | Tipo        | Descrição                                                                    |
| --------------------- | ----------- | ---------------------------------------------------------------------------- |
| `payment_provider`    | TEXT        | `'abacate_pay'` \| `'manual'` \| NULL. Check constraint valida valores.      |
| `external_payment_id` | TEXT        | ID da cobrança na AbacatePay (`pix_char_...`). Index parcial WHERE NOT NULL. |
| `pix_code`            | TEXT        | Código PIX copia-e-cola (brCode). Cacheado para evitar regeneração.          |
| `pix_expires_at`      | TIMESTAMPTZ | Expiração do QR Code. NULL = sem cache válido.                               |

**`teachers` — colunas adicionadas (migration 60):**

| Coluna                       | Tipo | Descrição                                                                                                        |
| ---------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `abacate_pay_api_key`        | TEXT | API key criptografada via pgcrypto. Descriptografada apenas em Edge Functions com SERVICE_ROLE_KEY.              |
| `abacate_pay_webhook_secret` | TEXT | UUID único por professor. Validado como query param nos webhooks. Rotacionado automaticamente ao trocar API key. |

## Relacionamentos

### 1:N (um para muitos)

- `teachers` → `students` (professor tem muitos alunos)
- `students` → `class_logs` (aluno tem muitas aulas)
- `students` → `financial_records` (aluno tem muitas cobranças)
- `students` → `activities` (aluno tem muitas atividades)
- `class_logs` → `financial_records` (aula individual tem uma cobrança)

### N:N (muitos para muitos)

- `financial_records` ↔ `class_logs` via `financial_record_class_logs` (pacotes de aulas)

### 1:1 (um para um)

- `auth.users` ↔ `profiles` (via `user_id UNIQUE`)

## Integridade referencial

| FK                                              | Comportamento | Justificativa                            |
| ----------------------------------------------- | ------------- | ---------------------------------------- |
| students.teacher_id → teachers                  | SET NULL      | Aluno não é deletado se professor sair   |
| profiles.teacher_id → teachers                  | SET NULL      | Profile mantido mesmo sem teacher        |
| profiles.student_id → students                  | SET NULL      | Profile mantido mesmo sem student        |
| profiles.user_id → auth.users                   | CASCADE       | Profile deletado com o usuário           |
| class_logs.student_id → students                | CASCADE       | Aulas deletadas com o aluno              |
| class_logs.teacher_id → teachers                | SET NULL      | Aula mantida sem professor               |
| financial_records.student_id → students         | CASCADE       | Cobranças deletadas com o aluno          |
| financial_records.class_log_id → class_logs     | CASCADE       | Cobrança individual deletada com a aula  |
| financial_record_class_logs.financial_record_id | RESTRICT      | Não deleta cobrança com aulas vinculadas |
| financial_record_class_logs.class_log_id        | CASCADE       | Link deletado quando aula é deletada     |
| activities.student_id → students                | CASCADE       | Atividades deletadas com o aluno         |
| activities.teacher_id → teachers                | SET NULL      | Atividade mantida sem professor          |

## Bugs identificados

### DB-001: Soft delete redundante

**Severidade:** Alta

`students` tem dois campos de soft delete redundantes e inconsistentes: `is_deleted BOOLEAN` (deprecated) e `status TEXT`. Queries que filtram por `status = 'ativo'` não filtram por `is_deleted = false` e vice-versa.

**Fix:** Deprecar `is_deleted`, migrar para `status`.

### DB-002: Índice faltando em financial_records.status

**Severidade:** Alta

Queries de dashboard que filtram `WHERE status = 'pendente'` fazem full table scan em tabela que pode ter centenas de milhares de linhas.

**Fix:**

```sql
CREATE INDEX idx_financial_records_status ON financial_records(status);
CREATE INDEX idx_financial_records_student_status ON financial_records(student_id, status);
```

### DB-003: Índices faltando em activities

**Severidade:** Alta

`activities` não tem índice em `status` nem em `teacher_id`. Com 50k+ atividades, isso é crítico.

**Fix:**

```sql
CREATE INDEX idx_activities_teacher_id ON activities(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_activities_status ON activities(status);
```

### DB-004: Índices faltando em teachers

**Severidade:** Alta

`teachers` não tem índice em `email` nem `status`. Queries de lookup por email fazem full scan.

**Fix:**

```sql
CREATE INDEX idx_teachers_email ON teachers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_teachers_status ON teachers(status);
```

### DB-005: Índice faltando em students.email

**Severidade:** Alta

Queries de lookup por email fazem full scan.

**Fix:**

```sql
CREATE INDEX idx_students_email ON students(email) WHERE email IS NOT NULL;
```

### DB-006: Índices faltando em audit_logs

**Severidade:** Média

Queries de auditoria que filtram por período ou por tabela fazem full scan em tabela que cresce indefinidamente.

**Fix:**

```sql
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
```

### DB-007: Sem política de expiração em idempotency_keys

**Severidade:** Média

Registros antigos acumulam indefinidamente, degradando performance.

**Fix:** Job de limpeza (manter 30 dias).

### DB-008: Sem política de retenção em performance_logs

**Severidade:** Média

Tabela de logs não deve crescer sem limite.

**Fix:** Job de limpeza (manter 90 dias).

### DB-009: Inconsistência de validação de amount

**Severidade:** Média

`financial_records.amount` tem `CHECK (amount >= 0)` mas o trigger valida `amount > 0`. Inconsistência: a constraint permite `0`, o trigger rejeita `0`.

**Fix:**

```sql
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_amount_check;
ALTER TABLE financial_records ADD CONSTRAINT financial_records_amount_check CHECK (amount > 0);
```

### DB-010: Sem constraint de range em grade

**Severidade:** Média

Notas podem ser inseridas como valores negativos ou acima de 100 sem validação no banco.

**Fix:**

```sql
ALTER TABLE class_logs ADD CONSTRAINT check_class_log_grade
  CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100));
```

### DB-011: Sem constraint UNIQUE em emails

**Severidade:** Baixa

É possível cadastrar dois professores ou dois alunos com o mesmo email, quebrando a lógica de vinculação de profiles por email.

**Fix:**

```sql
CREATE UNIQUE INDEX idx_teachers_email_unique ON teachers(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_students_email_unique ON students(email) WHERE email IS NOT NULL;
```

### DB-012: Sem constraint de consistência de data

**Severidade:** Baixa

Não há constraint garantindo que `start_at::date = class_date`. É possível inserir uma aula com `class_date = '2024-01-01'` e `start_at = '2024-06-15 14:00'`.

**Fix:**

```sql
ALTER TABLE class_logs ADD CONSTRAINT check_class_date_consistency
  CHECK (start_at IS NULL OR start_at::date = class_date);
```

### DB-013: Índice faltando em financial_record_class_logs

**Severidade:** Baixa

Queries que buscam "quais cobranças estão vinculadas a esta aula" fazem full scan na tabela de junção.

**Fix:**

```sql
CREATE INDEX idx_frcl_class_log_id ON financial_record_class_logs(class_log_id);
```

## Migration de correção

Todas as correções acima estão consolidadas em `supabase/migrations/22_dba_fixes.sql`.

## Ver também

- [Database Overview](./overview.md) — Visão geral do banco
- [Migrations](./migrations.md) — Histórico de migrations
- [RLS](./rls.md) — Row Level Security
