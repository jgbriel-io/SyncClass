# Schema do Banco de Dados

## Modelagem de Dados

### Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    │
    ├──1:1── profiles (role, teacher_id, student_id, active)
    └──1:1── user_roles (role — cache para RLS)

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

### Tabelas e Responsabilidades

| Tabela | Responsabilidade | Linhas estimadas |
|--------|-----------------|-----------------|
| `teachers` | Cadastro de professores | Baixo (< 100) |
| `students` | Cadastro de alunos | Médio (< 10k) |
| `profiles` | Vínculo auth.users ↔ teacher/student | = users |
| `user_roles` | Cache de role para RLS | = users |
| `class_logs` | Registro de aulas ministradas | Alto (> 100k) |
| `financial_records` | Cobranças (individuais ou pacotes) | Alto (> 50k) |
| `financial_record_class_logs` | N:N aulas ↔ cobranças de pacote | Médio |
| `activities` | Tarefas atribuídas a alunos | Alto (> 50k) |
| `audit_logs` | Auditoria de operações | Muito alto |
| `idempotency_keys` | Controle de operações duplicadas | Médio (TTL curto) |
| `performance_logs` | Métricas de performance | Muito alto |

### Relacionamentos

**1:N (um para muitos):**
- `teachers` → `students` (professor tem muitos alunos)
- `students` → `class_logs` (aluno tem muitas aulas)
- `students` → `financial_records` (aluno tem muitas cobranças)
- `students` → `activities` (aluno tem muitas atividades)
- `class_logs` → `financial_records` (aula individual tem uma cobrança)

**N:N (muitos para muitos):**
- `financial_records` ↔ `class_logs` via `financial_record_class_logs` (pacotes de aulas)

**1:1 (um para um):**
- `auth.users` ↔ `profiles` (via `user_id UNIQUE`)
- `auth.users` ↔ `user_roles` (via `user_id UNIQUE`)

### Integridade Referencial

| FK | Comportamento | Justificativa |
|----|--------------|---------------|
| `students.teacher_id → teachers` | SET NULL | Aluno não é deletado se professor sair |
| `profiles.teacher_id → teachers` | SET NULL | Profile mantido mesmo sem teacher |
| `profiles.student_id → students` | SET NULL | Profile mantido mesmo sem student |
| `profiles.user_id → auth.users` | CASCADE | Profile deletado com o usuário |
| `user_roles.user_id → auth.users` | CASCADE | Role deletada com o usuário |
| `class_logs.student_id → students` | CASCADE | Aulas deletadas com o aluno |
| `class_logs.teacher_id → teachers` | SET NULL | Aula mantida sem professor |
| `financial_records.student_id → students` | CASCADE | Cobranças deletadas com o aluno |
| `financial_records.class_log_id → class_logs` | CASCADE | Cobrança individual deletada com a aula |
| `financial_record_class_logs.financial_record_id` | RESTRICT | Não deleta cobrança com aulas vinculadas |
| `financial_record_class_logs.class_log_id` | CASCADE | Link deletado quando aula é deletada |
| `activities.student_id → students` | CASCADE | Atividades deletadas com o aluno |
| `activities.teacher_id → teachers` | SET NULL | Atividade mantida sem professor |

---

## Sprint de Correção — Análise DBA

### BUG-001
**SEVERIDADE:** ALTA  
**FALHA:** `students` tem dois campos de soft delete redundantes e inconsistentes: `is_deleted BOOLEAN` (deprecated) e `status TEXT`. Queries que filtram por `status = 'ativo'` não filtram por `is_deleted = false` e vice-versa, causando dados "ativos" que aparecem em uma query mas não na outra.  
**FIX:**
```sql
-- Deprecar is_deleted definitivamente, migrar para status
UPDATE students SET status = 'inativo' WHERE is_deleted = true AND (status IS NULL OR status = 'ativo');
ALTER TABLE students ALTER COLUMN status SET DEFAULT 'ativo';
ALTER TABLE students ADD CONSTRAINT check_student_status CHECK (status IN ('ativo', 'inativo'));
-- Remover is_deleted em migration futura após confirmar que nenhum código usa is_deleted
```

---

### BUG-002
**SEVERIDADE:** ALTA  
**FALHA:** `financial_records` não tem índice em `status`. Queries de dashboard que filtram `WHERE status = 'pendente'` ou `WHERE status = 'pago'` fazem full table scan em tabela que pode ter centenas de milhares de linhas.  
**FIX:**
```sql
CREATE INDEX idx_financial_records_status ON financial_records(status);
CREATE INDEX idx_financial_records_student_status ON financial_records(student_id, status);
CREATE INDEX idx_financial_records_due_date_status ON financial_records(due_date, status) WHERE status = 'pendente';
```

---

### BUG-003
**SEVERIDADE:** ALTA  
**FALHA:** `activities` não tem índice em `status` nem em `teacher_id`. A view `activities_active` e queries de dashboard fazem full scan. Com 50k+ atividades, isso é crítico.  
**FIX:**
```sql
CREATE INDEX idx_activities_teacher_id ON activities(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_teacher_status ON activities(teacher_id, status) WHERE teacher_id IS NOT NULL;
CREATE INDEX idx_activities_due_date ON activities(due_date) WHERE status IN ('pendente', 'atrasada');
```

---

### BUG-004
**SEVERIDADE:** ALTA  
**FALHA:** `teachers` não tem índice em `email` nem `status`. Queries de lookup por email (usadas no setup de profiles) fazem full scan. Com RLS que chama `get_teacher_id()` em toda query, isso multiplica o impacto.  
**FIX:**
```sql
CREATE INDEX idx_teachers_email ON teachers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_teachers_status ON teachers(status);
```

---

### BUG-005
**SEVERIDADE:** ALTA  
**FALHA:** `students` não tem índice em `email`. Queries de lookup por email (usadas no setup de profiles e verificação de duplicatas) fazem full scan.  
**FIX:**
```sql
CREATE INDEX idx_students_email ON students(email) WHERE email IS NOT NULL;
```

---

### BUG-006
**SEVERIDADE:** MÉDIA  
**FALHA:** `audit_logs` não tem índice em `created_at` nem em `table_name`. Queries de auditoria que filtram por período ou por tabela fazem full scan em tabela que cresce indefinidamente.  
**FIX:**
```sql
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
-- Implementar particionamento por mês em produção quando > 1M linhas
```

---

### BUG-007
**SEVERIDADE:** MÉDIA  
**FALHA:** `idempotency_keys` não tem política de expiração. Registros antigos acumulam indefinidamente, degradando performance das queries de verificação de idempotência que são executadas em toda operação financeira.  
**FIX:**
```sql
-- Índice para limpeza eficiente
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at) WHERE status IN ('completed', 'failed');

-- Job de limpeza (executar via pg_cron ou manualmente)
DELETE FROM idempotency_keys 
WHERE status IN ('completed', 'failed') 
  AND created_at < NOW() - INTERVAL '30 days';
```

---

### BUG-008
**SEVERIDADE:** MÉDIA  
**FALHA:** `performance_logs` cresce indefinidamente sem índice em `created_at` e sem política de retenção. Tabela de logs não deve crescer sem limite.  
**FIX:**
```sql
CREATE INDEX idx_performance_logs_created_at ON performance_logs(created_at DESC);
CREATE INDEX idx_performance_logs_operation ON performance_logs(operation);

-- Limpeza de logs antigos (manter 90 dias)
DELETE FROM performance_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

---

### BUG-009
**SEVERIDADE:** MÉDIA  
**FALHA:** `financial_records.amount` tem `CHECK (amount >= 0)` mas o trigger `validate_financial_logic` valida `amount > 0`. Inconsistência: a constraint permite `0`, o trigger rejeita `0`. Isso causa erro confuso quando `amount = 0`.  
**FIX:**
```sql
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_amount_check;
ALTER TABLE financial_records ADD CONSTRAINT financial_records_amount_check CHECK (amount > 0);
```

---

### BUG-010
**SEVERIDADE:** MÉDIA  
**FALHA:** `class_logs.grade` não tem constraint de range. Notas podem ser inseridas como valores negativos ou acima de 100 sem validação no banco (apenas validação frontend).  
**FIX:**
```sql
ALTER TABLE class_logs ADD CONSTRAINT check_class_log_grade 
  CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100));
```

---

### BUG-011
**SEVERIDADE:** BAIXA  
**FALHA:** `teachers.email` e `students.email` não têm constraint UNIQUE. É possível cadastrar dois professores ou dois alunos com o mesmo email, quebrando a lógica de vinculação de profiles por email.  
**FIX:**
```sql
-- Verificar duplicatas antes de aplicar
SELECT email, COUNT(*) FROM teachers WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;
SELECT email, COUNT(*) FROM students WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;

-- Aplicar após confirmar que não há duplicatas
CREATE UNIQUE INDEX idx_teachers_email_unique ON teachers(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_students_email_unique ON students(email) WHERE email IS NOT NULL;
```

---

### BUG-012
**SEVERIDADE:** BAIXA  
**FALHA:** `class_logs.start_at` e `end_at` são `TIMESTAMPTZ` mas `class_date` é `DATE`. Não há constraint garantindo que `start_at::date = class_date`. É possível inserir uma aula com `class_date = '2024-01-01'` e `start_at = '2024-06-15 14:00'`, criando inconsistência.  
**FIX:**
```sql
ALTER TABLE class_logs ADD CONSTRAINT check_class_date_consistency 
  CHECK (start_at IS NULL OR start_at::date = class_date);
```

---

### BUG-013
**SEVERIDADE:** BAIXA  
**FALHA:** `financial_record_class_logs` não tem índice em `class_log_id`. Queries que buscam "quais cobranças estão vinculadas a esta aula" fazem full scan na tabela de junção.  
**FIX:**
```sql
CREATE INDEX idx_frcl_class_log_id ON financial_record_class_logs(class_log_id);
```

---

## Migration de Correção

Todas as correções acima estão consolidadas em:
`supabase/migrations/22_dba_fixes.sql`
