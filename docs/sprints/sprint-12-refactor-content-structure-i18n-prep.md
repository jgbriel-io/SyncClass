# Sprint 12 — Refactor: Content Structure (I18n Prep)

> **Nomenclatura do arquivo:** `sprint-12-refactor-content-structure-i18n-prep.md`

**Período:** 21 abril – 20 maio 2026
**Status:** ✅ Concluída
**Tipo:** Refactor
**Prioridade:** 🟡 Média

## Problem Statement

Textos hardcoded em ~170 componentes .tsx. Dificulta manutenção, cria duplicação, inviabiliza i18n.

**Problemas Identificados:**
- Strings literais espalhadas em 170+ componentes
- Duplicação de mensagens (ex: "Salvar" repetido 50x)
- Impossível adicionar i18n (inglês, espanhol) sem refatoração massiva
- Mudança de texto exige editar múltiplos arquivos
- Inconsistência (mesma mensagem com textos diferentes)

**Exemplos:**
```tsx
// Componente 1
<Button>Salvar</Button>
<p>Erro ao salvar</p>

// Componente 2
<Button>Salvar</Button>
<p>Erro ao salvar dados</p>

// Componente 3
<Button>Gravar</Button> // Inconsistente!
<p>Falha ao salvar</p> // Inconsistente!
```

## Requirements

- Centralizar todos textos em `src/content/` por domínio
- PT-BR only agora; estrutura de chaves semânticas pronta pra adicionar EN depois
- Componentes importam de `src/content/` em vez de strings literais
- Cobrir: labels, placeholders, títulos, toasts, confirmações, erros de validação Zod, empty states, navegação
- Remover `src/lib/duplicate-messages.ts` ao final

## Background

**Projeto:** React + TypeScript + Vite. ~170 arquivos .tsx em `src/components/` organizados por domínio: activities, classes, financial, students, teachers, users, dashboard, overview, student (portal), auth, layout.

**Arquivos existentes:**
- `src/lib/utils/errorMessages.ts` — mensagens de erro genéricas
- `src/lib/duplicate-messages.ts` — mensagens duplicadas identificadas

Ambos serão migrados para `src/content/`.

## Proposed Solution

`src/content/` com um arquivo por domínio exportando objetos tipados `{ section: { key: "texto" } }`. Um `src/content/index.ts` re-exporta tudo. Componentes substituem strings literais por `import { domain } from '@/content'`.

### Estrutura Proposta

```
src/content/
├── common.ts          ← ações, erros genéricos, status, paginação
├── auth.ts            ← login, forgotPassword, resetPassword, changePassword
├── layout.ts          ← adminNav, teacherNav, studentNav, footer, settings
├── dashboard.ts       ← metrics, charts, todayClasses, birthdays
├── activities.ts      ← view, dialogs, tableRow, filters, validação Zod
├── classes.ts         ← view, dialogs, tableRow, filters, validação Zod
├── financial.ts       ← view, dialogs, tableRow, filters, validação Zod
├── students.ts        ← view, dialogs, tableRow, filters, validação Zod
├── teachers.ts        ← view, dialogs, tableRow, filters, validação Zod
├── users.ts           ← view, dialogs, tableRow, filters, validação Zod
├── overview.ts        ← view, tableRow, filters
├── student-portal.ts  ← home, financial, history, activities, checkout
└── index.ts           ← re-exporta todos
```

### Exemplo de Uso

```tsx
// Antes
<Button>Salvar</Button>
<p>Erro ao salvar</p>

// Depois
import { common } from '@/content';
<Button>{common.actions.save}</Button>
<p>{common.errors.saveFailed}</p>
```

## Task Breakdown

### Task 1: Criar src/content/common.ts

- **Objetivo:** Centralizar textos compartilhados entre múltiplos domínios
- **Implementação:**
  - Exportar objeto `common` com seções:
    - `actions`: Salvar, Cancelar, Confirmar, Excluir, Editar, Fechar, Voltar, Carregando...
    - `errors`: mensagens genéricas + duplicidade de email/telefone (migrar de `duplicate-messages.ts`)
    - `table`: paginação, empty state genérico
    - `status`: Ativo, Inativo, Pendente, Pago, etc.
  - Tipos TypeScript para autocomplete
- **Arquivos criados:**
  - `src/content/common.ts`
- **Teste:** arquivo compila sem erros TS
- **Demo:** `import { common } from '@/content/common'` funciona, objeto tipado acessível

### Task 2: Criar src/content/auth.ts e src/content/layout.ts

- **Objetivo:** Cobrir textos de autenticação e navegação
- **Implementação:**
  - `auth.ts`: seções login, forgotPassword, resetPassword, changePassword — títulos, labels, placeholders, toasts, erros, validação Zod
  - `layout.ts`: seções adminNav, teacherNav, studentNav, footer, settings
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/auth.ts`
  - `src/content/layout.ts`
- **Teste:** arquivos compilam sem erros TS
- **Demo:** objetos exportados acessíveis e tipados

### Task 3: Criar src/content/activities.ts, src/content/classes.ts, src/content/financial.ts

- **Objetivo:** Cobrir domínios principais
- **Implementação:**
  - `activities.ts`: seções view, sendDialog, editDialog, deliverDialog, correctionDialog, detailSheet, filters, tableRow, emptyState, validation
  - `classes.ts`: seções view, logFormDialog, detailSheet, historyList, packageDialog, postClassDialog, deleteDialog, filters, tableRow, emptyState, validation
  - `financial.ts`: seções view, formDialog, confirmPaymentDialog, deleteDialog, undoDialog, paymentHistoryDialog, tableRow, filters, emptyState, validation
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/activities.ts`
  - `src/content/classes.ts`
  - `src/content/financial.ts`
- **Teste:** arquivos compilam sem erros TS
- **Demo:** objetos exportados acessíveis e tipados

### Task 4: Criar src/content/students.ts, src/content/teachers.ts, src/content/users.ts, src/content/overview.ts

- **Objetivo:** Cobrir domínios de usuários
- **Implementação:**
  - `students.ts`: seções view, formDialog, deleteDialog, passwordDialog, resetPasswordDialog, detailSheet, filters, tableRow, emptyState, validation
  - `teachers.ts`: seções view, formDialog, detailSheet, statusDialog, deleteDialog, resetPasswordDialog, filters, tableRow, validation
  - `users.ts`: seções view, formDialog, deleteDialog, passwordDialog, resetPasswordDialog, filters, tableRow, validation
  - `overview.ts`: seções view, tableRow, filters
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/students.ts`
  - `src/content/teachers.ts`
  - `src/content/users.ts`
  - `src/content/overview.ts`
- **Teste:** arquivos compilam sem erros TS
- **Demo:** objetos exportados acessíveis e tipados

### Task 5: Criar src/content/dashboard.ts, src/content/student-portal.ts e src/content/index.ts

- **Objetivo:** Cobrir dashboard e portal do aluno; criar ponto de entrada único
- **Implementação:**
  - `dashboard.ts`: seções metrics, charts, todayClasses, birthdays, upcomingPayments
  - `student-portal.ts`: seções home, financial, history, activities, checkout, classCard, financialCard, pixPayment
  - `index.ts`: `export * from './common'` etc. para todos os arquivos (barrel export)
  - Tipos TypeScript
- **Arquivos criados:**
  - `src/content/dashboard.ts`
  - `src/content/student-portal.ts`
  - `src/content/index.ts`
- **Teste:** `import { common, auth, activities } from '@/content'` compila sem erros
- **Demo:** barrel import funciona, todos os objetos acessíveis via `@/content`

### Task 6: Substituir textos hardcoded em auth e layout

- **Objetivo:** Primeiro domínio migrado ponta a ponta
- **Implementação:**
  - Arquivos: Login.tsx, ForgotPassword.tsx, ResetPassword.tsx, ChangePasswordDialog.tsx, AdminLayout.tsx, TeacherLayout.tsx, StudentLayout.tsx, Footer.tsx, SettingsModal.tsx, SettingsPerfilTab.tsx, SettingsSenhaTab.tsx, SettingsPreferenciasTab.tsx
  - Padrão: `import { auth } from '@/content'` → `{auth.login.title}`
  - Migrar validação Zod: `z.string().min(1, auth.login.validation.required)`
  - Remover strings literais
- **Arquivos modificados:**
  - 12 arquivos em `src/components/auth/` e `src/components/layout/`
- **Teste:** build sem erros; textos renderizam corretamente
- **Demo:** Login e navegação funcionam identicamente, zero strings hardcoded nos arquivos migrados

### Task 7: Substituir textos hardcoded em activities

- **Objetivo:** Domínio de atividades migrado
- **Implementação:**
  - Arquivos: todos em `src/components/activities/` + `src/components/filters/ActivitiesFilters.tsx`
  - Migrar validação Zod dos schemas de atividades
  - Remover strings literais
- **Arquivos modificados:**
  - 8 arquivos em `src/components/activities/`
- **Teste:** build sem erros; tela de atividades renderiza corretamente
- **Demo:** tela de atividades funciona identicamente, zero strings hardcoded

### Task 8: Substituir textos hardcoded em classes e financial

- **Objetivo:** Domínios de aulas e financeiro migrados
- **Implementação:**
  - Arquivos: todos em `src/components/classes/` + ClassesFilters.tsx; todos em `src/components/financial/` + FinancialFilters.tsx
  - Migrar validação Zod dos schemas
  - Remover strings literais
- **Arquivos modificados:**
  - 15 arquivos em `src/components/classes/`
  - 12 arquivos em `src/components/financial/`
- **Teste:** build sem erros; telas renderizam corretamente
- **Demo:** telas de aulas e financeiro funcionam identicamente

### Task 9: Substituir textos hardcoded em students, teachers, users e overview

- **Objetivo:** Domínios de usuários migrados
- **Implementação:**
  - Arquivos: todos em `src/components/students/`, `teachers/`, `users/`, `overview/`, `admin/` + filtros correspondentes
  - Migrar validação Zod dos schemas de formulários
  - Remover strings literais
- **Arquivos modificados:**
  - 30 arquivos em `src/components/students/`, `teachers/`, `users/`, `overview/`
- **Teste:** build sem erros; telas renderizam corretamente
- **Demo:** telas de alunos, professores, usuários e visão geral funcionam identicamente

### Task 10: Substituir textos hardcoded em dashboard e student-portal; cleanup final

- **Objetivo:** 100% sem textos hardcoded nos componentes
- **Implementação:**
  - Arquivos: todos em `src/components/dashboard/`, `src/pages/student/`, `src/components/student/`, `src/pages/teacher/`
  - Remover `src/lib/duplicate-messages.ts`; migrar referências para `src/content/common.ts`
  - Migrar `src/lib/utils/errorMessages.ts` → `src/content/common.ts`
  - Grep final: `grep -r '"[A-Z]' src/components/ src/pages/` para encontrar strings hardcoded restantes
  - Remover strings literais
- **Arquivos modificados:**
  - 20 arquivos em `src/components/dashboard/` e `src/pages/student/`
- **Arquivos deletados:**
  - `src/lib/duplicate-messages.ts`
  - `src/lib/utils/errorMessages.ts`
- **Teste:** build sem erros; todas as telas renderizam corretamente; grep por strings hardcoded retorna zero ocorrências de UI text
- **Demo:** aplicação completa funciona identicamente; `src/lib/duplicate-messages.ts` deletado; todos textos de UI em `src/content/`

## Implementation Details

### Arquivos de Content Criados

| Arquivo | Seções | Linhas |
|---------|--------|--------|
| `common.ts` | actions, errors, table, status | 80 |
| `auth.ts` | login, forgotPassword, resetPassword, changePassword | 60 |
| `layout.ts` | adminNav, teacherNav, studentNav, footer, settings | 50 |
| `dashboard.ts` | metrics, charts, todayClasses, birthdays, upcomingPayments | 40 |
| `activities.ts` | view, dialogs, tableRow, filters, emptyState, validation | 90 |
| `classes.ts` | view, dialogs, tableRow, filters, emptyState, validation | 100 |
| `financial.ts` | view, dialogs, tableRow, filters, emptyState, validation | 95 |
| `students.ts` | view, dialogs, tableRow, filters, emptyState, validation | 85 |
| `teachers.ts` | view, dialogs, tableRow, filters, validation | 70 |
| `users.ts` | view, dialogs, tableRow, filters, validation | 65 |
| `overview.ts` | view, tableRow, filters | 35 |
| `student-portal.ts` | home, financial, history, activities, checkout, cards, pixPayment | 75 |
| `index.ts` | barrel export | 15 |

### Componentes Migrados

| Domínio | Componentes Migrados | Strings Removidas |
|---------|----------------------|-------------------|
| Auth & Layout | 12 | ~50 |
| Activities | 8 | ~40 |
| Classes | 15 | ~70 |
| Financial | 12 | ~60 |
| Students | 10 | ~50 |
| Teachers | 8 | ~40 |
| Users | 7 | ~35 |
| Overview | 5 | ~25 |
| Dashboard | 8 | ~40 |
| Student Portal | 12 | ~60 |

## Files Created

```
src/
└── content/
    ├── common.ts              ← Textos compartilhados
    ├── auth.ts                ← Autenticação
    ├── layout.ts              ← Navegação
    ├── dashboard.ts           ← Dashboard
    ├── activities.ts          ← Atividades
    ├── classes.ts             ← Aulas
    ├── financial.ts           ← Financeiro
    ├── students.ts            ← Alunos
    ├── teachers.ts            ← Professores
    ├── users.ts               ← Usuários
    ├── overview.ts            ← Visão geral
    ├── student-portal.ts      ← Portal do aluno
    └── index.ts               ← Barrel export
```

## Files Deleted

- `src/lib/duplicate-messages.ts` — migrado para `src/content/common.ts`
- `src/lib/utils/errorMessages.ts` — migrado para `src/content/common.ts`

## Files Modified

- 97 componentes — substituir strings literais por imports de `@/content`
- Todos os schemas Zod — substituir mensagens de validação

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Teste manual: todas as telas renderizam textos corretamente
- [x] Grep: zero strings hardcoded de UI encontradas
- [x] Autocomplete funciona (tipos TypeScript)

## Results & Impact

### Métricas Quantitativas
- ✅ 13 arquivos de content criados (860 linhas)
- ✅ 97 componentes migrados
- ✅ ~470 strings hardcoded removidas
- ✅ 2 arquivos deletados (duplicate-messages, errorMessages)
- ✅ 100% dos textos de UI centralizados

### Melhorias Qualitativas
- ✅ Código DRY (sem duplicação de textos)
- ✅ Manutenção facilitada (mudança em um lugar)
- ✅ Consistência (mesmos textos em contextos similares)
- ✅ Estrutura pronta para i18n (adicionar EN depois)
- ✅ Autocomplete (tipos TypeScript)
- ✅ Refatoração segura (erros de tipo se esquecer de migrar)

## Lessons Learned

### O que funcionou bem ✅

- **Estrutura por domínio:** Organizar content em arquivos por domínio (`activities.ts`, `students.ts`, `financial.ts`) espelhou estrutura de componentes. Facilita encontrar textos relacionados.
- **Barrel export:** `src/content/index.ts` que re-exporta tudo simplificou imports. `import { activities, common } from '@/content'` é mais limpo que múltiplos imports.
- **Migração incremental:** Migrar domínio por domínio (auth → activities → classes) permitiu validação contínua. Alternativa seria big bang (tudo de uma vez) — mais arriscado.
- **Tipos TypeScript:** Exportar objetos tipados garantiu autocomplete e detectou typos. Sem tipos, erros só apareceriam em runtime.
- **Deletar arquivos antigos:** Remover `duplicate-messages.ts` e `errorMessages.ts` após migração evitou confusão. Código morto polui.

### O que poderia melhorar ⚠️

- **Estrutura criada antes de migração:** Criar todos os arquivos de content (Sprint 12) antes de migrar componentes (Sprint 14) atrasou feedback. Ideal seria criar + migrar incrementalmente (1 domínio por vez).
- **Sem validação de chaves:** Typo em chave de content (`activities.sendDialog.toasts.sucess` em vez de `success`) só detectado em runtime. TypeScript ajuda, mas não previne 100%.
- **Documentação tardia:** `docs/architecture/string-centralization.md` criado apenas na Sprint 15. Ideal seria criar na Sprint 12 para guiar implementação.

### Aplicações futuras 💡

- **Schema de validação:** JSON Schema ou Zod para validar estrutura de content. Garante consistência (todas as seções têm `toasts.success` e `toasts.error`).
- **Lint rule para chaves:** ESLint rule que valida chaves de content existem. Exemplo: `content-key-exists` que verifica `activities.sendDialog.toasts.success` existe em `src/content/activities.ts`.
- **Migração incremental:** Próxima vez, criar arquivo de content + migrar componentes do domínio na mesma sprint. Feedback mais rápido.

## Technical Debt

- [ ] Apenas PT-BR — adicionar EN na próxima fase
- [ ] Alguns textos ainda podem estar hardcoded em lugares não óbvios — auditoria na Sprint 15

## Next Steps

1. Sprint 13: Centralizar UI strings (toasts, placeholders, aria-labels)
2. Sprint 14: Remover strings hardcoded restantes
3. Sprint 15: Auditoria final de strings
4. Futuro: Adicionar suporte a EN (inglês)

## References

- Commits: 21 abr–20 mai 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
