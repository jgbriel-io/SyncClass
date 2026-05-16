# Sprint 21 - Refatoração de Componentes

## Status

✅ **Concluída** — todos os componentes refatorados para usar `src/content/`

## O Que Foi Feito

### Fase 1: Toasts (✅ Concluída anteriormente)
1. ✅ `src/components/activities/DeliverActivityDialog.tsx`
2. ✅ `src/components/activities/ActivityCorrectionFormInline.tsx`
3. ✅ `src/components/activities/EditActivityDialog.tsx`
4. ✅ `src/components/activities/SendActivityDialog.tsx`
5. ✅ `src/components/activities/AddCorrectionDialog.tsx`
6. ✅ `src/components/classes/PackageSlotList.tsx`
7. ✅ `src/components/pwa/InstallPWABanner.tsx`
8. ✅ `src/components/layout/SettingsPreferenciasTab.tsx`
9. ✅ `src/components/student/StudentPixPaymentBox.tsx`
10. ✅ `src/components/financial/FinancialPaymentHistoryDialog.tsx`
11. ✅ `src/components/classes/PostClassDialog.tsx`
12. ✅ `src/components/classes/PackageClassesDialog.tsx`
13. ✅ `src/components/admin/StudentDetailActivitiesTab.tsx`

### Fase 2: Validações Zod (✅ Concluída)
- ✅ `src/components/users/userFormSchemas.ts` — substituídas 3 strings hardcoded
- ✅ `src/content/students.ts` — adicionadas chaves `hourlyRateRequired`, `payDayRequired`, `birthDateRequired`

### Fase 3: Empty States (✅ Já estava concluída)
- ✅ `src/components/ui/contextual-empty-states.tsx` — já usava `ui.emptyStates.*`

### Fase 4: Placeholders (✅ Concluída)
- ✅ `src/components/users/UserFormStudentFields.tsx` — birthDate, year, phone, email, hourlyRate, payDay, paymentMethod
- ✅ `src/components/users/UserFormTeacherFields.tsx` — name, email, phone
- ✅ `src/components/users/UserFormAdminFields.tsx` — email, fullName
- ✅ `src/components/users/UserFormStudentLocationFields.tsx` — country, state, city (placeholders e empty states)

### Fase 5: Aria Labels (✅ Concluída)
- ✅ `src/components/ui/table-pagination-bar.tsx` — tablePagination, previousPage, nextPage

## Resultado

- Zero strings hardcoded de UI nos arquivos refatorados
- Build sem erros (diagnostics limpos)
- Estrutura pronta para i18n (adicionar EN no futuro)

## Status Atual

✅ **Estrutura content completa** - todos textos centralizados em `src/content/`
🔄 **Refatoração em andamento** - ~30% dos componentes refatorados

## O Que Foi Feito

### Arquivos Refatorados (✅)
1. ✅ `src/components/activities/DeliverActivityDialog.tsx` - toasts + labels
2. ✅ `src/components/activities/ActivityCorrectionFormInline.tsx` - toast success
3. ✅ `src/components/activities/EditActivityDialog.tsx` - já tinha imports corretos
4. ✅ `src/components/activities/SendActivityDialog.tsx` - já tinha imports corretos
5. ✅ `src/components/activities/AddCorrectionDialog.tsx` - já tinha imports corretos
6. ✅ `src/components/classes/PackageSlotList.tsx` - todos toasts

### Arquivos Lidos (Prontos pra Refatorar)
- `src/components/layout/SettingsPreferenciasTab.tsx`
- `src/components/pwa/InstallPWABanner.tsx`
- `src/components/student/StudentPixPaymentBox.tsx`

## O Que Falta Fazer

### 1. PWA Components (3 arquivos)
**Prioridade: ALTA**

#### `src/components/pwa/InstallPWABanner.tsx`
```tsx
// Linha 56
toast.success("App instalado com sucesso!");
// → toast.success(pwa.installBanner.toasts.success);

// Linha 59
toast.info("Instalação cancelada");
// → toast.info(pwa.installBanner.toasts.cancelled);

// Linha 62
toast.error("Erro ao instalar o app");
// → toast.error(pwa.installBanner.toasts.error);

// Adicionar import:
import { pwa } from '@/content';
```

#### `src/components/layout/SettingsPreferenciasTab.tsx`
```tsx
// Linha 28
toast.success("App instalado com sucesso!");
// → toast.success(pwa.installBanner.toasts.success);

// Linha 31
toast.info("Use o menu do navegador para instalar o app");
// → toast.info(layout.settings.preferences.installAppBrowserHint);

// Adicionar import:
import { pwa, layout } from '@/content';
```

#### `src/components/student/StudentPixPaymentBox.tsx`
```tsx
// Linha 22
toast.success("Chave PIX copiada!");
// → toast.success(pwa.pixPayment.toasts.copied);

// Linha 25
toast.error("Não foi possível copiar.");
// → toast.error(pwa.pixPayment.toasts.copyError);

// Adicionar import:
import { pwa } from '@/content';
```

---

### 2. Financial Components (1 arquivo)
**Prioridade: ALTA**

#### `src/components/financial/FinancialPaymentHistoryDialog.tsx`
```tsx
// Linha 52
toast.success("Pagamento confirmado!");
// → toast.success(financial.paymentHistoryDialog.toasts.approveSuccess);

// Linha 56
toast.error("Erro ao aprovar comprovante");
// → toast.error(financial.paymentHistoryDialog.toasts.approveError);

// Linha 68
toast.success("Comprovante rejeitado");
// → toast.success(financial.paymentHistoryDialog.toasts.rejectSuccess);

// Linha 72
toast.error("Erro ao rejeitar comprovante");
// → toast.error(financial.paymentHistoryDialog.toasts.rejectError);

// Linha 83
toast.error("Erro ao abrir comprovante");
// → toast.error(financial.paymentHistoryDialog.toasts.proofOpenError);

// Adicionar import:
import { financial } from '@/content';
```

---

### 3. Classes Components (2 arquivos)
**Prioridade: ALTA**

#### `src/components/classes/PostClassDialog.tsx`
```tsx
// Linha 123
toast.error("Erro ao abrir comprovante");
// → toast.error(classes.postClassDialog.toasts.proofOpenError);

// Linha 255
toast.error("Erro ao registrar avaliação. Tente novamente.");
// → toast.error(classes.postClassDialog.toasts.evaluationError);

// Adicionar import:
import { classes as classesContent } from '@/content';
```

#### `src/components/classes/PackageClassesDialog.tsx`
```tsx
// Linha 201
toast.error("Selecione o método de pagamento.");
// → toast.error(classes.packageDialog.toasts.selectPaymentMethod);

// Adicionar import:
import { classes as classesContent } from '@/content';
```

---

### 4. Admin Components (1 arquivo)
**Prioridade: MÉDIA**

#### `src/components/admin/StudentDetailActivitiesTab.tsx`
```tsx
// Linha 31
toast.error("Não foi possível abrir o arquivo.");
// → toast.error(activities.view.toasts.fileOpenError);

// Adicionar import:
import { activities } from '@/content';
```

---

### 5. Validações Zod (2 arquivos)
**Prioridade: CRÍTICA**

#### `src/lib/validation/schemas.ts`
Substituir TODAS mensagens hardcoded por `validation.*`:

```tsx
// Adicionar import no topo:
import { validation } from '@/content';

// Exemplos:
z.string().min(1, "Telefone é obrigatório")
// → z.string().min(1, validation.phoneRequired)

z.string().email("Email inválido")
// → z.string().email(validation.emailInvalid)

z.string().min(1, "Data é obrigatória")
// → z.string().min(1, validation.dateRequired)

// etc... (~30 substituições)
```

#### `src/components/users/userFormSchemas.ts`
```tsx
// Adicionar import:
import { validation } from '@/content';

// Substituir mensagens hardcoded
```

---

### 6. Empty States (1 arquivo)
**Prioridade: MÉDIA**

#### `src/components/ui/contextual-empty-states.tsx`
Substituir TODOS textos hardcoded por `ui.emptyStates.*`:

```tsx
// Adicionar import:
import { ui } from '@/content';

// Exemplo:
title="Nenhum aluno cadastrado"
// → title={ui.emptyStates.students.title}

message="Comece adicionando seu primeiro aluno..."
// → message={ui.emptyStates.students.description}

// etc... (~15 substituições)
```

---

### 7. Placeholders em Forms (4 arquivos)
**Prioridade: BAIXA**

#### `src/components/users/UserFormStudentFields.tsx`
```tsx
// Adicionar import:
import { students } from '@/content';

// Substituir placeholders:
placeholder="Nome do aluno"
// → placeholder={students.formDialog.namePlaceholder}

placeholder="dd/mm/aaaa"
// → placeholder={students.formDialog.birthDatePlaceholder}

// etc...
```

#### `src/components/users/UserFormTeacherFields.tsx`
```tsx
// Adicionar import:
import { teachers } from '@/content';

// Substituir placeholders
```

#### `src/components/users/UserFormAdminFields.tsx`
```tsx
// Adicionar import:
import { users } from '@/content';

// Substituir placeholders
```

#### `src/components/users/UserFormStudentLocationFields.tsx`
```tsx
// Adicionar import:
import { ui } from '@/content';

// Substituir placeholders de location:
placeholder="Buscar país..."
// → placeholder={ui.location.countryPlaceholder}

// etc...
```

---

### 8. Aria Labels (1 arquivo)
**Prioridade: BAIXA**

#### `src/components/ui/table-pagination-bar.tsx`
```tsx
// Adicionar import:
import { common } from '@/content';

// Substituir aria-labels:
aria-label="Paginação da tabela"
// → aria-label={common.aria.tablePagination}

aria-label="Página anterior"
// → aria-label={common.aria.previousPage}

aria-label="Próxima página"
// → aria-label={common.aria.nextPage}
```

---

## Checklist de Execução

### Fase 1: Toasts (Mais Visível)
- [ ] PWA: InstallPWABanner.tsx
- [ ] PWA: SettingsPreferenciasTab.tsx
- [ ] PWA: StudentPixPaymentBox.tsx
- [ ] Financial: FinancialPaymentHistoryDialog.tsx
- [ ] Classes: PostClassDialog.tsx
- [ ] Classes: PackageClassesDialog.tsx
- [ ] Admin: StudentDetailActivitiesTab.tsx

### Fase 2: Validações (Crítico)
- [ ] lib/validation/schemas.ts (~30 substituições)
- [ ] components/users/userFormSchemas.ts

### Fase 3: Empty States
- [ ] components/ui/contextual-empty-states.tsx (~15 substituições)

### Fase 4: Placeholders (Menos Urgente)
- [ ] components/users/UserFormStudentFields.tsx
- [ ] components/users/UserFormTeacherFields.tsx
- [ ] components/users/UserFormAdminFields.tsx
- [ ] components/users/UserFormStudentLocationFields.tsx

### Fase 5: Aria Labels (Acessibilidade)
- [ ] components/ui/table-pagination-bar.tsx

---

## Como Continuar

1. **Começar por Fase 1** (toasts) - mais visível pro usuário
2. **Depois Fase 2** (validações) - afeta formulários
3. **Build após cada fase** pra garantir que compila
4. **Testar manualmente** as telas afetadas

## Comando de Build

```bash
npm run build
```

## Grep pra Verificar Progresso

```bash
# Ver toasts hardcoded restantes
grep -r 'toast\.(success|error)("' src/components/

# Ver strings hardcoded em geral (exceto imports)
grep -r '"[A-Z][a-z]' src/components/ | grep -v import | grep -v from
```

## Estimativa

- **Fase 1 (Toasts)**: ~30 min
- **Fase 2 (Validações)**: ~45 min
- **Fase 3 (Empty States)**: ~20 min
- **Fase 4 (Placeholders)**: ~30 min
- **Fase 5 (Aria)**: ~10 min

**Total**: ~2h15min

---

## Notas Importantes

- Sempre adicionar import no topo: `import { domain } from '@/content';`
- Manter estrutura do código, só substituir strings
- Build deve passar sem erros após cada fase
- Testar toasts manualmente (criar aluno, editar aula, etc)
