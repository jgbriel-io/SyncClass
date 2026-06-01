# Sprint 8 — Refactor: Supabase/Hooks Separation

> **Nomenclatura do arquivo:** `sprint-08-refactor-supabase-hooks-separation.md`

**Período:** 11 março – 21 abril 2026
**Status:** ✅ Concluída
**Tipo:** Refactor
**Prioridade:** 🟡 Média

## Problem Statement

Após Sprint 7, o sistema estava funcional e seguro, mas com problemas arquiteturais identificados na auditoria de clean code:

**Violação de Arquitetura:**

- Componentes e páginas chamavam Supabase diretamente
- Violação do padrão `Components → Hooks → Supabase`
- Lógica de dados misturada com UI
- Dificulta testes unitários
- Dificulta manutenção (mudança no Supabase afeta múltiplos componentes)

**Duplicação:**

- Padrão `useAuth() + useCurrentUserProfile(user?.id)` duplicado em 6 páginas teacher
- Cada página teacher repetia mesma lógica para buscar `teacherId`

**Impacto:**

- Código acoplado (componente depende diretamente do Supabase)
- Testes difíceis (precisa mockar Supabase em cada componente)
- Manutenção cara (mudança no schema afeta múltiplos arquivos)

## Requirements

### Separação de Responsabilidades

- Nenhum `supabase.from()` em `src/components/` (exceto auth público)
- Nenhum `supabase.from()` em `src/pages/`
- Toda lógica de dados em `src/hooks/`

### Hook `useTeacherId()`

- Encapsular padrão `useAuth() + useCurrentUserProfile()`
- Retornar: `{ teacherId, fullName, profile, isLoading, isError, role, user }`
- Usar em todas as páginas teacher

### Critérios de Conclusão

- ✅ Nenhum `supabase.from()` em componentes/páginas (exceto auth)
- ✅ `useTeacherId` usado em todas as páginas teacher
- ✅ Toda lógica de dados passa por `src/hooks/`

## Background

**Arquitetura correta:**

```
Components (UI apenas)
  ↓ usa
Hooks (TanStack Query + lógica de dados)
  ↓ chama
Supabase Client (acesso ao banco)
```

**Arquitetura incorreta (antes):**

```
Components (UI + lógica de dados)
  ↓ chama diretamente
Supabase Client
```

**Padrão duplicado (antes):**

```tsx
// TeacherHome.tsx
const { user } = useAuth();
const { data: profile } = useCurrentUserProfile(user?.id);
const teacherId = profile?.id;

// TeacherStudents.tsx
const { user } = useAuth();
const { data: profile } = useCurrentUserProfile(user?.id);
const teacherId = profile?.id;

// ... repetido em 6 páginas
```

**Padrão encapsulado (depois):**

```tsx
// Todas as páginas teacher
const { teacherId, fullName, isLoading } = useTeacherId();
```

## Proposed Solution

### Hook `useTeacherId()`

```ts
// src/hooks/useTeacherId.ts
export const useTeacherId = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, isError } = useCurrentUserProfile(user?.id);

  return {
    teacherId: profile?.id,
    fullName: profile?.full_name,
    profile,
    isLoading,
    isError,
    role: profile?.role,
    user,
  };
};
```

### Auditoria de Componentes

```bash
# Buscar supabase.from() em componentes
grep -r "supabase.from" src/components/
grep -r "supabase.from" src/pages/

# Exceções permitidas (auth público):
# - ForgotPassword.tsx
# - ResetPassword.tsx
```

## Task Breakdown

### Task 1: Criar hook `useTeacherId()`

- **Objetivo:** Encapsular padrão duplicado em hook único
- **Implementação:**
  - Criar `src/hooks/useTeacherId.ts`
  - Usar `useAuth()` para pegar usuário
  - Usar `useCurrentUserProfile(user?.id)` para pegar profile
  - Retornar objeto com `teacherId`, `fullName`, `profile`, `isLoading`, `isError`, `role`, `user`
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/hooks/useTeacherId.ts`
  - `src/hooks/__tests__/useTeacherId.test.ts`
- **Teste:** Hook retorna `teacherId` correto
- **Demo:** `const { teacherId } = useTeacherId()` funciona

### Task 2: Atualizar páginas teacher

- **Objetivo:** Substituir padrão duplicado por `useTeacherId()`
- **Implementação:**
  - Atualizar `TeacherHome.tsx`
  - Atualizar `TeacherStudents.tsx`
  - Atualizar `TeacherClasses.tsx`
  - Atualizar `TeacherFinancial.tsx`
  - Atualizar `TeacherActivities.tsx`
  - Atualizar `TeacherOverview.tsx`
  - Remover imports de `useAuth` e `useCurrentUserProfile`
  - Adicionar import de `useTeacherId`
- **Arquivos modificados:**
  - 6 páginas em `src/pages/teacher/`
- **Teste:** Páginas teacher funcionam identicamente
- **Demo:** Código mais limpo, sem duplicação

### Task 3: Auditoria de componentes

- **Objetivo:** Identificar `supabase.from()` em componentes/páginas
- **Implementação:**
  - Executar `grep -r "supabase.from" src/components/`
  - Executar `grep -r "supabase.from" src/pages/`
  - Listar todos os arquivos com `supabase.from()`
  - Verificar se são exceções permitidas (auth público)
  - Confirmar que nenhum componente/página chama Supabase diretamente
- **Resultado:**
  - Nenhum `supabase.from()` encontrado em componentes (exceto auth)
  - Nenhum `supabase.from()` encontrado em páginas (exceto auth)
- **Teste:** Auditoria passa
- **Demo:** Arquitetura correta implementada

## Implementation Details

### Hooks Criados

| Hook           | Responsabilidade                        | Arquivo                     |
| -------------- | --------------------------------------- | --------------------------- |
| `useTeacherId` | Encapsular padrão de busca de teacherId | `src/hooks/useTeacherId.ts` |

### Páginas Modificadas

| Página                  | Mudança                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `TeacherHome.tsx`       | Substituir `useAuth + useCurrentUserProfile` por `useTeacherId` |
| `TeacherStudents.tsx`   | Substituir `useAuth + useCurrentUserProfile` por `useTeacherId` |
| `TeacherClasses.tsx`    | Substituir `useAuth + useCurrentUserProfile` por `useTeacherId` |
| `TeacherFinancial.tsx`  | Substituir `useAuth + useCurrentUserProfile` por `useTeacherId` |
| `TeacherActivities.tsx` | Substituir `useAuth + useCurrentUserProfile` por `useTeacherId` |
| `TeacherOverview.tsx`   | Substituir `useAuth + useCurrentUserProfile` por `useTeacherId` |

## Files Created

```
src/
└── hooks/
    ├── useTeacherId.ts              ← Hook encapsulado
    └── __tests__/
        └── useTeacherId.test.ts     ← Testes unitários
```

## Files Modified

- `src/pages/teacher/TeacherHome.tsx` — Usar `useTeacherId`
- `src/pages/teacher/TeacherStudents.tsx` — Usar `useTeacherId`
- `src/pages/teacher/TeacherClasses.tsx` — Usar `useTeacherId`
- `src/pages/teacher/TeacherFinancial.tsx` — Usar `useTeacherId`
- `src/pages/teacher/TeacherActivities.tsx` — Usar `useTeacherId`
- `src/pages/teacher/TeacherOverview.tsx` — Usar `useTeacherId`

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Testes unitários passando (`npm run test`)
- [x] Teste manual: páginas teacher funcionam identicamente
- [x] Auditoria: nenhum `supabase.from()` em componentes/páginas (exceto auth)

## Results & Impact

### Métricas Quantitativas

- ✅ 1 hook criado
- ✅ 6 páginas refatoradas
- ✅ 12 linhas de código duplicado removidas (2 linhas × 6 páginas)
- ✅ 0 `supabase.from()` em componentes/páginas (exceto auth)

### Melhorias Qualitativas

- ✅ Arquitetura correta implementada
- ✅ Código DRY (sem duplicação)
- ✅ Manutenção simplificada (mudança no Supabase afeta apenas hooks)
- ✅ Testes facilitados (mockar apenas hooks, não Supabase)
- ✅ Separação de responsabilidades clara

## Lessons Learned

### O que funcionou bem ✅

- **Hook `useTeacherId()` eliminou duplicação:** Encapsular padrão `useAuth() + useCurrentUserProfile()` em hook único removeu 12 linhas duplicadas. Pattern aplicável a outros padrões duplicados (ex: `useStudentId()`, `useAdminId()`).
- **Auditoria com grep:** Comando `grep -r "supabase.from" src/components/` identificou violações de arquitetura rapidamente. Ferramenta simples e eficaz para validar separação de responsabilidades.
- **Refactor sem mudança de comportamento:** Refatorar arquitetura sem alterar funcionalidades permitiu validação rápida (testes manuais idênticos). Alternativa seria refactor + features novas (mais arriscado).

### O que poderia melhorar ⚠️

- **Faltou lint rule:** Auditoria manual com grep funciona, mas lint rule customizada (`no-supabase-in-components`) seria melhor. ESLint plugin poderia bloquear `supabase.from()` em `src/components/` e `src/pages/`.
- **Hooks ainda grandes:** Alguns hooks têm ~200 linhas (ex: `useStudents.ts`). Refatorar em hooks menores (ex: `useStudentsList`, `useStudentDetail`, `useStudentMutations`) seria mais testável.

### Aplicações futuras 💡

- **Pattern de encapsulamento:** Aplicar pattern de `useTeacherId()` em outros contextos (ex: `useStudentId()` para páginas student, `useAdminId()` para páginas admin).
- **Lint rules customizadas:** Criar ESLint plugin com rules: `no-supabase-in-components`, `no-supabase-in-pages`, `require-hooks-for-data-fetching`. Previne regressão arquitetural.
- **Auditoria periódica:** Executar `grep -r "supabase.from" src/` a cada sprint para garantir que arquitetura não regride. Adicionar no checklist de PR.

## Technical Debt

- [ ] Ainda existem alguns hooks grandes (~200 linhas) — refatorar na Sprint 9
- [ ] Alguns hooks têm lógica duplicada — remover na Sprint 10
