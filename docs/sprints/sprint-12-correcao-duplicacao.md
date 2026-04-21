# Sprint 12 — Duplicação de código

**Prioridade:** 🟡 Baixa  
**Esforço estimado:** Baixo  
**Status:** ⬜ Pendente

> Fazer após Sprint 1, pois a tarefa 3.1 depende do `useTeacherId` criado lá.

## Tarefas

### 3.1 — Query de `teacherId` duplicada nas páginas teacher

**Dependência:** Sprint 1, tarefa 1.1

Após criar `useTeacherId()`, substituir o bloco duplicado em todas as páginas:
- `TeacherHome.tsx`
- `TeacherStudents.tsx`
- `TeacherClasses.tsx`
- `TeacherFinancial.tsx`
- `TeacherOverview.tsx`

Cada página passa de ~70 linhas para ~30 linhas.

---

### 3.2 — Funções de formatação duplicadas em componentes de classes

As funções abaixo aparecem em múltiplos arquivos dentro de `src/components/classes/`:
- `formatClassDateAndTime`
- `getPaymentStatusLabel`
- `getPaymentStatusVariant`
- `formatDuration`
- `getClassLogDisplayTitle`

**Arquivos com duplicação:**
- `ClassesView.tsx`
- `ClassesTableRow.tsx`
- `ClassLogRow.tsx`
- `ClassDetailSheet.tsx`

**Ação:** Consolidar em `src/components/classes/ClassesTableRow.constants.ts` ou criar `src/lib/utils/classFormatters.ts` e importar de lá.

---

### 3.3 — `brDateToIso` duplicada em formulários

A função `brDateToIso` aparece em:
- `StudentFormDialog.tsx`
- `UserFormDialog.tsx`
- `FinancialFormDialog.tsx`
- `ClassLogFormDialog.tsx`

**Ação:** Mover para `src/lib/utils/formatters.ts` (já existe) e importar de lá.

---

## Critério de Conclusão

- `useTeacherId` usado em todas as páginas teacher
- Funções de formatação de classes centralizadas
- `brDateToIso` em um único lugar

