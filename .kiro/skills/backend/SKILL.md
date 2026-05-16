---
name: backend
description: >
  Boas práticas de backend para o SyncClass — hooks TanStack Query, mutations, Supabase,
  Postgres, índices, RLS, schema design e queries performáticas. Ativar ao trabalhar em
  src/hooks/, src/integrations/ ou supabase/. Trigger: "hook", "query", "mutation",
  "supabase", "banco", "RLS", "migration", "SQL".
---

# Senior Backend — Supabase & Hooks

Backend é 100% Supabase (PostgreSQL + Auth + Storage + Real-time). Toda comunicação passa por `src/hooks/`.

## Padrão de Hook com Query

```ts
export const useStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ['students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, status, teacher_id')
        .eq('teacher_id', teacherId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000,
  });
};
```

## Padrão de Mutation

```ts
export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StudentInsert) => {
      const { data: result, error } = await supabase
        .from('students').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar aluno.'),
  });
};
```

## Queries

```ts
// Selecionar apenas colunas necessárias
supabase.from('students').select('id, name, email') // não select('*')

// .single() quando espera um registro, .maybeSingle() quando pode ser null
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).single();
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).maybeSingle();

// Paginação para listas grandes
const { data } = await supabase
  .from('class_logs')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('class_date', { ascending: false });

// RPCs para operações complexas
const { data } = await supabase.rpc('create_class_package', {
  p_teacher_id: teacherId,
  p_student_id: studentId,
  p_classes: classesArray,
  p_financial: financialData,
});
```

## Real-time

```ts
const channel = supabase
  .channel('financial-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'financial_records',
    filter: `student_id=eq.${studentId}`
  }, handleUpdate)
  .subscribe();

// Sempre limpar
return () => supabase.removeChannel(channel);
```

## Tratamento de Erros

```ts
const { data, error } = await supabase.from('students').select('*').single();
if (error) throw error;
if (!data) throw new Error('Não encontrado');
return data;
```

---

# Postgres — Boas Práticas

## Índices

Índices existentes (não recriar):
- `idx_students_teacher_id`
- `idx_financial_records_student_id`
- `idx_class_logs_teacher_date`
- `idx_activities_student_id`

Ao criar nova tabela, sempre indexar FKs e colunas de ORDER BY:
```sql
CREATE INDEX idx_nova_tabela_teacher_id ON nova_tabela(teacher_id);
CREATE INDEX idx_nova_tabela_created_at ON nova_tabela(created_at DESC);
```

## RLS

```sql
-- Sempre habilitar em novas tabelas
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- Policy para teacher
CREATE POLICY "teacher_own_data" ON nova_tabela
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT teacher_id FROM profiles WHERE user_id = auth.uid()));

-- Policy para admin
CREATE POLICY "admin_all" ON nova_tabela
  FOR ALL TO authenticated
  USING ((SELECT is_admin()));
```

**CRÍTICO:** `is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita.

## Schema Design

- PKs sempre UUID: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ`
- Status como TEXT com CHECK: `CHECK (status IN ('ativo', 'inativo'))`
- Valores monetários: `NUMERIC(10,2)` não `FLOAT`

## Views Existentes (usar em vez de queries complexas)

- `students_with_stats` — alunos com total de aulas e valores do mês
- `students_active` — alunos ativos
- `class_logs_with_billing` — aulas com valores calculados

Views têm `SECURITY INVOKER` — herdam permissões do usuário autenticado.

## Funções

```sql
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
- ❌ N+1 queries
- ❌ Funções sem `SET search_path`
- ❌ Tabelas sem RLS
- ❌ PKs sequenciais (INTEGER/SERIAL) — usar UUID
- ❌ Supabase direto em componentes
- ❌ Ignorar o objeto `error`
- ❌ `useState` para server state
- ❌ `useEffect` para data fetching
- ❌ Cálculos no frontend que poderiam ser views/funções no banco
