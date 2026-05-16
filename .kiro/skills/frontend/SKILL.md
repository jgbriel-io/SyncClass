---
name: frontend
description: >
  Boas práticas de frontend para o SyncClass — React, Tailwind, shadcn/ui, design tokens,
  performance, acessibilidade e padrões visuais. Ativar ao trabalhar em arquivos .tsx/.ts
  ou ao discutir UI/componentes. Trigger: "componente", "UI", "frontend", "Tailwind", "shadcn".
---

# Senior Frontend — Boas Práticas

Stack: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query.

## Componentes

- Functional components com arrow functions
- Máximo ~150 linhas — extrair se crescer
- Props mínimas e claras, desestruturadas na assinatura
- Early returns para evitar ternários aninhados

```tsx
// ✅
const StudentCard = ({ student, onEdit }: Props) => {
  if (!student) return null;
  if (student.status === 'inativo') return <InactiveCard />;
  return <ActiveCard student={student} onEdit={onEdit} />;
};
```

## Estado

- `useState` apenas para UI state local (modais, toggles, inputs controlados)
- Server state sempre via TanStack Query — nunca `useState` + `useEffect` para dados
- Evitar estado global desnecessário

## Performance — Bundle Size (CRÍTICO)

**Evitar barrel imports:**
```tsx
// ❌
import { Button, Card, Input } from '@/components/ui'

// ✅
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**Lazy loading de páginas pesadas:**
```tsx
// App.tsx já usa lazy — manter esse padrão
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudents'));
```

## Performance — Waterfalls (CRÍTICO)

```ts
// ❌ Sequencial
const teacher = await fetchTeacher(id);
const students = await fetchStudents(id);

// ✅ Paralelo
const [teacher, students] = await Promise.all([fetchTeacher(id), fetchStudents(id)]);
```

TanStack Query paraleliza automaticamente múltiplos `useQuery` no mesmo componente.

## Performance — Re-renders (MÉDIO)

```tsx
// ❌ Novo objeto a cada render
<StudentList filters={{ status: 'ativo', teacherId }} />

// ✅
const filters = useMemo(() => ({ status: 'ativo', teacherId }), [teacherId]);
<StudentList filters={filters} />
```

Não usar `useMemo`/`useCallback` preventivamente — só com evidência de problema.

## Rendering

```tsx
// ❌ Pode renderizar "0"
{students.length && <StudentList />}

// ✅
{students.length > 0 && <StudentList />}
```

## Subscriptions Real-time

```ts
useEffect(() => {
  const channel = supabase.channel('...').subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

## Tailwind

- Escala consistente: `gap-4`, `gap-6`, `gap-8` (múltiplos de 4)
- ❌ `gap-3`, `gap-5`, `gap-7`
- Cores semânticas: `text-destructive` não `text-red-500`
- Responsivo mobile-first: `text-base md:text-lg`
- Design tokens do projeto: `typography()`, `stack()`, `iconSize()`

## Acessibilidade

- `alt` descritivo em imagens
- Botões com texto ou `aria-label`
- Inputs sempre com `label` associado
- Não remover `focus-visible` outline

---

# Padrões Visuais

Antes de criar qualquer coisa nova: verificar se já existe algo similar, reutilizar.

## Design Tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'
```

| Uso | Token |
|-----|-------|
| Títulos de página | `typography('H1')` |
| Títulos de seção | `typography('H2')`, `typography('H3')` |
| Texto padrão | `typography('BODY')` |
| Labels, hints | `typography('SMALL')` |
| Espaçamento denso | `stack('TIGHT')` |
| Espaçamento padrão | `stack('DEFAULT')` |
| Espaçamento relaxado | `stack('LOOSE')`, `stack('RELAXED')` |
| Ícones em botões | `iconSize('SM')` |
| Ícones em cards | `iconSize('MD')` |
| Ícones em headers | `iconSize('LG')` |

## Componentes — usar os existentes

Verificar antes de criar:
1. `src/components/ui/` — shadcn/ui
2. `src/components/students/`, `src/components/admin/` — componentes do domínio

- Buttons → `Button` do shadcn
- Inputs → `Input` do shadcn com `Label`
- Cards → `Card` do shadcn
- Tabelas → `Table`, `TableBody`, `TableRow` do shadcn
- Dialogs/Modals → `Dialog` do shadcn
- Toasts → `toast` do sonner

## Cores — apenas semânticas

| Situação | Classe |
|----------|--------|
| Erros | `text-destructive`, `bg-destructive/10`, `border-destructive/20` |
| Sucesso | `text-success`, `bg-success/10` |
| Avisos | `text-warning`, `bg-warning/10` |
| Neutro | `text-muted-foreground`, `bg-muted` |
| Primário | `text-primary`, `bg-primary` |

❌ `text-red-500`, `bg-green-50` (hardcoded)
✅ `text-destructive`, `bg-success/10` (semântico)

## Formulários

- Formulários são sempre Dialogs/Modals — não criar rotas separadas
- Inputs usam `id` para identificação (não `name`)
- Erros próximos ao input com `text-destructive`

## Loading States

```tsx
// Skeleton para listas
if (isLoading) return <StudentsTableSkeleton />

// Spinner para botões
<Button disabled={isPending}>
  {isPending && <Loader2 className={`mr-2 ${iconSize('SM')} animate-spin`} />}
  {isPending ? 'Salvando...' : 'Salvar'}
</Button>
```

## Organização

- Um componente por arquivo
- Hooks customizados em `src/hooks/` com prefixo `use`
- Lógica de negócio fora de componentes — sempre em hooks
