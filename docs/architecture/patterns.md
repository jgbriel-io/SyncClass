# Design Patterns

Padrões de design aplicados no SyncClass com exemplos práticos e quando usar cada um.

## Índice

- [Quando usar este documento](#quando-usar-este-documento)
- [Singleton](#singleton)
- [Strategy](#strategy)
- [Template Method](#template-method)
- [Repository](#repository)
- [Factory](#factory)
- [Observer](#observer)
- [Quando NÃO usar estes padrões](#quando-não-usar-estes-padrões)

## Quando usar este documento

**Use quando:**

- Adicionar nova feature e precisar escolher padrão adequado
- Fazer code review e identificar oportunidades de aplicar padrões
- Refatorar código com lógica duplicada ou complexa
- Onboarding — entender decisões de design

**Não use quando:**

- Procurar padrões de UI/componentes → `docs/frontend/overview.md`
- Procurar padrões de segurança → `docs/security/overview.md`
- Procurar padrões de banco → `docs/database/overview.md`

---

## Singleton

**Propósito:** Garantir uma única instância compartilhada globalmente.

**Aplicação:** Supabase client

**Arquivo:** `src/integrations/supabase/client.ts:8`

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Por que Singleton aqui:**

- Evita múltiplas conexões WebSocket (real-time)
- Compartilha cache de autenticação (JWT)
- Reduz overhead de inicialização

**Quando usar:**

- Clients de API (Supabase, Axios, fetch wrapper)
- Gerenciadores de estado global (AuthContext)
- Serviços de logging/monitoring

**Quando NÃO usar:**

- Componentes React (cada instância deve ser independente)
- Utilitários sem estado (funções puras)
- Testes (dificulta mock — preferir injeção de dependência)

---

## Strategy

**Propósito:** Encapsular algoritmos intercambiáveis e escolher em runtime.

**Aplicação:** Mutation wrappers (Optimistic vs Retry)

**Arquivos:**

- `src/hooks/useOptimisticMutation.ts:12`

> `useRetryMutation` é padrão conceitual — não implementado como hook separado.

```ts
// Strategy 1: Optimistic (feedback instantâneo)
const mutation = useOptimisticMutation({
  mutationFn: updateStudent,
  queryKey: ["students", studentId],
  optimisticUpdate: (old, variables) => ({ ...old, ...variables }),
});

// Strategy 2: Retry (operações flaky)
const mutation = useRetryMutation({
  mutationFn: confirmPayment,
  maxRetries: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
});
```

**Quando usar Optimistic:**

- Edições inline (nome, email, telefone)
- Toggles (ativo/inativo, pago/pendente)
- Ações onde feedback instantâneo importa

**Quando usar Retry:**

- Operações de rede instável (webhooks, integrações externas)
- Locks transitórios no banco (concurrent updates)
- Operações idempotentes (pagamentos, confirmações)

**Quando NÃO usar:**

- Operações destrutivas (delete) — sem retry
- Operações não idempotentes sem chave de idempotência
- Mutations simples sem requisitos especiais (usar `useMutation` cru)

---

## Template Method

**Propósito:** Definir esqueleto de algoritmo, delegando passos específicos para subclasses.

**Aplicação:** Mutation wrappers base

**Arquivo:** `src/hooks/useOptimisticMutation.ts:12`

```ts
export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  onSuccess,
  onError,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,

    // Template: passos fixos
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      // Passo customizável
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (old) =>
          optimisticUpdate(old, variables)
        );
      }

      return { previous };
    },

    onError: (err, variables, context) => {
      // Rollback automático
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      onError?.(err, variables, context);
    },

    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.(data, variables, context);
    },
  });
}
```

**Quando usar:**

- Lógica com passos fixos + pontos de extensão
- Evitar duplicação de boilerplate (onMutate, onError, onSuccess)
- Garantir consistência (sempre fazer rollback em erro)

**Quando NÃO usar:**

- Lógica completamente diferente entre casos (usar Strategy)
- Apenas 1-2 usos (abstrair prematuramente)

---

## Repository

**Propósito:** Abstrair acesso a dados, isolando lógica de persistência.

**Aplicação:** Data fetching hooks

**Arquivo:** `src/hooks/useStudents.ts:12`

```ts
// Repository pattern via TanStack Query
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

// Uso no componente (não sabe de Supabase)
const { data: students, isLoading } = useStudents(teacherId);
```

**Quando usar:**

- Toda busca de dados do servidor
- Isolar componentes de detalhes de persistência
- Facilitar testes (mock do hook, não do Supabase)

**Quando NÃO usar:**

- Estado local (useState, useReducer)
- Dados derivados (useMemo)
- Lógica de UI pura

---

## Factory

**Propósito:** Criar objetos sem expor lógica de criação.

**Aplicação:** Error handlers

**Arquivo:** `src/lib/security/errorHandler.ts:78`

```ts
export function createErrorHandler(context: string) {
  return (error: unknown): never => {
    const sanitized = sanitizeErrorMessage(error);
    const message = `[${context}] ${sanitized}`;

    console.error(message, error);
    throw new Error(sanitized);
  };
}

// Uso
const handleStudentError = createErrorHandler("useStudents");

try {
  await supabase.from("students").select("*");
} catch (error) {
  handleStudentError(error);
}
```

**Quando usar:**

- Criar objetos com configuração complexa
- Encapsular lógica de inicialização
- Reutilizar padrões de criação

**Quando NÃO usar:**

- Objetos simples (usar literal `{}`)
- Apenas 1 uso (inline é mais claro)

---

## Observer

**Propósito:** Notificar múltiplos observadores sobre mudanças de estado.

**Aplicação:** Real-time subscriptions

**Arquivo:** `src/hooks/useFinancialRecords.ts:456`

```ts
export const useFinancialRecordsRealtime = (teacherId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("financial-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "financial_records",
          filter: `student_id=in.(SELECT id FROM students WHERE teacher_id=${teacherId})`,
        },
        (payload) => {
          // Observer notificado
          queryClient.invalidateQueries({ queryKey: ["financial"] });
          toast.info("Cobrança atualizada");
        }
      )
      .subscribe();

    // Cleanup obrigatório
    return () => supabase.removeChannel(channel);
  }, [teacherId, queryClient]);
};
```

**Quando usar:**

- Sincronização real-time (chat, notificações, dashboards)
- Múltiplos componentes precisam reagir ao mesmo evento
- Desacoplamento (publisher não conhece subscribers)

**Quando NÃO usar:**

- Polling é suficiente (refetch a cada 30s)
- Apenas 1 observador (callback direto)
- Dados raramente mudam (cache com staleTime longo)

**Cuidados:**

- Sempre limpar subscription no cleanup (`removeChannel`)
- Filtrar no servidor (RLS + filter) para evitar vazamento de dados
- Considerar custo (conexão WebSocket permanente)

---

## Quando NÃO usar estes padrões

### Abstrair prematuramente

```ts
// ❌ Factory para objeto simples
const createStudent = (name: string) => ({ name, active: true });

// ✅ Literal direto
const student = { name: "João", active: true };
```

### Singleton para tudo

```ts
// ❌ Singleton desnecessário
export const dateFormatter = new Intl.DateTimeFormat("pt-BR");

// ✅ Função pura
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR").format(date);
```

### Repository sem benefício

```ts
// ❌ Repository para estado local
const useCounter = () => {
  return useQuery({
    queryKey: ["counter"],
    queryFn: () => localStorage.getItem("counter"),
  });
};

// ✅ useState direto
const [counter, setCounter] = useState(0);
```

### Observer para evento único

```ts
// ❌ Observer para 1 listener
const emitter = new EventEmitter();
emitter.on("save", handleSave);
emitter.emit("save");

// ✅ Callback direto
handleSave();
```

## Ver também

- [Architecture Overview](./overview.md) — Visão geral da arquitetura
- [Flows](./flows.md) — Fluxos de requisição e autenticação
- [Decisions](./decisions.md) — Por que estes padrões foram escolhidos
- [Technical Debt](./technical-debt.md) — Onde padrões não foram aplicados corretamente
