# Sprint 11 — Componentes e hooks grandes demais

**Prioridade:** 🟠 Média  
**Esforço estimado:** Alto  
**Status:** ⬜ Pendente

## Problema

Vários arquivos ultrapassam muito o limite de ~150 linhas para componentes e estão difíceis de manter.
A estratégia é extração cirúrgica — não reescrever, só separar responsabilidades.

## Tarefas

### 2.1 — `useUserMutations.ts` (944 linhas, 25+ funções)

**Ação:** Dividir em arquivos menores por domínio:
- `useUserMutations.ts` — manter apenas mutations de usuário/auth
- `useAvatarMutations.ts` — extrair `useUploadAvatar`
- `useInviteMutations.ts` — extrair `useInviteTeacher`, `useInviteStudent`

---

### 2.2 — `src/pages/admin/Users.tsx` (958 linhas)

**Problema:** Página com lógica de filtro, estado, tabela e dialogs tudo inline.

**Ação:**
- Extrair lógica de estado/filtros para hook `useUsersPageState.ts`
- Mover tabela para componente `UsersTable.tsx` em `src/components/users/`
- A página deve ficar com ~80 linhas (só composição)

---

### 2.3 — `src/pages/admin/Teachers.tsx` (805 linhas)

**Ação:** Mesma estratégia do 2.2:
- Extrair estado para hook ou usar `useTeachers` existente
- Mover tabela para `TeachersTable.tsx` (já existe `TeachersTableRow.tsx`)
- Página vira composição

---

### 2.4 — `src/components/users/UserFormDialog.tsx` (955 linhas)

**Ação:** Formulário muito grande. Dividir em seções/steps ou extrair sub-formulários:
- `UserBasicInfoForm.tsx` — dados básicos
- `UserRoleForm.tsx` — seleção de role e vinculação

---

### 2.5 — `src/components/students/StudentsListView.tsx` (865 linhas)

**Ação:**
- Extrair lógica de filtro/estado para hook
- Extrair seção de estatísticas para `StudentsStats.tsx`
- O componente deve orquestrar, não implementar

---

### 2.6 — `src/components/dashboard/DashboardView.tsx` (830 linhas)

**Ação:** Extrair seções em componentes:
- `DashboardMetrics.tsx` — cards de métricas
- `DashboardBirthdays.tsx` — lista de aniversários
- `DashboardUpcomingPayments.tsx` — próximos pagamentos
- `DashboardChart.tsx` — gráfico de novos alunos

---

### 2.7 — `src/components/financial/FinancialView.tsx` (818 linhas)

**Ação:**
- Extrair `FinancialSummaryCards.tsx`
- Extrair `FinancialTable.tsx`

---

### 2.8 — `src/components/classes/ClassesView.tsx` (791 linhas)

**Ação:**
- Extrair `ClassesTable.tsx`
- Extrair `ClassesSummary.tsx`

---

### 2.9 — Hooks grandes

| Hook | Linhas | Ação |
|---|---|---|
| `useClassLogs.ts` | 774 | Separar em `useClassLogMutations.ts` |
| `useFinancialRecords.ts` | 566 | Separar em `useFinancialMutations.ts` |
| `useStudents.ts` | 540 | Separar em `useStudentMutations.ts` |

---

## Ordem Sugerida

1. `useUserMutations.ts` — mais fácil, só mover funções
2. `Users.tsx` e `Teachers.tsx` — maior impacto visual
3. Componentes de view (Dashboard, Financial, Classes)
4. Hooks de domínio

## Critério de Conclusão

- Nenhum componente acima de ~300 linhas (exceto casos justificados)
- Nenhum hook acima de ~400 linhas
- Páginas em `src/pages/` com no máximo ~100 linhas (só composição)

