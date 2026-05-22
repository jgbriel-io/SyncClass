---
inclusion: always
description: Separação de responsabilidades, padrões de componentes, TanStack Query, mutations, formulários e queries Supabase
---

# Arquitetura e Padrões do Projeto

## Separação de Responsabilidades

```
Components → Hooks (queries + services) → Supabase client → Banco
```

- **Components**: apenas UI, delega lógica para hooks
- **Hooks**: TanStack Query + mutations em `src/hooks/use*.ts`
- **Services**: lógica de domínio em `src/hooks/*Service.ts` (convivem com hooks — não existe pasta `src/lib/services/`)
- **Contexts**: AuthContext para estado global de auth
- Nunca chamar Supabase diretamente em componentes

Exemplos de services existentes: `classLogsService.ts`, `financialRecordsService.ts`, `activitiesService.ts`, `teachersService.ts`, `inviteUserService.ts`.

## Componentes

```tsx
// ✅ Early returns, sem ternários aninhados
const TeacherStudentsPage = () => {
  const { data, isLoading } = useStudents(teacherId);

  if (isLoading) return <Loader2 className="animate-spin" />;
  if (!data?.length) return <EmptyState />;
  return <StudentsListView students={data} />;
};
```

- Functional components, arrow functions
- Máximo ~150 linhas — extrair se crescer
- Props desestruturadas na assinatura

## Data Fetching — TanStack Query

```ts
// ✅ hooks/useStudents.ts
export const useStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ['students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', teacherId);
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000,
  });
};
```

- Nunca `useEffect` para buscar dados
- Query keys: `['students', teacherId]`, `['financial', studentId]`, `['activities', teacherId]`
- Sempre tratar: loading → skeleton, error → mensagem, empty → empty state

## Mutations

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

### Wrappers de Mutation do Projeto

Antes de escrever `useMutation` cru, verificar wrappers existentes:

- `useOptimisticMutation` — atualização otimista (rollback automático em erro). Usar para edições inline, toggles e ações onde feedback instantâneo importa.
- `useRetryMutation` — retry com backoff exponencial. Usar para operações flaky (rede instável, locks transitórios).

## Formulários — React Hook Form + Zod

```tsx
const schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  pay_day: z.number().min(1).max(31),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

- Erros em português, próximos ao input, usando `text-destructive`
- Formulários são Dialogs/Modals — não criar rotas separadas para forms

## Supabase — Padrões de Query

```ts
// Verificar error sempre antes de usar data
const { data, error } = await supabase.from('students').select('*').single();
if (error) throw error;
if (!data) throw new Error('Não encontrado');
return data;

// .single() → lança erro se não encontrar (espera exatamente 1 registro)
// .maybeSingle() → retorna null se não encontrar (registro opcional)
const { data } = await supabase.from('profiles').select('role').eq('user_id', id).maybeSingle();

// Paginação obrigatória para listas grandes
const { data } = await supabase
  .from('class_logs')
  .select('id, class_date, duration, student_id')
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('class_date', { ascending: false });

// RPC para operações complexas (preferir ao invés de múltiplas queries)
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

// Sempre limpar no cleanup — sem isso vaza conexão
return () => supabase.removeChannel(channel);
```

## Anti-patterns

- ❌ Supabase direto em componentes
- ❌ `useEffect` para data fetching
- ❌ Lógica de negócio no JSX
- ❌ Class components
- ❌ Prop drilling (usar composição)
- ❌ Validação manual sem Zod
- ❌ `.single()` quando registro pode não existir (usar `.maybeSingle()`)
- ❌ Real-time subscription sem cleanup
