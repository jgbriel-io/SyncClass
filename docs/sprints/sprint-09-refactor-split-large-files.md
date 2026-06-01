# Sprint 9 — Refactor: Split Large Files

> **Nomenclatura do arquivo:** `sprint-09-refactor-split-large-files.md`

**Período:** 21 abril 2026
**Status:** ✅ Concluída
**Tipo:** Refactor
**Prioridade:** 🟡 Média

## Problem Statement

Após Sprint 8, a arquitetura estava correta mas alguns arquivos cresceram demais:

**Arquivos Grandes:**

- Hooks com 200-300 linhas (múltiplas responsabilidades)
- Componentes com 150-200 linhas (lógica complexa)
- Dificulta leitura e manutenção
- Dificulta testes (testar arquivo grande = testar múltiplas coisas)
- Viola Single Responsibility Principle

**Exemplos Identificados:**

- `useStudents.ts` — 250 linhas (CRUD + filtros + paginação + soft delete)
- `useFinancialRecords.ts` — 280 linhas (CRUD + aprovação + auditoria + relatórios)
- `StudentFormDialog.tsx` — 180 linhas (formulário + validação + upload + localização)

**Impacto:**

- Código difícil de navegar
- Testes complexos (muitos casos em um arquivo)
- Merge conflicts frequentes (múltiplos devs editando mesmo arquivo)
- Dificulta code review

## Requirements

### Critérios de Split

- Arquivos > 150 linhas devem ser analisados
- Split se houver múltiplas responsabilidades claras
- Manter coesão (não separar código fortemente acoplado)

### Hooks

- Separar CRUD de operações especiais
- Exemplo: `useStudents` → `useStudents` (CRUD) + `useStudentFilters` + `useStudentPagination`

### Componentes

- Separar formulários grandes em seções
- Exemplo: `StudentFormDialog` → `StudentFormDialog` + `StudentLocationSection` + `StudentFinancialSection`

### Critérios de Conclusão

- ✅ Nenhum arquivo > 200 linhas (exceto casos justificados)
- ✅ Cada arquivo tem responsabilidade única e clara
- ✅ Testes mais focados e simples

## Background

**Single Responsibility Principle (SRP):**

- Cada módulo deve ter uma única razão para mudar
- Se arquivo muda por múltiplas razões → split

**Exemplo de violação:**

```ts
// useStudents.ts (250 linhas)
export const useStudents = () => {
  /* CRUD */
};
export const useStudentFilters = () => {
  /* Filtros */
};
export const useStudentPagination = () => {
  /* Paginação */
};
export const useSoftDeleteStudent = () => {
  /* Soft delete */
};
export const useRestoreStudent = () => {
  /* Restore */
};
```

**Solução:**

```
useStudents.ts          ← CRUD básico (50 linhas)
useStudentFilters.ts    ← Filtros (40 linhas)
useStudentPagination.ts ← Paginação (30 linhas)
useStudentActions.ts    ← Soft delete + restore (50 linhas)
```

## Proposed Solution

### Estratégia de Split

1. **Identificar responsabilidades** no arquivo grande
2. **Agrupar código relacionado** (alta coesão)
3. **Criar novos arquivos** com nomes descritivos
4. **Mover código** preservando funcionalidade
5. **Atualizar imports** em arquivos que usam
6. **Testar** que nada quebrou

### Estrutura Proposta

```
src/hooks/
├── students/
│   ├── useStudents.ts           ← CRUD básico
│   ├── useStudentFilters.ts     ← Filtros
│   ├── useStudentPagination.ts  ← Paginação
│   └── useStudentActions.ts     ← Soft delete + restore
├── financial/
│   ├── useFinancialRecords.ts   ← CRUD básico
│   ├── usePaymentApproval.ts    ← Aprovação de comprovantes
│   └── useFinancialReports.ts   ← Relatórios
└── classes/
    ├── useClasses.ts            ← CRUD básico
    ├── useClassPackages.ts      ← Pacotes de aulas
    └── useAttendance.ts         ← Gestão de faltas
```

## Task Breakdown

### Task 1: Analisar arquivos grandes

- **Objetivo:** Identificar arquivos > 150 linhas e suas responsabilidades
- **Implementação:**
  - Executar `find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn`
  - Listar arquivos > 150 linhas
  - Para cada arquivo, identificar responsabilidades distintas
  - Decidir quais devem ser splitados
- **Resultado:**
  - Lista de 8 arquivos para split
  - Plano de split para cada um
- **Teste:** Lista completa e justificada
- **Demo:** Plano de refatoração documentado

### Task 2: Split `useStudents.ts`

- **Objetivo:** Separar CRUD de filtros, paginação e ações
- **Implementação:**
  - Criar `src/hooks/students/useStudents.ts` — CRUD básico (query, create, update)
  - Criar `src/hooks/students/useStudentFilters.ts` — Filtros (por nome, status, professor)
  - Criar `src/hooks/students/useStudentPagination.ts` — Paginação (page, pageSize, total)
  - Criar `src/hooks/students/useStudentActions.ts` — Soft delete, restore, archive
  - Atualizar imports em componentes que usam
  - Mover testes para arquivos correspondentes
- **Arquivos criados:**
  - `src/hooks/students/useStudents.ts` (50 linhas)
  - `src/hooks/students/useStudentFilters.ts` (40 linhas)
  - `src/hooks/students/useStudentPagination.ts` (30 linhas)
  - `src/hooks/students/useStudentActions.ts` (50 linhas)
- **Arquivos deletados:**
  - `src/hooks/useStudents.ts` (250 linhas)
- **Teste:** Componentes funcionam identicamente
- **Demo:** Código mais legível, testes mais focados

### Task 3: Split `useFinancialRecords.ts`

- **Objetivo:** Separar CRUD de aprovação e relatórios
- **Implementação:**
  - Criar `src/hooks/financial/useFinancialRecords.ts` — CRUD básico
  - Criar `src/hooks/financial/usePaymentApproval.ts` — Aprovação/rejeição de comprovantes
  - Criar `src/hooks/financial/useFinancialReports.ts` — Relatórios e auditoria
  - Atualizar imports
  - Mover testes
- **Arquivos criados:**
  - `src/hooks/financial/useFinancialRecords.ts` (60 linhas)
  - `src/hooks/financial/usePaymentApproval.ts` (50 linhas)
  - `src/hooks/financial/useFinancialReports.ts` (40 linhas)
- **Arquivos deletados:**
  - `src/hooks/useFinancialRecords.ts` (280 linhas)
- **Teste:** Componentes funcionam identicamente
- **Demo:** Responsabilidades claras

### Task 4: Split `useClasses.ts`

- **Objetivo:** Separar CRUD de pacotes e faltas
- **Implementação:**
  - Criar `src/hooks/classes/useClasses.ts` — CRUD básico
  - Criar `src/hooks/classes/useClassPackages.ts` — Criação de pacotes
  - Criar `src/hooks/classes/useAttendance.ts` — Gestão de faltas
  - Atualizar imports
  - Mover testes
- **Arquivos criados:**
  - `src/hooks/classes/useClasses.ts` (55 linhas)
  - `src/hooks/classes/useClassPackages.ts` (45 linhas)
  - `src/hooks/classes/useAttendance.ts` (35 linhas)
- **Arquivos deletados:**
  - `src/hooks/useClasses.ts` (220 linhas)
- **Teste:** Componentes funcionam identicamente
- **Demo:** Código organizado por responsabilidade

### Task 5: Split `StudentFormDialog.tsx`

- **Objetivo:** Separar formulário grande em seções
- **Implementação:**
  - Criar `src/components/students/StudentFormDialog.tsx` — Estrutura principal (80 linhas)
  - Criar `src/components/students/StudentBasicInfoSection.tsx` — Nome, email, telefone (40 linhas)
  - Criar `src/components/students/StudentLocationSection.tsx` — Endereço, CEP, cidade (50 linhas)
  - Criar `src/components/students/StudentFinancialSection.tsx` — Dia de pagamento, taxa horária (40 linhas)
  - Cada seção é componente independente
  - Dialog principal compõe seções
- **Arquivos criados:**
  - `src/components/students/StudentBasicInfoSection.tsx`
  - `src/components/students/StudentLocationSection.tsx`
  - `src/components/students/StudentFinancialSection.tsx`
- **Arquivos modificados:**
  - `src/components/students/StudentFormDialog.tsx` (180 → 80 linhas)
- **Teste:** Formulário funciona identicamente
- **Demo:** Seções reutilizáveis

### Task 6: Split `useActivities.ts`

- **Objetivo:** Separar CRUD de envio, entrega e correção
- **Implementação:**
  - Criar `src/hooks/activities/useActivities.ts` — CRUD básico
  - Criar `src/hooks/activities/useSendActivity.ts` — Envio de atividades
  - Criar `src/hooks/activities/useDeliverActivity.ts` — Entrega de atividades
  - Criar `src/hooks/activities/useCorrectActivity.ts` — Correção de atividades
  - Atualizar imports
  - Mover testes
- **Arquivos criados:**
  - `src/hooks/activities/useActivities.ts` (50 linhas)
  - `src/hooks/activities/useSendActivity.ts` (40 linhas)
  - `src/hooks/activities/useDeliverActivity.ts` (45 linhas)
  - `src/hooks/activities/useCorrectActivity.ts` (40 linhas)
- **Arquivos deletados:**
  - `src/hooks/useActivities.ts` (240 linhas)
- **Teste:** Componentes funcionam identicamente
- **Demo:** Responsabilidades bem definidas

### Task 7: Split `useTeachers.ts`

- **Objetivo:** Separar CRUD de ações especiais
- **Implementação:**
  - Criar `src/hooks/teachers/useTeachers.ts` — CRUD básico
  - Criar `src/hooks/teachers/useTeacherActions.ts` — Hard delete, soft delete, reativação
  - Atualizar imports
  - Mover testes
- **Arquivos criados:**
  - `src/hooks/teachers/useTeachers.ts` (55 linhas)
  - `src/hooks/teachers/useTeacherActions.ts` (45 linhas)
- **Arquivos deletados:**
  - `src/hooks/useTeachers.ts` (180 linhas)
- **Teste:** Componentes funcionam identicamente
- **Demo:** Código mais limpo

### Task 8: Split `useUsers.ts`

- **Objetivo:** Separar CRUD de gestão de senha
- **Implementação:**
  - Criar `src/hooks/users/useUsers.ts` — CRUD básico
  - Criar `src/hooks/users/usePasswordManagement.ts` — Reset de senha, troca obrigatória
  - Atualizar imports
  - Mover testes
- **Arquivos criados:**
  - `src/hooks/users/useUsers.ts` (50 linhas)
  - `src/hooks/users/usePasswordManagement.ts` (40 linhas)
- **Arquivos deletados:**
  - `src/hooks/useUsers.ts` (170 linhas)
- **Teste:** Componentes funcionam identicamente
- **Demo:** Responsabilidades separadas

### Task 9: Atualizar imports em todos os componentes

- **Objetivo:** Atualizar imports para novos caminhos
- **Implementação:**
  - Buscar todos os imports de hooks splitados
  - Atualizar para novos caminhos (ex: `@/hooks/useStudents` → `@/hooks/students/useStudents`)
  - Executar `npm run type-check` para garantir que nada quebrou
  - Executar `npm run build` para garantir que build funciona
- **Arquivos modificados:**
  - 30+ componentes com imports atualizados
- **Teste:** Build sem erros, type-check sem erros
- **Demo:** Todos os imports corretos

### Task 10: Atualizar testes

- **Objetivo:** Mover testes para arquivos correspondentes
- **Implementação:**
  - Mover testes de `useStudents.test.ts` para `students/useStudents.test.ts`, etc.
  - Atualizar imports nos testes
  - Executar `npm run test` para garantir que todos passam
  - Adicionar testes para novos hooks (se necessário)
- **Arquivos movidos:**
  - 8 arquivos de teste movidos para subpastas
- **Teste:** Todos os testes passando
- **Demo:** Testes organizados por responsabilidade

## Implementation Details

### Hooks Splitados

| Hook Original            | Linhas | Novos Hooks                        | Linhas |
| ------------------------ | ------ | ---------------------------------- | ------ |
| `useStudents.ts`         | 250    | `students/useStudents.ts`          | 50     |
|                          |        | `students/useStudentFilters.ts`    | 40     |
|                          |        | `students/useStudentPagination.ts` | 30     |
|                          |        | `students/useStudentActions.ts`    | 50     |
| `useFinancialRecords.ts` | 280    | `financial/useFinancialRecords.ts` | 60     |
|                          |        | `financial/usePaymentApproval.ts`  | 50     |
|                          |        | `financial/useFinancialReports.ts` | 40     |
| `useClasses.ts`          | 220    | `classes/useClasses.ts`            | 55     |
|                          |        | `classes/useClassPackages.ts`      | 45     |
|                          |        | `classes/useAttendance.ts`         | 35     |
| `useActivities.ts`       | 240    | `activities/useActivities.ts`      | 50     |
|                          |        | `activities/useSendActivity.ts`    | 40     |
|                          |        | `activities/useDeliverActivity.ts` | 45     |
|                          |        | `activities/useCorrectActivity.ts` | 40     |
| `useTeachers.ts`         | 180    | `teachers/useTeachers.ts`          | 55     |
|                          |        | `teachers/useTeacherActions.ts`    | 45     |
| `useUsers.ts`            | 170    | `users/useUsers.ts`                | 50     |
|                          |        | `users/usePasswordManagement.ts`   | 40     |

### Componentes Splitados

| Componente Original     | Linhas | Novos Componentes             | Linhas |
| ----------------------- | ------ | ----------------------------- | ------ |
| `StudentFormDialog.tsx` | 180    | `StudentFormDialog.tsx`       | 80     |
|                         |        | `StudentBasicInfoSection.tsx` | 40     |
|                         |        | `StudentLocationSection.tsx`  | 50     |
|                         |        | `StudentFinancialSection.tsx` | 40     |

## Files Created

```
src/
├── hooks/
│   ├── students/
│   │   ├── useStudents.ts
│   │   ├── useStudentFilters.ts
│   │   ├── useStudentPagination.ts
│   │   └── useStudentActions.ts
│   ├── financial/
│   │   ├── useFinancialRecords.ts
│   │   ├── usePaymentApproval.ts
│   │   └── useFinancialReports.ts
│   ├── classes/
│   │   ├── useClasses.ts
│   │   ├── useClassPackages.ts
│   │   └── useAttendance.ts
│   ├── activities/
│   │   ├── useActivities.ts
│   │   ├── useSendActivity.ts
│   │   ├── useDeliverActivity.ts
│   │   └── useCorrectActivity.ts
│   ├── teachers/
│   │   ├── useTeachers.ts
│   │   └── useTeacherActions.ts
│   └── users/
│       ├── useUsers.ts
│       └── usePasswordManagement.ts
└── components/
    └── students/
        ├── StudentBasicInfoSection.tsx
        ├── StudentLocationSection.tsx
        └── StudentFinancialSection.tsx
```

## Files Deleted

- `src/hooks/useStudents.ts` (250 linhas)
- `src/hooks/useFinancialRecords.ts` (280 linhas)
- `src/hooks/useClasses.ts` (220 linhas)
- `src/hooks/useActivities.ts` (240 linhas)
- `src/hooks/useTeachers.ts` (180 linhas)
- `src/hooks/useUsers.ts` (170 linhas)

## Files Modified

- 30+ componentes — imports atualizados para novos caminhos
- `src/components/students/StudentFormDialog.tsx` — reduzido de 180 para 80 linhas

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Testes passando (`npm run test`)
- [x] Teste manual: todas as funcionalidades funcionam identicamente
- [x] Code review: código mais legível e organizado

## Results & Impact

### Métricas Quantitativas

- ✅ 6 hooks splitados (1340 linhas → 24 arquivos menores)
- ✅ 1 componente splitado (180 linhas → 4 arquivos menores)
- ✅ Média de linhas por arquivo: 250 → 45 (redução de 82%)
- ✅ 0 arquivos > 200 linhas (exceto casos justificados)
- ✅ 30+ imports atualizados

### Melhorias Qualitativas

- ✅ Código mais legível (arquivos menores)
- ✅ Responsabilidades claras (SRP)
- ✅ Testes mais focados (testar uma coisa por vez)
- ✅ Manutenção facilitada (mudança afeta menos código)
- ✅ Merge conflicts reduzidos (arquivos menores)
- ✅ Code review mais fácil (menos código por arquivo)

## Lessons Learned

### O que funcionou bem ✅

- **Split por responsabilidade:** Separar hooks por responsabilidade (CRUD, filtros, paginação, ações) tornou código mais legível. Cada arquivo tem propósito claro.
- **Estrutura de pastas por domínio:** Organizar hooks em `students/`, `financial/`, `classes/` facilitou navegação. Alternativa seria flat structure (`useStudents.ts`, `useStudentFilters.ts` na mesma pasta) — mais confuso.
- **Componentes como composição:** Separar `StudentFormDialog` em seções (`BasicInfo`, `Location`, `Financial`) permitiu reutilização. Seções podem ser usadas em outros formulários.
- **Refactor sem mudança de comportamento:** Split preservou funcionalidade exata. Testes manuais idênticos validaram rapidamente.

### O que poderia melhorar ⚠️

- **Critério de 150 linhas arbitrário:** Alguns arquivos de 120 linhas têm múltiplas responsabilidades, outros de 180 linhas têm responsabilidade única. Critério deveria ser responsabilidade, não linhas.
- **Imports mais verbosos:** Antes: `import { useStudents } from '@/hooks/useStudents'`. Depois: `import { useStudents } from '@/hooks/students/useStudents'`. Barrel exports (`hooks/students/index.ts`) resolveriam.
- **Split manual demorado:** Identificar responsabilidades, criar arquivos, mover código, atualizar imports levou tempo. Ferramenta automatizada (ex: script que sugere splits) aceleraria.

### Aplicações futuras 💡

- **Barrel exports:** Criar `index.ts` em cada pasta de hooks para simplificar imports. Exemplo: `import { useStudents, useStudentFilters } from '@/hooks/students'`.
- **Análise automática de responsabilidades:** Script que analisa hooks e sugere splits baseado em: múltiplas queries, múltiplas mutations, múltiplos domínios. Exemplo: `useStudents` com queries de `students` e `financial` → sugerir split.
- **Critério baseado em coesão:** Medir coesão (quantas funções compartilham mesmas variáveis) em vez de linhas. Baixa coesão = candidato a split.

## Technical Debt

- [ ] Alguns hooks ainda têm ~100 linhas — analisar se precisam de split adicional
- [ ] Alguns componentes ainda têm ~120 linhas — analisar se precisam de split
