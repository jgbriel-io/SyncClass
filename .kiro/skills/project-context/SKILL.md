---
name: project-context
description: >
  Contexto completo do projeto SyncClass/JLAC English School — stack, roles, estrutura de pastas,
  design tokens, arquitetura, padrões de código e comportamento do assistente.
  Ativar em toda conversa sobre o projeto. Trigger: "contexto do projeto", "project context",
  ou qualquer tarefa de desenvolvimento no SyncClass.
---

# Projeto — JLAC English School Platform

Plataforma SaaS para gestão de escola de inglês. Professores gerenciam alunos, aulas, cobranças e atividades. Alunos acessam suas informações e entregam atividades. Admin tem visão global.

## Stack

- React 18 + TypeScript + Vite (porta 8080)
- Tailwind CSS + shadcn/ui (Radix UI)
- React Router v6
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- TanStack Query — data fetching
- React Hook Form + Zod — formulários
- Lucide React — ícones
- Sonner — toasts
- Deploy: Cloudflare Pages

Variáveis obrigatórias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Roles

- `admin` → acesso total, gerencia professores e usuários
- `teacher` → gerencia seus próprios alunos, aulas, cobranças e atividades
- `student` → acessa suas próprias informações, entrega atividades, paga cobranças

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/           # shadcn/ui
│   ├── students/     # StudentsListView, StudentFormDialog, StudentsTableRow
│   ├── admin/        # StudentDetailSheet, componentes admin
│   ├── auth/         # AuthRedirect, ChangePasswordDialog
│   ├── layout/       # AdminShell, TeacherShell, StudentShell
│   └── security/     # errorHandler
├── pages/
│   ├── admin/        # Dashboard, Students, Teachers, Financial, Classes, Activities, Users
│   ├── teacher/      # TeacherHome, TeacherStudents, TeacherFinancial, TeacherClasses, TeacherActivities
│   └── student/      # StudentHome, StudentFinancial, StudentActivities, StudentHistory
├── hooks/            # useStudents, useTeachers, useFinancial, useActivities, useClassLogs...
├── contexts/         # AuthContext
├── integrations/
│   └── supabase/     # client.ts, types gerados
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize()
    └── security/      # errorHandler.ts
```

## Convenções

- TypeScript: `noImplicitAny: false`, `strictNullChecks: false`
- Path alias: `@/*` → `./src/*`
- Componentes: PascalCase
- Hooks: camelCase com prefixo `use`
- Idioma: código em inglês, comentários e UI em português brasileiro

## Design Tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'

<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

## Particularidades

- Formulários são Dialogs/Modals, não rotas separadas
- Inputs usam `id` (não `name`) para identificação
- Polling contínuo via Supabase realtime — não usar `networkidle` em testes
- `is_admin()` DEVE ter `SECURITY DEFINER` para evitar recursão com RLS

---

# Arquitetura e Padrões

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

---

# Comportamento do Assistente

## Princípios

- Mudanças mínimas e precisas — não reescrever código que funciona
- Consistência > perfeição — seguir padrões existentes
- Reutilizar > reinventar — verificar hooks/componentes existentes antes de criar
- Nunca criar arquivos `.md` sem solicitação explícita

## Ao Editar

- Preservar estrutura existente
- Não refatorar partes não relacionadas ao pedido
- Verificar se já existe algo similar antes de criar
- Não introduzir novas bibliotecas sem justificativa

## Ao Criar

- Seguir padrões existentes no projeto
- Reutilizar hooks, componentes e utilitários existentes
- Usar apenas o que está no `package.json`

## Comentários

- Sempre em português
- Explicar o POR QUÊ, não o QUÊ
- Apenas em lógica complexa

## Mapeamento de Intenções

**"tá quebrado" / "não funciona" / "bugou"**
→ Identificar parte afetada, ler código ao redor, diagnosticar (estado, null checks, async, RLS), aplicar fix mínimo.

**"melhora isso" / "refatora"**
→ Simplificar lógica, remover duplicação, melhorar nomes. Preservar comportamento exatamente.

**"faz isso funcionar"**
→ Identificar peças faltando, completar implementação, garantir integração com hooks/query/supabase.

**"isso tá feio"**
→ Melhorar spacing, hierarquia, legibilidade. Usar Tailwind + shadcn + design-tokens. Não redesenhar tudo.

**"otimiza"**
→ Remover re-renders, evitar estado inútil, simplificar lógica antes de otimizar.

**"faz do jeito certo"**
→ Mover lógica para hooks, usar TanStack Query, remover anti-patterns, alinhar com arquitetura.

Sempre inferir intenção antes de codar. Não fazer perguntas desnecessárias se a intenção está clara.
