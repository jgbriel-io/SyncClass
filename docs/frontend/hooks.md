# Hooks e Services

TanStack Query, mutations e services. 45 hooks customizados.

## Índice

- [Quando usar](#quando-usar)
- [Padrão Repository](#padrão-repository)
- [Hooks de data fetching](#hooks-de-data-fetching)
- [Mutation wrappers](#mutation-wrappers)
- [Services de domínio](#services-de-domínio)
- [Hooks utilitários](#hooks-utilitários)
- [Convenções de criação](#convenções-de-criação)
- [Ver também](#ver-também)

## Quando usar

**Use hook quando:**

- Data fetching (TanStack Query)
- Mutations (create, update, delete)
- Lógica de negócio reutilizável
- Estado compartilhado entre componentes

**Não use quando:**

- Lógica de apresentação (mover para componente)
- Estado local de componente (usar `useState`)
- Efeitos colaterais simples (usar `useEffect` direto)

## Padrão Repository

**Conceito:** Hooks encapsulam acesso ao Supabase. Componentes nunca chamam Supabase diretamente.

**Fluxo:**

```
Component → Hook (TanStack Query) → Supabase Client → Banco
```

**Exemplo:**

```tsx
// ✅ CORRETO - Hook encapsula Supabase
// src/hooks/useStudents.ts
export const useStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ["students", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("teacher_id", teacherId);
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000,
  });
};

// src/components/students/StudentsListView.tsx
export function StudentsListView() {
  const { data, isLoading } = useStudents(teacherId);

  if (isLoading) return <Skeleton />;
  return <Table data={data} />;
}

// ❌ ERRADO - Componente chama Supabase direto
export function StudentsListView() {
  const [data, setData] = useState([]);

  useEffect(() => {
    supabase
      .from("students")
      .select("*")
      .then(({ data }) => setData(data));
  }, []);

  return <Table data={data} />;
}
```

## Hooks de data fetching

**Localização:** `src/hooks/use*.ts`

### Students

| Hook                              | Responsabilidade                |
| --------------------------------- | ------------------------------- |
| `useStudents(teacherId)`          | Lista alunos do professor       |
| `useStudentsByTeacher(teacherId)` | Alias de useStudents            |
| `useStudentDetails(studentId)`    | Detalhes de 1 aluno             |
| `useStudentsStats(teacherId)`     | Stats (total, ativos, inativos) |

**Exemplo:**

```tsx
const { data: students, isLoading } = useStudents(teacherId);
const { data: student } = useStudentDetails(studentId);
const { data: stats } = useStudentsStats(teacherId);
```

### Financial

| Hook                              | Responsabilidade            |
| --------------------------------- | --------------------------- |
| `useFinancialRecords(filters)`    | Lista cobranças com filtros |
| `useStudentStatement(studentId)`  | Extrato do aluno            |
| `useForecastedBilling(teacherId)` | Previsão de faturamento     |

**Exemplo:**

```tsx
const { data: records } = useFinancialRecords({ teacherId, status: "pending" });
const { data: statement } = useStudentStatement(studentId);
const { data: forecast } = useForecastedBilling(teacherId);
```

### Activities

| Hook                                 | Responsabilidade             |
| ------------------------------------ | ---------------------------- |
| `useActivities(filters)`             | Lista atividades com filtros |
| `useActivityFileActions(activityId)` | Upload/download de arquivos  |

**Exemplo:**

```tsx
const { data: activities } = useActivities({ teacherId, status: "pending" });
const { upload, download } = useActivityFileActions(activityId);
```

### Classes

| Hook                         | Responsabilidade        |
| ---------------------------- | ----------------------- |
| `useClassLogs(filters)`      | Lista aulas com filtros |
| `useTodayClasses(teacherId)` | Aulas de hoje           |
| `usePackageClassesForm()`    | Form de pacote de aulas |

**Exemplo:**

```tsx
const { data: classes } = useClassLogs({ teacherId, studentId });
const { data: todayClasses } = useTodayClasses(teacherId);
const { form, submit } = usePackageClassesForm();
```

### Teachers

| Hook                             | Responsabilidade            |
| -------------------------------- | --------------------------- |
| `useTeachers()`                  | Lista professores (admin)   |
| `useTeacherId()`                 | ID do professor autenticado |
| `useTeacherDashboard(teacherId)` | Dashboard do professor      |

**Exemplo:**

```tsx
const { data: teachers } = useTeachers();
const teacherId = useTeacherId();
const { data: dashboard } = useTeacherDashboard(teacherId);
```

### Users

| Hook                         | Responsabilidade               |
| ---------------------------- | ------------------------------ |
| `useUsers()`                 | Lista usuários (admin)         |
| `useProfiles()`              | Lista profiles                 |
| `useActiveUserCheck(userId)` | Verifica se usuário está ativo |

**Exemplo:**

```tsx
const { data: users } = useUsers();
const { data: profiles } = useProfiles();
const { isActive } = useActiveUserCheck(userId);
```

### Dashboard

| Hook                           | Responsabilidade   |
| ------------------------------ | ------------------ |
| `useDashboardStats(teacherId)` | Stats do dashboard |
| `useStudentPortal(studentId)`  | Portal do aluno    |

**Exemplo:**

```tsx
const { data: stats } = useDashboardStats(teacherId);
const { data: portal } = useStudentPortal(studentId);
```

## Mutation wrappers

**Localização:** `src/hooks/useOptimisticMutation.ts`

### useOptimisticMutation

**Responsabilidade:** Atualização otimista com rollback automático em erro.

**Quando usar:**

- Edições inline (toggle status, rename)
- Ações onde feedback instantâneo importa
- UX crítica (não esperar servidor)

**Exemplo:**

```tsx
// src/hooks/useStudents.ts
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async (data: StudentUpdate) => {
      const { data: result, error } = await supabase
        .from("students")
        .update(data)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onMutate: async (newData) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: ["students"] });

      // Snapshot do estado anterior
      const previous = queryClient.getQueryData(["students"]);

      // Atualização otimista
      queryClient.setQueryData(["students"], (old: Student[]) =>
        old.map((s) => (s.id === newData.id ? { ...s, ...newData } : s))
      );

      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback automático
      queryClient.setQueryData(["students"], context.previous);
      toast.error("Erro ao atualizar aluno.");
    },
    onSuccess: () => {
      toast.success("Aluno atualizado com sucesso!");
    },
  });
};
```

**Testes:** `src/hooks/useOptimisticMutation.test.tsx` (12 testes)

### useRetryMutation (não implementado ainda)

**Responsabilidade:** Retry com backoff exponencial.

**Quando usar:**

- Operações flaky (rede instável)
- Locks transitórios (concurrent updates)
- Timeouts ocasionais

**Exemplo (futuro):**

```tsx
export const useCreateStudent = () => {
  return useRetryMutation({
    mutationFn: async (data: StudentInsert) => {
      const { data: result, error } = await supabase
        .from("students")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    retries: 3,
    backoff: "exponential", // 1s, 2s, 4s
    onSuccess: () => toast.success("Aluno criado!"),
    onError: () => toast.error("Erro ao criar aluno."),
  });
};
```

## Services de domínio

**Localização:** `src/hooks/*Service.ts`

**Conceito:** Lógica de negócio complexa que não cabe em hook simples.

### classLogsService

**Responsabilidade:** Operações complexas de aulas (pacotes, attendance).

**Arquivo:** `src/hooks/classLogsService.ts`

**Funções:**

- `createClassPackage(teacherId, studentId, classes, financial)` — Cria pacote de aulas + cobrança
- `markAttendance(classId, attendance)` — Marca presença/falta
- `calculateClassStats(classes)` — Calcula stats (total, presentes, faltas)

**Exemplo:**

```tsx
import { createClassPackage } from "@/hooks/classLogsService";

const handleCreatePackage = async () => {
  await createClassPackage(teacherId, studentId, classes, financial);
  toast.success("Pacote criado!");
};
```

### financialRecordsService

**Responsabilidade:** Operações financeiras (pagamento, estorno).

**Arquivo:** `src/hooks/financialRecordsService.ts`

**Funções:**

- `markAsPaid(recordId, paymentDate, proofUrl)` — Marca como pago (idempotente)
- `confirmPayment(recordId)` — Confirma pagamento (admin)
- `undoPayment(recordId)` — Estorna pagamento
- `calculateBalance(records)` — Calcula saldo

**Exemplo:**

```tsx
import { markAsPaid } from "@/hooks/financialRecordsService";

const handlePayment = async () => {
  await markAsPaid(recordId, new Date(), proofUrl);
  toast.success("Pagamento registrado!");
};
```

### activitiesService

**Responsabilidade:** Operações de atividades (entrega, correção).

**Arquivo:** `src/hooks/activitiesService.ts`

**Funções:**

- `deliverActivity(activityId, fileUrl, notes)` — Entrega atividade (aluno)
- `correctActivity(activityId, grade, feedback)` — Corrige atividade (professor)
- `calculateActivityStats(activities)` — Calcula stats (entregues, corrigidas, pendentes)

**Exemplo:**

```tsx
import { deliverActivity } from "@/hooks/activitiesService";

const handleDeliver = async () => {
  await deliverActivity(activityId, fileUrl, notes);
  toast.success("Atividade entregue!");
};
```

### teachersService

**Responsabilidade:** Operações de professores (PIX, stats).

**Arquivo:** `src/hooks/teachersService.ts`

**Funções:**

- `updatePixKey(teacherId, pixKey)` — Atualiza chave PIX
- `calculateTeacherStats(teacherId)` — Calcula stats (alunos, aulas, faturamento)

**Exemplo:**

```tsx
import { updatePixKey } from "@/hooks/teachersService";

const handleUpdatePix = async () => {
  await updatePixKey(teacherId, pixKey);
  toast.success("Chave PIX atualizada!");
};
```

### inviteUserService

**Responsabilidade:** Convite de usuários (Edge Function).

**Arquivo:** `src/hooks/inviteUserService.ts`

**Funções:**

- `inviteUser(email, role)` — Convida usuário (Edge Function)

**Exemplo:**

```tsx
import { inviteUser } from "@/hooks/inviteUserService";

const handleInvite = async () => {
  await inviteUser(email, "teacher");
  toast.success("Convite enviado!");
};
```

## Hooks utilitários

**Localização:** `src/hooks/use*.ts`

### useMobile

**Responsabilidade:** Detecta se é mobile (breakpoint Tailwind `md`).

**Arquivo:** `src/hooks/use-mobile.tsx`

**Exemplo:**

```tsx
const isMobile = useMobile();

return isMobile ? <MobileView /> : <DesktopView />;
```

### useDebouncedValue

**Responsabilidade:** Debounce de valor (search, filters).

**Arquivo:** `src/hooks/useDebouncedValue.ts`

**Exemplo:**

```tsx
const [search, setSearch] = useState("");
const debouncedSearch = useDebouncedValue(search, 300);

// debouncedSearch só atualiza 300ms após última mudança
useEffect(() => {
  fetchStudents(debouncedSearch);
}, [debouncedSearch]);
```

**Testes:** `src/hooks/useDebouncedValue.test.ts` (5 testes)

### useDateMask

**Responsabilidade:** Máscara de data (DD/MM/YYYY).

**Arquivo:** `src/hooks/useDateMask.ts`

**Exemplo:**

```tsx
const { value, onChange } = useDateMask();

<Input value={value} onChange={onChange} placeholder="DD/MM/YYYY" />;
```

### useToast

**Responsabilidade:** Toast notifications (Sonner).

**Arquivo:** `src/hooks/use-toast.ts`

**Exemplo:**

```tsx
import { toast } from "@/hooks/use-toast";

toast.success("Sucesso!");
toast.error("Erro!");
toast.info("Info!");
```

### useChangePassword

**Responsabilidade:** Troca de senha (must_change_password).

**Arquivo:** `src/hooks/useChangePassword.ts`

**Exemplo:**

```tsx
const { changePassword, isPending } = useChangePassword();

const handleChange = async () => {
  await changePassword(newPassword);
  toast.success("Senha alterada!");
};
```

## Convenções de criação

### Estrutura de hook

```tsx
// src/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

// Query
export const useStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ["students", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Mutation - Create
export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StudentInsert) => {
      const { data: result, error } = await supabase
        .from("students")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar aluno.");
    },
  });
};

// Mutation - Update
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StudentUpdate) => {
      const { data: result, error } = await supabase
        .from("students")
        .update(data)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar aluno.");
    },
  });
};

// Mutation - Delete
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir aluno.");
    },
  });
};
```

### Regras

1. **Query keys consistentes** — `['students', teacherId]`, `['financial', studentId]`
2. **Tipos do Supabase** — `Database['public']['Tables']['students']['Row']`
3. **Error handling** — sempre `if (error) throw error`
4. **Invalidate queries** — `queryClient.invalidateQueries({ queryKey: ['students'] })`
5. **Toast feedback** — success/error em mutations
6. **Stale time** — 2 minutos para dados que mudam pouco
7. **Enabled** — `enabled: !!param` para queries condicionais

### Anti-patterns

- ❌ `useEffect` para data fetching (usar TanStack Query)
- ❌ `useState` para dados do servidor (usar TanStack Query cache)
- ❌ Supabase direto em componentes (usar hooks)
- ❌ Mutations sem invalidate (cache desatualizado)
- ❌ Mutations sem toast (usuário não sabe se funcionou)
- ❌ Query keys inconsistentes (`['students']` vs `['student-list']`)

## Ver também

- [Frontend Overview](./overview.md) — Visão geral do frontend
- [Components](./components.md) — Uso de hooks em componentes
- [Architecture Patterns](../architecture/patterns.md) — Repository pattern
- [Backend RPCs](../backend/rpcs.md) — RPCs usados por hooks
