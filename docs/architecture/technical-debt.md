# Débito técnico

Problemas arquiteturais e refatorações identificadas no SyncClass. Documentação viva — atualizar ao resolver itens ou identificar novos.

**Para quem:** Desenvolvedores planejando melhorias de código, code reviews, ou sprints de refatoração.

## Índice

- [Quando usar este documento](#quando-usar-este-documento)
- [Problemas arquiteturais](#problemas-arquiteturais)
- [Refatorações identificadas](#refatorações-identificadas)
- [Como priorizar](#como-priorizar)
- [Ver também](#ver-também)

## Quando usar este documento

**Use quando:**

- Planejar sprint de refatoração
- Investigar performance ou bugs relacionados a arquitetura
- Fazer code review e identificar padrões ruins
- Onboarding — entender o que melhorar

**Não use quando:**

- Procurar bugs funcionais → Issues do GitHub
- Procurar vulnerabilidades de segurança → `docs/security/overview.md`
- Procurar melhorias de UI/UX → `docs/frontend/overview.md`

## Problemas arquiteturais

**Ativos:** ARQ-004, ARQ-005 (parciais) — restantes resolvidos.

### ARQ-001: God hook

**Severidade:** Alta  
**Status:** ✅ Resolvido — useUpdateStudent delega para RPC + helpers; sem god hook.  
**Local:** `src/hooks/useStudents.ts:272` (useUpdateStudent)

Hook tem 200+ linhas com lógica de negócio complexa misturada com data fetching. Sincroniza profiles, user_roles, valida telefone, atualiza pay_day via RPC, tudo em uma única função `mutationFn`.

**Impacto:** Dificulta manutenção, testes e reutilização. Viola Single Responsibility Principle.

**Fix:** Extrair lógica de sincronização para RPC no banco:

```sql
CREATE OR REPLACE FUNCTION update_student_with_sync(
  p_student_id UUID,
  p_updates JSONB
) RETURNS JSONB AS $$
BEGIN
  -- Sincroniza profiles, user_roles, students em uma transação
  -- Retorna registro atualizado
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Aplicar em: `supabase/migrations/024_refactor_update_student.sql`

---

### ARQ-002: Agregação no cliente

**Severidade:** Alta  
**Status:** ✅ Resolvido — useFinancialSummary chama RPC `get_financial_summary`.  
**Local:** `src/hooks/useFinancialRecords.ts:328` (useFinancialSummary)

Busca TODOS os registros financeiros sem paginação para calcular totais no frontend. Com crescimento, vai degradar performance.

**Impacto:** Query lenta (>2s) com 500+ registros. Consome memória do cliente desnecessariamente.

**Fix:** Mover cálculo para o banco via view materializada (já existe):

```ts
const { data } = await supabase
  .from("financial_dashboard")
  .select("*")
  .eq("teacher_id", teacherId)
  .single();
```

Aplicar em: `src/hooks/useFinancialRecords.ts:245`

---

### ARQ-003: Query keys inconsistentes

**Severidade:** Média  
**Status:** ✅ Resolvido — `src/hooks/queryKeys.ts` com export `QK` centraliza todas as keys.  
**Local:** `src/hooks/queryKeys.ts`

Falta de padronização nas query keys. Existem 3+ padrões diferentes para a mesma entidade, causando invalidações inconsistentes.

**Impacto:** Invalidações não funcionam corretamente. Cache desatualizado em algumas telas.

**Fix:** Centralizar query keys em `src/lib/queryKeys.ts`:

```ts
export const QUERY_KEYS = {
  students: {
    all: () => ["students"] as const,
    paginated: (page: number, filters: StudentsListFilters) =>
      ["students", "paginated", page, filters] as const,
    detail: (id: string) => ["students", "detail", id] as const,
  },
  financial: {
    all: () => ["financial"] as const,
    records: (teacherId: string) =>
      ["financial", "records", teacherId] as const,
    summary: (teacherId: string) =>
      ["financial", "summary", teacherId] as const,
  },
} as const;
```

Aplicar em: 17 hooks que usam TanStack Query

---

### ARQ-004: Invalidações excessivas

**Severidade:** Média  
**Status:** ⚠️ Parcial — 6 invalidateQueries (era 8); ainda inclui algumas não essenciais.  
**Local:** `src/hooks/useStudents.ts:340` (useUpdateStudent.onSuccess)

Invalida 8 query keys diferentes, incluindo queries não relacionadas (`users`, `profiles`). Causa refetch desnecessário.

**Impacto:** 8 requisições ao banco após cada update de aluno. UX com loading desnecessário.

**Fix:** Invalidar apenas o que mudou. Usar `setQueryData` para atualização otimista:

```ts
onSuccess: (updatedStudent) => {
  queryClient.setQueryData(["students", "detail", studentId], updatedStudent);
  queryClient.invalidateQueries({ queryKey: ["students", "paginated"] });
  // Remover invalidações de users, profiles, etc
};
```

Aplicar em: `src/hooks/useStudents.ts:210`

---

### ARQ-005: N+1 queries

**Severidade:** Média  
**Status:** ⚠️ Parcial — JOIN para dados principais implementado; query separada para package_classes persiste.  
**Local:** `src/hooks/useFinancialRecords.ts:109`

Faz N+1 queries para buscar nomes de usuários confirmadores e aulas de pacotes.

**Impacto:** 1 + N requisições ao banco (N = número de registros). Lento com 50+ registros.

**Fix:** Usar JOIN no Supabase:

```ts
const { data } = await supabase
  .from("financial_records")
  .select(
    `
    *,
    students!inner(name, teacher_id),
    confirmed_by:profiles!confirmed_by_user_id(full_name),
    financial_record_class_logs(class_logs(id, class_date, title))
  `
  )
  .range(from, to);
```

Aplicar em: `src/hooks/useFinancialRecords.ts:89`

---

### ARQ-006: God file

**Severidade:** Baixa  
**Status:** ✅ Resolvido — `useUserMutations.ts` é barrel de 24 linhas; lógica dividida em auth/profile/link modules.  
**Local:** `src/hooks/useUserMutations.ts`

Arquivo tem 600+ linhas com lógica de criação de usuário, fallback para Edge Function, geração de senha, validação de email, criação de student/teacher — tudo misturado.

**Impacto:** Dificulta navegação e manutenção. Arquivo muito grande para revisar em code review.

**Fix:** Separar em módulos menores:

```
src/hooks/users/
├── useCreateUser.ts
├── useUpdateUser.ts
├── useDeleteUser.ts
├── useInviteUser.ts
└── utils/
    ├── passwordGenerator.ts
    ├── emailValidator.ts
    └── userRoleSync.ts
```

Aplicar em: Criar pasta `src/hooks/users/` e migrar código

---

## Refatorações identificadas

**Ativas:** REFORMA-002 (parcial), REFORMA-004 (parcial), REFORMA-007 (aberta) — restantes resolvidas.

### REFORMA-001: Duplicação de sanitizeErrorMessage

**Severidade:** Alta  
**Status:** ✅ Resolvido — fonte única em `errorHandler.ts`; `errorMessages.ts` é re-export apenas.  
**Local:** `src/lib/security/errorHandler.ts:66`

Existe em dois arquivos com lógica diferente. Hooks importam de fontes diferentes, causando comportamento inconsistente.

**Impacto:** Mensagens de erro inconsistentes entre módulos. Confunde usuário.

**Fix:** Consolidar em `src/lib/security/errorHandler.ts` e remover de `errorMessages.ts`. Atualizar imports em 23 hooks.

---

### REFORMA-002: God function em useUpdateClassLog

**Severidade:** Alta  
**Status:** ⚠️ Parcial — mutationFn ~40 linhas com helpers extraídos; complexidade reduzida mas ainda densa.  
**Local:** `src/hooks/useClassLogs.ts:609`

`mutationFn` tem complexidade ciclomática ~12 com 4 níveis de aninhamento.

**Impacto:** Dificulta leitura e testes. Bugs escondidos em lógica complexa.

**Fix:** Extrair para funções auxiliares:

```ts
async function validateClassLogUpdate(data: ClassLogUpdate): Promise<void> { ... }
async function updateClassLogRecord(id: string, data: ClassLogUpdate): Promise<ClassLog> { ... }
async function syncRelatedRecords(classLog: ClassLog): Promise<void> { ... }
```

---

### REFORMA-003: Duplicação de detecção de overlap

**Severidade:** Alta  
**Status:** ✅ Resolvido — `isClassOverlapError` centralizado em `src/lib/utils/classTime.ts`.  
**Local:** `src/lib/utils/classTime.ts:15`

Padrão de detecção de overlap duplicado em 3 hooks diferentes com lógica idêntica.

**Impacto:** Manutenção triplicada. Risco de inconsistência ao corrigir bugs.

**Fix:** Extrair para `src/lib/utils/classTime.ts`:

```ts
export function isClassOverlapError(error: unknown): boolean {
  return error?.message?.includes("overlapping_class_time");
}
export const CLASS_OVERLAP_MESSAGE =
  "Já existe outra aula agendada neste horário";
```

---

### REFORMA-004: N+1 em useClassLogs

**Severidade:** Média  
**Status:** ⚠️ Parcial — usa `.in()` com relacionamentos inline; sem N+1 clássico mas query não é JOIN puro.  
**Local:** `src/hooks/useClassLogs.ts:265`

Faz query separada para buscar `student_ids` do professor e depois filtra.

**Impacto:** 2 requisições ao banco em vez de 1. Lento com muitos alunos.

**Fix:** Usar JOIN direto via PostgREST:

```ts
const { data } = await supabase
  .from("class_logs")
  .select("*, students!inner(teacher_id)")
  .eq("students.teacher_id", teacherId);
```

---

### REFORMA-005: Agregação no cliente em useClassLogsSummary

**Severidade:** Média  
**Status:** ✅ Resolvido — chama RPC `get_class_logs_summary` (migration 29).  
**Local:** `src/hooks/useClassLogs.ts:335`

Carrega todos os registros de aulas para calcular estatísticas no frontend.

**Impacto:** Query lenta (>1s) com 200+ aulas. Consome memória do cliente.

**Fix:** Mover para RPC:

```sql
CREATE OR REPLACE FUNCTION get_class_logs_summary(p_teacher_id UUID)
RETURNS TABLE(total_classes INT, total_hours NUMERIC, attendance_rate NUMERIC) ...
```

---

### REFORMA-006: Queries sequenciais em useAvailableClassLogsForStudent

**Severidade:** Média  
**Status:** ✅ Resolvido — usa `Promise.all()` para queries paralelas.  
**Local:** `src/hooks/useClassLogs.ts:302`

Faz 3 queries sequenciais (waterfall): busca aluno → busca aulas → busca pacotes.

**Impacto:** 3x mais lento que paralelo. Latência acumulada de ~600ms.

**Fix:** Paralelizar com `Promise.all()`:

```ts
const [student, classLogs, packages] = await Promise.all([
  supabase.from("students").select("*").eq("id", studentId).single(),
  supabase.from("class_logs").select("*").eq("student_id", studentId),
  supabase.from("class_packages").select("*").eq("student_id", studentId),
]);
```

---

### REFORMA-007: Mutação direta em enrichWithPackageFinancial

**Severidade:** Baixa  
**Status:** 🔴 Aberto — `forEach` mutando array por referência; não usa `.map()`.  
**Local:** `src/hooks/useFinancialRecords.ts:209`

Função modifica array passado por referência, violando imutabilidade.

**Impacto:** Bugs sutis com cache do TanStack Query. Dificulta debug.

**Fix:** Retornar novo array com `.map()`:

```ts
export function enrichWithPackageFinancial(
  records: FinancialRecord[]
): FinancialRecord[] {
  return records.map((record) => ({
    ...record,
    package_info: findPackageInfo(record.id),
  }));
}
```

---

### REFORMA-008: Inconsistência de validação de nota

**Severidade:** Baixa  
**Status:** ✅ Resolvido — `gradeSchema` usa `.max(10)` alinhado com UX da plataforma.  
**Local:** `src/lib/validation/schemas.ts:173`

`gradeSchema` define nota máxima como 10, mas o banco tem `CHECK (grade <= 100)`.

**Impacto:** Validação frontend aceita nota 10, mas banco espera 0-100. Confusão.

**Fix:** Alinhar validação frontend com constraint do banco:

```ts
export const gradeSchema = z.number().min(0).max(100);
```

---

## Como priorizar

### Critérios de priorização

1. **Severidade** — Impacto no usuário ou desenvolvedor
2. **Frequência** — Quantas vezes o problema aparece
3. **Esforço** — Tempo estimado para resolver
4. **Dependências** — Outros problemas que dependem deste

### Itens ativos (5 restantes)

| Problema    | Severidade | Status     | Esforço |
| ----------- | ---------- | ---------- | ------- |
| ARQ-004     | Média      | ⚠️ Parcial | ~1h     |
| ARQ-005     | Média      | ⚠️ Parcial | ~30min  |
| REFORMA-002 | Alta       | ⚠️ Parcial | ~30min  |
| REFORMA-004 | Média      | ⚠️ Parcial | ~30min  |
| REFORMA-007 | Baixa      | 🔴 Aberto  | 15min   |

**Estimativa total restante: ~2h45min**

## Ver também

- [Architecture Overview](./overview.md) — Visão geral da arquitetura
- [Design Patterns](./patterns.md) — Padrões aplicados no projeto
- [Decisões Arquiteturais](./decisions.md) — ADRs e trade-offs
- [Sprints](../sprints/README.md) — Histórico de desenvolvimento
