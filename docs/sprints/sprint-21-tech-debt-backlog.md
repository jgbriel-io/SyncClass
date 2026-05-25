# Sprint 22 — Tech Debt Backlog (pós-MVP)

**Período:** 24/05/2026  
**Status:** ✅ Concluída  
**Tipo:** Refatoração + Performance

## Contexto

Débito técnico identificado na Sprint 18 e aceito conscientemente para MVP.
Todos os itens têm localização exata, esforço estimado e critério de aceite.
Prioridade: maior impacto de performance / menor risco de regressão primeiro.

## Itens

### BACK-005 — Race condition em idempotência (INSERT sem ON CONFLICT)

**Severidade:** 🟡 Média  
**Esforço:** 1h  
**Arquivo:** `src/hooks/useClassLogs.ts` (lógica de idempotência)

**Problema:** Padrão SELECT → verificar → INSERT cria janela de race condition
entre dois requests simultâneos. Unique constraint previne duplicata no banco,
mas o cliente recebe erro genérico em vez de resposta idempotente.

**Fix:**

```sql
INSERT INTO idempotency_keys (key, response)
VALUES ($1, $2)
ON CONFLICT (key) DO NOTHING
RETURNING *;
```

Se `RETURNING *` retornar vazio → chave já existia → buscar resposta existente e retornar.

**Critério de aceite:** Dois requests simultâneos com mesma chave retornam
a mesma resposta sem erro 409 ou 500.

---

### ARQ-005 — N+1 query em confirmed_by (financial_records)

**Severidade:** 🟡 Média  
**Esforço:** 1h  
**Arquivo:** `src/hooks/useFinancialRecords.ts:89`

**Problema:** Após buscar financial_records, faz segunda query para buscar
nomes dos usuários confirmadores (`confirmed_by_user_id`). Atual: 1+1 queries
(batch por IN). Problema real: FK aponta para `auth.users(id)`, não para `profiles`,
então JOIN direto não funciona via PostgREST.

**Fix:** Adicionar FK explícita `financial_records.confirmed_by_user_id → profiles.user_id`
via migration, então usar JOIN Supabase:

```ts
.select(`
  *,
  confirmer:profiles!financial_records_confirmed_by_user_id_fkey(full_name)
`)
```

**Critério de aceite:** `fetchFinancialRecords` faz 1 query (com JOIN) em vez de 2.

---

### REFORMA-002 — God function em useClassLogs (mutationFn)

**Severidade:** 🟡 Alta  
**Esforço:** 1h  
**Arquivo:** `src/hooks/useClassLogs.ts:156`

**Problema:** `mutationFn` de `useCreateClassLog` tem complexidade ciclomática ~12.
Mistura validação, idempotência, formatação de datas, criação de registro e
atualização de pacote em uma única função de ~90 linhas.

**Fix:** Extrair em funções puras nomeadas:

```ts
function buildClassLogPayload(input, teacherId): ClassLogInsert { ... }
async function resolveIdempotencyKey(key, supabase): Promise<string | null> { ... }
async function insertClassLog(payload, supabase): Promise<ClassLog> { ... }
```

**Critério de aceite:** `mutationFn` fica com ≤30 linhas delegando para funções extraídas.
Testes existentes passam sem alteração.

---

### REFORMA-004 — Query separada de student_ids em fetchClassLogs

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivo:** `src/hooks/useClassLogs.ts:45`

**Problema:** `fetchClassLogs` faz query separada para buscar `student_ids`
de um professor antes da query principal. Resultado: 2 queries sequenciais
onde 1 (com JOIN) seria suficiente.

**Fix:** Usar JOIN ou subconsulta na query principal:

```ts
.select(`
  *,
  student:students!class_logs_student_id_fkey(id, full_name, teacher_id)
`)
.eq('student.teacher_id', teacherId)
```

**Critério de aceite:** `fetchClassLogs` faz 1 query. Volume de dados igual ao atual.

---

### REFORMA-005 — Agregação client-side em fetchClassLogsSummary

**Severidade:** 🟡 Média  
**Esforço:** 1h  
**Arquivo:** `src/hooks/useClassLogs.ts:289`

**Problema:** `fetchClassLogsSummary` busca todos os registros e agrega
(count, sum, group by) no frontend em JavaScript. Com 500+ registros,
causa query lenta e processamento desnecessário no cliente.

**Fix:** Criar RPC `get_class_logs_summary(teacher_id, period)`:

```sql
CREATE OR REPLACE FUNCTION get_class_logs_summary(
  p_teacher_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'attended', COUNT(*) FILTER (WHERE attendance = true),
    'pending', COUNT(*) FILTER (WHERE attendance IS NULL)
  )
  FROM class_logs cl
  JOIN students s ON s.id = cl.student_id
  WHERE s.teacher_id = p_teacher_id
    AND cl.class_date BETWEEN p_start_date AND p_end_date;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**Critério de aceite:** `fetchClassLogsSummary` chama RPC e retorna resultado
sem processar array no cliente. Tempo de resposta <500ms com 1000 registros.

---

### REFORMA-006 — Queries sequenciais em fetchAvailableClassLogsForStudent

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivo:** `src/hooks/useClassLogs.ts:334`

**Problema:** `fetchAvailableClassLogsForStudent` faz múltiplas queries
sequenciais (waterfall) para montar lista de aulas disponíveis.

**Fix:** Consolidar em uma única query com JOINs ou usar `Promise.all`
para paralelizar as queries independentes.

**Critério de aceite:** Número de round-trips reduzido de N sequenciais
para 1 ou N paralelos (Promise.all). Sem regressão funcional.

---

### REFORMA-007 — Padrão de update otimista duplicado

**Severidade:** 🟢 Baixa  
**Esforço:** 15min  
**Arquivo:** `src/hooks/useFinancialRecords.ts:412`

**Problema:** Lógica de optimistic update (setQueryData + rollback em onError)
está duplicada em múltiplas mutations do mesmo hook.

**Fix:** Extrair `useOptimisticUpdate<T>` genérico ou helper inline:

```ts
function buildOptimisticHandlers<T>(queryKey: QueryKey, updater: (old: T) => T) {
  return {
    onMutate: async () => { ... },
    onError: (_err, _vars, context) => { ... },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}
```

**Critério de aceite:** Padrão aparece 1x como helper, usado nas mutations.
Comportamento de rollback idêntico ao atual.

---

## Ordem de Implementação Recomendada

| #   | Item        | Esforço | Risco | Impacto                      |
| --- | ----------- | ------- | ----- | ---------------------------- |
| 1   | REFORMA-007 | 15min   | Baixo | Manutenibilidade             |
| 2   | REFORMA-004 | 30min   | Baixo | -1 query por listagem        |
| 3   | REFORMA-006 | 30min   | Médio | -N queries por operação      |
| 4   | REFORMA-002 | 1h      | Médio | Legibilidade + testabilidade |
| 5   | BACK-005    | 1h      | Médio | Robustez em concorrência     |
| 6   | ARQ-005     | 1h      | Alto  | -1 query (requer migration)  |
| 7   | REFORMA-005 | 1h      | Alto  | Performance em escala (RPC)  |

**Total estimado:** ~5h15min

## Dependências

- ARQ-005 requer migration SQL antes da mudança no hook
- REFORMA-005 requer migration SQL (nova função RPC) antes do hook
- Os demais itens são mudanças de TypeScript puras, sem migration

## Referências

- [Sprint 18](./sprint-18-consolidacao-problemas-identificados.md) — Origem dos itens
- [useClassLogs.ts](../../src/hooks/useClassLogs.ts) — Principal arquivo afetado
- [useFinancialRecords.ts](../../src/hooks/useFinancialRecords.ts) — REFORMA-007 + ARQ-005
