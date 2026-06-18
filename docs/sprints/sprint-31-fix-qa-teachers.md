# Sprint 31 — Fix: Correções encontradas durante QA (Teachers)

**Período:** 01/06/2026
**Status:** ✅ Concluída
**Tipo:** Fix + Feature
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
- `src/components/dashboard/DashboardPeriodFilter.tsx` — botões Mês/Semestre/Ano _(posteriormente movido para `src/components/ui/period-filter.tsx`)_
- `src/components/dashboard/DashboardView.tsx` — props `periodFilter`/`onPeriodFilterChange`; helper `byPeriod()` elimina ternários repetidos
- `src/components/dashboard/DashboardFinancialCards.tsx` — `FORECAST_LABELS` record; recebe `periodFilter`
- `src/pages/admin/Dashboard.tsx` e `src/pages/teacher/TeacherHome.tsx` — `useState<PeriodFilter>("month")` + conectado a todos os hooks

---

## Nova Feature — Filtro de Período nas Páginas de Alunos, Aulas e Financeiro

**Contexto:** Após o filtro de período no Dashboard, o mesmo padrão foi estendido para as páginas de domínio. Cards de estatísticas de Alunos, Aulas e Financeiro passaram a respeitar o período selecionado. Atividades foram excluídas do filtro por período — os cards exibem estado atual de todas as atividades (filtragem por `created_at` escondia atividades antigas ainda pendentes, tornando os counts incorretos).

**Decisões de design:**

- **Financeiro:** filtro afeta apenas os cards de resumo (Recebido, A Receber, Pendente, Atrasado) — a tabela mantém filtros manuais independentes.
- **Atividades:** sem filtro de período nos cards — semanticamente errado filtrar status por data de criação.
- **`DashboardPeriodFilter`** movido de `src/components/dashboard/` para `src/components/ui/period-filter.tsx` como primitivo genérico reutilizável.

**Bug corrigido durante implementação:**

- `FinancialSummaryCards` computava totais a partir do array `records` paginado (apenas 10 registros/página), resultando em totais incorretos. Refatorado para receber `summary` do hook `useFinancialSummary` (RPC server-side, dataset completo).

**Bug de naming corrigido durante code review:**

- `useClassLogs.ts` importava `getDateRangeForPeriod` do `periodFilter.ts` usando o mesmo nome de função local já existente no arquivo (assinatura diferente: `"week"|"month"|"3months"`). Import renomeado para `getPeriodDateRange` para evitar shadowing.

**Arquivos alterados:**

- `src/components/ui/period-filter.tsx` — componente `PeriodFilter` genérico (movido + renomeado de `DashboardPeriodFilter`)
- `src/components/dashboard/DashboardView.tsx` — import atualizado para novo caminho
- `src/content/students.ts` — `statNewSemester` e `statNewYear` adicionados
- `src/hooks/useStudentsStats.ts` — aceita `period: PeriodFilter`, `getDateRangeForPeriod` internamente, `period` no `queryKey`
- `src/components/students/StudentsStatCards.tsx` — aceita `period` prop, label dinâmico "Novos este mês/semestre/ano"
- `src/components/students/StudentsListView.tsx` — `useState<PeriodFilter>`, `PeriodFilter` no header
- `supabase/migrations/64_class_logs_summary_period_filter.sql` — `get_class_logs_summary` ganha `p_date_from DATE DEFAULT NULL` e `p_date_to DATE DEFAULT NULL` (retrocompatível — nulls = sem filtro)
- `src/hooks/useClassLogs.ts` — `useClassLogsSummary` aceita `period?`; import aliasado como `getPeriodDateRange`
- `src/components/classes/ClassesView.tsx` — `useState<PeriodFilter>`, `PeriodFilter` no header, `period` para `useClassLogsSummary`
- `src/components/financial/FinancialSummaryCards.tsx` — refatorado: recebe `summary: FinancialSummary | undefined` em vez de `records[]`
- `src/components/financial/FinancialView.tsx` — `useState<PeriodFilter>`, `dateRange` derivado do período, `PeriodFilter` no header

**Migrations aplicadas em produção:**

- Migration 64 (`64_class_logs_summary_period_filter.sql`) ✅ aplicada
- Migration 70 (`70_fix_activity_tenant_isolation_null_role.sql`) ✅ aplicada
- Migration 71 (`71_fix_class_logs_summary_orphan_logs.sql`) ✅ aplicada
- Migration 72 (`72_fix_log_performance_search_path.sql`) ✅ aplicada

---

---

## Bugs Identificados em Code Review (pós-sprint)

Code review do branch `feat/sprint-31-fixes-period-filter` identificou 5 bugs adicionais, todos corrigidos antes do merge.

---

### BUG-031-009 — `validate_activity_tenant_isolation` aceita INSERT de usuário sem perfil

**Severidade:** 🔴 Crítica (segurança — bypass de isolamento multi-tenant)
**Arquivo:** `supabase/migrations/69_fix_activity_tenant_isolation_teacher_id.sql`
**Root cause:** Quando `auth.uid()` não tem linha correspondente em `profiles` (race condition no signup hook, falha parcial de cadastro), `SELECT INTO v_user_role` retorna `NULL`. Ambos os `IF v_user_role = 'admin'` e `IF v_user_role = 'teacher'` são falsos, e a função executa `RETURN NEW` sem qualquer verificação — o usuário pode inserir atividades com qualquer `student_id` de qualquer tenant.
**Correção:** `IF v_user_role IS NULL THEN RAISE EXCEPTION 'Perfil de usuário não encontrado'; END IF;` adicionado antes dos checks de role. Também adicionado `SET search_path = public` que estava ausente na versão anterior.
**Arquivos:**

- `supabase/migrations/70_fix_activity_tenant_isolation_null_role.sql` — `RAISE EXCEPTION` para role NULL + `SET search_path`

---

### BUG-031-010 — `get_class_logs_summary` infla totais do admin com class_logs órfãos

**Severidade:** 🟠 Alta (dados incorretos na visão admin)
**Arquivo:** `supabase/migrations/64_class_logs_summary_period_filter.sql`
**Root cause:** A função usava `LEFT JOIN students s ON s.id = cl.student_id`. Quando `p_teacher_id IS NULL` (visão admin), a condição `(p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)` é sempre `true` — incluindo linhas onde `s.id IS NULL` (class_logs cujo student foi hard-deleted). Esses logs órfãos eram contabilizados em `totalClasses`, `totalPresent`, etc.
**Correção:** `LEFT JOIN` → `INNER JOIN`. Logs sem student correspondente são automaticamente excluídos.
**Arquivos:**

- `supabase/migrations/71_fix_class_logs_summary_orphan_logs.sql` — INNER JOIN substitui LEFT JOIN

---

### BUG-031-011 — Atividades sem `due_date` inflavam stat cards de período

**Severidade:** 🟡 Média (métricas de período incorretas)
**Arquivo:** `src/components/activities/ActivitiesView.tsx`
**Root cause:** `periodActivities` filtrava por `statPeriod` com `if (!a.due_date) return true` — atividades sem prazo sempre passavam o filtro, independente do período selecionado. Uma atividade criada há 6 meses sem prazo aparecia nos cards de "este mês".
**Correção:** `return true` → `return false`. Atividades sem `due_date` não têm posição temporal e são excluídas dos stat cards de período.
**Arquivos:**

- `src/components/activities/ActivitiesView.tsx:146` — `!due_date → return false`

---

### BUG-031-012 — `log_performance` stub sem `SET search_path` (SECURITY DEFINER)

**Severidade:** 🟡 Média (vetor de segurança — search_path hijacking)
**Arquivo:** `supabase/migrations/66_create_log_performance_stub.sql`
**Root cause:** Função criada com `SECURITY DEFINER` mas sem `SET search_path = public`. Um usuário com permissão de criar schemas poderia criar uma função `log_performance` em outro schema e, em sessões com `search_path` não fixo, redirecionar a chamada para sua versão rodando com os privilégios do owner original.
**Correção:** `SET search_path = public` adicionado.
**Arquivos:**

- `supabase/migrations/72_fix_log_performance_search_path.sql` — SET search_path adicionado

---

### BUG-031-013 — `payment_method: null` gravado em `financial_records` de pacotes

**Severidade:** 🟢 Baixa (inconsistência de dados)
**Arquivo:** `src/hooks/usePackageClassesForm.ts`
**Root cause:** O campo `payment_method` foi removido da UI do formulário de pacote (AbacatePay PIX é o único método), mas o valor `null` era passado diretamente para o RPC `create_class_package`. A coluna não tem constraint `NOT NULL`, então o INSERT ocorria silenciosamente com `payment_method = NULL`, quebrando relatórios que agrupam por método de pagamento.
**Correção:** `payment_method: null` → `payment_method: "pix"` (valor fixo, já que PIX via AbacatePay é o único método suportado).
**Arquivos:**

- `src/hooks/usePackageClassesForm.ts:167` — `payment_method: "pix"`

---

---

## Bugs Corrigidos — Identificados durante desenvolvimento do branch

Bugs encontrados e corrigidos durante o desenvolvimento, identificados via commit history. Não fazem parte do escopo original da sprint nem do code review pós-sprint.

---

### BUG-031-014 — Hard delete bloqueado por registros já anonimizados (`is_deleted=true`)

**Rotas:** `/admin/students`, `/admin/teachers`
**Sintoma:** Tentar hard delete de aluno/professor após soft delete falhava silenciosamente — a edge function `admin-delete-user` encontrava o registro `is_deleted=true` e retornava erro de "não encontrado".
**Root cause:** Guard queries na edge function não filtravam `is_deleted=false`. Após soft delete (que seta `is_deleted=true`), o guard encontrava o registro anonimizado e abortava.
**Severidade:** 🔴 Crítica (hard delete inutilizável após soft delete)
**Correção:** `.eq("is_deleted", false)` adicionado nas guard queries da edge function. `profileError` agora lança exceção em vez de toast.warning + continuar — evita chamar a edge function com state de profile inconsistente.
**Arquivos:**

- `supabase/functions/admin-delete-user/admin-delete-user.ts` — `.eq("is_deleted", false)` nas guard queries
- `src/hooks/useStudents.ts` — `profileError` throws em vez de toast.warning
- `src/hooks/useTeachers.ts` — idem

---

### BUG-031-015 — Filtro de período na overview calculado client-side

**Rota:** `/admin/overview`
**Sintoma:** Filtro de período (`createdAfter`) era calculado no frontend e passado como parâmetro. Com datasets grandes, a query trazia todos os registros e filtrava depois — sem aproveitar o índice do banco.
**Root cause:** `useStudentsWithStatsPaginated` recebia `createdAfter` como string ISO e aplicava `.gte()` client-side após fetch completo.
**Severidade:** 🟡 Média (performance — full table scan em datasets grandes)
**Correção:** Filtro movido para dentro do hook — derivado do `period` recebido, aplicado via `.gte('created_at', ...)` antes do fetch.
**Arquivos:**

- `src/components/overview/OverviewView.tsx` — passa `period` em vez de `createdAfter` calculado
- `src/hooks/useStudentDetails.ts` — `getDateRangeForPeriod` interno, `.gte()` server-side

---

### BUG-031-016 — Alunos anonimizados apareciam na overview

**Rota:** `/admin/overview`
**Sintoma:** Alunos com `is_deleted=true` (hard-deleted, dados anonimizados) eram listados na tabela de overview.
**Root cause:** `useStudentsWithStatsPaginated` não filtrava `is_deleted`.
**Severidade:** 🟠 Alta (PII — nomes anonimizados visíveis na UI)
**Correção:** `.eq('is_deleted', false)` adicionado na query.
**Arquivos:**

- `src/hooks/useStudentDetails.ts` — `.eq('is_deleted', false)`

---

### BUG-031-017 — Busca na overview client-side; sem filtro de status

**Rota:** `/admin/overview`
**Sintoma:** Campo de busca filtrava o array já retornado pela query — com 1000 alunos, trazia todos e descartava 990 no frontend. Sem filtro de status (ativo/inativo).
**Root cause:** Filtro de busca aplicado no `useMemo` sobre o resultado completo da query.
**Severidade:** 🟡 Média (performance + feature ausente)
**Correção:** Busca movida server-side via `.ilike('name', '%...%')`; filtro de status adicionado via `Select` em `OverviewFilters`.
**Arquivos:**

- `src/hooks/useStudentDetails.ts` — `.ilike()` server-side + parâmetro `status`
- `src/components/filters/OverviewFilters.tsx` — campo status adicionado
- `src/components/filters/filterDefaults.ts` — `status: "all"` em `defaultOverviewFilters`
- `src/content/filters.ts` — labels `all`/`active`/`inactive`

---

### BUG-031-018 — Campos não limpos ao fechar `SendActivityDialog`

**Rota:** `/teacher` e `/admin` → aba Atividades
**Sintoma:** Ao fechar e reabrir o dialog de enviar atividade, `student_id`, `title` e `description` mantinham os valores da sessão anterior.
**Root cause:** `reset()` do react-hook-form era chamado sem passar os valores default explícitos — campos controlados não eram zerados.
**Severidade:** 🟡 Média (UX — dados residuais no formulário)
**Correção:** `reset({ student_id: "", title: "", description: "" })` adicionado no handler `onOpenChange`.
**Arquivos:**

- `src/components/activities/SendActivityDialog.tsx` — `reset()` com defaultValues explícitos

---

### BUG-031-019 — Status `pendente` exibido como texto raw lowercase

**Rota:** Tabela de atividades
**Sintoma:** Atividades com status `pendente` sem prazo exibiam "pendente" minúsculo na badge de status. Atividades pendentes com prazo vencido exibiam "pendente" em vez de "Atrasada".
**Root cause:** `getActivityDisplayStatus` não tratava o caso `status === 'pendente'` — caia no fallback que retornava o valor raw.
**Severidade:** 🟢 Baixa (UX — label incorreto)
**Correção:** Case `'pendente'` adicionado: sem prazo → `"Pendente"`, com prazo vencido → `"Atrasada"`.
**Arquivos:**

- `src/hooks/useActivities.ts` — case `pendente` em `getActivityDisplayStatus`
- `src/components/activities/__snapshots__/ActivitiesTableRow.test.tsx.snap` — snapshot atualizado

---

### BUG-031-020 — Máscara BR aplicada a telefone de alunos estrangeiros

**Rota:** `/teacher` e `/admin` → formulário de aluno
**Sintoma:** Alunos com `nationality !== 'BR'` tinham o número de telefone formatado com máscara `(XX) XXXXX-XXXX` no `defaultValues` e no `reset()` — corrompendo números internacionais no formulário.
**Root cause:** `StudentFormDialog` aplicava `phoneMask()` incondicionalmente ao popular o formulário.
**Severidade:** 🟡 Média (dado corrompido ao editar aluno estrangeiro)
**Correção:** `phoneMask()` aplicado condicionalmente apenas quando `nationality === 'BR'`.
**Arquivos:**

- `src/components/students/StudentFormDialog.tsx` — guard `nationality === 'BR'` antes de `phoneMask()`

---

### BUG-031-021 — Trigger `prevent_student_hourly_rate_manipulation` crashava em todo update

**Rota:** Qualquer edição de aluno com `hourly_rate`
**Sintoma:** Todo update de `hourly_rate` falhava com erro de função inexistente. Adicionalmente, o guard comparava `OLD.teacher_id` com `auth.uid()` diretamente — UUIDs de tabelas diferentes.
**Root causes:**

1. Trigger referenciava tabela `user_roles` que foi dropada em migração anterior.
2. `OLD.teacher_id` (FK para `teachers.id`) comparado com `auth.uid()` (FK para `auth.users.id`) — sempre `false`, bloqueando edições legítimas.
   **Severidade:** 🔴 Crítica (edição de `hourly_rate` completamente quebrada)
   **Correção:** Migration 67 substituiu `user_roles` por `profiles.role`. Migration 68 corrigiu a comparação via `v_profile_teacher_id` (lookup em `profiles WHERE user_id = auth.uid()`). `StudentFormDialog` passou a usar `toFixed(2)` para exibir "100,00" em vez de "100".
   **Arquivos:**

- `supabase/migrations/67_fix_prevent_hourly_rate_trigger_user_roles.sql`
- `supabase/migrations/68_fix_hourly_rate_trigger_teacher_id_comparison.sql`
- `src/components/students/StudentFormDialog.tsx` — `toFixed(2)` no `defaultValues` de `hourly_rate`

---

### BUG-031-022 — Tenant isolation de atividades comparava `students.teacher_id` com `auth.uid()`

**Contexto:** Trigger `validate_activity_tenant_isolation` (base do BUG-031-009)
**Sintoma:** Professores não conseguiam criar atividades — trigger sempre bloqueava com "Você não pode criar atividades para alunos de outros professores".
**Root cause:** `students.teacher_id` é FK para `teachers.id`, não para `auth.users.id`. Comparar com `auth.uid()` retornava sempre `false`.
**Severidade:** 🔴 Crítica (criação de atividades completamente quebrada para professores)
**Correção:** Lookup em `profiles WHERE user_id = auth.uid()` para obter `v_profile_teacher_id`, depois comparar `students.teacher_id = v_profile_teacher_id`.
**Arquivos:**

- `supabase/migrations/69_fix_activity_tenant_isolation_teacher_id.sql`

---

### BUG-031-023 — `payment_method` exibido como valor raw do banco na tabela financeira

**Rota:** `/teacher` e `/admin` → aba Financeiro
**Sintoma:** Coluna "Método" exibia `pix`, `credit_card`, `bank_transfer` em vez de "PIX", "Cartão de Crédito", "Transferência". Registros do AbacatePay exibiam coluna vazia (campo `payment_provider` não mapeado).
**Root cause:** `FinancialTableRow` renderizava `record.payment_method` diretamente sem label mapping. Caso `payment_provider === 'abacate_pay'` não tinha tratamento.
**Severidade:** 🟢 Baixa (UX — labels ilegíveis)
**Correção:** Map `payment_method → label` adicionado. Case `abacate_pay` → "Pix - AbacatePay".
**Arquivos:**

- `src/components/financial/FinancialTableRow.tsx` — map de labels + case AbacatePay

---

### BUG-031-024 — Título de aulas individuais de pacote em preto+bold na tabela

**Rota:** `/teacher` e `/admin` → aba Aulas
**Sintoma:** Aulas individuais dentro de um pacote exibiam o título do pacote em preto+negrito, identicamente ao título de aulas avulsas — impossível distinguir visualmente.
**Root cause:** `ClassesTableRow` não diferenciava o estilo visual entre aula avulsa e aula de pacote.
**Severidade:** 🟢 Baixa (UX — distinção visual ausente)
**Correção:** Título de aula de pacote renderizado em cinza sem negrito.
**Arquivos:**

- `src/components/classes/ClassesTableRow.tsx` — estilo condicional por tipo de aula

---

### BUG-031-025 — Nome do aluno duplicado na descrição do registro financeiro de pacote

**Rota:** Criação de pacote de aulas
**Sintoma:** Registro financeiro gerado pelo pacote tinha descrição `"João Silva — Pacote mensal - 4 aula(s) - Junho 2026"` — nome do aluno redundante (já aparece na coluna Aluno da tabela).
**Root cause:** `usePackageClassesForm` concatenava o nome do aluno na descrição.
**Severidade:** 🟢 Baixa (UX — descrição verbosa e redundante)
**Correção:** Nome do aluno removido da descrição.
**Arquivos:**

- `src/hooks/usePackageClassesForm.ts` — descrição simplificada para `"Pacote mensal - N aula(s) - Mês Ano"`

---

### BUG-031-026 — `setPaymentMethod` residual chamado no `resetForm` de `PackageClassesDialog`

**Rota:** Dialog de criação de pacote de aulas
**Sintoma:** Console warning ao fechar o dialog — `setPaymentMethod` não era mais um estado existente (removido junto com o seletor de método de pagamento).
**Root cause:** Chamada `setPaymentMethod(null)` esquecida no `resetForm` após remoção do estado.
**Severidade:** 🟢 Baixa (código morto — runtime warning)
**Correção:** Chamada residual removida.
**Arquivos:**

- `src/components/classes/PackageClassesDialog.tsx` — `setPaymentMethod(null)` removido de `resetForm`

---

## Edge Functions — Deploy realizado

| Function         | Versão após fix |
| ---------------- | --------------- |
| `reset-password` | v11             |

## Testing & Validation

- [x] `npm run type-check` — zero erros
- [x] `npm run test` — 304 testes passando
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
- [x] Alunos — filtro de período altera card "Novos" e label dinâmico
- [x] Financeiro — filtro de período altera cards de resumo (RPC server-side)
- [x] Atividades — cards exibem estado atual de todas as atividades (sem filtro de período)
- [x] Aulas — filtro de período altera cards de resumo (migration 64 aplicada)
- [x] Atividades sem due_date excluídas dos stat cards de período (BUG-031-011)
- [x] INSERT de atividade sem perfil → RAISE EXCEPTION (BUG-031-009)
- [x] Totais admin de aulas não incluem logs órfãos (BUG-031-010)
- [x] Pacote de aulas grava payment_method = "pix" (BUG-031-013)
- [x] Hard delete após soft delete funciona sem bloqueio por `is_deleted=true` (BUG-031-014)
- [x] Overview — alunos anonimizados ocultos (BUG-031-016)
- [x] Overview — busca server-side + filtro de status funcionando (BUG-031-017)
- [x] SendActivityDialog — campos limpos ao reabrir (BUG-031-018)
- [x] Status "Pendente"/"Atrasada" exibido corretamente (BUG-031-019)
- [x] Aluno estrangeiro — telefone sem máscara BR no formulário (BUG-031-020)
- [x] `hourly_rate` editável sem crash de trigger (BUG-031-021)
- [x] Professores conseguem criar atividades (BUG-031-022)
- [x] Método de pagamento com label legível na tabela financeira (BUG-031-023)
- [x] `npm run type-check` — zero erros (pós code review fixes)
- [x] `npm run test` — 304 testes passando

## References

- Sprint 28: `docs/sprints/sprint-28-testes-manuais.md` — QA que gerou estes bugs
- Sprint 29: `docs/sprints/sprint-29-fix-correcoes-painel-admin.md` — precedente de fixes pós-QA
