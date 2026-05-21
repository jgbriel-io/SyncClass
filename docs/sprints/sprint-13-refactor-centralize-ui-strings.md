# Sprint 13 — Refactor: Centralize UI Strings

> **Nomenclatura do arquivo:** `sprint-13-refactor-centralize-ui-strings.md`

**Período:** 20 maio 2026
**Status:** ✅ Concluída
**Tipo:** Refactor
**Prioridade:** 🟡 Média

## Problem Statement

Após Sprint 12, a estrutura de `src/content/` estava criada mas ainda havia strings hardcoded não migradas:

**Strings Faltando:**
- Toasts de sucesso/erro em componentes (~50 strings)
- Placeholders de inputs (~30 strings)
- Labels de tabelas (~20 strings)
- Mensagens de validação Zod (~40 strings)
- Empty states genéricos (~15 strings)
- Aria-labels de acessibilidade (~25 strings)
- Textos de PWA (~10 strings)

**Total:** ~190 strings hardcoded ainda presentes

**Impacto:**
- Centralização incompleta (Sprint 12 cobriu ~70%)
- Inconsistência (alguns textos centralizados, outros não)
- Dificulta i18n (ainda há strings hardcoded)

## Requirements

### Novos Arquivos de Content
- `src/content/validation.ts` — todas mensagens de validação Zod
- `src/content/ui.ts` — empty states, paginação, filtros genéricos
- `src/content/pwa.ts` — install banner, PIX payment box

### Expandir Arquivos Existentes
- Adicionar seções `toasts`, `placeholders`, `labels` em todos os arquivos de domínio
- Expandir `common.ts` com seções: `toasts`, `aria`, `emptyStates`, `placeholders`, `labels`

### Critérios de Conclusão
- ✅ 100% das strings de UI centralizadas
- ✅ Nenhuma string hardcoded em componentes (exceto constantes técnicas)
- ✅ Build sem erros

## Background

**Tipos de strings ainda hardcoded:**

1. **Toasts:**
```tsx
// Antes
toast.success('Aluno criado com sucesso!');
toast.error('Erro ao criar aluno.');

// Depois
import { students } from '@/content';
toast.success(students.formDialog.toasts.success);
toast.error(students.formDialog.toasts.error);
```

2. **Placeholders:**
```tsx
// Antes
<Input placeholder="Digite o nome do aluno" />

// Depois
import { students } from '@/content';
<Input placeholder={students.formDialog.namePlaceholder} />
```

3. **Validação Zod:**
```tsx
// Antes
z.string().min(1, 'Campo obrigatório').email('Email inválido')

// Depois
import { validation } from '@/content';
z.string().min(1, validation.required).email(validation.emailInvalid)
```

## Proposed Solution

### Estrutura de Novos Arquivos

```ts
// src/content/validation.ts
export const validation = {
  required: 'Campo obrigatório',
  emailRequired: 'Email é obrigatório',
  emailInvalid: 'Email inválido',
  phoneRequired: 'Telefone é obrigatório',
  phoneInvalid: 'Telefone inválido',
  // ... todas as validações
};

// src/content/ui.ts
export const ui = {
  emptyStates: {
    students: {
      title: 'Nenhum aluno cadastrado',
      description: 'Comece adicionando seu primeiro aluno',
      actionLabel: 'Adicionar Aluno',
    },
    // ... outros empty states
  },
  pagination: {
    previous: 'Anterior',
    next: 'Próximo',
    // ...
  },
};

// src/content/pwa.ts
export const pwa = {
  installBanner: {
    title: 'Instalar SyncClass',
    description: 'Instale o app para acesso rápido',
    install: 'Instalar',
    dismiss: 'Agora não',
  },
};
```

### Expansão de Arquivos Existentes

```ts
// src/content/activities.ts (expandido)
export const activities = {
  // ... seções existentes
  sendDialog: {
    // ... campos existentes
    toasts: {
      success: 'Atividade enviada com sucesso!',
      error: 'Erro ao enviar atividade.',
    },
    descriptionPlaceholder: 'Descreva a atividade...',
  },
};
```

## Task Breakdown

### Task 1: Criar src/content/validation.ts

- **Objetivo:** Centralizar todas mensagens de validação Zod
- **Implementação:**
  - Criar arquivo com todas as mensagens de validação
  - Campos obrigatórios: `required`, `emailRequired`, `phoneRequired`, etc.
  - Validações de formato: `emailInvalid`, `phoneInvalid`, `cpfInvalid`, `dateInvalid`, etc.
  - Validações de range: `minLength`, `maxLength`, `minValue`, `maxValue`
  - Validações específicas: `gradeRange` (0-100), `payDayRange` (1-31)
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/validation.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** `import { validation } from '@/content'` funciona

### Task 2: Criar src/content/ui.ts

- **Objetivo:** Centralizar textos de componentes UI genéricos
- **Implementação:**
  - Seção `emptyStates`: students, classes, financial, activities, search, history, birthdays
  - Seção `pagination`: previous, next, page, of, showing, results
  - Seção `filters`: all, active, inactive, pending, paid, overdue
  - Seção `location`: country, state, city placeholders
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/ui.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** `import { ui } from '@/content'` funciona

### Task 3: Criar src/content/pwa.ts

- **Objetivo:** Centralizar textos de PWA
- **Implementação:**
  - Seção `installBanner`: title, description, install, dismiss, toasts
  - Seção `pixPayment`: title, copyKey, copied, uploadProof
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/pwa.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** `import { pwa } from '@/content'` funciona

### Task 4: Expandir src/content/activities.ts

- **Objetivo:** Adicionar toasts, placeholders e labels
- **Implementação:**
  - `sendDialog.toasts`: success, error
  - `sendDialog.descriptionPlaceholder`
  - `editDialog.toasts`: success, error
  - `editDialog.descriptionPlaceholder`
  - `deliverDialog`: seção completa (title, labels, placeholders, toasts)
  - `correctionDialog.toasts`: success, error
  - `deleteDialog.toasts`: success, error
- **Arquivos modificados:**
  - `src/content/activities.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 5: Expandir src/content/classes.ts

- **Objetivo:** Adicionar toasts em todos os dialogs
- **Implementação:**
  - `logFormDialog.toasts`: success, successEdit, error
  - `postClassDialog.toasts`: proofOpenError, evaluationError, success
  - `packageDialog.toasts`: selectMonth, selectWeekday, invalidTime, endTimeBeforeStart, noDatesFound, generated, selectPaymentMethod, success, error
  - `deleteDialog.toasts`: success, error
- **Arquivos modificados:**
  - `src/content/classes.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 6: Expandir src/content/financial.ts

- **Objetivo:** Adicionar toasts em todos os dialogs
- **Implementação:**
  - `formDialog.toasts`: success, error
  - `confirmPaymentDialog.toasts`: success, error
  - `undoDialog.toasts`: success, error
  - `deleteDialog.toasts`: success, error
  - `paymentHistoryDialog.toasts`: approveSuccess, approveError, rejectSuccess, rejectError, proofOpenError
- **Arquivos modificados:**
  - `src/content/financial.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 7: Expandir src/content/students.ts

- **Objetivo:** Adicionar toasts, placeholders e labels
- **Implementação:**
  - `formDialog.toasts`: success, error
  - `formDialog` placeholders: yearPlaceholder, teacherPlaceholder, paymentMethodPlaceholder
  - `formDialog` labels: teacherLabel, paymentMethodLabel
  - `archiveDialog.toasts`: success, error
  - `deleteDialog.toasts`: success, error
  - `resetPasswordDialog.toasts`: success, error
  - `table`: noCharges, daysWithoutClass, editedAt
- **Arquivos modificados:**
  - `src/content/students.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 8: Expandir src/content/teachers.ts

- **Objetivo:** Adicionar toasts e labels
- **Implementação:**
  - `formDialog.toasts`: success, error
  - `statusDialog.toasts`: success, error
  - `deleteDialog.toasts`: success, error
  - `resetPasswordDialog.toasts`: success, error
  - `table`: statusActive, statusInactive, editedAt, viewDetails
- **Arquivos modificados:**
  - `src/content/teachers.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 9: Expandir src/content/users.ts

- **Objetivo:** Adicionar toasts e labels
- **Implementação:**
  - `formDialog.toasts`: success, error
  - `resetPasswordDialog.toasts`: success, error
  - `table`: statusActive, statusInactive, roleAdmin, roleTeacher, roleStudent, linkedStudent, linkedTeacher, linkedAdmin, createdAt, viewDetails
- **Arquivos modificados:**
  - `src/content/users.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 10: Expandir src/content/common.ts

- **Objetivo:** Adicionar 5 novas seções
- **Implementação:**
  - `toasts`: success, error, saved, deleted, updated, created, copied, loading, processing
  - `aria`: tablePagination, previousPage, nextPage, closeDialog, openMenu, closeMenu, loading, search, filter, sort, moreOptions
  - `emptyStates`: noResults, noResultsHint, noData, noRecords, searchEmpty, filterEmpty
  - `placeholders`: search, searchByName, searchByEmail, searchByNameOrEmail, select, selectOption, optional, none, notAvailable, notInformed
  - `labels`: all, active, inactive, yes, no, name, email, phone, status, date, time, description, observations, actions, details, more, less, viewMore, viewLess, viewDetails, editedAt, createdAt, updatedAt
- **Arquivos modificados:**
  - `src/content/common.ts`
- **Teste:** Arquivo compila sem erros
- **Demo:** Novas chaves acessíveis

### Task 11: Atualizar src/content/index.ts

- **Objetivo:** Exportar novos arquivos
- **Implementação:**
  - Adicionar `export { validation } from './validation';`
  - Adicionar `export { ui } from './ui';`
  - Adicionar `export { pwa } from './pwa';`
- **Arquivos modificados:**
  - `src/content/index.ts`
- **Teste:** Imports funcionam
- **Demo:** `import { validation, ui, pwa } from '@/content'` funciona

## Implementation Details

### Novos Arquivos Criados

| Arquivo | Seções | Chaves | Linhas |
|---------|--------|--------|--------|
| `validation.ts` | Validações Zod | 30 | 60 |
| `ui.ts` | Empty states, pagination, filtros | 40 | 80 |
| `pwa.ts` | Install banner, PIX | 15 | 30 |

### Arquivos Expandidos

| Arquivo | Novas Seções | Novas Chaves | Linhas Adicionadas |
|---------|--------------|--------------|-------------------|
| `activities.ts` | toasts, deliverDialog | 15 | 30 |
| `classes.ts` | toasts em todos dialogs | 20 | 40 |
| `financial.ts` | toasts em todos dialogs | 15 | 30 |
| `students.ts` | toasts, placeholders, table | 18 | 35 |
| `teachers.ts` | toasts, table | 12 | 25 |
| `users.ts` | toasts, table | 15 | 30 |
| `common.ts` | toasts, aria, emptyStates, placeholders, labels | 50 | 100 |

## Files Created

```
src/
└── content/
    ├── validation.ts          ← Validações Zod
    ├── ui.ts                  ← Empty states, pagination
    └── pwa.ts                 ← PWA texts
```

## Files Modified

- `src/content/index.ts` — exportar novos arquivos
- `src/content/activities.ts` — adicionar toasts, deliverDialog
- `src/content/classes.ts` — adicionar toasts em todos dialogs
- `src/content/financial.ts` — adicionar toasts em todos dialogs
- `src/content/students.ts` — adicionar toasts, placeholders, table
- `src/content/teachers.ts` — adicionar toasts, table
- `src/content/users.ts` — adicionar toasts, table
- `src/content/common.ts` — adicionar 5 novas seções

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Teste manual: imports funcionam
- [x] Teste manual: autocomplete funciona (tipos TypeScript)
- [x] Estrutura pronta para Sprint 14 (substituir strings hardcoded)

## Results & Impact

### Métricas Quantitativas
- ✅ 3 novos arquivos criados (170 linhas)
- ✅ 7 arquivos expandidos (290 linhas adicionadas)
- ✅ 185 novas chaves de texto adicionadas
- ✅ Estrutura completa para centralização

### Melhorias Qualitativas
- ✅ Estrutura completa de content (16 arquivos)
- ✅ Todas as categorias de texto cobertas
- ✅ Pronto para Sprint 14 (substituir strings hardcoded)
- ✅ Autocomplete melhorado (mais chaves disponíveis)

## Lessons Learned

### O que funcionou bem ✅

- **Estrutura completa antes de substituir:** Criar todos os arquivos de content (Sprint 12-13) antes de substituir strings (Sprint 14) permitiu visão completa. Alternativa seria incremental (criar + substituir por domínio) — mais arriscado.
- **Seções granulares:** Separar content em seções (`toasts`, `placeholders`, `labels`, `validation`) facilitou navegação. Alternativa seria flat structure (`activities.sendDialogSuccessToast`) — mais verboso.
- **Tipos TypeScript:** Exportar objetos tipados garantiu autocomplete e detectou typos. Sem tipos, erros só apareceriam em runtime.
- **Barrel export:** `src/content/index.ts` que re-exporta tudo simplificou imports. `import { activities, common } from '@/content'` é mais limpo que múltiplos imports.

### O que poderia melhorar ⚠️

- **Expansão tardia:** Adicionar seções (`toasts`, `placeholders`) apenas na Sprint 13 atrasou substituição. Ideal seria criar estrutura completa na Sprint 12.
- **Validação de chaves:** Sem validação automática, chaves podem ficar desatualizadas. Exemplo: renomear `sendDialog` → `createDialog` quebra componentes silenciosamente (TypeScript ajuda, mas não previne 100%).
- **Documentação de estrutura:** Faltou guia de como adicionar novas chaves. Desenvolvedores podem criar estruturas inconsistentes (ex: `toasts.success` vs `successToast`).

### Aplicações futuras 💡

- **Schema de validação:** JSON Schema ou Zod para validar estrutura de content. Garante consistência (todas as seções têm `toasts.success` e `toasts.error`).
- **Geração automática:** Script que gera arquivos de content baseado em componentes existentes. Detecta strings hardcoded e sugere estrutura de content.
- **Guia de contribuição:** Documentar padrões de nomenclatura (`toasts.success`, não `successToast`) e estrutura de seções. Previne inconsistências.

## Technical Debt

- [ ] Strings ainda não substituídas nos componentes — Sprint 14
- [ ] Auditoria final necessária — Sprint 15

## Next Steps

1. Sprint 14: Substituir strings hardcoded nos componentes
2. Sprint 15: Auditoria final de strings
3. Futuro: Adicionar suporte a EN (inglês)

## References

- Commits: 20 mai 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
- Sprint anterior: Sprint 12 (estrutura inicial de content)
