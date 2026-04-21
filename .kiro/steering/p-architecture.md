---
inclusion: always
description: Separação de responsabilidades, padrões de componentes, TanStack Query, mutations, formulários e queries Supabase
---

# Arquitetura e Padrões do Projeto

## Separação de Responsabilidades

```
Components → Hooks → Services (Supabase client) → Banco
```

- **Components**: apenas UI, delega lógica para hooks
- **Hooks**: lógica de negócio, TanStack Query, mutations
- **Contexts**: AuthContext para estado global de auth
- Nunca chamar Supabase diretamente em componentes

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

## Supabase — Padrão de Query

```ts
// ✅ Sempre verificar error antes de usar data
const { data, error } = await supabase.from('students').select('*').single();
if (error) throw error;
if (!data) throw new Error('Não encontrado');
return data;
```

## Anti-patterns

- ❌ Supabase direto em componentes
- ❌ `useEffect` para data fetching
- ❌ Lógica de negócio no JSX
- ❌ Class components
- ❌ Prop drilling (usar composição)
- ❌ Validação manual sem Zod
