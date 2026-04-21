# Sprint 10 — Supabase direto em componentes/páginas

**Prioridade:** 🔴 Alta  
**Esforço estimado:** Médio  
**Status:** ⬜ Pendente

## Problema

17 arquivos chamam o Supabase diretamente, violando a arquitetura `Components → Hooks → Supabase`.
Isso dificulta testes, duplica lógica e mistura responsabilidades.

## Tarefas

### 1.1 — Criar `useTeacherId()` hook

**Problema:** A mesma query de `profiles` para buscar `teacher_id` está duplicada em 5 páginas.

**Arquivos afetados:**
- `src/pages/teacher/TeacherHome.tsx`
- `src/pages/teacher/TeacherStudents.tsx`
- `src/pages/teacher/TeacherClasses.tsx`
- `src/pages/teacher/TeacherFinancial.tsx`
- `src/pages/teacher/TeacherOverview.tsx`

**Solução:** Criar `src/hooks/useTeacherId.ts`:
```ts
export const useTeacherId = () => {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ['teacherId', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('teacher_id, full_name')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && role === 'teacher',
  });
};
```
Depois substituir o bloco inline em cada página pelo hook.

---

### 1.2 — Mover lógica de `FinancialView.tsx` para hook

**Arquivo:** `src/components/financial/FinancialView.tsx`  
**Ação:** Identificar chamadas Supabase diretas e mover para `useFinancialRecords.ts`.

---

### 1.3 — Mover lógica de `StudentsListView.tsx` para hook

**Arquivo:** `src/components/students/StudentsListView.tsx`  
**Ação:** Identificar chamadas Supabase diretas e mover para `useStudents.ts`.

---

### 1.4 — Mover lógica de `TeacherLayout.tsx` e `SettingsModal.tsx`

**Arquivos:**
- `src/components/layout/TeacherLayout.tsx`
- `src/components/layout/SettingsModal.tsx`

**Ação:** Extrair queries para hooks existentes ou novos conforme necessário.

---

### 1.5 — Páginas de aluno

**Arquivos:**
- `src/pages/student/StudentActivities.tsx`
- `src/pages/student/StudentCheckout.tsx`

**Ação:** Mover queries para hooks em `useStudentPortal.ts` ou hooks específicos.

---

### 1.6 — `src/pages/admin/Dashboard.tsx`

**Ação:** Verificar se a query pode usar `useDashboardStats` já existente.

---

### 1.7 — `src/components/auth/ChangePasswordDialog.tsx`

**Nota:** Supabase Auth direto em componente de auth é aceitável, mas avaliar se faz sentido mover para `useUserMutations.ts`.

---

### ⚠️ Não alterar

- `src/pages/ForgotPassword.tsx` — fluxo de auth público, Supabase direto é aceitável
- `src/pages/ResetPassword.tsx` — idem

## Critério de Conclusão

- Nenhum `import { supabase }` em `src/components/` (exceto auth) ou `src/pages/`
- Toda lógica de dados passa por `src/hooks/`

