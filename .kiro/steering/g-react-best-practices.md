---
inclusion: fileMatch
fileMatchPattern: ['**/*.tsx', '**/*.ts']
description: Performance React — barrel imports, Promise.all, lazy loading, re-renders, bundle size. Projeto usa Vite (não Next.js), RSC não se aplica.
---

# React — Performance e Boas Práticas

Projeto usa React 18 + Vite. Regras de RSC/Server Components não se aplicam.

## Bundle Size (CRÍTICO)

**Evitar barrel imports:**
```tsx
// ❌ Carrega biblioteca inteira
import { Button, Card, Input } from '@/components/ui'

// ✅ Import direto
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**Lazy loading de páginas pesadas:**
```tsx
// App.tsx já usa lazy — manter esse padrão
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudents'));
```

## Waterfalls (CRÍTICO)

**Paralelizar queries independentes:**
```ts
// ❌ Sequencial — lento
const teacher = await fetchTeacher(id);
const students = await fetchStudents(id);

// ✅ Paralelo
const [teacher, students] = await Promise.all([
  fetchTeacher(id),
  fetchStudents(id),
]);
```

**TanStack Query já paraleliza automaticamente** quando múltiplos `useQuery` são chamados no mesmo componente.

## Re-renders (MÉDIO)

**Não criar objetos/arrays inline em props:**
```tsx
// ❌ Novo objeto a cada render
<StudentList filters={{ status: 'ativo', teacherId }} />

// ✅ Memoizar ou extrair
const filters = useMemo(() => ({ status: 'ativo', teacherId }), [teacherId]);
<StudentList filters={filters} />
```

**Não usar `useMemo`/`useCallback` preventivamente** — só quando há evidência de problema de performance.

## Rendering

**Conditional rendering explícito:**
```tsx
// ❌ Pode renderizar "0" na tela
{students.length && <StudentList />}

// ✅ Explícito
{students.length > 0 && <StudentList />}
```

**Hoist elementos JSX estáticos fora do componente:**
```tsx
// ❌ Recriado a cada render
const EmptyState = () => <p>Nenhum aluno</p>;

// ✅ Fora do componente
const EMPTY_STATE = <p className="text-muted-foreground">Nenhum aluno</p>;
```

## JavaScript

```ts
// ✅ Imutável
const sorted = students.toSorted((a, b) => a.name.localeCompare(b.name));

// ❌ Mutável
const sorted = [...students].sort(...);

// ✅ Set para lookups O(1)
const studentIds = new Set(students.map(s => s.id));
if (studentIds.has(id)) { ... }
```

## Subscriptions Real-time

```ts
// Sempre limpar subscription no cleanup
useEffect(() => {
  const channel = supabase.channel('...').subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```
