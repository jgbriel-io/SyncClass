# Clean Code — Design Patterns e Sprint de Refatoração

## Design Patterns Identificados

### Singleton
`supabase` client em `src/integrations/supabase/client.ts` — instância única exportada e reutilizada em todo o projeto. Correto para clientes HTTP.

### Strategy (implícito)
`useOptimisticMutation` e `useRetryMutation` em `src/hooks/useOptimisticMutation.ts` — encapsulam estratégias diferentes de mutation (otimista vs retry com backoff exponencial) com a mesma interface. Bem implementado.

### Template Method
`useOptimisticMutation` define o esqueleto do fluxo (onMutate → onError rollback → onSuccess → onSettled invalidate) e delega `optimisticUpdate`, `successMessage` e `onSuccess` para o chamador. Boa abstração.

### Repository (parcial)
Os hooks (`useStudents`, `useFinancialRecords`, `useActivities`) funcionam como repositories — abstraem o acesso ao Supabase dos componentes. Porém, a camada não é pura: mistura queries com lógica de negócio (validação de telefone, sincronização de profiles, cálculo de valores).

### Factory (implícito)
`createErrorHandler(context)` em `src/lib/security/errorHandler.ts` — factory que cria handlers de erro pré-configurados com contexto.

### Observer
`supabase.auth.onAuthStateChange` no `AuthContext` — padrão Observer nativo do Supabase para reagir a mudanças de sessão.

---

## Princípios SOLID Aplicados

### ✅ Single Responsibility (parcialmente)
- `src/lib/utils/formatters.ts` — apenas formatação
- `src/lib/utils/financialStatus.ts` — apenas lógica de status financeiro
- `src/lib/validation/schemas.ts` — apenas schemas Zod
- `src/lib/utils/rateLimit.ts` — apenas rate limiting

### ✅ Open/Closed
`useOptimisticMutation` é extensível via callbacks sem modificar o hook base.

### ⚠️ Violações de SRP
- `useUpdateStudent` — validação + data fetching + sincronização de profiles + sincronização de user_roles + atualização de pay_day
- `useUserMutations.ts` — criação de usuário + fallback + geração de senha + validação + criação de student/teacher

### ✅ Dependency Inversion
Hooks dependem da abstração `supabase` client, não de implementações concretas de HTTP.

---

## Sprint de Refatoração

### REFORMA-001
**SEVERIDADE:** ALTA  
**MOTIVO:** Duplicação de `sanitizeErrorMessage` — existe em dois arquivos com lógica diferente e incompatível:
- `src/lib/security/errorHandler.ts` — versão simples, foca em erros de banco
- `src/lib/utils/errorMessages.ts` — versão completa com `detectErrorType()` e mapa de mensagens

Os hooks importam de fontes diferentes:
```ts
// useStudents.ts
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";

// useFinancialRecords.ts
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";

// useActivities.ts
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
```

Isso causa comportamento inconsistente: o mesmo erro de banco pode gerar mensagens diferentes dependendo do hook.

**FIX:** Consolidar em um único arquivo e remover o duplicado:
```ts
// src/lib/utils/errorMessages.ts — manter este (mais completo)
// src/lib/security/errorHandler.ts — remover sanitizeErrorMessage, re-exportar do utils

// errorHandler.ts
export { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
export function logError(error: Error | unknown, context?: Record<string, unknown>) { ... }
export function createErrorHandler(context: string) { ... }
```

---

### REFORMA-002
**SEVERIDADE:** ALTA  
**MOTIVO:** God Function — `useUpdateClassLog.mutationFn` tem complexidade ciclomática ~12. Faz:
1. Busca se aula é parte de pacote
2. Atualiza a aula
3. Se é pacote E duração mudou: busca todas as aulas do pacote, busca hourly_rate do aluno, recalcula valor total, atualiza cobrança do pacote
4. Se não é pacote: atualiza cobrança individual

```ts
// ~80 linhas em um único mutationFn com 4 níveis de aninhamento
mutationFn: async ({ id, financialRecordId, dueDate, amount, ...updates }) => {
  const { data: packageLink } = await supabase...  // query 1
  const { data } = await supabase.update...         // query 2
  if (financialRecordId) {
    if (isPackage && updates.duration_minutes) {
      const { data: packageLinks } = await supabase... // query 3
      const { data: packageClasses } = await supabase... // query 4
      const { data: student } = await supabase...        // query 5
      // cálculo de valor
      await supabase.update...                           // query 6
    }
    // ...
  }
}
```

**FIX:** Extrair para funções auxiliares:
```ts
async function updatePackageFinancial(classLogId: string, packageRecordId: string, newDurationMinutes: number) {
  const packageClasses = await fetchPackageClasses(packageRecordId);
  const student = await fetchStudent(packageClasses[0].student_id);
  const newAmount = calculatePackageAmount(packageClasses, student.hourly_rate);
  return supabase.from("financial_records").update({ amount: newAmount }).eq("id", packageRecordId);
}

// mutationFn simplificado
mutationFn: async ({ id, financialRecordId, dueDate, amount, ...updates }) => {
  const packageLink = await findPackageLink(id);
  const data = await updateClassLog(id, updates);
  
  if (financialRecordId) {
    if (packageLink && updates.duration_minutes !== undefined) {
      await updatePackageFinancial(id, packageLink.financial_record_id, updates.duration_minutes);
    } else {
      await updateIndividualFinancial(financialRecordId, { dueDate, amount });
    }
  }
  return data;
}
```

---

### REFORMA-003
**SEVERIDADE:** ALTA  
**MOTIVO:** Duplicação do padrão de detecção de overlap em 3 hooks diferentes com lógica idêntica:

```ts
// useCreateClassLog.onError
// useCreateClassLogWithFinancial.onError
// useUpdateClassLog.onError
const isOverlap =
  code === "23P01" ||
  msg.includes("neste horário") ||
  msg.includes("sobreposição") ||
  msg.includes("overlap") ||
  msg.includes("class_logs_no_overlap") ||
  msg.includes("exclusion constraint") ||
  msg.includes("conflicting key") ||
  msg.includes("agendada em");
toast.error(isOverlap ? "Já existe outra aula..." : "Erro ao registrar...");
```

**FIX:** Extrair para utilitário:
```ts
// src/lib/utils/classTime.ts (já existe)
export function isClassOverlapError(error: unknown): boolean {
  const msg = (error as Error)?.message?.toLowerCase() || "";
  const code = (error as { code?: string })?.code;
  return (
    code === "23P01" ||
    msg.includes("neste horário") ||
    msg.includes("sobreposição") ||
    msg.includes("overlap") ||
    msg.includes("class_logs_no_overlap") ||
    msg.includes("exclusion constraint") ||
    msg.includes("agendada em")
  );
}

export const CLASS_OVERLAP_MESSAGE = "Já existe outra aula neste horário para este professor. Escolha outro intervalo.";

// Uso nos hooks
onError: (error) => {
  toast.error(isClassOverlapError(error) ? CLASS_OVERLAP_MESSAGE : "Erro ao registrar aula.");
}
```

---

### REFORMA-004
**SEVERIDADE:** MÉDIA  
**MOTIVO:** `useClassLogs` faz N+1 queries para filtrar por professor. Em vez de usar JOIN, faz uma query separada para buscar os `student_ids` do professor e depois filtra:

```ts
// Query 1: busca student_ids do professor
const { data: teacherStudentIds } = await supabase
  .from("students")
  .select("id")
  .eq("teacher_id", effectiveTeacherId);

// Query 2: usa os IDs para filtrar class_logs
q = q.in("student_id", teacherStudentIds.map(s => s.id));
```

Com 500+ alunos, o array de IDs no `.in()` pode causar queries lentas.

**FIX:** Usar JOIN direto via PostgREST:
```ts
// Uma única query com JOIN
let q = supabase
  .from("class_logs")
  .select(`
    *,
    students!inner(name, teacher_id),
    ...
  `);

if (effectiveTeacherId) {
  q = q.eq("students.teacher_id", effectiveTeacherId);
}
```

---

### REFORMA-005
**SEVERIDADE:** MÉDIA  
**MOTIVO:** `useClassLogsSummary` carrega todos os registros de aulas para calcular estatísticas no frontend, com o mesmo padrão problemático de `useFinancialSummary`:

```ts
// Busca TODOS os class_logs (pode ser 100k+)
const { data } = await query; // sem paginação

// Calcula no frontend
data.forEach((log) => {
  if (log.attendance) summary.totalPresent++;
  else summary.totalAbsent++;
  if (log.grade !== null) { summary.gradesSum += Number(log.grade); ... }
});
```

**FIX:** Mover para RPC ou usar agregação SQL:
```ts
const { data } = await supabase.rpc('get_class_logs_summary', {
  p_teacher_id: teacherId
});
// RPC retorna { total_classes, total_present, total_absent, average_grade }
```

---

### REFORMA-006
**SEVERIDADE:** MÉDIA  
**MOTIVO:** `useAvailableClassLogsForStudent` faz 3 queries sequenciais (waterfall) para calcular quais aulas não têm cobrança:

```ts
// Query 1: busca todas as aulas do aluno
const { data: classLogs } = await supabase.from("class_logs")...

// Query 2: busca cobranças com class_log_id
const { data: financialRecords } = await supabase.from("financial_records")...

// Query 3: busca links de pacotes
const { data: packageLinks } = await supabase.from("financial_record_class_logs")...

// Filtra no frontend
return classLogs?.filter(log => !usedClassLogIds.has(log.id)) || [];
```

**FIX:** Paralelizar as queries independentes:
```ts
const [classLogs, financialRecords, packageLinks] = await Promise.all([
  supabase.from("class_logs").select("*").eq("student_id", studentId).order("class_date", { ascending: false }),
  supabase.from("financial_records").select("class_log_id").eq("student_id", studentId).not("class_log_id", "is", null),
  supabase.from("financial_record_class_logs").select("class_log_id").in("class_log_id", classLogIds)
]);
```

---

### REFORMA-007
**SEVERIDADE:** BAIXA  
**MOTIVO:** `enrichWithPackageFinancial` é uma função assíncrona que modifica o array passado por referência (mutação direta) e também retorna o array:

```ts
async function enrichWithPackageFinancial(list: ClassLogWithStudent[]): Promise<ClassLogWithStudent[]> {
  // ...
  withoutFinancial.forEach((log) => {
    (log as ClassLogWithStudent).financial_records = [fr]; // ← mutação direta
  });
  return list; // ← retorna o mesmo array mutado
}
```

Isso viola imutabilidade e pode causar bugs sutis com React (referência não muda, componente não re-renderiza).

**FIX:**
```ts
async function enrichWithPackageFinancial(list: ClassLogWithStudent[]): Promise<ClassLogWithStudent[]> {
  // ...
  return list.map((log) => {
    const frId = logToFr.get(log.id);
    const fr = frId ? frMap.get(frId) : null;
    if (!fr) return log;
    return { ...log, financial_records: [fr], financial_record_via_package: true };
  });
}
```

---

### REFORMA-008
**SEVERIDADE:** BAIXA  
**MOTIVO:** `gradeSchema` em `src/lib/validation/schemas.ts` define nota máxima como 10, mas o banco tem `CHECK (grade >= 0 AND grade <= 100)`. Inconsistência entre validação frontend e constraint do banco.

```ts
// schemas.ts
export const gradeSchema = z.number().min(0, "Nota mínima é 0").max(10, "Nota máxima é 10");

// migration 22_dba_fixes.sql
CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100))
```

**FIX:**
```ts
export const gradeSchema = z
  .number({ invalid_type_error: "Informe a nota" })
  .min(0, "Nota mínima é 0")
  .max(100, "Nota máxima é 100")
  .optional()
  .nullable();
```
