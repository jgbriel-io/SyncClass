# Sprint 32 — Fix: QA Financial, Settings AbacatePay e Checkout

**Período:** 06/06/2026 – 07/06/2026  
**Status:** 🟡 Em andamento  
**Tipo:** QA Manual + Fix  
**Prioridade:** 🔴 Alta

## Contexto

Continuação da Sprint 28 (QA manual). Sprint 31 cobriu fluxos de teachers/admin. Sprint 32 cobre os fluxos de pagamento end-to-end: ações financeiras do professor (cancelar, abonar, reembolso AbacatePay), configuração AbacatePay em Settings, e o painel financeiro do aluno incluindo o checkout PIX.

**Origem:** `docs/sprints/sprint-28-testes-manuais.md` — itens não testados ou marcados como pendentes.

---

## Escopo

### 1. Teacher Financial (`/teacher/financial`)

- [ ] Cancelar cobrança → status muda para `cancelado`, toast correto
- [ ] Abonar cobrança → status muda para `abonado`, toast correto
- [ ] Cobrança `pago` com `payment_provider='abacate_pay'` → botão "Reembolso" visível
- [ ] Botão "Reembolso" (AbacatePay) → dialog exibe campo motivo + botão "Reembolsar via PIX"
- [ ] Confirmar reembolso AbacatePay → toast "Reembolso PIX processado com sucesso!", status → `extornado`
- [ ] Cobrança com aula vinculada (`attendance != null`) → aviso destrutivo extra exibido no dialog de reembolso
- [ ] Cobrança `pago` sem `payment_provider` (manual/legado) → dialog exibe instrução manual + botão "Confirmar reembolso"
- [ ] Confirmar reembolso manual → toast "Reembolso registrado com sucesso!", status → `extornado`

### 2. Teacher Settings — Pagamentos (`/teacher/settings` ou `/settings`)

- [x] Aba "Pagamentos" exibe badge "Não configurado" sem API key salva
- [x] Campo API key não pré-preenche com ciphertext ao clicar "Configurar" (deve iniciar vazio)
- [x] Salvar API key válida → badge muda para "Configurado", webhook URL exibida
- [x] Webhook exibido em 2 campos separados: URL e Secret, cada um com botão de cópia → toast de confirmação
- [x] Clicar "Editar" novamente → campo começa vazio (não mostra ciphertext)
- [x] Remover integração → badge volta para "Não configurado", webhook URL some

### 3. Student Financial (`/student/financial`)

- [ ] Lista cobranças do aluno logado (não vê cobranças de outros alunos)
- [ ] Status de cada cobrança exibido corretamente (pendente / pago / atrasado / abonado / extornado / cancelado)
- [ ] Cobrança `pendente` com `payment_provider='abacate_pay'` → botão "Pagar via PIX" leva para `/checkout/:id`

### 4. Checkout (`/student/financial/checkout/:recordId`)

- [ ] Carrega cobrança específica pelo ID
- [x] Cobrança AbacatePay: formulário de CPF exibido
- [x] Cobrança AbacatePay: informar CPF + clicar "Gerar QR Code" → QR Code PIX renderiza
- [ ] Cobrança AbacatePay: segundo acesso com QR ainda válido → mesmo QR retornado (cache)
- [x] Cobrança AbacatePay: após pagamento real → tela "Pagamento confirmado!" exibida automaticamente (realtime)
- [ ] Cobrança AbacatePay: QR expirado → formulário de CPF exibido novamente
- [ ] Cobrança manual/legada (`payment_provider != 'abacate_pay'`) → mensagem informativa exibida, sem formulário CPF
- [ ] Professor sem API key configurada → mensagem de erro amigável no checkout
- [ ] ID de outro aluno → acesso bloqueado (RLS)

### 5. Toasts de Pagamento (Validação Sprint 29/30)

- [ ] Cancelar cobrança → toast correto
- [ ] Abonar cobrança → toast correto
- [x] Criar cobrança → "Cobrança criada com sucesso!"
- [ ] Editar cobrança → "Cobrança atualizada com sucesso!"
- ~~Excluir cobrança → removido (ver BUG-032-009)~~
- [ ] Reembolso via AbacatePay → "Reembolso PIX processado com sucesso!"
- [ ] Reembolso manual → "Reembolso registrado com sucesso!"
- [x] Salvar API key → "Configuração salva com sucesso!"
- [x] Copiar webhook URL → toast de confirmação de cópia

---

## Critério de Conclusão

Todos os itens testados. Bugs críticos (🔴) corrigidos antes de marcar ✅. Bugs de severidade menor documentados abaixo com `[BUG-032-XXX]`.

---

## Bugs Encontrados

### [BUG-032-001] Exposição de credenciais AbacatePay na listagem de usuários

- **Rota:** `/admin/users`
- **Severidade:** 🔴 Alta (segurança)
- **Descrição:** `useUsers.ts` e `useUsersPaginated` consultavam `teachers` sem restringir colunas — `abacate_pay_api_key` e `abacate_pay_webhook_secret` trafegavam na resposta da listagem de usuários do admin.
- **Fix:** `src/hooks/useUsers.ts` — select explícito `id, name, email, phone, status` nas duas queries de teachers.
- **Status:** ✅ Corrigido

### [BUG-032-002] `pickAnonSegment` gerava mesmo nome para UUIDs com prefixo idêntico

- **Rota:** Hard delete de aluno/professor
- **Severidade:** 🟡 Média (LGPD — anonimização incorreta)
- **Descrição:** O fallback de `pickAnonSegment` usava `hex.slice(0, 8)`, que colide para UUIDs que diferem apenas nos últimos caracteres (ex.: seeds com prefixo `44444444-0000-...`). Ambos os alunos recebiam o mesmo nome anonimizado.
- **Fix:** `src/lib/utils/anonymize.ts` — fallback alterado para `hex.slice(-8)` (últimos 8 chars são únicos).
- **Status:** ✅ Corrigido

### [BUG-032-003] Crash ao abrir dialog de entrega de atividade

- **Rota:** `/student/activities`
- **Severidade:** 🔴 Alta (funcionalidade bloqueada)
- **Descrição:** `DeliverActivityDialog` referenciava `FILE_TYPES.ACTIVITY_RESPONSE` que não existe em `fileValidation.ts`, causando `TypeError: Cannot read properties of undefined (reading 'accept')` ao renderizar o dialog.
- **Fix:** `src/components/activities/DeliverActivityDialog.tsx` — substituído `ACTIVITY_RESPONSE` por `ACTIVITY_ALL` em 2 locais (input `accept` e `validateFile`).
- **Status:** ✅ Corrigido

### [BUG-032-004] `.single()` lançava 406 ao buscar nome do professor no portal do aluno

- **Rota:** `/student/history`
- **Severidade:** 🟡 Média (erro silencioso no console, nome do professor = "—")
- **Descrição:** `useStudentClassLogs` usava `.single()` ao buscar `teachers_masked` — quando a RLS bloqueava ou o resultado era vazio, o PostgREST retornava 406 em vez de `null`.
- **Fix:** `src/hooks/useStudentPortal.ts` — `.single()` → `.maybeSingle()`.
- **Status:** ✅ Corrigido

### [BUG-032-005] RLS `teachers_select_policy` sem cláusula de aluno

- **Rota:** `/student/activities`, `/student/history`
- **Severidade:** 🔴 Alta (aluno não consegue ver nome do professor nem pix_key para pagamento)
- **Descrição:** A policy `teachers_select_policy` no banco estava definida apenas com `is_admin OR id = get_teacher_id()`. A cláusula que permite ao aluno ver seu próprio professor (`is_student AND teacher_id IN students WHERE id = get_student_id()`) estava ausente — provavelmente sobrescrita por um migration intermediário.
- **Fix:** Migration `73_fix_teachers_select_policy_student_clause.sql` — policy recriada com a cláusula de aluno restaurada.
- **Status:** ✅ Corrigido

### [BUG-032-006] RLS `activities_update_policy` sem cláusula de aluno

- **Rota:** `/student/activities`
- **Severidade:** 🔴 Alta (funcionalidade bloqueada — aluno não consegue entregar atividade)
- **Descrição:** A policy `activities_update_policy` no banco estava definida apenas com `is_admin OR (is_teacher AND ...)`. A cláusula que permite ao aluno atualizar sua própria atividade (`is_student AND student_id = get_student_id()`) estava ausente — mesmo padrão do BUG-032-005. O UPDATE retornava 0 rows, e `.single()` em `useMarkActivityAsDelivered` lançava PGRST116.
- **Fix:** Migration `74_fix_activities_update_policy_student_clause.sql` — policy recriada com USING e WITH CHECK incluindo cláusula de aluno.
- **Status:** ✅ Corrigido

### [BUG-032-007] Função `is_activity_on_time` ausente no banco

- **Rota:** `/student/activities` (entrega de atividade)
- **Severidade:** 🔴 Alta (funcionalidade bloqueada — trigger falha em toda entrega)
- **Descrição:** Migration `25_drop_dead_functions.sql` removeu `is_activity_on_time(TIMESTAMPTZ)`, mas o trigger `validate_activity_submission` (criado em migration posterior) ainda a referencia. Todo UPDATE de entrega lançava `42883: function is_activity_on_time(timestamp with time zone) does not exist`.
- **Fix:** Migration `75_recreate_is_activity_on_time.sql` — função recriada: retorna `true` se `due_date IS NULL OR NOW() <= due_date`.
- **Status:** ✅ Corrigido

### [BUG-032-008] Webhook AbacatePay exibido em campo único com query param embutido

- **Rota:** `/teacher/settings` → aba Pagamentos
- **Severidade:** 🟡 Média (UX confuso — usuário não sabia onde colar cada valor)
- **Descrição:** Settings exibia URL do webhook como `${BASE_URL}/functions/v1/abacate-webhook?webhookSecret=<uuid>`. O painel AbacatePay tem campos separados para URL e Secret — o formato de query param não funciona lá. O botão único de cópia copiava a string inteira incluindo o secret.
- **Fix:** `src/components/layout/SettingsPagamentosTab.tsx` — split em dois campos: `webhookBaseUrl` (sem query param) e `webhookSecret`. Cada campo com label e botão de cópia independente. `src/content/layout.ts` — strings atualizadas (`webhookUrlLabel`, `webhookSecretLabel`, `copyUrlButton`, `copySecretButton`, `webhookHint` reescrito).
- **Status:** ✅ Corrigido

### [BUG-032-009] Botão de excluir cobrança acessível no financeiro do professor

- **Rota:** `/teacher/financial`
- **Severidade:** 🟡 Média (ação indesejada — cobranças não devem ser deletáveis)
- **Descrição:** `FinancialTableRow` expunha item "Excluir" no dropdown de ações. Cobranças são registros contábeis permanentes — exclusão comprometeria histórico financeiro. Apenas cancelamento/reembolso são ações válidas.
- **Fix:** `src/components/financial/FinancialTableRow.tsx` — removido `onDelete` prop, `canDelete` logic, `DropdownMenuItem` de delete e import `Trash2`. `src/components/financial/FinancialView.tsx` — removido `recordToDelete`, `deleteDialogOpen`, `onDelete` prop e `FinancialDeleteDialog`. `src/components/financial/FinancialTableRow.test.tsx` — removido `onDelete: vi.fn()`.
- **Status:** ✅ Corrigido

### [BUG-032-010] Avatar do aluno não exibido na listagem e no sheet lateral

- **Rota:** `/teacher/students`, `/admin/students` (sheet lateral)
- **Severidade:** 🟡 Média (feature incompleta — aluno sobe foto mas ela não aparece)
- **Descrição:** `StudentsTableRow` passava `avatarUrl` como `undefined`. A view `students_with_stats` e `students_masked` não expunham `avatar_url`. Ao adicionar scalar subquery diretamente na view (`SELECT p.avatar_url FROM profiles WHERE student_id = s.id`), o retorno era `NULL` para professores — a RLS de `profiles` (`is_admin() OR user_id = auth.uid()`) bloqueava a consulta. `BaseDetailSheet` não aceitava `avatarUrl` prop.
- **Fix:** Migration `77_add_avatar_url_to_student_views.sql` (tentativa inicial). Migration `78_fix_student_avatar_url_security_definer.sql` — função `get_student_avatar_url(UUID)` com `SECURITY DEFINER` criada; views `students_with_stats` e `students_masked` atualizadas para usá-la. `src/integrations/supabase/types.ts` — `avatar_url` adicionado aos rows de ambas as views. `src/components/students/StudentsTableRow.tsx` — `avatarUrl={student.avatar_url}` adicionado. `src/components/ui/custom/BaseDetailSheet.tsx` — prop `avatarUrl?: string | null` adicionada; header renderiza `<AvatarCircle>` quando presente. `src/components/admin/StudentDetailSheet.tsx` — `avatarUrl={student?.avatar_url ?? null}` adicionado.
- **Status:** ✅ Corrigido

### [BUG-032-011] Avatar do professor não exibido na listagem do admin

- **Rota:** `/admin/teachers`
- **Severidade:** 🟡 Média (feature incompleta — mesmo problema do BUG-032-010)
- **Descrição:** View `teachers_masked` não expunha `avatar_url`. `useTeachers` consultava `teachers` diretamente (sem view), sem campo de avatar. `TeachersTableRow` usava div manual de avatar sem imagem.
- **Fix:** Migration `79_add_avatar_url_to_teachers_masked.sql` — função `get_teacher_avatar_url(UUID)` com `SECURITY DEFINER`; `DROP VIEW IF EXISTS teachers_masked CASCADE` + recriação com coluna `avatar_url` e `GRANT SELECT TO authenticated`. `src/hooks/useTeachers.ts` — `TEACHER_LIST_FIELDS` inclui `avatar_url`; ambas as queries (`fetchTeachers`, `fetchTeachersPaginated`) apontam para `teachers_masked`. `src/components/teachers/TeachersTableRow.tsx` — substituído div manual por `<AvatarCircle name={teacher.name} avatarUrl={teacher.avatar_url} />`.
- **Status:** ✅ Corrigido

### [BUG-032-012] Overflow no menu inferior mobile com 5 ícones

- **Rota:** Layout student mobile (375px)
- **Severidade:** 🟢 Baixa (UX degradada em telas pequenas)
- **Descrição:** Nav bottom com 5 links (`/student/...`) usava `justify-around` com `px-4` — na largura 375px o 5º ícone vazava para fora do container ou ficava cortado.
- **Fix:** `src/components/layout/StudentLayout.tsx` — removido `justify-around` do container; cada link recebeu `flex-1 min-w-0 py-2 text-[10px]` (sem `px-4`); label "Configurações" abreviado para "Config." para evitar quebra de linha.
- **Status:** ✅ Corrigido

### [IMP-032-001] Paginação no histórico do aluno (`StudentHistory`)

- **Rota:** `/student/history`
- **Tipo:** Melhoria
- **Descrição:** Sem paginação, alunos com muitas aulas viam lista interminável nas 3 abas (Aulas, Presença, Média). `PAGE_SIZE=10`, estado independente por aba; filtro/sort reseta para página 1.
- **Fix:** `src/pages/student/StudentHistory.tsx` — adicionados estados `pageAulas`, `pagePresenca`, `pageMedia`; `useEffect` reseta `pageAulas` ao mudar filtro/sort; helper `renderPagination` usa componentes `shadcn/ui Pagination`; cada aba usa slice paginado + controles Prev/X/Next.
- **Status:** ✅ Implementado

---

## References

- Sprint 28: `docs/sprints/sprint-28-testes-manuais.md` — checklist completo de QA
- Sprint 31: `docs/sprints/sprint-31-fix-qa-teachers.md` — fixes anteriores de QA
- Sprint 30: `docs/sprints/sprint-30-abacatepay-integration.md` — implementação AbacatePay
