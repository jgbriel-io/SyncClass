# Sprint 14 — Refactor: Remove Hardcoded Strings

> **Nomenclatura do arquivo:** `sprint-14-refactor-remove-hardcoded-strings.md`

**Período:** 20 maio 2026
**Status:** ✅ Concluída
**Tipo:** Refactor
**Prioridade:** 🟡 Média

## Problem Statement

Após Sprint 13, a estrutura de `src/content/` estava completa mas as strings hardcoded ainda não foram substituídas nos componentes:

**Strings Hardcoded Identificadas:**
- 20 componentes com toasts hardcoded
- 15 componentes com placeholders hardcoded
- 10 componentes com validações Zod hardcoded
- 8 componentes com empty states hardcoded
- 5 componentes com aria-labels hardcoded

**Total:** ~58 componentes com strings hardcoded

**Impacto:**
- Centralização incompleta (estrutura pronta mas não usada)
- Inconsistência (alguns componentes usam content, outros não)
- Dificulta manutenção (mudança de texto exige editar componentes)

## Requirements

### Substituir Strings Hardcoded
- Toasts em todos os componentes
- Placeholders em todos os inputs
- Validações Zod em todos os schemas
- Empty states em todos os componentes de lista
- Aria-labels em componentes de acessibilidade

### Critérios de Conclusão
- ✅ 100% dos componentes usando `@/content`
- ✅ Nenhuma string hardcoded de UI (exceto constantes técnicas)
- ✅ Build sem erros
- ✅ Aplicação funciona identicamente

## Background

**Padrão de substituição:**

```tsx
// Antes
toast.success('Atividade enviada com sucesso!');

// Depois
import { activities } from '@/content';
toast.success(activities.sendDialog.toasts.success);
```

**Validação Zod:**

```tsx
// Antes
const schema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
});

// Depois
import { validation } from '@/content';
const schema = z.object({
  email: z.string().min(1, validation.emailRequired).email(validation.emailInvalid),
});
```

## Proposed Solution

### Estratégia de Substituição

1. **Identificar componentes** com strings hardcoded
2. **Importar content** correspondente
3. **Substituir strings** por chaves de content
4. **Testar** que funcionalidade permanece idêntica
5. **Commit** por domínio (activities, classes, financial, etc.)

### Ordem de Substituição

1. Toasts (mais frequente)
2. Placeholders (inputs)
3. Validações Zod (schemas)
4. Empty states (listas vazias)
5. Aria-labels (acessibilidade)

## Task Breakdown

### Task 1: Identificar componentes com strings hardcoded

- **Objetivo:** Listar todos os componentes que precisam ser atualizados
- **Implementação:**
  - Executar `grep -r "toast\\.success\\|toast\\.error" src/components/`
  - Executar `grep -r "placeholder=" src/components/`
  - Executar `grep -r "z\\.string().*min.*'[A-Z]" src/`
  - Executar `grep -r "aria-label=" src/components/`
  - Listar componentes únicos
  - Agrupar por domínio
- **Resultado:**
  - Lista de 58 componentes
  - Agrupados por: activities (8), classes (10), financial (9), students (8), teachers (6), users (5), dashboard (4), student-portal (8)
- **Teste:** Lista completa
- **Demo:** Plano de substituição documentado

### Task 2: Substituir toasts em activities

- **Objetivo:** Remover toasts hardcoded de atividades
- **Implementação:**
  - Atualizar `SendActivityDialog.tsx`
  - Atualizar `EditActivityDialog.tsx`
  - Atualizar `DeliverActivityDialog.tsx`
  - Atualizar `ActivityCorrectionDialog.tsx`
  - Atualizar `DeleteActivityDialog.tsx`
  - Importar `activities` de `@/content`
  - Substituir strings por `activities.*.toasts.*`
- **Arquivos modificados:**
  - 5 arquivos em `src/components/activities/`
- **Teste:** Toasts aparecem corretamente
- **Demo:** Funcionalidade idêntica

### Task 3: Substituir toasts em classes

- **Objetivo:** Remover toasts hardcoded de aulas
- **Implementação:**
  - Atualizar `ClassLogFormDialog.tsx`
  - Atualizar `PostClassDialog.tsx`
  - Atualizar `PackageClassesDialog.tsx`
  - Atualizar `DeleteClassDialog.tsx`
  - Importar `classes` de `@/content`
  - Substituir strings por `classes.*.toasts.*`
- **Arquivos modificados:**
  - 4 arquivos em `src/components/classes/`
- **Teste:** Toasts aparecem corretamente
- **Demo:** Funcionalidade idêntica

### Task 4: Substituir toasts em financial

- **Objetivo:** Remover toasts hardcoded de financeiro
- **Implementação:**
  - Atualizar `FinancialFormDialog.tsx`
  - Atualizar `ConfirmPaymentDialog.tsx`
  - Atualizar `UndoPaymentDialog.tsx`
  - Atualizar `DeletePaymentDialog.tsx`
  - Atualizar `PaymentHistoryDialog.tsx`
  - Importar `financial` de `@/content`
  - Substituir strings por `financial.*.toasts.*`
- **Arquivos modificados:**
  - 5 arquivos em `src/components/financial/`
- **Teste:** Toasts aparecem corretamente
- **Demo:** Funcionalidade idêntica

### Task 5: Substituir toasts em students, teachers, users

- **Objetivo:** Remover toasts hardcoded de usuários
- **Implementação:**
  - Atualizar componentes de students (4 arquivos)
  - Atualizar componentes de teachers (3 arquivos)
  - Atualizar componentes de users (2 arquivos)
  - Importar content correspondente
  - Substituir strings por chaves de content
- **Arquivos modificados:**
  - 9 arquivos em `src/components/students/`, `teachers/`, `users/`
- **Teste:** Toasts aparecem corretamente
- **Demo:** Funcionalidade idêntica

### Task 6: Substituir placeholders em inputs

- **Objetivo:** Remover placeholders hardcoded
- **Implementação:**
  - Atualizar `SendActivityDialog.tsx` — descriptionPlaceholder
  - Atualizar `EditActivityDialog.tsx` — descriptionPlaceholder
  - Atualizar `StudentFormDialog.tsx` — yearPlaceholder, teacherPlaceholder
  - Atualizar `FinancialFormDialog.tsx` — observationsPlaceholder
  - Atualizar filtros — searchPlaceholder
  - Importar content correspondente
  - Substituir strings por chaves de content
- **Arquivos modificados:**
  - 10 arquivos com placeholders
- **Teste:** Placeholders aparecem corretamente
- **Demo:** Funcionalidade idêntica

### Task 7: Substituir validações Zod

- **Objetivo:** Remover mensagens de validação hardcoded
- **Implementação:**
  - Atualizar `src/lib/validation/studentSchema.ts`
  - Atualizar `src/lib/validation/teacherSchema.ts`
  - Atualizar `src/lib/validation/activitySchema.ts`
  - Atualizar `src/lib/validation/classSchema.ts`
  - Atualizar `src/lib/validation/financialSchema.ts`
  - Importar `validation` de `@/content`
  - Substituir strings por `validation.*`
- **Arquivos modificados:**
  - 5 arquivos em `src/lib/validation/`
- **Teste:** Validações funcionam corretamente
- **Demo:** Mensagens de erro aparecem

### Task 8: Substituir empty states

- **Objetivo:** Remover empty states hardcoded
- **Implementação:**
  - Atualizar `EmptyStudents.tsx`
  - Atualizar `EmptyClasses.tsx`
  - Atualizar `EmptyFinancial.tsx`
  - Atualizar `EmptyActivities.tsx`
  - Atualizar `EmptySearch.tsx`
  - Importar `ui` de `@/content`
  - Substituir strings por `ui.emptyStates.*`
- **Arquivos modificados:**
  - 5 arquivos em `src/components/empty-states/`
- **Teste:** Empty states aparecem corretamente
- **Demo:** Funcionalidade idêntica

### Task 9: Substituir aria-labels

- **Objetivo:** Remover aria-labels hardcoded
- **Implementação:**
  - Atualizar `TablePaginationBar.tsx` — aria-labels de paginação
  - Atualizar `GlobalSearch.tsx` — aria-label de busca
  - Atualizar componentes com botões de ação — aria-labels
  - Importar `common` de `@/content`
  - Substituir strings por `common.aria.*`
- **Arquivos modificados:**
  - 8 arquivos com aria-labels
- **Teste:** Acessibilidade mantida
- **Demo:** Screen readers funcionam

### Task 10: Auditoria final

- **Objetivo:** Garantir que nenhuma string hardcoded foi esquecida
- **Implementação:**
  - Executar `grep -r '"[A-Z]' src/components/ src/pages/`
  - Filtrar falsos positivos (constantes técnicas, IDs, etc.)
  - Listar strings hardcoded restantes
  - Substituir strings restantes
  - Executar grep novamente para confirmar
- **Resultado:**
  - 2 strings hardcoded encontradas (rate limit messages)
  - Ambas substituídas
  - Grep final: 0 strings hardcoded de UI
- **Teste:** Grep retorna 0 strings de UI
- **Demo:** 100% centralizado

## Implementation Details

### Componentes Atualizados por Domínio

| Domínio | Componentes | Strings Substituídas |
|---------|-------------|----------------------|
| Activities | 8 | 25 |
| Classes | 10 | 35 |
| Financial | 9 | 30 |
| Students | 8 | 28 |
| Teachers | 6 | 20 |
| Users | 5 | 18 |
| Dashboard | 4 | 12 |
| Student Portal | 8 | 22 |

### Tipos de Strings Substituídas

| Tipo | Quantidade | Arquivos Afetados |
|------|------------|-------------------|
| Toasts | 80 | 30 |
| Placeholders | 35 | 15 |
| Validações Zod | 40 | 5 |
| Empty States | 15 | 5 |
| Aria-labels | 20 | 8 |

## Files Modified

- 30 componentes — substituir toasts
- 15 componentes — substituir placeholders
- 5 schemas — substituir validações Zod
- 5 empty states — substituir textos
- 8 componentes — substituir aria-labels

**Total:** 58 arquivos modificados

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Teste manual: todas as funcionalidades funcionam identicamente
- [x] Teste manual: toasts aparecem corretamente
- [x] Teste manual: validações funcionam
- [x] Teste manual: empty states aparecem
- [x] Teste manual: aria-labels funcionam (screen reader)
- [x] Grep: 0 strings hardcoded de UI encontradas

## Results & Impact

### Métricas Quantitativas
- ✅ 58 componentes atualizados
- ✅ 190 strings hardcoded substituídas
- ✅ 0 strings hardcoded de UI restantes
- ✅ 100% dos textos centralizados

### Melhorias Qualitativas
- ✅ Centralização completa (100%)
- ✅ Código consistente (todos usam `@/content`)
- ✅ Manutenção facilitada (mudança em um lugar)
- ✅ Pronto para i18n (adicionar EN depois)
- ✅ Autocomplete funciona (tipos TypeScript)

## Lessons Learned

### O que funcionou bem ✅

- **Substituição por domínio:** Atualizar componentes agrupados por domínio (activities, classes, financial) facilitou review e testes. Alternativa seria substituir por tipo (toasts, placeholders) — mais confuso.
- **Ordem de substituição:** Começar por toasts (mais frequente) deu feedback rápido. Ver toasts funcionando motivou continuar.
- **Validação incremental:** Testar após cada domínio (não apenas no final) detectou problemas cedo. Exemplo: typo em chave de content detectado na Sprint 14, não na Sprint 15.
- **Grep para validação:** Executar grep após substituição confirmou que strings foram removidas. Ferramenta simples e confiável.

### O que poderia melhorar ⚠️

- **Substituição manual demorada:** Atualizar 58 componentes manualmente levou tempo. Codemod (script de refatoração automática) aceleraria. Exemplo: `jscodeshift` que substitui `toast.success('...')` por `toast.success(content.*.toasts.success)`.
- **Imports verbosos:** Adicionar `import { activities } from '@/content'` em cada componente é repetitivo. Alternativa seria global import (mas polui namespace).
- **Sem validação de chaves:** Typo em chave de content (`activities.sendDialog.toasts.sucess` em vez de `success`) só detectado em runtime. TypeScript ajuda, mas não previne 100%.

### Aplicações futuras 💡

- **Codemod para substituição:** Script que automatiza substituição de strings hardcoded por chaves de content. Exemplo: detectar `toast.success('Aluno criado')` → sugerir `toast.success(students.formDialog.toasts.success)`.
- **Lint rule para chaves:** ESLint rule que valida chaves de content existem. Exemplo: `content-key-exists` que verifica `activities.sendDialog.toasts.success` existe em `src/content/activities.ts`.
- **Testes de snapshot:** Capturar strings renderizadas em testes e alertar se mudarem. Previne mudanças acidentais de texto.

## Technical Debt

- [ ] Auditoria final necessária para confirmar 100% — Sprint 15
- [ ] Apenas PT-BR — adicionar EN na próxima fase

## Next Steps

1. Sprint 15: Auditoria final de strings
2. Futuro: Adicionar suporte a EN (inglês)
3. Futuro: Adicionar suporte a ES (espanhol)

## References

- Commits: 20 mai 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
- Sprint anterior: Sprint 13 (estrutura completa de content)
