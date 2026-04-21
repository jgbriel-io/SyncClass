---
inclusion: fileMatch
fileMatchPattern: ['src/hooks/**', 'src/integrations/**', 'supabase/**']
description: Padrões de hooks com TanStack Query, mutations, queries Supabase, real-time e tratamento de erros
---

# Senior Backend — Supabase & Hooks

Backend é 100% Supabase (PostgreSQL + Auth + Storage + Real-time). Toda comunicação passa por `src/hooks/`.

## Padrão de Hook com Query

```ts
// src/hooks/useStudents.ts
export const useStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ['students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
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

- Selecionar apenas colunas necessárias: `.select('id, name, email')` não `.select('*')` quando possível
- `.single()` quando espera um registro, `.maybeSingle()` quando pode ser null
- Paginação com `.range(from, to)` para listas grandes
- RPCs para operações complexas: `supabase.rpc('create_class_package', { ... })`

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
// Sempre verificar error antes de usar data
const { data, error } = await supabase.from('students').select('*').single();
if (error) throw error;
if (!data) throw new Error('Não encontrado');
return data;
```

## Anti-patterns

- ❌ Supabase direto em componentes
- ❌ Ignorar o objeto `error`
- ❌ Queries N+1
- ❌ `useState` para server state
- ❌ `useEffect` para data fetching
