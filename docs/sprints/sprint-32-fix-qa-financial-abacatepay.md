# Sprint 32 — Fix: QA Financial, Settings AbacatePay e Checkout

**Período:** 06/06/2026  
**Status:** 🔴 Pendente  
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
- [x] Webhook URL copiada com botão → toast de confirmação
- [x] Clicar "Editar" novamente → campo começa vazio (não mostra ciphertext)
- [x] Remover integração → badge volta para "Não configurado", webhook URL some

### 3. Student Financial (`/student/financial`)

- [ ] Lista cobranças do aluno logado (não vê cobranças de outros alunos)
- [ ] Status de cada cobrança exibido corretamente (pendente / pago / atrasado / abonado / extornado / cancelado)
- [ ] Cobrança `pendente` com `payment_provider='abacate_pay'` → botão "Pagar via PIX" leva para `/checkout/:id`

### 4. Checkout (`/student/financial/checkout/:recordId`)

- [ ] Carrega cobrança específica pelo ID
- [ ] Cobrança AbacatePay: formulário de CPF exibido
- [ ] Cobrança AbacatePay: informar CPF + clicar "Gerar QR Code" → QR Code PIX renderiza
- [ ] Cobrança AbacatePay: segundo acesso com QR ainda válido → mesmo QR retornado (cache)
- [ ] Cobrança AbacatePay: após pagamento real → tela "Pagamento confirmado!" exibida automaticamente (realtime)
- [ ] Cobrança AbacatePay: QR expirado → formulário de CPF exibido novamente
- [ ] Cobrança manual/legada (`payment_provider != 'abacate_pay'`) → mensagem informativa exibida, sem formulário CPF
- [ ] Professor sem API key configurada → mensagem de erro amigável no checkout
- [ ] ID de outro aluno → acesso bloqueado (RLS)

### 5. Toasts de Pagamento (Validação Sprint 29/30)

- [ ] Cancelar cobrança → toast correto
- [ ] Abonar cobrança → toast correto
- [ ] Criar cobrança → "Cobrança criada com sucesso!"
- [ ] Editar cobrança → "Cobrança atualizada com sucesso!"
- [ ] Excluir cobrança → "Cobrança excluída com sucesso!"
- [ ] Reembolso via AbacatePay → "Reembolso PIX processado com sucesso!"
- [ ] Reembolso manual → "Reembolso registrado com sucesso!"
- [ ] Salvar API key → "Configuração salva com sucesso!"
- [ ] Copiar webhook URL → toast de confirmação de cópia

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

---

## References

- Sprint 28: `docs/sprints/sprint-28-testes-manuais.md` — checklist completo de QA
- Sprint 31: `docs/sprints/sprint-31-fix-qa-teachers.md` — fixes anteriores de QA
- Sprint 30: `docs/sprints/sprint-30-abacatepay-integration.md` — implementação AbacatePay
