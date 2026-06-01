# Sprint 10 — Refactor: Remove Duplicate Queries

> **Nomenclatura do arquivo:** `sprint-10-refactor-remove-duplicate-queries.md`

**Período:** 21 abril 2026
**Status:** ✅ Concluída
**Tipo:** Refactor
**Prioridade:** 🟡 Média

## Problem Statement

Após Sprint 9, os arquivos estavam organizados mas com queries duplicadas identificadas na auditoria:

**Queries Duplicadas:**

- Mesma query repetida em múltiplos hooks
- Exemplo: buscar `teacherId` do usuário logado (repetido 8x)
- Exemplo: buscar alunos de um professor (repetido 5x)
- Exemplo: buscar cobranças pendentes (repetido 4x)

**Impacto:**

- Código duplicado (DRY violation)
- Manutenção cara (mudança precisa ser feita em múltiplos lugares)
- Inconsistência (queries similares com pequenas diferenças)
- Performance (queries não otimizadas igualmente)

**Exemplos Identificados:**

```ts
// Hook 1
const { data } = await supabase
  .from("students")
  .select("*")
  .eq("teacher_id", teacherId)
  .is("deleted_at", null);

// Hook 2 (duplicado)
const { data } = await supabase
  .from("students")
  .select("*")
  .eq("teacher_id", teacherId)
  .is("deleted_at", null);

// Hook 3 (duplicado com pequena diferença)
const { data } = await supabase
  .from("students")
  .select("id, name, email")
  .eq("teacher_id", teacherId)
  .is("deleted_at", null);
```

## Requirements

### Identificar Queries Duplicadas

- Buscar padrões repetidos em hooks
- Listar todas as queries duplicadas
- Priorizar por frequência de duplicação

### Criar Query Builders

- Funções reutilizáveis para queries comuns
- Exemplo: `getStudentsByTeacher(teacherId, options)`
- Exemplo: `getPendingPayments(studentId, options)`

### Refatorar Hooks

- Substituir queries duplicadas por query builders
- Manter funcionalidade idêntica
- Adicionar testes

### Critérios de Conclusão

- ✅ Nenhuma query duplicada (exceto casos justificados)
- ✅ Query builders testados e documentados
- ✅ Hooks mais simples e legíveis

## Background

**Query Builder Pattern:**

```ts
// Antes (duplicado em 5 hooks)
const { data } = await supabase
  .from("students")
  .select("*")
  .eq("teacher_id", teacherId)
  .is("deleted_at", null);

// Depois (query builder reutilizável)
const data = await getStudentsByTeacher(teacherId);

// Query builder
export const getStudentsByTeacher = async (
  teacherId: string,
  options?: { includeDeleted?: boolean; select?: string }
) => {
  let query = supabase
    .from("students")
    .select(options?.select || "*")
    .eq("teacher_id", teacherId);

  if (!options?.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};
```

**Vantagens:**

- Código DRY (uma única implementação)
- Manutenção fácil (mudança em um lugar)
- Consistência (mesma query em todos os lugares)
- Testável (testar query builder uma vez)

## Proposed Solution

### Estrutura de Query Builders

```
src/lib/queries/
├── students.ts          ← Query builders de alunos
├── teachers.ts          ← Query builders de professores
├── classes.ts           ← Query builders de aulas
├── financial.ts         ← Query builders de financeiro
├── activities.ts        ← Query builders de atividades
└── users.ts             ← Query builders de usuários
```

### Query Builders Principais

```ts
// src/lib/queries/students.ts
export const getStudentsByTeacher = (teacherId, options?) => {
  /* ... */
};
export const getStudentById = (studentId, options?) => {
  /* ... */
};
export const getActiveStudents = (teacherId, options?) => {
  /* ... */
};
export const getArchivedStudents = (teacherId, options?) => {
  /* ... */
};

// src/lib/queries/financial.ts
export const getPendingPayments = (studentId, options?) => {
  /* ... */
};
export const getPaidPayments = (studentId, options?) => {
  /* ... */
};
export const getOverduePayments = (studentId, options?) => {
  /* ... */
};
export const getPaymentsByPeriod = (
  studentId,
  startDate,
  endDate,
  options?
) => {
  /* ... */
};
```

## Task Breakdown

### Task 1: Identificar queries duplicadas

- **Objetivo:** Listar todas as queries duplicadas no projeto
- **Implementação:**
  - Buscar padrões `.from('students')` em hooks
  - Buscar padrões `.from('financial_records')` em hooks
  - Buscar padrões `.from('class_logs')` em hooks
  - Buscar padrões `.from('activities')` em hooks
  - Agrupar queries similares
  - Contar frequência de cada padrão
- **Resultado:**
  - Lista de 15 queries duplicadas
  - Frequência: 2-8 duplicações por query
- **Teste:** Lista completa e priorizada
- **Demo:** Plano de refatoração documentado

### Task 2: Criar query builders de students

- **Objetivo:** Query builders reutilizáveis para alunos
- **Implementação:**
  - Criar `src/lib/queries/students.ts`
  - `getStudentsByTeacher(teacherId, options?)` — buscar alunos de um professor
  - `getStudentById(studentId, options?)` — buscar aluno por ID
  - `getActiveStudents(teacherId, options?)` — buscar alunos ativos
  - `getArchivedStudents(teacherId, options?)` — buscar alunos arquivados
  - Opções: `includeDeleted`, `select`, `orderBy`, `limit`
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/lib/queries/students.ts`
  - `src/lib/queries/__tests__/students.test.ts`
- **Teste:** Query builders retornam dados corretos
- **Demo:** Queries reutilizáveis e testadas

### Task 3: Refatorar hooks de students

- **Objetivo:** Substituir queries duplicadas por query builders
- **Implementação:**
  - Atualizar `useStudents` para usar `getStudentsByTeacher`
  - Atualizar `useStudentFilters` para usar query builders
  - Atualizar `useStudentActions` para usar query builders
  - Remover queries duplicadas
  - Manter funcionalidade idêntica
- **Arquivos modificados:**
  - `src/hooks/students/useStudents.ts`
  - `src/hooks/students/useStudentFilters.ts`
  - `src/hooks/students/useStudentActions.ts`
- **Teste:** Hooks funcionam identicamente
- **Demo:** Código mais limpo, sem duplicação

### Task 4: Criar query builders de financial

- **Objetivo:** Query builders reutilizáveis para financeiro
- **Implementação:**
  - Criar `src/lib/queries/financial.ts`
  - `getPendingPayments(studentId, options?)` — buscar cobranças pendentes
  - `getPaidPayments(studentId, options?)` — buscar cobranças pagas
  - `getOverduePayments(studentId, options?)` — buscar cobranças atrasadas
  - `getPaymentsByPeriod(studentId, startDate, endDate, options?)` — buscar por período
  - `getPaymentById(paymentId, options?)` — buscar cobrança por ID
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/lib/queries/financial.ts`
  - `src/lib/queries/__tests__/financial.test.ts`
- **Teste:** Query builders retornam dados corretos
- **Demo:** Queries reutilizáveis

### Task 5: Refatorar hooks de financial

- **Objetivo:** Substituir queries duplicadas por query builders
- **Implementação:**
  - Atualizar `useFinancialRecords` para usar query builders
  - Atualizar `usePaymentApproval` para usar query builders
  - Atualizar `useFinancialReports` para usar query builders
  - Remover queries duplicadas
- **Arquivos modificados:**
  - `src/hooks/financial/useFinancialRecords.ts`
  - `src/hooks/financial/usePaymentApproval.ts`
  - `src/hooks/financial/useFinancialReports.ts`
- **Teste:** Hooks funcionam identicamente
- **Demo:** Código DRY

### Task 6: Criar query builders de classes

- **Objetivo:** Query builders reutilizáveis para aulas
- **Implementação:**
  - Criar `src/lib/queries/classes.ts`
  - `getClassesByStudent(studentId, options?)` — buscar aulas de um aluno
  - `getClassesByTeacher(teacherId, options?)` — buscar aulas de um professor
  - `getClassesByPeriod(studentId, startDate, endDate, options?)` — buscar por período
  - `getUpcomingClasses(teacherId, options?)` — buscar aulas futuras
  - `getPastClasses(studentId, options?)` — buscar aulas passadas
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/lib/queries/classes.ts`
  - `src/lib/queries/__tests__/classes.test.ts`
- **Teste:** Query builders retornam dados corretos
- **Demo:** Queries reutilizáveis

### Task 7: Refatorar hooks de classes

- **Objetivo:** Substituir queries duplicadas por query builders
- **Implementação:**
  - Atualizar `useClasses` para usar query builders
  - Atualizar `useClassPackages` para usar query builders
  - Atualizar `useAttendance` para usar query builders
  - Remover queries duplicadas
- **Arquivos modificados:**
  - `src/hooks/classes/useClasses.ts`
  - `src/hooks/classes/useClassPackages.ts`
  - `src/hooks/classes/useAttendance.ts`
- **Teste:** Hooks funcionam identicamente
- **Demo:** Código limpo

### Task 8: Criar query builders de activities

- **Objetivo:** Query builders reutilizáveis para atividades
- **Implementação:**
  - Criar `src/lib/queries/activities.ts`
  - `getActivitiesByTeacher(teacherId, options?)` — buscar atividades de um professor
  - `getActivitiesByStudent(studentId, options?)` — buscar atividades de um aluno
  - `getPendingActivities(studentId, options?)` — buscar atividades pendentes
  - `getCompletedActivities(studentId, options?)` — buscar atividades concluídas
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/lib/queries/activities.ts`
  - `src/lib/queries/__tests__/activities.test.ts`
- **Teste:** Query builders retornam dados corretos
- **Demo:** Queries reutilizáveis

### Task 9: Refatorar hooks de activities

- **Objetivo:** Substituir queries duplicadas por query builders
- **Implementação:**
  - Atualizar `useActivities` para usar query builders
  - Atualizar `useSendActivity` para usar query builders
  - Atualizar `useDeliverActivity` para usar query builders
  - Atualizar `useCorrectActivity` para usar query builders
  - Remover queries duplicadas
- **Arquivos modificados:**
  - `src/hooks/activities/useActivities.ts`
  - `src/hooks/activities/useSendActivity.ts`
  - `src/hooks/activities/useDeliverActivity.ts`
  - `src/hooks/activities/useCorrectActivity.ts`
- **Teste:** Hooks funcionam identicamente
- **Demo:** Código DRY

### Task 10: Criar query builders de teachers e users

- **Objetivo:** Query builders reutilizáveis para professores e usuários
- **Implementação:**
  - Criar `src/lib/queries/teachers.ts`
  - `getTeacherById(teacherId, options?)` — buscar professor por ID
  - `getActiveTeachers(options?)` — buscar professores ativos
  - Criar `src/lib/queries/users.ts`
  - `getUserById(userId, options?)` — buscar usuário por ID
  - `getUsersByRole(role, options?)` — buscar usuários por role
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/lib/queries/teachers.ts`
  - `src/lib/queries/users.ts`
  - `src/lib/queries/__tests__/teachers.test.ts`
  - `src/lib/queries/__tests__/users.test.ts`
- **Teste:** Query builders retornam dados corretos
- **Demo:** Queries reutilizáveis

### Task 11: Refatorar hooks de teachers e users

- **Objetivo:** Substituir queries duplicadas por query builders
- **Implementação:**
  - Atualizar `useTeachers` para usar query builders
  - Atualizar `useTeacherActions` para usar query builders
  - Atualizar `useUsers` para usar query builders
  - Atualizar `usePasswordManagement` para usar query builders
  - Remover queries duplicadas
- **Arquivos modificados:**
  - `src/hooks/teachers/useTeachers.ts`
  - `src/hooks/teachers/useTeacherActions.ts`
  - `src/hooks/users/useUsers.ts`
  - `src/hooks/users/usePasswordManagement.ts`
- **Teste:** Hooks funcionam identicamente
- **Demo:** Código limpo e DRY

### Task 12: Documentar query builders

- **Objetivo:** Documentar uso de query builders
- **Implementação:**
  - Criar `docs/architecture/query-builders.md`
  - Documentar cada query builder com exemplos
  - Documentar opções disponíveis
  - Documentar quando criar novos query builders
  - Adicionar ao README
- **Arquivos criados:**
  - `docs/architecture/query-builders.md`
- **Teste:** Documentação completa e clara
- **Demo:** Desenvolvedores sabem como usar query builders

## Implementation Details

### Query Builders Criados

| Arquivo         | Query Builders   | Linhas |
| --------------- | ---------------- | ------ |
| `students.ts`   | 4 query builders | 80     |
| `financial.ts`  | 5 query builders | 100    |
| `classes.ts`    | 5 query builders | 95     |
| `activities.ts` | 4 query builders | 75     |
| `teachers.ts`   | 2 query builders | 40     |
| `users.ts`      | 2 query builders | 40     |

### Hooks Refatorados

| Hook                  | Queries Removidas    | Linhas Reduzidas |
| --------------------- | -------------------- | ---------------- |
| `useStudents`         | 3 queries duplicadas | -15 linhas       |
| `useFinancialRecords` | 4 queries duplicadas | -20 linhas       |
| `useClasses`          | 3 queries duplicadas | -15 linhas       |
| `useActivities`       | 2 queries duplicadas | -10 linhas       |
| `useTeachers`         | 2 queries duplicadas | -10 linhas       |
| `useUsers`            | 1 query duplicada    | -5 linhas        |

## Files Created

```
src/
└── lib/
    └── queries/
        ├── students.ts              ← Query builders de alunos
        ├── financial.ts             ← Query builders de financeiro
        ├── classes.ts               ← Query builders de aulas
        ├── activities.ts            ← Query builders de atividades
        ├── teachers.ts              ← Query builders de professores
        ├── users.ts                 ← Query builders de usuários
        └── __tests__/
            ├── students.test.ts
            ├── financial.test.ts
            ├── classes.test.ts
            ├── activities.test.ts
            ├── teachers.test.ts
            └── users.test.ts

docs/
└── architecture/
    └── query-builders.md            ← Documentação
```

## Files Modified

- `src/hooks/students/useStudents.ts` — usar query builders
- `src/hooks/students/useStudentFilters.ts` — usar query builders
- `src/hooks/students/useStudentActions.ts` — usar query builders
- `src/hooks/financial/useFinancialRecords.ts` — usar query builders
- `src/hooks/financial/usePaymentApproval.ts` — usar query builders
- `src/hooks/financial/useFinancialReports.ts` — usar query builders
- `src/hooks/classes/useClasses.ts` — usar query builders
- `src/hooks/classes/useClassPackages.ts` — usar query builders
- `src/hooks/classes/useAttendance.ts` — usar query builders
- `src/hooks/activities/useActivities.ts` — usar query builders
- `src/hooks/activities/useSendActivity.ts` — usar query builders
- `src/hooks/activities/useDeliverActivity.ts` — usar query builders
- `src/hooks/activities/useCorrectActivity.ts` — usar query builders
- `src/hooks/teachers/useTeachers.ts` — usar query builders
- `src/hooks/teachers/useTeacherActions.ts` — usar query builders
- `src/hooks/users/useUsers.ts` — usar query builders
- `src/hooks/users/usePasswordManagement.ts` — usar query builders

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Testes passando (`npm run test`)
- [x] Teste manual: todas as funcionalidades funcionam identicamente
- [x] Code review: nenhuma query duplicada encontrada

## Results & Impact

### Métricas Quantitativas

- ✅ 6 arquivos de query builders criados (430 linhas)
- ✅ 22 query builders implementados
- ✅ 15 queries duplicadas removidas
- ✅ 75 linhas de código duplicado removidas
- ✅ 17 hooks refatorados
- ✅ 12 testes unitários adicionados

### Melhorias Qualitativas

- ✅ Código DRY (sem duplicação)
- ✅ Manutenção facilitada (mudança em um lugar)
- ✅ Consistência (mesma query em todos os lugares)
- ✅ Testabilidade (query builders testados)
- ✅ Performance (queries otimizadas igualmente)
- ✅ Documentação (guia de uso)

## Lessons Learned

### O que funcionou bem ✅

- **Query builders como camada de abstração:** Encapsular queries Supabase em funções reutilizáveis (`getStudentsByTeacher`) centralizou lógica. Mudança no schema (ex: renomear coluna) afeta apenas query builders, não 15 hooks.
- **Opções flexíveis:** Parâmetro `options` em query builders (`includeDeleted`, `select`, `orderBy`) permitiu reutilização sem duplicação. Alternativa seria múltiplas funções (`getStudents`, `getStudentsWithDeleted`, `getStudentsOrdered`) — mais verboso.
- **Testes de query builders:** Testar query builders uma vez (12 testes) é mais eficiente que testar mesma query em 15 hooks. Cobertura maior com menos esforço.

### O que poderia melhorar ⚠️

- **Query builders ainda básicos:** Opções limitadas (`includeDeleted`, `select`, `orderBy`). Faltam: filtros complexos (AND/OR), joins, agregações. Adicionar depois conforme necessidade.
- **Sem cache de queries:** Query builders não usam cache do React Query. Mesma query executada múltiplas vezes. Integrar com React Query resolveria, mas aumenta complexidade.
- **Documentação tardia:** `docs/architecture/query-builders.md` criado no final da sprint. Ideal seria criar antes (TDD de documentação) para guiar implementação.

### Aplicações futuras 💡

- **Query builders para joins:** Criar query builders para queries complexas com joins (ex: `getStudentsWithFinancialSummary`, `getClassesWithAttendance`). Evita duplicação de joins.
- **Integração com React Query:** Query builders retornam `queryKey` + `queryFn` para usar diretamente em `useQuery`. Exemplo: `useQuery(getStudentsByTeacher(teacherId))`.
- **Geração automática:** Script que gera query builders baseado no schema Supabase. Reduz boilerplate e garante consistência.

## Technical Debt

- [ ] Alguns query builders ainda básicos — adicionar opções avançadas depois
- [ ] Sem cache de queries — adicionar React Query cache depois
