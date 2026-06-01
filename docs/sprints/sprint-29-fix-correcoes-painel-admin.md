# Sprint 29 — Fix: Correções do painel admin e propagação entre visões

**Período:** 31/05/2026 – 31/05/2026
**Status:** ✅ Concluída
**Tipo:** Fix
**Prioridade:** 🔴 Alta

## Problem Statement

Testes manuais da Sprint 28 revelaram bugs críticos concentrados no painel admin: fluxos de criação, edição, exclusão e visualização de usuários quebrados. Parte dos bugs bloqueava operações do próprio admin; outra parte impedia que ações feitas pelo admin refletissem corretamente nas visões de professor e aluno. Causas raízes incluíam referências à tabela `user_roles` (dropada na migration 45), funções RLS com corpo incorreto, edge functions com autenticação quebrada e falta de propagação de dados entre camadas (auth → profiles → domain tables).

## Bugs Encontrados e Corrigidos

### BUG-001 — Email de convite quebrando testes

**Rota:** `/admin/students` → criar aluno
**Sintoma:** `invite-user` edge function chamava `inviteUserByEmail` após criar o usuário, disparando email de confirmação Supabase que interferia nos testes.
**Severidade:** 🟡 Média (bloqueava QA, não produção)
**Correção:** Removido bloco `inviteUserByEmail` do edge function. Senha agora exibida em modal na tela após criação (email + senha com toggle de visibilidade).
**Arquivos:**

- `supabase/functions/invite-user/invite-user.ts` — bloco removido
- `src/hooks/useStudentFormSubmit.ts` — novo callback `onCreated(email, password)`
- `src/hooks/useUserInviteMutations.ts` — removed toast; retorna result direto
- `src/hooks/inviteUserService.ts` — parse corrigido: usa `body.password` quando edge function não retorna senha; fix `permissionsWarning: !roleOk` → `false` (variável indefinida)
- `src/components/users/PasswordDisplayDialog.tsx` — prop `email?` adicionada; título dinâmico `"Aluno criado com sucesso!"`
- `src/components/students/StudentsListView.tsx` — estado `generatedEmail`; callback `onCreated` → abre `StudentPasswordDialog` com `source="create"`

---

### BUG-002 — Rate limit bloqueando 100% das chamadas

**Rota:** Qualquer operação via edge function
**Sintoma:** Todas as chamadas aos 3 edge functions retornavam 429 imediatamente.
**Root cause:** `check_rate_limit` RPC usa `auth.uid()` internamente. Quando chamado via `supabaseAdmin` (service role), `auth.uid()` = NULL → função retorna FALSE → bloqueia toda chamada.
**Severidade:** 🔴 Crítica (bloqueava 100% das operações)
**Correção:** Trocado `supabaseAdmin.rpc("check_rate_limit")` → `supabaseAuthed.rpc("check_rate_limit")` em todos os edge functions.
**Arquivos:**

- `supabase/functions/invite-user/invite-user.ts`
- `supabase/functions/reset-password/reset-password.ts`
- `supabase/functions/admin-delete-user/admin-delete-user.ts`

---

### BUG-003 — Aluno criado não conseguia logar

**Rota:** `/login` com aluno recém-criado
**Sintoma:** `"Email não confirmado. Verifique sua caixa de entrada."` ao tentar login.
**Root cause:** `email_confirm: false` no `createUser` do edge function deixava conta não confirmada.
**Severidade:** 🔴 Crítica (aluno criado não conseguia acessar o sistema)
**Correção:** Mudado `email_confirm: false` → `email_confirm: true`.
**Arquivos:**

- `supabase/functions/invite-user/invite-user.ts`

---

### BUG-004 — "Perfil não vinculado" ao logar como aluno

**Rota:** `/student` após login bem-sucedido
**Sintoma:** Tela mostrava `"Perfil não vinculado. Seu usuário ainda não está vinculado a um cadastro de aluno."` mesmo com perfil e `student_id` corretos no banco.
**Root cause:** `get_student_id()` DB function fazia `WHERE id = auth.uid()` — comparava `students.id` (UUID da linha) com `auth.uid()` (UUID do usuário Supabase). Nunca coincidem.
**Severidade:** 🔴 Crítica (portal do aluno inacessível)
**Correção:** Reescrita a função para `SELECT student_id FROM profiles WHERE user_id = auth.uid()`.
**Arquivos:**

- `supabase/migrations/47_fix_get_student_id_lookup_via_profile.sql` — criado
- DB: migration aplicada via MCP

---

### BUG-005 — `"Erro ao verificar permissões."` no reset de senha

**Rota:** Admin → redefinir senha de aluno
**Sintoma:** Edge function `reset-password` retornava erro 500.
**Root cause:** `reset-password.ts` consultava `user_roles` (tabela dropada na migration 45) para verificar role do caller.
**Severidade:** 🔴 Crítica (reset de senha completamente quebrado)
**Correção:** Substituído `from("user_roles")` → `from("profiles")` em `reset-password.ts`. Mesma correção aplicada em `admin-delete-user.ts` (onde `user_roles` aparecia em 2 locais).
**Arquivos:**

- `supabase/functions/reset-password/reset-password.ts`
- `supabase/functions/admin-delete-user/admin-delete-user.ts`

---

### BUG-006 — Rate limit: limite desatualizado (30 → 100)

**Rota:** `/admin/students` → criar aluno
**Sintoma:** Após fix do BUG-002, ainda bloqueava com 30 req/min durante testes intensivos.
**Root cause:** `invite-user` usava `p_max_requests: 30` — apertado para uso em QA.
**Severidade:** 🟡 Média (impacto só em QA, não produção)
**Correção:** `p_max_requests: 30` → `100`.
**Arquivos:**

- `supabase/functions/invite-user/invite-user.ts`

---

## Feature — Admin read-only nas tabelas de aulas, atividades e financeiro

**Contexto:** Decisão de design: admin visualiza dados de todos os professores mas não opera no domínio deles (aulas, atividades, cobranças). Admin cria apenas alunos e professores.

**Mudanças:**

- Botões "Registrar Aula", "Cadastrar Pacote", "Nova Atividade" ocultados na visão admin
- Coluna de ação (Avaliar/Corrigir/Confirmar/Desfazer) oculta nas 3 tabelas quando `isAdmin=true`
- Dropdown de Editar/Excluir oculto nas 3 tabelas quando `isAdmin=true`
- `FinancialView` admin passa `isAdmin={true}` (sem botão "Nova Cobrança" — já não existia)

**Arquivos:**

- `src/components/classes/ClassesView.tsx` — prop `isAdmin`; hide botões header
- `src/components/classes/ClassesTableView.tsx` — prop `isAdmin`; hide `<th>` AVALIAR
- `src/components/classes/ClassesTableRow.tsx` — prop `isAdmin`; hide `<td>` AVALIAR + dropdown
- `src/components/activities/ActivitiesView.tsx` — hide botão + `<th>` AVALIAR
- `src/components/activities/ActivitiesTableRow.tsx` — hide `<td>` AVALIAR + edit/delete dropdown items
- `src/components/financial/FinancialView.tsx` — prop `isAdmin`; hide `<th>` AVALIAR
- `src/components/financial/FinancialTableRow.tsx` — prop `isAdmin`; hide `<td>` AVALIAR + dropdown
- `src/pages/admin/Classes.tsx` — `isAdmin={true}`
- `src/pages/admin/Financial.tsx` — `isAdmin={true}`

### BUG-007 — Phone sem máscara ao editar professor

**Rota:** `/admin/teachers` → editar professor
**Sintoma:** Campo telefone abria com dígitos brutos (ex: `35999999979`) em vez de formatado `(35) 99999-9979`. Não era possível salvar sem redigitar.
**Root cause:** `TeacherFormDialog` passava `teacher.phone` bruto no `reset()` e `defaultValues`. A máscara só era aplicada no `onChange`.
**Severidade:** 🟡 Média (UX quebrada, salvar funcionava se redigitasse)
**Correção:** Aplicado `maskPhone(teacher.phone)` no `defaultValues` e no `reset()` do `useEffect`.
**Arquivos:**

- `src/components/teachers/TeacherFormDialog.tsx`

---

### BUG-008 — `42883: operator does not exist: character varying = uuid` ao arquivar professor

**Rota:** `/admin/teachers` → arquivar professor
**Sintoma:** Erro 500 ao tentar soft delete de professor com auth account vinculada.
**Root cause:** Trigger `invalidate_user_sessions_before` fazia `DELETE FROM auth.refresh_tokens WHERE user_id = NEW.user_id`. `auth.refresh_tokens.user_id` é `character varying`, `NEW.user_id` é `uuid` — sem operador de comparação.
**Severidade:** 🔴 Crítica (impossível arquivar qualquer professor com conta)
**Correção:** Cast explícito: `WHERE user_id = NEW.user_id::text`.
**Arquivos:**

- `supabase/migrations/49_fix_invalidate_sessions_refresh_tokens_cast.sql`

---

### BUG-009 — `sanitize_html()` inexistente bloqueava UPDATE em class_logs

**Sintoma:** Qualquer UPDATE com `feedback`, `title`, `notes` ou `observations` em `class_logs` falhava com `function sanitize_html(text) does not exist`.
**Root cause:** Trigger `sanitize_class_log_text` chamava `sanitize_html()` que foi removida em alguma migration anterior.
**Severidade:** 🔴 Crítica (impossível avaliar ou editar aulas)
**Correção:** Recriada `sanitize_html(text)` usando `regexp_replace` para strip de tags HTML.
**Arquivos:**

- `supabase/migrations/48_fix_sanitize_html_function.sql`

---

### BUG-010 — Hard delete de aluno passava `string` em vez de `{ id: string }`

**Rota:** `/admin/students` → excluir definitivamente
**Sintoma:** `invalid input syntax for type uuid: "undefined"` — `id` era `undefined`.
**Root cause:** `StudentDeleteDialog` chamava `hardDeleteStudent.mutate(student.id, ...)` mas `useHardDeleteStudent.mutationFn` esperava `{ id: string; force?: boolean }`. Destructuring `{ id }` de uma string → `undefined`.
**Severidade:** 🔴 Crítica (hard delete completamente quebrado)
**Correção:** `hardDeleteStudent.mutate({ id: student.id }, ...)`.
**Arquivos:**

- `src/components/students/StudentDeleteDialog.tsx`

---

### BUG-011 — Hard delete de aluno apagava todo o histórico (cascade)

**Rota:** `/admin/students` → excluir definitivamente
**Sintoma:** Hard delete removia `class_logs`, `financial_records` e `activities` do aluno via CASCADE.
**Root cause:** FKs configuradas como `ON DELETE CASCADE`. Hard delete correto deveria preservar histórico por auditoria.
**Severidade:** 🟡 Média (perda de dados de negócio)
**Correção:** Alterado `useHardDeleteStudent` para anonimizar aluno (`is_deleted=true`, dados pessoais zerados) em vez de deletar a linha. Histórico preservado linkado ao aluno anonimizado. Comportamento espelha o soft_delete_teacher.
**Arquivos:**

- `src/hooks/useStudents.ts`

---

### BUG-012 — Coluna "Vínculo" não exibia professor para alunos criados via edge function

**Rota:** `/admin/users` → coluna Vínculo
**Sintoma:** Alunos criados pelo caminho novo (edge function `invite-user`) mostravam só `Aluno: nome` no vínculo — sem o professor vinculado. Alunos criados pelo caminho antigo (`createUserLegacy`) mostravam corretamente `Aluno: nome` + `Professor: nome`.
**Root cause:** Dois problemas em camada:

1. `useUsersPaginated`: buscava professores via `profiles.teacher_id` apenas. Edge function não seta `profiles.teacher_id` para alunos — professor fica só em `students.teacher_id`.
2. `UsersTableRow`: re-fazia o lookup do professor usando `user.profile?.teacher_id` (NULL para novos alunos), ignorando `user.teacher` já resolvido pelo hook.
   **Severidade:** 🟡 Média (dado exibido incorretamente, vínculo existia no banco)
   **Correção:**

- `useUsersPaginated`: após buscar students, coleta `studentTeacherIds = students.map(s => s.teacher_id)`, merge com `profileTeacherIds` antes do fetch de teachers. Fallback no mapeamento: `profile.teacher_id ?? student?.teacher_id`.
- `UsersTableRow`: trocado lookup manual por uso direto de `user.teacher` e `user.student` (já resolvidos pelo hook).
  **Arquivos:**
- `src/hooks/useUsers.ts` — `useUsersPaginated`: coleta + merge de teacher IDs; fallback no lookup
- `src/components/users/UsersTableRow.tsx` — `linkedTeacher`/`linkedStudent` via `user.teacher`/`user.student`

---

## Feature — Hard delete habilitado em `/admin/students` e `/admin/teachers`

**Contexto:** Hard delete existia no código mas estava desabilitado (`showHardDelete={false}`) em ambas as páginas admin. Professores não devem ter acesso — só admin.

**Mudanças:**

- `showHardDelete` adicionado como prop em `StudentsListView` (default `false`)
- Admin Students e Teachers passam `showHardDelete={true}`
- Teacher Students permanece `false`

**Arquivos:**

- `src/components/students/StudentsListView.tsx` — prop `showHardDelete`
- `src/pages/admin/Students.tsx` — `showHardDelete={true}`
- `src/pages/admin/Teachers.tsx` — `showHardDelete={true}`

---

## Edge Functions — Deploys realizados

| Function            | Versão após fixes |
| ------------------- | ----------------- |
| `invite-user`       | v26               |
| `reset-password`    | v9                |
| `admin-delete-user` | v13               |

---

## Testing & Validation

- [x] Type-check passou (`npm run type-check`)
- [x] Criar aluno via admin → modal exibe email + senha
- [x] Login com aluno recém-criado → acesso ao portal `/student`
- [x] Reset de senha via admin → modal exibe nova senha
- [x] Admin não vê botões de ação nas tabelas de aulas/atividades/financeiro
- [x] Editar professor → telefone aparece formatado no modal
- [x] Arquivar professor com auth account → funciona, sessão invalidada
- [x] Hard delete professor → remove da lista, logs preservados (SET NULL)
- [x] Hard delete aluno → anonimiza dados, class_logs/activities/financial mantidos
- [x] Deletar usuário → logout automático confirmado (sessões + refresh_tokens zerados)
- [x] Hard delete aparece em `/admin/students` e `/admin/teachers`, não em `/teacher/students`
- [x] Aluno criado pelo admin via aba Users → aparece na visão do professor logado
- [x] Filtros de status e ordenação em `/admin/classes` funcionam
- [x] Filtros de status em `/admin/activities` funcionam
- [x] Modais de archive/hard delete padronizados nas 3 abas (students/teachers/users)
- [x] Hard delete via `/users` com vínculo student/teacher → anonimiza domain record
- [x] Editar aluno via `/users` → nome propagado para students.name, profiles.full_name, auth.users
- [x] Seletor de professor pré-preenchido ao reabrir edição de aluno via `/users`
- [x] Editar aluno via professor → propaga nome para admin/users e auth.users
- [x] Professor logado vê alunos vinculados corretamente (RLS is_teacher() corrigido)
- [x] Cards de estatísticas na aba Students mostram contagem correta (sem anonimizados)
- [x] Filtro "Anonimizados" aparece apenas para admin, não para professor
- [x] Alunos anonimizados exibem badge vermelho + sem ações (só detalhes)
- [x] Botão "Novo Aluno" oculto quando filtro anonimizados ativo

---

### BUG-013 — Hard delete via `/users` não anonimizava domain records

**Rota:** `/admin/users` → Excluir definitivamente (usuário com vínculo student/teacher)
**Sintoma:** Hard delete de aluno ou professor feito pela aba Users apenas removia auth user + profile, sem anonimizar o registro em `students` ou `teachers`. Histórico perdia a referência pessoal nominal.
**Root cause:** `DeleteUserDialog.handleConfirm` sempre chamava `hardDeleteUser` (remove auth+profile) independente de `linkedStudent`/`linkedTeacher`. Não roteava para `useHardDeleteStudent`/`useHardDeleteTeacher` que executam a anonimização.
**Severidade:** 🔴 Alta (comportamento inconsistente entre abas — dados não anonimizados)
**Correção:** `DeleteUserDialog` agora roteia: se `linkedStudent` → `hardDeleteStudent`; se `linkedTeacher` → `hardDeleteTeacher`; sem vínculo → `hardDeleteUser`. Comportamento alinhado com `/students` e `/teachers`.
**Arquivos:**

- `src/components/users/DeleteUserDialog.tsx` — routing corrigido no branch hard delete

---

### BUG-014 — Editar nome via `/users` não propagava para `students.name` / `teachers.name`

**Rota:** `/admin/users` → editar usuário → alterar nome
**Sintoma:** Renomear aluno ou professor pela aba Users atualizava `profiles.full_name` (visível na aba Users) mas não sincronizava `students.name` / `teachers.name`. Aba `/students` e visão do professor continuavam exibindo o nome antigo.
**Root cause:** `handleCreateOrUpdate` em `Users.tsx` no branch de edição chamava apenas `updateProfile.mutate(fullName)` + `updateRole.mutate(role)`. O `studentData`/`teacherData` recebido do form era ignorado.
**Severidade:** 🟡 Média (dado inconsistente entre tabelas; não bloqueia fluxo)
**Correção:** Após `updateRole.onSuccess`, verifica `data.role`:

- `"student"` + `student_id` → `updateStudent.mutate({ id, ...studentData })`
- `"teacher"` + `teacher_id` → `updateTeacher.mutate({ id, ...teacherData })` (já sincroniza profile internamente)
- `"admin"` → fecha form normalmente
  **Arquivos:**
- `src/pages/admin/Users.tsx` — `handleCreateOrUpdate` edit branch

---

### BUG-015 — Seletor de professor vazio ao editar aluno via `/users`

**Rota:** `/admin/users` → editar usuário aluno
**Sintoma:** Ao abrir o formulário de edição de um aluno, o seletor de professor aparecia em branco — o professor vinculado não era pré-selecionado. Se o admin salvasse sem reparar, o `teacher_id` seria sobrescrito (formulário bloqueava o submit com erro de validação, mas a UX estava quebrada).
**Root cause:** O `useEffect` de reset do `UserFormDialog` para o caso `userRole === "student"` não chamava `setSelectedTeacherId`. O estado `selectedTeacherId` permanecia `""` (valor inicial) mesmo com `user.student.teacher_id` disponível.
**Severidade:** 🟡 Média (UX quebrada; submit bloqueado por validação, mas causava confusão)
**Correção:** Adicionado `setSelectedTeacherId(s.teacher_id || "")` no bloco de reset do student edit.
**Arquivos:**

- `src/components/users/UserFormDialog.tsx` — `useEffect` edit reset, bloco student

---

### BUG-016 — `is_teacher()` com query incorreta + `get_teacher_id()` sem cast `::text`

**Rota:** `/teacher/students` — professor logado não via nenhum aluno
**Sintoma:** Professor vê lista com 0 alunos. Rede confirmou: query correta (`teacher_id=eq.<uuid>`), status 200, response `[]`.
**Root cause (2 camadas):**

**Camada 1** — `get_teacher_id()` (migration 04) usava `WHERE user_id = auth.uid()` sem cast. Quando `profiles.user_id` é `varchar/text` e `auth.uid()` retorna `uuid`, a comparação falha → função retorna `NULL`. RLS: `teacher_id = NULL` → sempre falso. Corrigido na migration 51.

**Camada 2 (raiz do problema)** — `is_teacher()` no banco tinha o corpo: `SELECT EXISTS(SELECT 1 FROM teachers WHERE id = auth.uid())`. Compara `teachers.id` (UUID do registro de domínio) com `auth.uid()` (UUID do auth user) — **nunca coincidem**. `is_teacher()` sempre retornava `false` → RLS bloqueava 100% das rows para qualquer professor. Versão errada sobreviveu às migrations sem ser sobrescrita. Adicionalmente, `is_admin()` também usava `WHERE user_id = auth.uid()` sem cast.

**Severidade:** 🔴 Crítica (portal do professor 100% quebrado — 0 alunos, 0 aulas, 0 financeiro)
**Diagnóstico:** Simulação `set_config('request.jwt.claims', ...)` + chamada direta às funções confirmou `is_teacher() = false` mesmo com profile correto no banco.
**Correção:**

- `is_teacher()` reescrita: `SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id::text = auth.uid()::text AND role = 'teacher')`
- `is_admin()` reescrita: mesmo padrão com `::text` cast
- `get_teacher_id()` + `get_student_id()` corrigidos: `::text` cast (migration 51)

**Arquivos:**

- `supabase/migrations/51_fix_get_teacher_id_and_get_student_id_text_cast.sql`
- `supabase/migrations/52_fix_is_teacher_is_admin_correct_profiles_lookup.sql` — aplicado via MCP

---

### BUG-017 — Editar nome do aluno pelo professor não sincronizava `profiles.full_name` nem `auth.users`

**Rota:** `/teacher/students` → editar aluno → alterar nome
**Sintoma:** Professor edita nome do aluno; `students.name` atualiza (visível na aba Students do admin e na visão do professor), mas aba `/admin/users` continuava exibindo o nome antigo mesmo após page refresh. `auth.users.raw_user_meta_data.full_name` também ficava desatualizado.
**Root cause (2 camadas):**

1. `profiles_select_policy`: `is_admin() OR user_id = auth.uid()` — professor só lê o próprio profile. `syncStudentProfiles()` faz `SELECT profiles WHERE student_id = ?` → retorna vazio para o professor → pula o `UPDATE profiles`.
2. `update_profile_by_id` RPC: bloca explicitamente não-admins com `RAISE EXCEPTION 'Apenas administradores podem atualizar profiles'` — mesmo que encontrasse o profile, a atualização seria bloqueada.
   **Severidade:** 🟡 Média (dado inconsistente entre tabelas; não bloqueia fluxo, mas confunde admin)
   **Correção:** Nova RPC `teacher_sync_student_display_name(p_student_id, p_name)`:

- `SECURITY DEFINER` → bypassa RLS de `profiles`
- Valida que o aluno pertence ao professor chamador (ou que o caller é admin)
- Atualiza `profiles.full_name` + `auth.users.raw_user_meta_data.full_name` atomicamente
- Chamada de `useUpdateStudent` após `syncStudentProfiles` quando `name` está presente no update

**Bonus coberto pelo mesmo fix:** `auth.users` metadata também era desatualizado no fluxo admin→edit-via-users. Resolvido separadamente com `admin_update_auth_display_name` RPC chamada de `useUpdateUserProfile` (migration 53).

**Arquivos:**

- `supabase/migrations/53_add_admin_update_auth_display_name_rpc.sql` — RPC para fluxo admin
- `supabase/migrations/54_add_teacher_sync_student_display_name_rpc.sql` — RPC para fluxo professor
- `src/hooks/useUserProfileMutations.ts` — `useUpdateUserProfile`: chama migration 53 RPC após update de profile
- `src/hooks/useStudents.ts` — `useUpdateStudent`: chama migration 54 RPC quando `name` é atualizado

---

## Refactor — Shared dialog components para archive/hard delete

**Contexto:** Cada aba (`/students`, `/teachers`, `/users`) tinha componentes de modal independentes com UI duplicada. Estrutura inconsistente dificultava manutenção e causava divergências visuais.

**Mudanças:**

- Criados 2 primitivos compartilhados em `src/components/ui/`:
  - `ConfirmArchiveDialog` — archive/reactivate genérico; aceita `title`, `description`, `confirmLabel`, `loadingLabel`, `onConfirm`, `variant` (`"destructive"` | `"default"`)
  - `ConfirmHardDeleteDialog` — hard delete genérico; aceita os campos acima + `warningLabel?`, `warning?`; título sempre `text-destructive`
- `StudentDeleteDialog` refatorado: `StudentArchiveDialog` e `StudentHardDeleteDialog` agora são thin wrappers que delegam UI aos shared components
- `TeacherStatusDialog` refatorado: usa `ConfirmArchiveDialog`
- `TeacherHardDeleteDialog` refatorado: usa `ConfirmHardDeleteDialog`; lógica two-step (aulas agendadas) permanece no componente domain
- `DeleteUserDialog` refatorado: usa shared components + fix BUG-013; três branches separados (reactivate, hard delete, archive) em vez de switch condicional único
- Reactivate passou a usar `variant="default"` (botão neutro) em vez de `bg-destructive` — alinhado com UX correta para ação não destrutiva

**Arquivos:**

- `src/components/ui/ConfirmArchiveDialog.tsx` — criado
- `src/components/ui/ConfirmHardDeleteDialog.tsx` — criado
- `src/components/students/StudentDeleteDialog.tsx` — refatorado
- `src/components/teachers/TeacherStatusDialog.tsx` — refatorado
- `src/components/teachers/TeacherHardDeleteDialog.tsx` — refatorado
- `src/components/users/DeleteUserDialog.tsx` — refatorado + BUG-013

---

---

### BUG-018 — `useStudentsStats` contabilizava alunos anonimizados como inativos

**Rota:** `/admin/students` → cards de estatísticas
**Sintoma:** Card "Inativos" exibia 11 alunos quando não havia nenhum inativo real — contagem incluía alunos anonimizados (`is_deleted = true`).
**Root cause:** `useStudentsStats` consultava `students` sem filtro `is_deleted = false`.
**Severidade:** 🟡 Média (dado incorreto no card de métricas)
**Correção:** Adicionado `.eq("is_deleted", false)` na query de `useStudentsStats`.
**Arquivos:**

- `src/hooks/useStudentsStats.ts`

---

## Feature — Filtro "Anonimizados" na aba `/admin/students`

**Contexto:** Alunos que passaram por hard delete têm `is_deleted = true` com dados pessoais zerados, mas histórico (aulas, cobranças, atividades) preservado. Não apareciam em nenhuma view — admin não tinha forma de auditar registros anonimizados.

**Comportamento:**

- Opção "Anonimizados" adicionada ao select de status em `/admin/students`
- Exclusivo do admin (`showAnonymizedFilter={true}` via prop — professor não vê a opção)
- Quando ativo: query usa `is_deleted = true` em vez de `false`; filtro de status não aplicado
- Rows mostram badge "Anonimizado" (vermelho) em vez de Ativo/Inativo
- Dropdown de ações removido — apenas botão de detalhes disponível
- Botão "Novo Aluno" oculto enquanto filtro anonimizados está ativo

**Arquivos:**

- `src/hooks/useStudents.ts` — `StudentsListFilters.status` + lógica `is_deleted` flip em `useStudentsPaginated`
- `src/components/filters/StudentsFilters.tsx` — tipo `StudentStatusFilter` + prop `showAnonymizedFilter` + SelectItem
- `src/components/students/StudentsTableRow.tsx` — prop `isAnonymized`: badge + sem dropdown
- `src/components/students/StudentsListView.tsx` — prop `showAnonymizedFilter`; repassa; oculta "Novo Aluno"
- `src/pages/admin/Students.tsx` — `showAnonymizedFilter={true}`

---

---

## Refactor — Correções pós code review

**Contexto:** Code review identificou 6 problemas nos arquivos modificados da sprint.

**Correções:**

1. **Strings hardcoded** — `"Anonimizado"`, `"Anonimizados"` e 2 toast warnings do hard delete estavam hardcoded em componente e hook. Movidos para `src/content/students.ts` (`table.statusAnonymized`, `table.filterAnonymized`, `deleteDialog.toasts.warnProfileNotDeleted`, `deleteDialog.toasts.warnAccountNotDeleted`).

2. **`DeleteUserDialog` comentário enganoso** — `isTeacherActive = true; // teachers have no status field here` contradiz o `updateTeacher.mutate({ status: "ativo" })` na linha 141. Comentário reescrito para explicar que `linkedTeacher` só carrega `{id, name}` e a checagem de status é delegada ao domain hook.

3. **`useUsers.ts` teachers sem filtro `is_deleted`** — query de teachers para a coluna Vínculo não filtrava `is_deleted = false`, fazendo professores anonimizados aparecerem no vínculo. Adicionado `.eq("is_deleted", false)`.

4. **`ConfirmHardDeleteDialog` título sempre vermelho** — prop `titleClassName` adicionada (default `"text-destructive"`). Callers que usam o componente para confirmações não-destrutivas (ex: step de aulas agendadas) podem sobrescrever.

**Arquivos:**

- `src/content/students.ts` — 4 novas strings
- `src/hooks/useStudents.ts` — import content + usa strings do content
- `src/components/filters/StudentsFilters.tsx` — import content + usa string
- `src/components/students/StudentsTableRow.tsx` — usa string do content
- `src/components/users/DeleteUserDialog.tsx` — comentário corrigido
- `src/hooks/useUsers.ts` — `.eq("is_deleted", false)` na query de teachers
- `src/components/ui/ConfirmHardDeleteDialog.tsx` — prop `titleClassName`

---

---

### BUG-019 — `useUpdateTeacher` chamava `upsert_user_role_safe` (tabela dropada) — nome e email não sincronizavam com `auth.users`

**Rota:** `/admin/users` → editar professor → alterar nome ou email
**Sintoma:** Editar nome/email de professor via aba Users atualizava `teachers.name`, `profiles.full_name` e `profiles.email`, mas `auth.users.raw_user_meta_data.full_name` e `auth.users.email` ficavam com valores antigos.
**Root cause:** `useUpdateTeacher` chamava `upsert_user_role_safe` no loop de profiles para cada `user_id` vinculado. Essa RPC fazia INSERT em `user_roles` (tabela dropada na migration 45) → erro silenciado por ausência de `throw` após o `roleError` — na prática a RPC falhava mas o flow continuava sem chamar `admin_update_auth_display_name`. Resultado: `auth.users` nunca atualizado.
**Severidade:** 🟡 Média (dado inconsistente no painel Supabase Auth; login/sessão não afetados)
**Correção:** Substituído bloco `upsert_user_role_safe` por chamadas diretas:

- `admin_update_auth_display_name` quando `fullName` presente
- `admin_update_auth_email` (migration 56, nova) quando `normalizedEmail` presente

**Arquivos:**

- `src/hooks/useTeachers.ts` — loop de profiles: substituição de `upsert_user_role_safe`
- `supabase/migrations/56_add_admin_update_auth_email_rpc.sql` — nova RPC

---

## Feature — RPC `admin_update_auth_email` (migration 56)

**Contexto:** Não existia RPC para atualizar `auth.users.email` com permissão de admin. `admin_update_auth_display_name` (migration 53) só cobria `full_name`. Necessário para sincronizar email quando admin edita professor.

**Comportamento:**

- `SECURITY DEFINER` (acessa `auth.users` diretamente)
- Requer `is_admin()` — lança exceção se não for admin
- Atualiza `auth.users.email` + seta `email_confirmed_at = NOW()` (evita re-confirmação desnecessária)

**Assinatura:**

```sql
admin_update_auth_email(p_user_id UUID, p_email TEXT) RETURNS void
```

**Arquivos:**

- `supabase/migrations/56_add_admin_update_auth_email_rpc.sql` — criado e aplicado

---

## Fix — Padrão alfanumérico no nome de anonimização

**Contexto:** `id.slice(0, 8)` do UUID podia gerar segmentos all-digits (ex: `"02818510"`) quando o primeiro octeto não continha letras hex (`a-f`). Visualmente indistinguível de um ID numérico.

**Correção:** Scan do UUID (stripped de hifens) para encontrar o primeiro window de 8 chars com pelo menos uma letra (`a-f`) e pelo menos um dígito (`0-9`). UUID v4 sempre tem esse window.

```ts
const hex = id.replace(/-/g, "");
let segment = hex.slice(0, 8);
for (let i = 0; i <= hex.length - 8; i++) {
  const s = hex.slice(i, i + 8);
  if (/[a-f]/.test(s) && /[0-9]/.test(s)) {
    segment = s;
    break;
  }
}
```

**Migration 55** faz backfill nos registros já anonimizados (`is_deleted = true`) em `students` e `teachers`.

**Arquivos:**

- `src/hooks/useStudents.ts` — `useHardDeleteStudent`: segment scan
- `src/hooks/useTeachers.ts` — `useHardDeleteTeacher`: segment scan
- `supabase/migrations/55_fix_anonymized_names_alphanumeric.sql` — backfill

---

## Feature — Nome e email read-only para professor em Configurações

**Contexto:** `SettingsPerfilTab` exibia campo Editar para nome e email para todos os roles. Professor editando o próprio nome via settings não sincronizava `teachers.name` (hook `useUpdateProfileName` atualiza só `profiles.full_name` + `auth.users`). Decisão: nome e email de professor são atributos gerenciados pelo admin.

**Comportamento:**

- `isTeacher = true` → campo Nome e campo Email ficam read-only (sem botão Editar)
- Professor ainda pode editar: avatar, chave Pix, exportar dados (LGPD)
- Alunos e admin mantêm comportamento original (Editar habilitado)

**Arquivos:**

- `src/components/layout/SettingsPerfilTab.tsx` — `!isTeacher` guard nos blocos Nome e Email

---

---

### BUG-020 — `upsert_user_role_safe` remanescente em 3 hooks adicionais

**Rotas afetadas:**

- `/admin/users` → alterar role de usuário (`useUpdateUserRole`)
- `/admin/users` → vincular usuário a aluno (`useLinkUserToStudent`)
- `/admin/users` → vincular usuário a professor (`useLinkUserToTeacher`)

**Sintoma:** Operações acima retornavam erro 500 silencioso ou toast de erro genérico por causa da RPC `upsert_user_role_safe` que fazia INSERT em `user_roles` (dropada na migration 45).

**Root cause:** Mesma causa raiz do BUG-019 — `upsert_user_role_safe` não foi removida de todos os hooks quando `user_roles` foi dropada. `useUpdateUserRole` lançava o erro antes do `profiles.role` update (bloqueante). `useLinkUserToStudent` e `useLinkUserToTeacher` lançavam após o `profiles` update já ter ocorrido (partial failure).

**Correção:**

- `useUpdateUserRole`: removido bloco `upsert_user_role_safe` — `profiles.role` update direto é suficiente
- `useLinkUserToStudent` / `useLinkUserToTeacher`: removido `upsert_user_role_safe` + fetch de `profile` que era usado exclusivamente para alimentar os parâmetros da RPC morta

**Adicionalmente:** `syncStudentProfiles` (`useStudents.ts`) também chamava `upsert_user_role_safe` — removido no mesmo fix. Corrigido `p_teacher_id: null` hardcoded → `student.teacher_id ?? null` no `update_profile_by_id` call.

**Arquivos:**

- `src/hooks/useUserProfileMutations.ts` — `useUpdateUserRole`: remove `upsert_user_role_safe`
- `src/hooks/useUserLinkMutations.ts` — `useLinkUserToStudent`, `useLinkUserToTeacher`: remove `upsert_user_role_safe` + profile fetch
- `src/hooks/useStudents.ts` — `syncStudentProfiles`: remove `upsert_user_role_safe`; fix `p_teacher_id`

---

---

## Fix — `validando` promovido a status real no DB (migration 58)

**Contexto:** `financial_records.status` não permitia `validando` — o estado "comprovante enviado, aguardando confirmação" era derivado no front via `payment_proof_status === 'pending'`. Isso criava inconsistência: `aguardando_confirmacao` em `useStudentPortal`, `validando` em `financialStatus.ts`, e nenhum armazenado no DB. Filtros e queries não conseguiam consultar cobranças nesse estado diretamente.

**Causa raiz:** Check constraint `financial_records_status_check` (e `check_valid_financial_logic`) só permitia `pendente`, `pago`, `cancelado`, `abonado`, `extornado`. `validando` era apenas uma string de retorno da função `getFinancialActualStatus`.

**Correção:**

1. **Migration 58** — `financial_records_status_check` e `check_valid_financial_logic` atualizados para incluir `validando`
2. **`submit_payment_proof` RPC** — agora seta `status = 'validando'` atomicamente ao registrar comprovante (antes só setava `payment_proof_status = 'pending'`)
3. **`getFinancialActualStatus`** — simplificado: lê `status === 'validando'` direto do DB; parâmetro `payment_proof_status` removido da assinatura
4. **`useStudentPortal`** — tipo `"aguardando_confirmacao"` renomeado para `"validando"`
5. **Helpers de status em classes view** — `getPaymentStatusVariant` e `getPaymentStatusLabel` atualizados com case `"validando"` em:
   - `classesViewHelpers.ts`
   - `ClassDetailSheet.tsx` (local duplicate)
   - `ClassLogRow.tsx` (local duplicate)
6. **`ClassesTableRow`** — parâmetro morto `payment_proof_status` removido das chamadas a `getFinancialActualStatus`

**Fluxo após fix:** `pendente → validando (proof upload) → pago (aprovado) | pendente (rejeitado)`

**Arquivos:**

- `supabase/migrations/58_financial_validando_status.sql` — constraints + RPC atualizada + backfill
- `src/lib/utils/financialStatus.ts` — `getFinancialActualStatus` simplificado
- `src/hooks/useStudentPortal.ts` — tipo `"aguardando_confirmacao"` → `"validando"`
- `src/components/classes/classesViewHelpers.ts` — case `validando` adicionado
- `src/components/classes/ClassDetailSheet.tsx` — case `validando` adicionado
- `src/components/classes/ClassLogRow.tsx` — case `validando` adicionado
- `src/components/classes/ClassesTableRow.tsx` — parâmetro morto removido

---

---

## Refactor — Centralização de strings de toast em `src/content/`

**Contexto:** Auditoria de toasts revelou 12 hooks com strings hardcoded e `useProfiles.ts` usando `use-toast` do shadcn em vez do `sonner` (padrão do projeto). Strings duplicadas entre hooks e `src/content/` criavam fonte dupla de verdade.

**Mudanças:**

- `useProfiles.ts` — migrado de `import { toast } from "@/hooks/use-toast"` → `import { toast } from "sonner"`. Chamadas `toast({ title, description, variant })` convertidas para `toast.success/error()`.
- `useActivities.ts` — usa `activitiesContent.{sendDialog,editDialog,correctionDialog,deleteDialog}.toasts.success`
- `useFinancialRecords.ts` — usa `financialContent.{view,confirmPaymentDialog,undoDialog,deleteDialog}.toasts.{success,successEdit}`
- `useClassLogs.ts` — usa `classesContent.logFormDialog.toasts.{success,successWithPayment,successEdit,successDelete}` (2 novas strings adicionadas)
- `useStudents.ts` — usa `studentsContent.toasts.*` (nova seção adicionada: `created`, `updated`, `archived`, `deleted`, `restored`, `payDayUpdated`)
- `useTeachers.ts` — usa `teachersContent.toasts.*` (nova seção adicionada: `created`, `updated`, `archived`, `pixUpdated`, `deleted`)
- `useUserProfileMutations.ts` — usa `layout.settings.profile.toasts.*` + `usersContent.form.toasts.successEdit` (`avatarSuccess` adicionado ao layout)
- `useUserAuthMutations.ts` — usa `usersContent.{form,resetPasswordDialog}.toasts.*` (`successForUser` adicionado)
- `useUserInviteMutations.ts` — usa `usersContent.form.toasts.successTeacherInvite` (adicionado)

**Content files alterados:** `students.ts`, `teachers.ts`, `classes.ts`, `financial.ts`, `layout.ts`, `users.ts`

**Regra estabelecida:** Todo `toast.success/error` em hooks deve referenciar `src/content/`. Nunca hardcode string de toast em hook.

---

## Bugs Pendentes

Nenhum.
