# Sprint 31 — Fix: Correções encontradas durante QA (Teachers)

**Período:** 01/06/2026
**Status:** ✅ Concluída
**Tipo:** Fix
**Prioridade:** 🔴 Alta

## Problem Statement

Sprint 28 (QA manual) identificou falhas no fluxo de redefinição de senha da aba `/admin/teachers`. O botão "Redefinir Senha" exibia erro `"Este professor não possui conta de acesso vinculada."` mesmo para professores com conta ativa no banco. Adicionalmente, o modal da aba teachers tinha UI diferente dos dialogs equivalentes em `/admin/students` e `/admin/users`, quebrando a consistência da plataforma.

**Root causes identificados:**

1. **`useTeacherUserId` retornava `null` via RLS** — O hook fazia `SELECT user_id FROM profiles WHERE teacher_id = ?` usando o JWT do usuário logado (client-side). Embora o admin tenha acesso via `is_admin()`, a query retornava null em certos contextos de cache/timing.

2. **Edge Function `reset-password` sem suporte a `teacherId`** — O frontend precisava resolver o `user_id` client-side antes de chamar a Edge Function. Para alunos, a Edge Function recebia `studentId` e resolvia internamente via `supabaseAdmin`. Teachers não tinham o mesmo caminho.

3. **`.maybeSingle()` com múltiplas linhas** — `profiles WHERE teacher_id = teacherId` retornava 3 linhas: o próprio professor + alunos vinculados a ele (campo `profiles.teacher_id` é usado tanto para o teacher quanto para seus students). `.maybeSingle()` falha com erro quando recebe múltiplas linhas.

4. **UI inconsistente no `TeacherResetPasswordDialog`** — Requisitos de senha de 6 chars (vs 8 em students), sem bloco de requisitos visíveis, gerador de senha inline customizado (vs `generateRandomPassword(12)` compartilhado), sem validação de força.

5. **Texto do botão inconsistente** — Teachers exibia "Redefinir senha do professor", Students exibia "Redefinir senha do aluno", Users exibia hardcoded "Redefinir senha". Três variações sem necessidade.

## Bugs Corrigidos

### BUG-031-001 — `reset-password` Edge Function sem suporte a `teacherId`

**Rota:** `/admin/teachers` → dropdown → "Redefinir senha"
**Sintoma:** `{"error":"Este professor não possui conta de acesso vinculada."}` mesmo com conta existente.
**Root cause:** Edge Function só suportava `studentId` e `userId`. Teacher path fazia lookup client-side via `useTeacherUserId` que retornava `null` por causa do `.maybeSingle()` com múltiplos resultados (profiles de alunos também têm `teacher_id`).
**Severidade:** 🔴 Crítica (feature completamente quebrada)
**Correção:**

- Adicionado branch `teacherId` na Edge Function: `supabaseAdmin.from("profiles").select("user_id").eq("teacher_id", teacherId).eq("role", "teacher").maybeSingle()`
- `.eq("role", "teacher")` garante retorno de única linha (apenas o profile do professor, não dos alunos)
- Removido `useTeacherUserId` do `TeacherResetPasswordDialog` — dialog passa `teacherId: teacher.id` direto
  **Arquivos:**
- `supabase/functions/reset-password/reset-password.ts` — branch `teacherId` adicionado (deploy v11)
- `src/hooks/useUserAuthMutations.ts` — `teacherId?: string` adicionado ao tipo do param
- `src/components/teachers/TeacherResetPasswordDialog.tsx` — removido `useTeacherUserId`; passa `teacherId` direto

---

### BUG-031-002 — `TeacherResetPasswordDialog` UI inconsistente

**Rota:** `/admin/teachers` → dropdown → "Redefinir senha"
**Sintoma:** Modal sem bloco de requisitos de senha, validação fraca (6 chars), gerador diferente do padrão.
**Severidade:** 🟡 Média (UX inconsistente vs students e users)
**Correção:** `TeacherResetPasswordDialog` reescrito para ser idêntico ao `StudentResetPasswordDialog`:

- Bloco de requisitos visível (`auth.resetPassword.requirements.*`)
- Validação 8 chars + uppercase + lowercase + number + special
- `generateRandomPassword(12)` do serviço compartilhado
- Toasts de validação via `auth.resetPassword.toasts.*`
  **Arquivos:**
- `src/components/teachers/TeacherResetPasswordDialog.tsx` — reescrito
- `src/content/teachers.ts` — description atualizada para "A senha deve atender aos requisitos abaixo"

---

### BUG-031-003 — Texto do botão "Redefinir senha" inconsistente nas 3 abas

**Rotas:** `/admin/teachers`, `/admin/students`, `/admin/users`
**Sintoma:** Cada aba exibia texto diferente no item do dropdown (com sufixo "do professor", "do aluno", ou hardcoded).
**Severidade:** 🟢 Baixa (UX inconsistente, sem impacto funcional)
**Correção:** Centralizado em `common.actions.resetPassword = "Redefinir senha"`. Todas as 3 telas usam o mesmo string.
**Arquivos:**

- `src/content/common.ts` — `resetPassword: "Redefinir senha"` adicionado em `actions`
- `src/components/students/StudentsTableRow.tsx`
- `src/components/teachers/TeachersTableRow.tsx`
- `src/components/users/UsersTableRow.tsx`

---

---

### BUG-031-004 — `start_at` exibido como ISO raw na mensagem de guard do hard delete

**Rotas:** `/admin/students`, `/admin/teachers`
**Sintoma:** Mensagem de alerta exibia `09/06/2026 2026-06-09T10:00:00+00:00 - Professor Teste` em vez de `09/06/2026 10:00 - Professor Teste`.
**Root cause:** `const time = c.start_at || ""` — `start_at` é datetime ISO completo, não só hora.
**Severidade:** 🟡 Média (UX confuso)
**Correção:** `c.start_at.slice(11, 16)` extrai `HH:MM`. Se null, omite horário do item.
**Arquivos:**

- `src/hooks/useStudents.ts` — slice(11,16) + omissão quando null
- `src/hooks/useTeachers.ts` — idem

---

### BUG-031-005 — `StudentHardDeleteDialog` sem fluxo de confirmação forçada

**Rota:** `/admin/students` → dropdown → "Excluir definitivamente"
**Sintoma:** Clicar em "Excluir" gerava erro toast quando aluno tinha aulas agendadas. O guard lançava exceção que não era tratada pela UI — sem caminho para confirmar e prosseguir.
**Root cause:** `StudentHardDeleteDialog` chamava `mutate({ id })` sem `force` e sem capturar o erro para exibir segundo passo. `TeacherHardDeleteDialog` tinha two-step via segundo modal; `StudentHardDeleteDialog` não tinha nenhum.
**Severidade:** 🔴 Crítica (feature completamente quebrada para alunos com aulas)
**Correção:** Adicionado `checkboxLabel` ao `ConfirmHardDeleteDialog` (checkbox obrigatório para habilitar botão). Todos os dialogs de hard delete passam `force: true` direto e exibem checkbox de confirmação. Um único modal — sem segundo modal.
**Arquivos:**

- `src/components/ui/ConfirmHardDeleteDialog.tsx` — prop `checkboxLabel?` + checkbox com gate no botão
- `src/components/students/StudentDeleteDialog.tsx` — `force: true` + `checkboxLabel`
- `src/components/teachers/TeacherHardDeleteDialog.tsx` — removido two-step; `force: true` + `checkboxLabel`
- `src/content/students.ts` — `checkboxLabel` adicionado
- `src/content/teachers.ts` — `checkboxLabel` adicionado (substituiu `scheduledTitle/Description/forceConfirmButton`)

---

### BUG-031-006 — Hard delete sem anonimização completa de PII em `profiles`

**Rotas:** `/admin/students`, `/admin/teachers`, `/admin/users`
**Sintoma:** Hard delete anonimizava a linha em `students`/`teachers` mas deixava `full_name` e `avatar_url` intactos em `profiles`. Hard delete de usuário admin (`useHardDeleteUser`) não fazia nenhuma anonimização — chamava a edge function diretamente.
**Root cause:** Profiles update em students/teachers só zeravam `email`; `full_name` e `avatar_url` permaneciam. `useHardDeleteUser` não tinha nenhuma etapa de anonimização antes da chamada à edge function.
**Severidade:** 🟠 Alta (LGPD — PII residual após exclusão)
**Correção:** Todos os 3 fluxos agora anonimizam `profiles` com `full_name: "Usuário {seg}"`, `email: null`, `avatar_url: null`, `deleted_at`, `active: false` antes de chamar `admin-delete-user`.
**Arquivos:**

- `src/hooks/useStudents.ts` — `full_name` + `avatar_url` adicionados ao profiles update
- `src/hooks/useTeachers.ts` — idem
- `src/hooks/useUserProfileMutations.ts` — profiles lookup + anonimização adicionados antes da edge function; import `pickAnonSegment`

---

### BUG-031-007 — `formatDateTime` sem timezone fixo causava divergência CI/local

**Contexto:** CI (UTC+0) e ambiente local (UTC-3) renderizavam timestamps diferentes para o mesmo valor ISO.
**Sintoma:** Snapshot `FinancialTableRow` passava localmente mas falhava no CI — `07:30` vs `10:30` para `2024-01-15T10:30:00Z`.
**Root cause:** `Intl.DateTimeFormat("pt-BR", { hour, minute })` sem `timeZone` usa timezone do sistema.
**Severidade:** 🟡 Média (falha de CI bloqueante)
**Correção:** `timeZone: "America/Sao_Paulo"` adicionado às opções de `formatDateTime`.
**Arquivos:**

- `src/lib/utils/formatters.ts` — `timeZone: "America/Sao_Paulo"` em `formatDateTime`
- `src/components/financial/__snapshots__/FinancialTableRow.test.tsx.snap` — regenerado

---

### BUG-031-008 — Cálculo de semestre com `new Date(year, 5, 31)` rolava para julho

**Contexto:** Filtro de período do dashboard — opção "Semestre".
**Sintoma:** H1 terminava em 1 de julho em vez de 30 de junho. `new Date(2026, 5, 31)` → `2026-07-01` (JavaScript faz rollover automaticamente).
**Root cause:** Dia 31 hardcoded para meses de 30 dias.
**Severidade:** 🟡 Média (dados incorretos no filtro semestral)
**Correção:** `endOfMonth(new Date(year, isH1 ? 5 : 11, 1))` — usa `date-fns` para calcular último dia correto do mês.
**Arquivos:**

- `src/lib/utils/periodFilter.ts` — `endOfMonth` substituindo dia 31 hardcoded

---

## Nova Feature — Filtro de Período no Dashboard

**Contexto:** Cards do dashboard misturavam escopos temporais (Previsão Mensal de um período, Total Recebido de outro), tornando os números inconsistentes entre si.

**Implementação:** Seletor Mês / Semestre / Ano no header do dashboard. Todos os cards usam o mesmo período.

- `src/lib/utils/periodFilter.ts` — tipo `PeriodFilter`, `getDateRangeForPeriod()` (H1/H2 calendário)
- `supabase/migrations/62_financial_summary_date_range.sql` — `p_date_from`/`p_date_to` opcionais em `get_financial_summary` (`total_overdue` não filtrado por período — Decision A)
- `src/hooks/useFinancialSummary` — aceita `dateRange?`
- `src/hooks/useForecastedBilling` — aceita `dateRange?`
- `src/hooks/useDashboardStats` — aceita `period?`
- `src/hooks/useTeacherDashboardStats` — aceita `period?`
- `src/components/dashboard/DashboardPeriodFilter.tsx` — botões Mês/Semestre/Ano
- `src/components/dashboard/DashboardView.tsx` — props `periodFilter`/`onPeriodFilterChange`; helper `byPeriod()` elimina ternários repetidos
- `src/components/dashboard/DashboardFinancialCards.tsx` — `FORECAST_LABELS` record; recebe `periodFilter`
- `src/pages/admin/Dashboard.tsx` e `src/pages/teacher/TeacherHome.tsx` — `useState<PeriodFilter>("month")` + conectado a todos os hooks

---

## Edge Functions — Deploy realizado

| Function         | Versão após fix |
| ---------------- | --------------- |
| `reset-password` | v11             |

## Testing & Validation

- [x] `npm run type-check` — zero erros
- [x] `npm run test` — 287 testes passando
- [x] `/admin/teachers` → redefinir senha → modal com bloco de requisitos visível
- [x] Redefinir senha via aba teachers → funciona (senha atualizada, modal de nova senha exibido)
- [x] Modal idêntico ao de alunos em requisitos e validação
- [x] Botão "Redefinir senha" idêntico nas 3 abas (students/teachers/users)
- [x] Hard delete aluno com aulas agendadas → modal com checkbox → force delete funciona
- [x] Hard delete teacher com aulas agendadas → mesmo padrão (um modal, checkbox)
- [x] Hard delete usuário admin → profiles anonimizados antes da exclusão
- [x] `formatDateTime` → UTC-3 consistente local e CI
- [x] Dashboard filtro Mês/Semestre/Ano → todos os cards atualizam
- [x] Semestre H1 termina em 30/06 (não 01/07)

## References

- Sprint 28: `docs/sprints/sprint-28-testes-manuais.md` — QA que gerou estes bugs
- Sprint 29: `docs/sprints/sprint-29-fix-correcoes-painel-admin.md` — precedente de fixes pós-QA
