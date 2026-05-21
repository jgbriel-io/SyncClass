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

**Prioridade de resolução:** ARQ-001 → ARQ-002 → ARQ-003 → ARQ-004 → ARQ-005 → ARQ-006

### ARQ-001: God hook
**Severidade:** Alta  
**Prioridade:** 1  
**Estimativa:** 3h  
**Local:** `src/hooks/useStudents.ts:187` (useUpdateStudent)

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
**Prioridade:** 2  
**Estimativa:** 2h  
**Local:** `src/hooks/useFinancialRecords.ts:245` (useFinancialSummary)

Busca TODOS os registros financeiros sem paginação para calcular totais no frontend. Com crescimento, vai degradar performance.

**Impacto:** Query lenta (>2s) com 500+ registros. Consome memória do cliente desnecessariamente.

**Fix:** Mover cálculo para o banco via view materializada (já existe):
```ts
const { data } = await supabase
  .from('financial_dashboard')
  .select('*')
  .eq('teacher_id', teacherId)
  .single();
```

Aplicar em: `src/hooks/useFinancialRecords.ts:245`

---

### ARQ-003: Query keys inconsistentes
**Severidade:** Média  
**Prioridade:** 3  
**Estimativa:** 4h  
**Local:** TanStack Query (múltiplos hooks)

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
    records: (teacherId: string) => ["financial", "records", teacherId] as const,
    summary: (teacherId: string) => ["financial", "summary", teacherId] as const,
  },
} as const;
```

Aplicar em: 17 hooks que usam TanStack Query

---

### ARQ-004: Invalidações excessivas
**Severidade:** Média  
**Prioridade:** 4  
**Estimativa:** 2h  
**Local:** `src/hooks/useStudents.ts:187` (useUpdateStudent.onSuccess)

Invalida 8 query keys diferentes, incluindo queries não relacionadas (`users`, `profiles`). Causa refetch desnecessário.

**Impacto:** 8 requisições ao banco após cada update de aluno. UX com loading desnecessário.

**Fix:** Invalidar apenas o que mudou. Usar `setQueryData` para atualização otimista:
```ts
onSuccess: (updatedStudent) => {
  queryClient.setQueryData(['students', 'detail', studentId], updatedStudent);
  queryClient.invalidateQueries({ queryKey: ['students', 'paginated'] });
  // Remover invalidações de users, profiles, etc
};
```

Aplicar em: `src/hooks/useStudents.ts:210`

---

### ARQ-005: N+1 queries
**Severidade:** Média  
**Prioridade:** 5  
**Estimativa:** 1h  
**Local:** `src/hooks/useFinancialRecords.ts:89`

Faz N+1 queries para buscar nomes de usuários confirmadores e aulas de pacotes.

**Impacto:** 1 + N requisições ao banco (N = número de registros). Lento com 50+ registros.

**Fix:** Usar JOIN no Supabase:
```ts
const { data } = await supabase
  .from("financial_records")
  .select(`
    *,
    students!inner(name, teacher_id),
    confirmed_by:profiles!confirmed_by_user_id(full_name),
    financial_record_class_logs(class_logs(id, class_date, title))
  `)
  .range(from, to);
```

Aplicar em: `src/hooks/useFinancialRecords.ts:89`

---

### ARQ-006: God file
**Severidade:** Baixa  
**Prioridade:** 6  
**Estimativa:** 3h  
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

**Prioridade de resolução:** REFORMA-001 → REFORMA-003 → REFORMA-002 → REFORMA-004 → REFORMA-005 → REFORMA-006 → REFORMA-007 → REFORMA-008

### REFORMA-001: Duplicação de sanitizeErrorMessage
**Severidade:** Alta  
**Prioridade:** 1  
**Estimativa:** 30min  
**Local:** `src/lib/security/errorHandler.ts:45` e `src/lib/utils/errorMessages.ts:12`

Existe em dois arquivos com lógica diferente. Hooks importam de fontes diferentes, causando comportamento inconsistente.

**Impacto:** Mensagens de erro inconsistentes entre módulos. Confunde usuário.

**Fix:** Consolidar em `src/lib/security/errorHandler.ts` e remover de `errorMessages.ts`. Atualizar imports em 23 hooks.

---

### REFORMA-002: God function em useUpdateClassLog
**Severidade:** Alta  
**Prioridade:** 3  
**Estimativa:** 1h  
**Local:** `src/hooks/useClassLogs.ts:156`

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
**Prioridade:** 2  
**Estimativa:** 45min  
**Local:** `src/hooks/useClassLogs.ts:89`, `src/hooks/usePackages.ts:134`, `src/hooks/useActivities.ts:201`

Padrão de detecção de overlap duplicado em 3 hooks diferentes com lógica idêntica.

**Impacto:** Manutenção triplicada. Risco de inconsistência ao corrigir bugs.

**Fix:** Extrair para `src/lib/utils/classTime.ts`:
```ts
export function isClassOverlapError(error: unknown): boolean {
  return error?.message?.includes('overlapping_class_time');
}
export const CLASS_OVERLAP_MESSAGE = "Já existe outra aula agendada neste horário";
```

---

### REFORMA-004: N+1 em useClassLogs
**Severidade:** Média  
**Prioridade:** 4  
**Estimativa:** 30min  
**Local:** `src/hooks/useClassLogs.ts:45`

Faz query separada para buscar `student_ids` do professor e depois filtra.

**Impacto:** 2 requisições ao banco em vez de 1. Lento com muitos alunos.

**Fix:** Usar JOIN direto via PostgREST:
```ts
const { data } = await supabase
  .from('class_logs')
  .select('*, students!inner(teacher_id)')
  .eq('students.teacher_id', teacherId);
```

---

### REFORMA-005: Agregação no cliente em useClassLogsSummary
**Severidade:** Média  
**Prioridade:** 5  
**Estimativa:** 1h  
**Local:** `src/hooks/useClassLogs.ts:289`

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
**Prioridade:** 6  
**Estimativa:** 30min  
**Local:** `src/hooks/useClassLogs.ts:334`

Faz 3 queries sequenciais (waterfall): busca aluno → busca aulas → busca pacotes.

**Impacto:** 3x mais lento que paralelo. Latência acumulada de ~600ms.

**Fix:** Paralelizar com `Promise.all()`:
```ts
const [student, classLogs, packages] = await Promise.all([
  supabase.from('students').select('*').eq('id', studentId).single(),
  supabase.from('class_logs').select('*').eq('student_id', studentId),
  supabase.from('class_packages').select('*').eq('student_id', studentId),
]);
```

---

### REFORMA-007: Mutação direta em enrichWithPackageFinancial
**Severidade:** Baixa  
**Prioridade:** 7  
**Estimativa:** 15min  
**Local:** `src/hooks/useFinancialRecords.ts:412`

Função modifica array passado por referência, violando imutabilidade.

**Impacto:** Bugs sutis com cache do TanStack Query. Dificulta debug.

**Fix:** Retornar novo array com `.map()`:
```ts
export function enrichWithPackageFinancial(records: FinancialRecord[]): FinancialRecord[] {
  return records.map(record => ({
    ...record,
    package_info: findPackageInfo(record.id),
  }));
}
```

---

### REFORMA-008: Inconsistência de validação de nota
**Severidade:** Baixa  
**Prioridade:** 8  
**Estimativa:** 15min  
**Local:** `src/lib/validation/activitySchemas.ts:23`

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

### Matriz de priorização

| Problema | Severidade | Frequência | Esforço | Score | Prioridade |
|----------|-----------|-----------|---------|-------|-----------|
| ARQ-001 | Alta | Média | 3h | 8 | 1 |
| ARQ-002 | Alta | Alta | 2h | 9 | 2 |
| ARQ-003 | Média | Alta | 4h | 7 | 3 |
| ARQ-004 | Média | Alta | 2h | 7 | 4 |
| ARQ-005 | Média | Média | 1h | 6 | 5 |
| ARQ-006 | Baixa | Baixa | 3h | 3 | 6 |
| REFORMA-001 | Alta | Alta | 30min | 9 | 1 |
| REFORMA-002 | Alta | Baixa | 1h | 6 | 3 |
| REFORMA-003 | Alta | Média | 45min | 8 | 2 |
| REFORMA-004 | Média | Média | 30min | 6 | 4 |
| REFORMA-005 | Média | Baixa | 1h | 5 | 5 |
| REFORMA-006 | Média | Baixa | 30min | 5 | 6 |
| REFORMA-007 | Baixa | Baixa | 15min | 3 | 7 |
| REFORMA-008 | Baixa | Baixa | 15min | 3 | 8 |

### Sugestão de sprints

**Sprint de Refatoração 1 (8h):**
- REFORMA-001 (30min)
- REFORMA-003 (45min)
- ARQ-001 (3h)
- ARQ-002 (2h)
- ARQ-005 (1h)
- REFORMA-004 (30min)

**Sprint de Refatoração 2 (6h):**
- ARQ-003 (4h)
- ARQ-004 (2h)

**Sprint de Refatoração 3 (6h):**
- ARQ-006 (3h)
- REFORMA-002 (1h)
- REFORMA-005 (1h)
- REFORMA-006 (30min)
- REFORMA-007 (15min)
- REFORMA-008 (15min)

## Ver também

- [Architecture Overview](./overview.md) — Visão geral da arquitetura
- [Design Patterns](./patterns.md) — Padrões aplicados no projeto
- [Decisões Arquiteturais](./decisions.md) — ADRs e trade-offs
- [Sprints](../sprints/README.md) — Histórico de desenvolvimento
