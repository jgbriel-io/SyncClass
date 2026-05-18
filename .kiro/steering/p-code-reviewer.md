---
inclusion: always
description: Checklist de code review SyncClass — arquitetura, qualidade, segurança, performance, UI/UX e TypeScript
---

# Code Review — Checklist SyncClass

## Arquitetura

- [ ] Componente faz apenas UI? Lógica está em hook?
- [ ] Hook usa TanStack Query para dados do servidor?
- [ ] Supabase chamado apenas em hooks/services, não em componentes?
- [ ] Mutation considerou wrappers existentes (`useOptimisticMutation`, `useRetryMutation`) antes de usar `useMutation` cru?
- [ ] Service de domínio em `src/hooks/*Service.ts` (não em `src/lib/`)?
- [ ] Sem prop drilling?

## Qualidade

- [ ] Componente tem menos de ~150 linhas?
- [ ] Sem ternários aninhados? (usar early returns)
- [ ] Nomes descritivos? (`isLoading`, `hasError`, `teacherId`)
- [ ] Sem código morto ou comentado?
- [ ] Sem `console.log`?

## Segurança

- [ ] Inputs validados com Zod?
- [ ] Queries filtram por `teacher_id` ou `student_id` do usuário autenticado?
- [ ] Sem dados sensíveis em logs?
- [ ] Erros do Supabase tratados (`if (error) throw error`)?
- [ ] RLS habilitado em novas tabelas?

## Performance

- [ ] Sem barrel imports (`import { X } from '@/components/ui'`)?
- [ ] Sem objetos/arrays criados inline em props?
- [ ] `useEffect` não usado para data fetching?
- [ ] Subscriptions real-time limpas no cleanup (`supabase.removeChannel`)?
- [ ] `.single()` vs `.maybeSingle()` usado corretamente?
- [ ] Paginação em listas grandes (`.range()`)?

## UI/UX

- [ ] Cores semânticas (`text-destructive` não `text-red-500`)?
- [ ] Spacing na escala de 4px (`gap-4`, `gap-6`, `gap-8`)?
- [ ] Estados de loading, error e empty tratados?
- [ ] Mensagens de erro em português?
- [ ] Design tokens usados: `typography()`, `stack()`, `iconSize()`?
- [ ] Strings UI em `src/content/{dominio}.ts`, não hardcoded?

## TypeScript

- [ ] Sem `any` explícito desnecessário?
- [ ] Props tipadas?
- [ ] Tipos do Supabase usados (`Database['public']['Tables']['students']['Row']`)?

## Padrões comuns de problema

```tsx
// ❌
const [data, setData] = useState();
useEffect(() => { supabase.from('students').select().then(setData) }, []);

// ✅
const { data } = useStudents(teacherId);
```

```tsx
// ❌ Cor hardcoded
<p className="text-red-500">Erro</p>

// ✅ Semântica
<p className="text-destructive">Erro</p>
```

```tsx
// ❌ String hardcoded
<h1>Alunos</h1>

// ✅ Content centralizado
import { students } from '@/content';
<h1>{students.title}</h1>
```
