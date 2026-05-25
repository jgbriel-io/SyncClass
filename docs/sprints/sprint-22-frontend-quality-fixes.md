# Sprint 22 — Frontend Quality: Code Review Fixes

**Período:** 25/05/2026  
**Status:** ⬜ Planejada  
**Tipo:** Refatoração + Bug Fix

## Contexto

Code review automatizado (5 ângulos + sweep de frontend) sobre o branch `main`
identificou bugs reais e degradações de performance no frontend. Sprint 21 cobriu
débito técnico de hooks de dados; esta sprint cobre findings de validação,
queries, state management, acessibilidade e UX.

Um fix crítico (`MONEY_REGEX`) já foi aplicado antes da sprint ser criada —
documentado aqui para rastreabilidade.

---

## Itens

### FE-000 — `moneySchema` MONEY_REGEX rejeita valores de 4+ dígitos ✅ Corrigido

**Severidade:** 🔴 Crítica  
**Esforço:** 5min (já aplicado)  
**Arquivo:** `src/lib/validation/schemas.ts:102`

**Problema:** Regex `/^\d{1,3}(\.\d{3})*(,\d{2})?$/` exige separador de milhar
para valores ≥ 1.000. Entradas como `"1234,56"`, `"10000"` ou `"9999,99"` falham
silenciosamente, impedindo salvar valores sem ponto de milhar.

**Fix aplicado:**

```ts
// antes
const MONEY_REGEX = /^\d{1,3}(\.\d{3})*(,\d{2})?$/;

// depois
const MONEY_REGEX = /^(\d{1,3}(\.\d{3})*|\d+)(,\d{2})?$/;
```

**Critério de aceite:** `"1234,56"`, `"10000"`, `"9999,99"`, `"1.234,56"` e `"50"`
passam. `"abc"`, `"12,3"`, `"-50"` continuam rejeitando.

---

### FE-010 — Strings hardcoded em `ClassLogFormDialog` e `StudentFormDialog`

**Severidade:** 🔴 Crítica (viola convenção CLAUDE.md)  
**Esforço:** 20min  
**Arquivos:** `src/components/classes/ClassLogFormDialog.tsx:211`, `src/components/students/StudentFormDialog.tsx:220`

**Problema:** Ambos os arquivos contêm `"Selecione um professor"` hardcoded inline.
Viola regra obrigatória: strings UI **sempre** em `src/content/`.

**Fix:**

```ts
// src/content/classes.ts (ou equivalent)
export const classesContent = {
  ...
  teacherRequired: "Selecione um professor",
};

// nos components
import { classesContent } from "@/content/classes";
// ...
setError(classesContent.teacherRequired);
```

**Critério de aceite:** Grep por `"Selecione um professor"` retorna 0 resultados
em `src/components/`. Strings vivem em `src/content/`.

---

### FE-001 — `useUsers.ts` sem paginação carrega todos os usuários

**Severidade:** 🟠 Alta  
**Esforço:** 1h30min  
**Arquivo:** `src/hooks/useUsers.ts:91`

**Problema:** `fetchAllUsers` busca todas as linhas de `profiles`, `user_roles`,
`students` e `teachers` sem `range()` ou `limit()`. Com N usuários, retorna
N × 4 registros — memória e tempo crescem linearmente. Para demo TCC
(volume baixo) é invisível; produção real quebraria.

**Fix:** Paginação server-side via `range(offset, offset + pageSize - 1)`.
Para selects/comboboxes que precisam de todos: RPC agregador ou `staleTime` longo (5min).

```ts
.range(offset, offset + PAGE_SIZE - 1)
```

**Critério de aceite:** Admin page carrega em ≤2s com 500 usuários simulados.
Paginação de UI funciona sem regressão.

---

### FE-002 — `useUsers.ts` executa queries sequenciais sem `Promise.all`

**Severidade:** 🟠 Alta  
**Esforço:** 45min  
**Arquivo:** `src/hooks/useUsers.ts:236`

**Problema:** `queryFn` encadeia múltiplas queries com `await` sequencial.
Latência total = soma de todas as latências (~600ms+ em rede normal).

**Fix:**

```ts
const [profiles, roles, students, teachers] = await Promise.all([
  supabase.from("profiles").select("*"),
  supabase.from("user_roles").select("*"),
  supabase.from("students").select("*"),
  supabase.from("teachers").select("*"),
]);
```

**Critério de aceite:** DevTools Network mostra requisições em paralelo.
Latência percebida cai ~60%.

---

### FE-011 — `useUsers.ts` double role fetch (race condition)

**Severidade:** 🟠 Alta  
**Esforço:** 30min  
**Arquivo:** `src/hooks/useUsers.ts:199`

**Problema:** `fetchUserRole` chamado tanto em `onAuthStateChange` (L138)
quanto no callback de `getSession` (L206). Ambos podem disparar simultaneamente
causando race condition ou setState duplicado.

**Fix:** Deduplicar via flag ou `Promise.all` único na inicialização:

```ts
// usar apenas um ponto de entrada para buscar role
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) fetchUserRole(session.user.id);
  });
}, []);

// onAuthStateChange apenas para mudanças subsequentes (SIGNED_IN, SIGNED_OUT)
```

**Critério de aceite:** DevTools Network não mostra `/user_roles` duplicado
no carregamento inicial. State de role seta uma única vez.

---

### FE-003 — `AuthContext` polling de status de conta a cada 30s

**Severidade:** 🟠 Alta  
**Esforço:** 1h  
**Arquivo:** `src/contexts/AuthContext.tsx:196`

**Problema:** `setInterval` de 30s verifica status da conta. Com N sessões,
servidor recebe N requests/30s — escala O(N). Interval não limpo no logout
causa requests após unmount.

**Fix:** Substituir por Supabase Realtime com cleanup correto:

```ts
const channel = supabase
  .channel("account-status")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "profiles",
      filter: `user_id=eq.${user.id}`,
    },
    handleStatusChange
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
```

Fallback se Realtime indisponível: intervalo de 5min (reduz carga 10×).

**Critério de aceite:** Sem `setInterval` de 30s. Interval limpo no logout/unmount.

---

### FE-012 — `AuthContext` setTimeout async sem cleanup de unmount

**Severidade:** 🟠 Alta  
**Esforço:** 30min  
**Arquivo:** `src/contexts/AuthContext.tsx:136`

**Problema:** `setTimeout(async () => { ... }, 0)` faz fetch de role sem
rastrear se componente desmontou. `isMounted` check antes de `setState` existe
mas o fetch ainda corre até o fim — memory leak e possível state update pós-unmount.

**Fix:** Usar `AbortController` ou flag combinada com cleanup:

```ts
let cancelled = false;
setTimeout(async () => {
  const role = await fetchUserRole(userId);
  if (!cancelled) setUserRole(role);
}, 0);
return () => {
  cancelled = true;
};
```

**Critério de aceite:** Desmount durante o fetch inicial não produz warning
"Can't perform a React state update on an unmounted component".

---

### FE-004 — `useUpdateStudent` invalida 10 queries (scope excessivo)

**Severidade:** 🟠 Alta  
**Esforço:** 30min  
**Arquivo:** `src/hooks/useStudents.ts:336`

**Problema:** `onSuccess` invalida 10 chaves diferentes, disparando refetch
de dados não relacionados à edição de aluno.

**Fix:**

```ts
// Apenas keys afetadas por edição de dados cadastrais
queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
queryClient.invalidateQueries({ queryKey: ["student", variables.id] });
// Remover: class_logs, financial_records, activities (não mudam)
```

**Critério de aceite:** Update de aluno dispara ≤3 invalidações. Sem regressão
em views relacionadas.

---

### FE-013 — `useStudents` mutations invalidam sem `exact: false`

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `src/hooks/useStudents.ts:179`

**Problema:** `invalidateQueries({ queryKey: [QK.STUDENTS] })` sem `exact: false`
não invalida chaves compostas como `[QK.STUDENTS, { page: 2 }]` ou
`[QK.STUDENTS_PAGINATED, ...]`. Dados paginados ficam stale após mutação.

**Fix:**

```ts
queryClient.invalidateQueries({ queryKey: [QK.STUDENTS], exact: false });
queryClient.invalidateQueries({
  queryKey: [QK.STUDENTS_PAGINATED],
  exact: false,
});
```

**Critério de aceite:** Criar/editar aluno invalida todas as páginas da listagem.

---

### FE-005 — State collision em `FinancialView` (historyRecord vs confirmPaymentRecord)

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Arquivo:** `src/components/financial/FinancialView.tsx:252`

**Problema:** `onConfirmPayment` seta `historyRecord` em vez de `confirmPaymentRecord`.
Abre dialog de histórico ao tentar confirmar pagamento — dado errado na tela.

**Fix:** Cada handler seta exclusivamente seu próprio state:

```ts
const handleOpenHistory = (r: FinancialRecord) => setHistoryRecord(r);
const handleConfirmPayment = (r: FinancialRecord) => setConfirmPaymentRecord(r);
```

**Critério de aceite:** Acionar "confirmar pagamento" abre dialog de confirmação,
não de histórico. Sem mistura de dados.

---

### FE-014 — `FinancialPaymentHistoryDialog` non-null assertion sem guard

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Arquivo:** `src/components/financial/FinancialPaymentHistoryDialog.tsx:193`

**Problema:** `record!` usa non-null assertion sem verificação prévia.
Se `record` for `null` (bug de state), throw em runtime sem mensagem útil.

**Fix:**

```ts
if (!record) return null; // guard explícito antes do acesso
```

**Critério de aceite:** Render sem `record` retorna null silenciosamente.
Sem runtime error em estado inválido.

---

### FE-015 — `FinancialFormDialog` usa string de validação errada para professor

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Arquivo:** `src/components/financial/FinancialFormDialog.tsx:162`

**Problema:** `teacherError` seta `financial.validation.studentRequired` — mensagem
de **aluno** aplicada a campo de **professor**. Usuário vê "Selecione um aluno"
ao não selecionar professor.

**Fix:**

```ts
// adicionar em src/content/financial.ts
teacherRequired: ("Selecione um professor",
  // no component
  setTeacherError(financial.validation.teacherRequired));
```

**Critério de aceite:** Validação de professor exibe mensagem correta.

---

### FE-016 — `ClassLogFormDialog` semCobranca não inicializado em modo edição

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Arquivo:** `src/components/classes/ClassLogFormDialog.tsx:80`

**Problema:** `defaultValues` seta `semCobranca: false` fixo. Em modo edição
(passando `classLog` existente), campo não reflete o valor salvo — usuário
abre edição e vê estado errado para esse toggle.

**Fix:**

```ts
defaultValues: {
  semCobranca: classLog?.sem_cobranca ?? false,
  // ... outros campos
}
```

**Critério de aceite:** Abrir edição de aula com `sem_cobranca = true` exibe
o toggle ativado. Sem regressão em criação nova.

---

### FE-006 — `useStudents` sem `staleTime` refaz fetch a todo mount

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `src/hooks/useStudents.ts:49`

**Problema:** `staleTime` padrão = 0ms. Qualquer remount dispara novo fetch.

**Fix:**

```ts
staleTime: 60_000, // 1 minuto
```

**Critério de aceite:** Navegar entre páginas não refaz fetch se dados têm < 1min.
DevTools Query: status `fresh`.

---

### FE-017 — `useTeachers` sem `staleTime`

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Arquivo:** `src/hooks/useTeachers.ts:77`

**Problema:** Mesmo padrão de FE-006. Lista de professores raramente muda,
mas refetch ocorre a todo mount.

**Fix:**

```ts
staleTime: 5 * 60_000, // 5 minutos (lista mais estável que alunos)
```

**Critério de aceite:** Montar componente que usa `useTeachers` não dispara
refetch se dados têm < 5min.

---

### FE-007 — `invalidateQueries` em useActivities sem `exact: false`

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `src/hooks/useActivities.ts:335`

**Problema:** `invalidateQueries({ queryKey: ['activities'] })` não invalida
keys compostas. Dados filtrados ficam stale após mutação.

**Fix:**

```ts
queryClient.invalidateQueries({ queryKey: ["activities"], exact: false });
```

**Critério de aceite:** Criar atividade invalida todas as variantes de `['activities', ...]`.

---

### FE-018 — `useActivities` sem guard `enabled` adequado

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `src/hooks/useActivities.ts:306`

**Problema:** Se `fetchAll = false` e `teacherId`/`studentId` ambos `undefined`,
query ainda executa retornando lista vazia — request desnecessário.

**Fix:**

```ts
enabled: fetchAll || !!teacherId || !!studentId,
```

**Critério de aceite:** Query não dispara quando nenhum filtro está definido
e `fetchAll = false`.

---

### FE-019 — `emailSchema` aceita string vazia como válida

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Arquivo:** `src/lib/validation/schemas.ts:39`

**Problema:** `.optional()` + refine `!v` → string vazia `""` passa na validação
(é falsy mas `.optional()` não converte string para `undefined`). Campo opcional
aceita `""` quando deveria aceitar apenas email válido ou ausência total.

**Fix:**

```ts
export const emailSchema = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined)
  .refine((v) => !v || REGEX_PATTERNS.email.test(v), {
    message: validation.emailInvalid,
  });
```

**Critério de aceite:** `""` e `"   "` tratados como ausência (undefined).
Email inválido como `"a@"` rejeitado com mensagem correta.

---

### FE-008 — `pay_day` aceita valores negativos e fora do range 1–31

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Arquivo:** `src/components/students/StudentFormDialog.tsx:365`

**Problema:** `min=1`/`max=31` no input HTML bypassável via teclado. RHF usa
valor JS sem restrição.

**Fix:**

```ts
// Schema Zod
pay_day: z.number().int().min(1).max(31).optional().nullable();

// onChange
const v = parseInt(e.target.value);
field.onChange(isNaN(v) ? null : Math.min(31, Math.max(1, v)));
```

**Critério de aceite:** `-5` e `99` geram erro de validação antes do submit.

---

### FE-009 — `ClassLogFormDialog` não reseta aluno selecionado ao reabrir

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Arquivo:** `src/components/classes/ClassLogFormDialog.tsx:148`

**Problema:** Reabrir dialog mantém aluno da sessão anterior.

**Fix:**

```ts
onOpenChange={(open) => {
  if (!open) {
    form.reset(defaultValues);
    setSelectedStudent(null);
  }
  onClose();
}}
```

**Critério de aceite:** Dialog reaberto mostra campos limpos. Nenhum aluno pré-selecionado.

---

### FE-020 — `StudentFormDialog` double-render por defaultValues duplicados

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Arquivo:** `src/components/students/StudentFormDialog.tsx:93`

**Problema:** `useForm` recebe `defaultValues` inline e `useEffect` chama
`form.reset()` logo após. Resultado: render inicial com valores inline,
seguido de re-render imediato com valores do reset — flash de estado.

**Fix:** Calcular `defaultValues` uma vez fora do `useForm` e não usar reset
para sobrescrevê-los na inicialização:

```ts
const defaultValues = useMemo(() => buildDefaultValues(student), [student]);
const form = useForm({ defaultValues });
// remover useEffect que chama reset na montagem
```

**Critério de aceite:** Abrir dialog de edição não produz re-render extra.
Valores carregados diretamente no estado inicial do form.

---

### FE-021 — `FinancialFormDialog` onChange sem debounce em campo de valor

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Arquivo:** `src/components/financial/FinancialFormDialog.tsx:294`

**Problema:** `onChange` do campo `amount` executa `formatNumberToMoneyBR` +
`setValue` em cada keystroke. Com re-renders pesados, causa lag perceptível
em digitação rápida.

**Fix:** Validar `onBlur` em vez de `onChange`, ou debounce de 200ms:

```ts
// opção 1: mode: 'onBlur' no useForm
// opção 2: debounce
const debouncedFormat = useMemo(
  () => debounce((v) => setValue("amount", format(v)), 200),
  []
);
```

**Critério de aceite:** Digitar valor no campo não causa lag. Re-renders de
formatação ocorrem ≤1× por 200ms.

---

### FE-022 — `BaseDialog` aria-describedby sempre `undefined`

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivo:** `src/components/ui/custom/BaseDialog.tsx:47`

**Problema:** `aria-describedby={description ? undefined : undefined}` — ambos
os branches retornam `undefined`. Elemento description nunca associado ao dialog
por acessibilidade.

**Fix:**

```ts
const descriptionId = description ? `dialog-desc-${id}` : undefined;

<DialogDescription id={descriptionId}>{description}</DialogDescription>
<DialogContent aria-describedby={descriptionId}>
```

**Critério de aceite:** Dialog com `description` prop tem `aria-describedby`
apontando para o elemento correto. Leitores de tela anunciam a descrição.

---

### FE-023 — `FinancialPaymentHistoryDialog` query sem guard `enabled`

**Severidade:** 🔵 Info  
**Esforço:** 5min  
**Arquivo:** `src/components/financial/FinancialPaymentHistoryDialog.tsx:38`

**Problema:** `useCurrentUserProfile` chamado sem `enabled: !!user?.id`.
Se `user` for undefined no momento do render, query executa com key undefined.

**Fix:**

```ts
useCurrentUserProfile({ enabled: !!user?.id });
```

**Critério de aceite:** Query não dispara quando usuário ainda não carregou.

---

### FE-024 — `FinancialView` scroll forçado na primeira carga

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Arquivo:** `src/components/financial/FinancialView.tsx:91`

**Problema:** `useEffect` scrolla para o topo em qualquer mudança de página,
incluindo o primeiro render — usuário pode ver salto visual ao carregar a view.

**Fix:**

```ts
scrollIntoView({ behavior: isFirstLoad ? "auto" : "smooth" });
```

**Critério de aceite:** Primeira carga sem scroll. Mudança de página com
scroll suave.

---

### FE-025 — Strings hardcoded em `FinancialView` e `FinancialPaymentHistoryDialog`

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Arquivos:** `src/components/financial/FinancialView.tsx:271`, `src/components/financial/FinancialPaymentHistoryDialog.tsx:55`

**Problema:** Dois strings PT-BR hardcoded em componentes:

1. `FinancialView:271` — `"As cobranças são criadas ao registrar aulas..."` e `"Ajuste os filtros acima ou limpe a busca"` inline no JSX
2. `FinancialPaymentHistoryDialog:55` — `rejectionReason: "Comprovante inválido"` hardcoded na chamada da mutation

**Fix:**

```ts
// src/content/financial.ts
paymentHistoryDialog: {
  rejectionReason: "Comprovante inválido",
  emptyStateMessage: "As cobranças são criadas ao registrar aulas...",
  filterEmptyMessage: "Ajuste os filtros acima ou limpe a busca",
}

// nos components
rejectionReason: financial.paymentHistoryDialog.rejectionReason
```

**Critério de aceite:** Grep por `"Comprovante inválido"` e `"Ajuste os filtros"` retorna 0 hits em `src/components/`.

---

### FE-026 — Inputs de senha sem `autocomplete` em 3 dialogs

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Arquivos:** `src/components/users/ResetPasswordDialog.tsx:153`, `src/components/teachers/TeacherResetPasswordDialog.tsx:100`, `src/components/students/StudentResetPasswordDialog.tsx:127`

**Problema:** Todos os `type="password"` nos dialogs de reset de senha não têm
`autocomplete`. Gerenciadores de senha não conseguem preencher automaticamente,
e browsers mostram warning de acessibilidade.

**Fix:**

```tsx
<Input
  type="password"
  autocomplete="new-password"  // reset de senha sempre = new-password
  ...
/>
```

**Critério de aceite:** Todos os inputs `type="password"` têm `autocomplete="new-password"`.
Sem warnings de acessibilidade no Lighthouse.

---

## Ordem de Implementação Recomendada

| #   | Item   | Esforço | Risco | Impacto                                     |
| --- | ------ | ------- | ----- | ------------------------------------------- |
| ✅  | FE-000 | —       | —     | Validação monetária corrigida               |
| 1   | FE-010 | 20min   | Baixo | Strings hardcoded → content bundle          |
| 2   | FE-015 | 10min   | Baixo | Mensagem errada de validação professor      |
| 3   | FE-007 | 15min   | Baixo | invalidateQueries activities exact:false    |
| 4   | FE-013 | 15min   | Baixo | invalidateQueries students exact:false      |
| 5   | FE-006 | 15min   | Baixo | staleTime useStudents                       |
| 6   | FE-017 | 10min   | Baixo | staleTime useTeachers                       |
| 7   | FE-023 | 5min    | Baixo | enabled guard FinancialPaymentHistoryDialog |
| 8   | FE-014 | 10min   | Baixo | non-null guard record!                      |
| 9   | FE-019 | 15min   | Baixo | enabled guard useActivities                 |
| 10  | FE-019 | 10min   | Baixo | emailSchema empty string                    |
| 11  | FE-025 | 15min   | Baixo | Strings hardcoded Financial dialogs         |
| 12  | FE-026 | 10min   | Baixo | autocomplete="new-password" inputs          |
| 13  | FE-022 | 15min   | Baixo | aria-describedby BaseDialog                 |
| 12  | FE-005 | 30min   | Médio | State collision FinancialView               |
| 13  | FE-008 | 20min   | Baixo | pay_day validação                           |
| 14  | FE-009 | 20min   | Baixo | ClassLogFormDialog reset student            |
| 15  | FE-016 | 20min   | Baixo | semCobranca modo edição                     |
| 16  | FE-020 | 20min   | Médio | StudentFormDialog double-render             |
| 17  | FE-021 | 20min   | Médio | FinancialFormDialog debounce amount         |
| 18  | FE-024 | 10min   | Baixo | FinancialView scroll primeira carga         |
| 19  | FE-004 | 30min   | Médio | -7 invalidações por update aluno            |
| 20  | FE-012 | 30min   | Médio | AuthContext setTimeout cleanup              |
| 21  | FE-002 | 45min   | Médio | Promise.all useUsers                        |
| 22  | FE-011 | 30min   | Alto  | Double role fetch race condition            |
| 23  | FE-003 | 1h      | Alto  | Eliminar polling O(N) → Realtime            |
| 24  | FE-001 | 1h30min | Alto  | Paginação admin (escala)                    |

**Total estimado:** ~11h

## Dependências

- FE-003 requer canal Realtime habilitado no projeto Supabase (já está)
- FE-001 pode exigir ajuste na UI de admin para suportar paginação
- FE-010 requer string nova em `src/content/` antes de atualizar os components
- Demais itens são mudanças TypeScript puras, zero risco de migration

## Referências

- [Sprint 21](./sprint-21-tech-debt-backlog.md) — Débito técnico de hooks de dados
- [Sprint 18](./sprint-18-consolidacao-problemas-identificados.md) — Code review original
- `src/hooks/useUsers.ts` — FE-001, FE-002, FE-011
- `src/contexts/AuthContext.tsx` — FE-003, FE-012
- `src/hooks/useStudents.ts` — FE-004, FE-006, FE-013
- `src/hooks/useTeachers.ts` — FE-017
- `src/hooks/useActivities.ts` — FE-007, FE-018
- `src/lib/validation/schemas.ts` — FE-000 (corrigido), FE-019
- `src/components/financial/FinancialView.tsx` — FE-005, FE-024, FE-025
- `src/components/financial/FinancialFormDialog.tsx` — FE-015, FE-021
- `src/components/financial/FinancialPaymentHistoryDialog.tsx` — FE-014, FE-023, FE-025
- `src/components/users/ResetPasswordDialog.tsx` — FE-026
- `src/components/teachers/TeacherResetPasswordDialog.tsx` — FE-026
- `src/components/students/StudentResetPasswordDialog.tsx` — FE-026
- `src/components/classes/ClassLogFormDialog.tsx` — FE-009, FE-010, FE-016
- `src/components/students/StudentFormDialog.tsx` — FE-008, FE-010, FE-020
- `src/components/ui/custom/BaseDialog.tsx` — FE-022
