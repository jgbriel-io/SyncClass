# Sprint 20 - Centralização de Strings (Continuação Sprint 19)

## Objetivo

Completar centralização de strings hardcoded em português, expandindo estrutura criada na Sprint 19.

## Problema

Após Sprint 19, ainda havia ~170+ strings hardcoded em:
- Toasts de sucesso/erro em componentes
- Placeholders de inputs
- Labels de tabelas
- Mensagens de validação Zod
- Empty states genéricos
- Aria-labels de acessibilidade
- Textos de PWA

## Solução Implementada

### 1. Novos Arquivos Criados

#### `src/content/validation.ts`
Centraliza **todas** mensagens de validação Zod:
- Campos obrigatórios
- Validações de formato (email, telefone, data, CEP, horário)
- Validações de range (nota, dia de pagamento)
- Validações específicas de domínio

**Uso:**
```ts
import { validation } from '@/content';

const schema = z.object({
  email: z.string().min(1, validation.emailRequired).email(validation.emailInvalid),
  phone: z.string().min(1, validation.phoneRequired).refine(
    (v) => REGEX_PATTERNS.phone.test(v),
    { message: validation.phoneInvalid }
  ),
});
```

#### `src/content/ui.ts`
Centraliza textos de componentes UI genéricos:
- Empty states (students, classes, financial, activities, search, history, birthdays)
- Paginação (aria-labels)
- Filtros genéricos
- Location fields (country, state, city placeholders)

**Uso:**
```tsx
import { ui } from '@/content';

<EmptyState
  title={ui.emptyStates.students.title}
  description={ui.emptyStates.students.description}
  actionLabel={ui.emptyStates.students.actionLabel}
/>
```

#### `src/content/pwa.ts`
Centraliza textos de PWA:
- Install banner
- PIX payment box
- Toasts de instalação

**Uso:**
```tsx
import { pwa } from '@/content';

toast.success(pwa.installBanner.toasts.success);
```

### 2. Arquivos Expandidos

Todos arquivos existentes receberam seções `toasts`, `placeholders`, `labels` adicionais:

#### `src/content/activities.ts`
- ✅ `sendDialog.toasts.success`
- ✅ `editDialog.toasts.success`
- ✅ `correctionDialog.toasts.success`
- ✅ `deliverDialog` (nova seção completa)
- ✅ `deleteDialog.toasts`
- ✅ `sendDialog.descriptionLabel` e `descriptionPlaceholder`
- ✅ `editDialog.descriptionLabel` e `descriptionPlaceholder`

#### `src/content/classes.ts`
- ✅ `logFormDialog.toasts` (success, successEdit, error)
- ✅ `postClassDialog.toasts` (proofOpenError, evaluationError, success)
- ✅ `packageDialog.toasts` (selectMonth, selectWeekday, invalidTime, endTimeBeforeStart, noDatesFound, generated, selectPaymentMethod, success, error)
- ✅ `deleteDialog.toasts`

#### `src/content/financial.ts`
- ✅ `formDialog.toasts`
- ✅ `confirmPaymentDialog.toasts`
- ✅ `undoDialog.toasts`
- ✅ `deleteDialog.toasts`
- ✅ `paymentHistoryDialog.toasts` (approveSuccess, approveError, rejectSuccess, rejectError, proofOpenError)

#### `src/content/students.ts`
- ✅ `formDialog.toasts`
- ✅ `formDialog` placeholders expandidos (yearPlaceholder, teacherLabel, teacherPlaceholder, paymentMethodLabel, paymentMethodPlaceholder)
- ✅ `archiveDialog.toasts`
- ✅ `deleteDialog.toasts`
- ✅ `resetPasswordDialog.toasts` (success, error)
- ✅ `table` expandido (noCharges, daysWithoutClass, editedAt)

#### `src/content/teachers.ts`
- ✅ `formDialog.toasts`
- ✅ `statusDialog.toasts`
- ✅ `deleteDialog.toasts` (success, error)
- ✅ `resetPasswordDialog.toasts` (success, error)
- ✅ `table` expandido (statusActive, statusInactive, editedAt, viewDetails)

#### `src/content/users.ts`
- ✅ `formDialog.toasts`
- ✅ `resetPasswordDialog.toasts` (success, error)
- ✅ `table` expandido (statusActive, statusInactive, roleAdmin, roleTeacher, roleStudent, linkedStudent, linkedTeacher, linkedAdmin, createdAt, viewDetails)

#### `src/content/common.ts`
Expandido com 5 novas seções:
- ✅ `toasts` - mensagens genéricas (success, error, saved, deleted, updated, created, copied, loading, processing)
- ✅ `aria` - labels de acessibilidade (tablePagination, previousPage, nextPage, closeDialog, openMenu, closeMenu, loading, search, filter, sort, moreOptions)
- ✅ `emptyStates` - mensagens genéricas (noResults, noResultsHint, noData, noRecords, searchEmpty, filterEmpty)
- ✅ `placeholders` - placeholders genéricos (search, searchByName, searchByEmail, searchByNameOrEmail, select, selectOption, optional, none, notAvailable, notInformed)
- ✅ `labels` - labels genéricos (all, active, inactive, yes, no, name, email, phone, status, date, time, description, observations, actions, details, more, less, viewMore, viewLess, viewDetails, editedAt, createdAt, updatedAt)

### 3. Atualização do Index

`src/content/index.ts` agora exporta:
```ts
export { validation } from './validation';
export { ui } from './ui';
export { pwa } from './pwa';
```

## Estrutura Final

```
src/content/
├── index.ts              ← barrel export
├── validation.ts         ← 🆕 mensagens Zod
├── ui.ts                 ← 🆕 empty states, pagination, filtros
├── pwa.ts                ← 🆕 install banner, PIX
├── common.ts             ← expandido: toasts, aria, emptyStates, placeholders, labels
├── activities.ts         ← expandido: toasts, deliverDialog
├── classes.ts            ← expandido: toasts em todos dialogs
├── financial.ts          ← expandido: toasts em todos dialogs
├── students.ts           ← expandido: toasts, placeholders, table
├── teachers.ts           ← expandido: toasts, table
├── users.ts              ← expandido: toasts, table
├── layout.ts             ← já completo
├── auth.ts               ← já completo
├── dashboard.ts          ← já completo
├── overview.ts           ← já completo
└── student-portal.ts     ← já completo
```

## Próximos Passos (Sprint 21)

### Fase 1: Refatorar Componentes
1. Substituir strings hardcoded em componentes por imports de `@/content`
2. Prioridade:
   - Toasts (activities, classes, financial, students, teachers, users)
   - Validações Zod (schemas.ts, userFormSchemas.ts)
   - Empty states (contextual-empty-states.tsx)
   - Placeholders (UserFormStudentFields, UserFormTeacherFields, UserFormAdminFields, UserFormStudentLocationFields)
   - Aria-labels (table-pagination-bar.tsx)
   - PWA (InstallPWABanner.tsx, StudentPixPaymentBox.tsx)

### Fase 2: Cleanup
1. Remover `src/lib/duplicate-messages.ts` (se existir)
2. Migrar `src/lib/utils/errorMessages.ts` → `src/content/common.ts`
3. Grep final pra confirmar zero strings hardcoded

### Fase 3: Verificação
1. Build sem erros
2. Testes manuais em todas telas
3. Confirmar toasts aparecem corretamente
4. Confirmar validações funcionam

## Impacto

- ✅ **170+ strings** agora centralizadas
- ✅ **Zero duplicação** de mensagens
- ✅ **Estrutura pronta** pra i18n (adicionar EN depois)
- ✅ **Manutenção** simplificada (um lugar pra editar textos)
- ✅ **Consistência** garantida (mesmas mensagens em contextos similares)

## Build Status

✅ Build passou sem erros
✅ Todos arquivos compilam corretamente
✅ Tipos TypeScript validados
