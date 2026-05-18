---
inclusion: fileMatch
fileMatchPattern: ['src/integrations/**', 'src/hooks/**', 'supabase/**']
description: Padrões Supabase/Postgres para SyncClass — índices existentes, RLS, schema design, views e queries performáticas
---

# Database Patterns — SyncClass

## Queries

**Selecionar apenas colunas necessárias:**
```ts
// ❌
supabase.from('students').select('*')

// ✅
supabase.from('students').select('id, name, email, status, teacher_id')
```

**`.single()` vs `.maybeSingle()`:**
```ts
// .single() → lança erro se não encontrar (espera exatamente 1 registro)
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).single();

// .maybeSingle() → retorna null se não encontrar (registro opcional)
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).maybeSingle();
```

**Paginação para listas grandes:**
```ts
const { data } = await supabase
  .from('class_logs')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('class_date', { ascending: false });
```

**RPCs para operações complexas:**
```ts
// RPC em vez de múltiplas queries
const { data } = await supabase.rpc('create_class_package', {
  p_teacher_id: teacherId,
  p_student_id: studentId,
  p_classes: classesArray,
  p_financial: financialData,
});

// RPCs financeiras idempotentes
supabase.rpc('mark_as_paid_idempotent', { ... })
supabase.rpc('confirm_payment_idempotent', { ... })
supabase.rpc('undo_payment_idempotent', { ... })
```

## Índices Existentes (não recriar)

- `idx_students_teacher_id` — students por teacher
- `idx_financial_records_student_id` — cobranças por aluno
- `idx_class_logs_teacher_date` — aulas por professor e data
- `idx_activities_student_id` — atividades por aluno

Ao criar nova tabela, sempre indexar FKs usadas em WHERE/JOIN:
```sql
CREATE INDEX idx_nova_tabela_teacher_id ON nova_tabela(teacher_id);
CREATE INDEX idx_nova_tabela_student_id ON nova_tabela(student_id);
CREATE INDEX idx_nova_tabela_created_at ON nova_tabela(created_at DESC);
```

## RLS

```sql
-- Sempre habilitar em novas tabelas
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- Policy padrão para teacher
CREATE POLICY "teacher_own_data" ON nova_tabela
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT teacher_id FROM profiles WHERE user_id = auth.uid()));

-- Policy padrão para admin
CREATE POLICY "admin_all" ON nova_tabela
  FOR ALL TO authenticated
  USING ((SELECT is_admin()));
```

**CRÍTICO:** `is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita e HTTP 500.

## Schema Design

- PKs sempre UUID: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ` (preferir a `is_deleted BOOLEAN`)
- Status como TEXT com CHECK: `CHECK (status IN ('ativo', 'inativo'))`
- Valores monetários: `NUMERIC(10,2)` — nunca `FLOAT`

## Views Existentes (usar em vez de queries complexas)

- `students_with_stats` — alunos com total de aulas e valores do mês
- `students_active` — alunos ativos
- `class_logs_with_billing` — aulas com valores calculados
- `teachers_with_pix_restricted` — dados PIX (admin only)

Views têm `SECURITY INVOKER` — herdam permissões do usuário autenticado.

## Funções SQL

```sql
-- Sempre definir search_path para segurança
CREATE OR REPLACE FUNCTION minha_funcao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- lógica
END;
$$;
```

## Anti-patterns

- ❌ `SELECT *` em tabelas grandes
- ❌ N+1 queries (buscar lista e depois cada item — usar JOIN)
- ❌ Funções sem `SET search_path`
- ❌ Tabelas sem RLS
- ❌ PKs sequenciais (INTEGER/SERIAL) — usar UUID
- ❌ Cálculos no frontend que poderiam ser views/funções no banco
- ❌ `.single()` quando registro pode ser null (usar `.maybeSingle()`)
