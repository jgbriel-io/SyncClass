# Troubleshooting

Erros comuns, diagnóstico e soluções para problemas arquiteturais no SyncClass.

## Índice

- [Quando usar este documento](#quando-usar-este-documento)
- [Erro 1: "new row violates row-level security policy"](#erro-1-new-row-violates-row-level-security-policy)
- [Erro 2: "Failed to fetch" ou "Network request failed"](#erro-2-failed-to-fetch-ou-network-request-failed)
- [Erro 3: "Invalid query key" ou cache desatualizado](#erro-3-invalid-query-key-ou-cache-desatualizado)
- [Erro 4: "Function is_admin() does not exist"](#erro-4-function-is_admin-does-not-exist)
- [Erro 5: Query lenta (>2s)](#erro-5-query-lenta-2s)
- [Ver também](#ver-também)

## Quando usar este documento

**Use quando:**

- Encontrar erro em desenvolvimento ou produção
- Query não retorna dados esperados
- Performance degradada
- Debugging de problemas arquiteturais

**Não use quando:**

- Procurar bugs funcionais → Issues do GitHub
- Procurar vulnerabilidades → `docs/security/overview.md`
- Procurar como implementar algo → `docs/architecture/patterns.md`

---

## Erro 1: "new row violates row-level security policy"

### Sintoma

```
Error: new row violates row-level security policy for table "students"
```

Ocorre ao tentar inserir/atualizar registro no Supabase.

### Causa

RLS (Row Level Security) bloqueou a operação. Possíveis razões:

1. **Usuário não tem role necessário** — Policy exige `is_teacher()` mas usuário é `student`
2. **Filtro de tenant incorreto** — Tentando inserir aluno com `teacher_id` diferente do usuário autenticado
3. **Campo obrigatório faltando** — Policy valida campo que não foi enviado
4. **JWT expirado** — Token de autenticação inválido

### Diagnóstico

**Passo 1:** Verificar role do usuário

```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("user_id", userId)
  .single();

console.log("Role:", profile?.role); // Deve ser 'teacher' ou 'admin'
```

**Passo 2:** Verificar policy no banco

```sql
-- supabase/migrations/04_rls_and_permissions.sql:89
SELECT * FROM pg_policies WHERE tablename = 'students';
```

**Passo 3:** Testar query com `EXPLAIN`

```sql
EXPLAIN (ANALYZE, VERBOSE)
INSERT INTO students (name, email, teacher_id)
VALUES ('João', 'joao@example.com', 'uuid-do-professor');
```

### Solução

**Cenário 1:** Role incorreto

```ts
// ❌ Usuário student tentando criar aluno
const { error } = await supabase.from("students").insert({ name: "João" });

// ✅ Verificar role antes
if (userRole !== "teacher" && userRole !== "admin") {
  throw new Error("Apenas professores podem criar alunos");
}
```

**Cenário 2:** Tenant incorreto

```ts
// ❌ teacher_id hardcoded ou vindo do cliente
const { error } = await supabase.from("students").insert({
  name: "João",
  teacher_id: req.body.teacherId, // ⚠️ Nunca confiar no cliente
});

// ✅ teacher_id do usuário autenticado
const teacherId = await getTeacherId(userId);
const { error } = await supabase.from("students").insert({
  name: "João",
  teacher_id: teacherId,
});
```

**Cenário 3:** Campo obrigatório faltando

```ts
// ❌ Faltando pay_day (obrigatório na policy)
const { error } = await supabase.from("students").insert({
  name: "João",
  email: "joao@example.com",
});

// ✅ Todos os campos obrigatórios
const { error } = await supabase.from("students").insert({
  name: "João",
  email: "joao@example.com",
  pay_day: 10,
  hourly_rate: 50,
});
```

**Cenário 4:** JWT expirado

```ts
// Forçar refresh do token
await supabase.auth.refreshSession();
```

### Prevenção

- Sempre validar role antes de operações sensíveis
- Buscar `teacher_id` do banco, nunca do cliente
- Usar Zod para validar campos obrigatórios antes de enviar
- Implementar refresh automático de token (já implementado em `AuthContext.tsx:78`)

**Arquivo relacionado:** `src/contexts/AuthContext.tsx:78`

---

## Erro 2: "Failed to fetch" ou "Network request failed"

### Sintoma

```
Error: Failed to fetch
TypeError: Network request failed
```

Query do Supabase falha sem detalhes.

### Causa

1. **CORS bloqueado** — Domínio não autorizado no Supabase Dashboard
2. **Supabase offline** — Serviço indisponível (raro)
3. **Variáveis de ambiente incorretas** — `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` erradas
4. **Rede instável** — Timeout ou conexão perdida

### Diagnóstico

**Passo 1:** Verificar variáveis de ambiente

```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_PUBLISHABLE_KEY
```

Devem estar definidas em `.env` (não versionado) ou `.env.example` (template).

**Passo 2:** Testar conexão direta

```bash
curl https://seu-projeto.supabase.co/rest/v1/students \
  -H "apikey: sua-chave-publica"
```

**Passo 3:** Verificar CORS no Supabase Dashboard

1. Acessar [Supabase Dashboard](https://app.supabase.com)
2. Settings → API → CORS
3. Adicionar `http://localhost:5173` (dev) e domínio de produção

### Solução

**Cenário 1:** Variáveis de ambiente faltando

```bash
# .env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

Reiniciar dev server: `npm run dev`

**Cenário 2:** CORS bloqueado

Adicionar domínio no Supabase Dashboard (Settings → API → CORS).

**Cenário 3:** Rede instável

Implementar retry com backoff exponencial:

```ts
import { useRetryMutation } from "@/hooks/useRetryMutation";

const mutation = useRetryMutation({
  mutationFn: createStudent,
  maxRetries: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
});
```

**Arquivo relacionado:** `src/hooks/useRetryMutation.ts:18`

### Prevenção

- Validar variáveis de ambiente no build (`src/integrations/supabase/env.ts:8`)
- Configurar CORS antes de deploy
- Usar `useRetryMutation` para operações críticas

---

## Erro 3: "Invalid query key" ou cache desatualizado

### Sintoma

```
Warning: Invalid query key
```

Ou: dados desatualizados após mutation (ex: criar aluno mas listagem não atualiza).

### Causa

1. **Query key inconsistente** — Invalidação usa key diferente da query
2. **Invalidação não chamada** — `onSuccess` sem `invalidateQueries`
3. **Query key dinâmica** — Filtros/paginação não incluídos na key

### Diagnóstico

**Passo 1:** Verificar query key na query

```ts
// src/hooks/useStudents.ts:12
export const useStudents = (teacherId: string) => {
  return useQuery({
    queryKey: ["students", teacherId], // ← Key usada
    queryFn: fetchStudents,
  });
};
```

**Passo 2:** Verificar invalidação na mutation

```ts
// src/hooks/useStudents.ts:187
export const useCreateStudent = () => {
  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] }); // ← Key invalidada
    },
  });
};
```

**Passo 3:** Verificar TanStack Query DevTools

Abrir DevTools (ícone no canto inferior direito) e verificar:

- Queries ativas
- Cache entries
- Invalidações recentes

### Solução

**Cenário 1:** Query key inconsistente

```ts
// ❌ Query usa ['students', teacherId], invalidação usa ['students']
queryClient.invalidateQueries({ queryKey: ["students"] });

// ✅ Invalidar com prefixo (invalida todas as variações)
queryClient.invalidateQueries({ queryKey: ["students"] });
// Ou invalidar exata
queryClient.invalidateQueries({ queryKey: ["students", teacherId] });
```

**Cenário 2:** Invalidação não chamada

```ts
// ❌ Sem invalidação
export const useCreateStudent = () => {
  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      toast.success("Aluno criado!");
    },
  });
};

// ✅ Com invalidação
export const useCreateStudent = () => {
  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno criado!");
    },
  });
};
```

**Cenário 3:** Query key dinâmica

```ts
// ❌ Filtros não incluídos na key
export const useStudents = (teacherId: string, filters: Filters) => {
  return useQuery({
    queryKey: ["students", teacherId], // ⚠️ Faltando filters
    queryFn: () => fetchStudents(teacherId, filters),
  });
};

// ✅ Filtros incluídos
export const useStudents = (teacherId: string, filters: Filters) => {
  return useQuery({
    queryKey: ["students", teacherId, filters],
    queryFn: () => fetchStudents(teacherId, filters),
  });
};
```

### Prevenção

- Centralizar query keys em `src/lib/queryKeys.ts` (pendente ARQ-003)
- Sempre incluir parâmetros dinâmicos na query key
- Usar TanStack Query DevTools para debug

**Débito técnico relacionado:** `docs/architecture/technical-debt.md` → ARQ-003

---

## Erro 4: "Function is_admin() does not exist"

### Sintoma

```
Error: function is_admin() does not exist
HTTP 500 Internal Server Error
```

Ocorre ao tentar acessar rota admin ou executar query que usa `is_admin()`.

### Causa

Pode ter duas origens:

1. Função `is_admin()` **não tem** `SECURITY DEFINER` — executa com permissões do usuário, causando recursão infinita com RLS.
2. Corpo da função incorreto — versão antiga usava `FROM user_roles` (tabela removida na migration 45) ou `FROM teachers WHERE id = auth.uid()` (nunca coincide com auth UUID).

### Diagnóstico

**Passo 1:** Verificar que a função existe e tem SECURITY DEFINER

```sql
SELECT proname, prosecdef, prosrc
FROM pg_proc
WHERE proname IN ('is_admin', 'is_teacher', 'is_student')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
-- prosecdef deve ser 't'; prosrc deve referenciar profiles, não user_roles
```

**Passo 2:** Testar com JWT simulado

```sql
SELECT set_config('request.jwt.claims', '{"sub":"<user_id>","role":"authenticated"}', true);
SELECT is_admin(), is_teacher();
```

### Solução

**Recriar funções com implementação correta (migration 52):**

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id::text = (auth.uid())::text
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id::text = (auth.uid())::text
    AND role = 'teacher'
  );
$$;
```

> ⚠️ Cast `::text` obrigatório — `profiles.user_id` é `varchar`, `auth.uid()` retorna `uuid`. Sem cast, comparação retorna NULL silenciosamente.

### Prevenção

- Sempre usar `SECURITY DEFINER` em funções que acessam tabelas com RLS
- Usar `::text` cast em comparações com `auth.uid()`
- Verificar corpo da função no banco com `SELECT prosrc FROM pg_proc WHERE proname = 'is_teacher'` após cada migration

**Arquivo relacionado:** `supabase/migrations/52_fix_is_teacher_is_admin_correct_profiles_lookup.sql`

---

## Erro 5: Query lenta (>2s)

### Sintoma

Query demora >2s para retornar, causando loading prolongado na UI.

### Causa

1. **N+1 queries** — Busca relacionamentos em loop
2. **Agregação no cliente** — Busca todos os registros para calcular totais
3. **Sem índice** — Query faz full table scan
4. **Sem paginação** — Busca 1000+ registros de uma vez

### Diagnóstico

**Passo 1:** Medir tempo da query

```ts
console.time("useStudents");
const { data } = await supabase.from("students").select("*");
console.timeEnd("useStudents"); // Ex: useStudents: 2341ms
```

**Passo 2:** Verificar `EXPLAIN ANALYZE` no banco

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM students WHERE teacher_id = 'uuid';
```

Procurar por:

- `Seq Scan` (full table scan) — adicionar índice
- `Nested Loop` com muitas iterações — N+1 query
- `execution time: >1000ms` — query lenta

**Passo 3:** Verificar Network tab no DevTools

- Múltiplas requisições sequenciais → N+1
- Payload grande (>1MB) → sem paginação

### Solução

**Cenário 1:** N+1 queries

```ts
// ❌ N+1 — busca alunos, depois busca professor de cada um
const students = await supabase.from("students").select("*");
for (const student of students) {
  const teacher = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", student.teacher_id);
}

// ✅ JOIN — 1 query
const students = await supabase
  .from("students")
  .select("*, profiles!teacher_id(full_name, email)");
```

**Cenário 2:** Agregação no cliente

```ts
// ❌ Busca todos os registros para calcular total
const { data } = await supabase.from("financial_records").select("*");
const total = data.reduce((sum, r) => sum + r.amount, 0);

// ✅ Usar view materializada ou RPC
const { data } = await supabase
  .from("financial_dashboard")
  .select("total_amount")
  .eq("teacher_id", teacherId)
  .single();
```

**Cenário 3:** Sem índice

```sql
-- Adicionar índice
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_financial_records_student_id ON financial_records(student_id);
```

**Cenário 4:** Sem paginação

```ts
// ❌ Busca todos os registros
const { data } = await supabase.from("class_logs").select("*");

// ✅ Paginação
const { data } = await supabase
  .from("class_logs")
  .select("*")
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order("class_date", { ascending: false });
```

### Prevenção

- Sempre usar JOIN para relacionamentos
- Mover agregações para o banco (views, RPCs)
- Adicionar índices em colunas de filtro (`WHERE`, `JOIN`)
- Implementar paginação em listas grandes (>50 registros)

**Débito técnico relacionado:**

- `docs/architecture/technical-debt.md` → ARQ-002 (Agregação no cliente)
- `docs/architecture/technical-debt.md` → ARQ-005 (N+1 queries)

---

## Ver também

- [Architecture Overview](./overview.md) — Visão geral da arquitetura
- [Flows](./flows.md) — Fluxos de requisição e autenticação
- [Technical Debt](./technical-debt.md) — Problemas arquiteturais conhecidos
- [Database Overview](../database/overview.md) — Schema, índices, RLS
- [Security Overview](../security/overview.md) — Políticas de segurança
