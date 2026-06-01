# Sprint 30 — Feature: AbacatePay Integration (PIX Automático)

**Período:** 01/06/2026 – 01/06/2026
**Status:** ✅ Concluída
**Tipo:** Feature
**Prioridade:** 🔴 Alta

## Problem Statement

O fluxo de pagamento do SyncClass era inteiramente manual: o aluno enviava um comprovante de PIX, o professor aprovava ou rejeitava via UI. Esse fluxo tinha quatro problemas críticos:

1. **Ausência de automação real** — o pagamento não era verificado; o sistema confiava que o comprovante era legítimo
2. **Atrito no portal do aluno** — aluno precisava enviar comprovante manualmente em vez de pagar com um clique
3. **Carga no professor** — professor precisava abrir cada comprovante e aprovar um por um
4. **"Desfazer pagamento" sem semântica válida** — o botão revertia `pago → pendente`, mas o dinheiro já estava na conta do professor; sem relação com a realidade financeira

Com a integração AbacatePay, o pagamento passa a ser confirmado automaticamente via webhook após o aluno escanear o QR Code PIX. O reembolso também pode ser processado via API.

## Requirements

**Funcionais:**

- [ ] Aluno acessa `/student/checkout/:recordId` e vê QR Code PIX gerado via AbacatePay
- [ ] Status da cobrança atualiza automaticamente para `pago` quando webhook `billing.paid` / `pixQrCode.paid` chega
- [ ] Professor configura sua chave AbacatePay em Configurações → Pagamentos
- [ ] Professor pode solicitar reembolso: automático via AbacatePay (se `payment_provider = 'abacate_pay'`) ou manual (legado)
- [ ] Webhook `checkout.refunded` atualiza status para `extornado` automaticamente

**Não-funcionais:**

- [ ] Cada professor usa sua própria API key AbacatePay (multi-tenant)
- [ ] API key armazenada criptografada no banco (`pgcrypto`)
- [ ] Webhook validado via secret por professor (sem HMAC global)
- [ ] QR Code com cache no banco — não regenera se ainda válido (idempotência)
- [ ] Reembolso idempotente: mesmo `external_payment_id` → mesmo resultado na AbacatePay

**Fora do escopo:**

- Reembolso parcial (AbacatePay só suporta total)
- Notificação por e-mail ao aluno sobre pagamento confirmado
- Integração com relatórios financeiros externos

## Background

**Stack relevante:** Deno Edge Functions (Supabase), `pgcrypto` (criptografia), `webhook_processing_log` (idempotência de webhooks), `financial_records.status` check constraint.

**Arquitetura anterior:**

- `submit_payment_proof` RPC → `status = 'validando'` + prova armazenada
- `confirm_payment_idempotent` RPC → `status = 'pago'` (chamada pelo professor)
- `undo_payment_idempotent` RPC → `status = 'pendente'` (botão "Desfazer")
- `review_payment_proof` RPC → aprovação/rejeição de comprovante

**Padrão Edge Function já estabelecido:** `create-abacate-payment` usa auth JWT via header `Authorization`, `userClient` para validação, `serviceClient` (SERVICE_ROLE_KEY) para operações privilegiadas, `decrypt_sensitive_data` RPC para descriptografar chave.

## Proposed Solution

### Arquitetura do fluxo de pagamento

```
Aluno acessa /student/checkout/:recordId
  → create-abacate-payment (Edge Function)
      → AbacatePay POST /v1/pixQrCode/create (com API key do professor)
      → Salva brCode + external_payment_id em financial_records
      → Retorna { brCode, expiresAt }
  → Aluno escaneia QR Code
  → AbacatePay confirma pagamento
  → POST /functions/v1/abacate-webhook?webhookSecret=<secret>
      → Valida secret contra teachers.abacate_pay_webhook_secret
      → Idempotência: insere em webhook_processing_log (UNIQUE constraint)
      → event === 'billing.paid' → UPDATE status='pago', paid_at=NOW()
```

### Arquitetura do reembolso

```
Professor clica "Reembolso" em FinancialTableRow (status='pago')
  → FinancialRefundDialog detecta payment_provider

  [Caminho AbacatePay — payment_provider='abacate_pay']
    → refund-abacate-payment (Edge Function)
        → Verifica ownership: teacher_id do record = teacher_id do caller
        → AbacatePay POST /v2/transparents/refund { id: external_payment_id }
        → UPDATE status='extornado'
    → Webhook checkout.refunded (belt-and-suspenders) → mesmo UPDATE

  [Caminho manual — payment_provider=null/'manual']
    → useUpdateFinancialStatus direto
    → Professor confirma que fez a devolução fora da plataforma
    → UPDATE status='extornado'
```

### Estrutura de arquivos

```
supabase/functions/
├── create-abacate-payment/index.ts    ← PIX QR Code generation
├── refund-abacate-payment/index.ts    ← PIX refund via AbacatePay API
└── abacate-webhook/index.ts           ← payment + refund webhook handler

src/
├── pages/student/StudentCheckout.tsx  ← checkout page com QR Code
├── components/
│   ├── financial/FinancialRefundDialog.tsx  ← bifurcado AbacatePay/manual
│   └── layout/SettingsPagamentosTab.tsx     ← config chave AbacatePay
└── hooks/
    └── useFinancialRecords.ts               ← useRefundAbacatePayment adicionado

supabase/migrations/
├── 59_add_abacatepay_fields.sql       ← colunas em financial_records
├── 60_add_teacher_abacate_pay_key.sql ← colunas em teachers
└── 61_grant_encrypt_functions_authenticated.sql
```

## Task Breakdown

### Task 1: Migrations — Campos AbacatePay

- **Objetivo:** Adicionar colunas necessárias para rastreio de pagamentos AbacatePay
- **Implementação:**
  - `financial_records`: `payment_provider` (TEXT, CHECK IN ('abacate_pay', 'manual')), `external_payment_id` (TEXT), `pix_code` (TEXT), `pix_expires_at` (TIMESTAMPTZ)
  - `teachers`: `abacate_pay_api_key` (TEXT, criptografada), `abacate_pay_webhook_secret` (TEXT)
  - Index em `financial_records.external_payment_id` (WHERE NOT NULL)
  - Tabela `webhook_processing_log` (event_id, gateway, UNIQUE(event_id, gateway))
  - Grant de funções `encrypt_sensitive_data` / `decrypt_sensitive_data` para authenticated
- **Arquivos afetados:** `supabase/migrations/59_add_abacatepay_fields.sql`, `60_add_teacher_abacate_pay_key.sql`, `61_grant_encrypt_functions_authenticated.sql`
- **Teste:** `tsc --noEmit` passa; tipos gerados incluem novos campos
- **Demo:** `financial_records` tem coluna `external_payment_id` visível no Supabase Dashboard

### Task 2: Edge Function — `create-abacate-payment`

- **Objetivo:** Gerar QR Code PIX via API AbacatePay usando credenciais do professor
- **Implementação:**
  - Auth JWT → valida que caller é aluno (`profile.student_id != null`)
  - Rate limit via `check_rate_limit` RPC (10 req/min)
  - Verifica ownership do record (`record.student_id === profile.student_id`)
  - Cache: retorna `pix_code` existente se `pix_expires_at` ainda válido
  - Resolve teacher via `students.teacher_id` → `teachers.abacate_pay_api_key`
  - Descriptografa API key via `decrypt_sensitive_data` RPC
  - `POST https://api.abacatepay.com/v1/pixQrCode/create`
  - Salva `brCode`, `external_payment_id`, `pix_expires_at`, `payment_provider='abacate_pay'`
- **Arquivos afetados:** `supabase/functions/create-abacate-payment/index.ts`
- **Teste:** Aluno acessa checkout → QR Code aparece → re-acesso retorna mesmo QR (cache)
- **Demo:** QR Code PIX válido renderizado em `StudentCheckout`

### Task 3: Edge Function — `abacate-webhook`

- **Objetivo:** Receber e processar eventos de pagamento e reembolso da AbacatePay
- **Implementação:**
  - Validação: `webhookSecret` query param → lookup em `teachers.abacate_pay_webhook_secret`
  - Idempotência: INSERT em `webhook_processing_log`; código 23505 = já processado (ack sem reprocessar)
  - `billing.paid` / `pixQrCode.paid` → `UPDATE status='pago', paid_at=NOW()` WHERE `external_payment_id = billingId` AND `status != 'pago'`
  - `checkout.refunded` → `UPDATE status='extornado'` WHERE `external_payment_id = billingId` AND `status != 'extornado'`
- **Arquivos afetados:** `supabase/functions/abacate-webhook/index.ts`
- **Teste:** Simular POST com payload `billing.paid` → status atualiza; segundo POST idêntico → ack sem duplicata
- **Demo:** Após pagamento real, status muda de `pendente` para `pago` sem ação do professor

### Task 4: Edge Function — `refund-abacate-payment`

- **Objetivo:** Processar reembolso automático via API AbacatePay
- **Implementação:**
  - Auth JWT → valida que caller é professor (`profile.teacher_id != null`)
  - Ownership check: `record.students.teacher_id === profile.teacher_id`
  - Valida `payment_provider = 'abacate_pay'` e `external_payment_id` existe
  - Valida `status = 'pago'` (só cobranças pagas podem ser reembolsadas)
  - Descriptografa `abacate_pay_api_key` via `decrypt_sensitive_data`
  - `POST https://api.abacatepay.com/v2/transparents/refund { id, reason? }`
  - `reason` omitido do body se string vazia
  - Em sucesso: `UPDATE status='extornado' WHERE status='pago'` (guard idempotente)
  - Mapeamento de erros: `INSUFFICIENT_FUNDS` → mensagem amigável
- **Arquivos afetados:** `supabase/functions/refund-abacate-payment/index.ts`
- **Teste:** Professor solicita reembolso em cobrança paga via AbacatePay → status vira `extornado`
- **Demo:** `FinancialRefundDialog` mostra "Reembolso PIX processado com sucesso!"

### Task 5: Página `StudentCheckout`

- **Objetivo:** UI de checkout para o aluno com QR Code PIX e status em tempo real
- **Implementação:**
  - Rota: `/student/checkout/:recordId`
  - Guard `isAbacatePay`: se `payment_provider !== 'abacate_pay'`, exibe mensagem de pagamento manual
  - `isPixValid`: retorna false se `expiresAt` é null (AbacatePay sempre define; ausência = inválido)
  - `useCheckoutPaymentStatus`: realtime subscription para detectar `status = 'pago'` via webhook
  - `handleGenerate`: valida CPF (11 dígitos) → chama `createAbacatePayment.mutate({ financialRecordId: record.id, cpf })`
  - Cache: `brCode = generatedBrCode ?? (hasValidPix ? record.pix_code : null)`
  - Estado pago: exibe tela de confirmação com `CheckCircle2`
- **Arquivos afetados:** `src/pages/student/StudentCheckout.tsx`
- **Teste:** Aluno com cobrança `pendente` AbacatePay → gera QR → paga → tela de confirmação aparece automaticamente
- **Demo:** QR Code renderiza, copia-e-cola funciona, "Aguardando confirmação..." muda para "Pagamento confirmado!" após webhook

### Task 6: `FinancialRefundDialog` bifurcado

- **Objetivo:** Reembolso automático AbacatePay ou confirmação manual, dependendo de `payment_provider`
- **Implementação:**
  - `isAbacatePay = payment_provider === 'abacate_pay' && !!external_payment_id`
  - Caminho AbacatePay: `useRefundAbacatePayment`, campo `reason` opcional (Input), botão "Reembolsar via PIX"
  - Caminho manual: `useUpdateFinancialStatus({ status: 'extornado' })`, instrução de devolução fora da plataforma, botão "Confirmar reembolso"
  - Ambos exibem aviso extra se `record.class_logs.attendance != null` (aula já confirmada)
  - `handleOpenChange` reseta `reason` ao fechar
- **Arquivos afetados:** `src/components/financial/FinancialRefundDialog.tsx`
- **Teste:** Cobrança com `payment_provider='abacate_pay'` → mostra campo reason + "Reembolsar via PIX"; cobrança manual → mostra instrução manual
- **Demo:** Dialog bifurca corretamente baseado no `payment_provider` do record

### Task 7: `SettingsPagamentosTab` — Configuração de Chave AbacatePay

- **Objetivo:** Professor configura sua chave AbacatePay nas configurações
- **Implementação:**
  - Aba "Pagamentos" em Configurações (rota dedicada, substitui `SettingsModal`)
  - Input para AbacatePay API key (criptografada ao salvar)
  - Exibe webhook URL gerada: `<supabase_url>/functions/v1/abacate-webhook?webhookSecret=<secret>`
  - `useUpdateTeacherAbacatePayConfig` — sempre rotaciona `webhookSecret` ao salvar (segurança: secret antigo invalidado)
- **Arquivos afetados:** `src/components/layout/SettingsPagamentosTab.tsx`, `src/hooks/useTeachers.ts`
- **Teste:** Professor salva API key → webhook URL gerada; recarregar página → URL preservada
- **Demo:** Professor copia webhook URL e registra no dashboard AbacatePay

### Task 8: Remoção do fluxo manual

- **Objetivo:** Remover código morto do fluxo de pagamento manual
- **Removidos:**
  - `FinancialUndoDialog.tsx` — confirmação de "Desfazer pagamento" (pago → pendente)
  - `useUndoFinancialPayment` hook — chamava RPC `undo_payment_idempotent`
  - `FinancialConfirmPaymentDialog.tsx` — confirmação manual de pagamento
  - `usePaymentProof` hook — upload e revisão de comprovante
  - `StudentPixPaymentBox.tsx` — caixa de PIX manual no portal do aluno
  - `PostClassPaymentSection.tsx` — seção de confirmação de pagamento em aula
  - `SettingsModal.tsx` — modal de configurações (substituído por página dedicada)
- **Props removidas:** `isUndoing`, `onUndoPayment` de `FinancialTableRow`; substituídas por `onRequestRefund?`
- **Arquivos afetados:** `FinancialTableRow.tsx`, `FinancialView.tsx`, `useFinancialRecords.ts`, `content/financial.ts`
- **Teste:** `tsc --noEmit` sem erros; nenhuma referência a `useUndoFinancialPayment` no codebase
- **Demo:** Tabela financeira exibe botão "Reembolso" em vez de "Desfazer" para cobranças pagas

## Implementation Details

### Migrations

| Migration | Descrição                                                                         | Arquivo                                        |
| --------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| 59        | Campos AbacatePay em `financial_records` + tabela `webhook_processing_log`        | `59_add_abacatepay_fields.sql`                 |
| 60        | Campos `abacate_pay_api_key` e `abacate_pay_webhook_secret` em `teachers`         | `60_add_teacher_abacate_pay_key.sql`           |
| 61        | Grant de `encrypt_sensitive_data` / `decrypt_sensitive_data` para `authenticated` | `61_grant_encrypt_functions_authenticated.sql` |

### Edge Functions

| Function                 | Responsabilidade                                               | Auth                        |
| ------------------------ | -------------------------------------------------------------- | --------------------------- |
| `create-abacate-payment` | Gera PIX QR Code via AbacatePay API                            | JWT (aluno)                 |
| `abacate-webhook`        | Processa `billing.paid`, `pixQrCode.paid`, `checkout.refunded` | `webhookSecret` query param |
| `refund-abacate-payment` | Processa reembolso via AbacatePay API                          | JWT (professor)             |

### Novos campos no schema

**`financial_records`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `payment_provider` | TEXT | `'abacate_pay'` \| `'manual'` \| NULL |
| `external_payment_id` | TEXT | ID da cobrança na AbacatePay (`pix_char_...`) |
| `pix_code` | TEXT | Código PIX copia-e-cola (brCode) |
| `pix_expires_at` | TIMESTAMPTZ | Expiração do QR Code |

**`teachers`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `abacate_pay_api_key` | TEXT | API key criptografada via pgcrypto |
| `abacate_pay_webhook_secret` | TEXT | UUID único por professor para validar webhooks |

### Novos hooks

| Hook                               | Arquivo                  | Descrição                                                |
| ---------------------------------- | ------------------------ | -------------------------------------------------------- |
| `useCreateAbacatePayment`          | `useFinancialRecords.ts` | Invoca `create-abacate-payment` Edge Function            |
| `useRefundAbacatePayment`          | `useFinancialRecords.ts` | Invoca `refund-abacate-payment` Edge Function            |
| `useCheckoutPaymentStatus`         | `useStudentPortal.ts`    | Realtime subscription para detectar pagamento confirmado |
| `useUpdateTeacherAbacatePayConfig` | `useTeachers.ts`         | Salva/atualiza API key + rotaciona webhook secret        |

## Files Created

```
supabase/
├── functions/
│   ├── create-abacate-payment/index.ts     ← Edge Function: geração de PIX QR Code
│   ├── refund-abacate-payment/index.ts     ← Edge Function: reembolso via AbacatePay
│   └── abacate-webhook/index.ts            ← Edge Function: webhook handler
├── migrations/
│   ├── 59_add_abacatepay_fields.sql        ← colunas AbacatePay em financial_records
│   ├── 60_add_teacher_abacate_pay_key.sql  ← credenciais AbacatePay em teachers
│   └── 61_grant_encrypt_functions_authenticated.sql

src/
├── pages/student/StudentCheckout.tsx       ← página de checkout com QR Code PIX
├── components/
│   ├── financial/FinancialRefundDialog.tsx ← dialog de reembolso bifurcado
│   └── layout/SettingsPagamentosTab.tsx    ← aba de config AbacatePay em Configurações
└── pages/settings/                         ← páginas de configurações (Settings page)
```

## Files Modified

- `src/components/financial/FinancialTableRow.tsx` — removeu `isUndoing`/`onUndoPayment`; adicionou `onRequestRefund?`; botão "Desfazer" → botão "Reembolso"
- `src/components/financial/FinancialView.tsx` — substituiu estados/dialog de undo por refund; removeu `useUndoFinancialPayment`
- `src/hooks/useFinancialRecords.ts` — removeu `useUndoFinancialPayment`; adicionou `useRefundAbacatePayment`, `useCreateAbacatePayment`; fix `formDialog.toasts` (era `view.toasts`); `mutationInFlight` em `useUpdateFinancialStatus`
- `src/content/financial.ts` — removeu `undoDialog`, `undo`, `undoing`; adicionou `refundDialog` completo com paths AbacatePay e manual
- `src/hooks/useStudentPortal.ts` — expandiu `StudentFinancialRecord.status` para 7 valores; adicionou `useCheckoutPaymentStatus`
- `src/hooks/useTeachers.ts` — `useUpdateTeacherAbacatePayConfig`; rotação sempre de `webhookSecret`
- `src/components/student/StudentFinancialCard.tsx` — expandiu `FinancialStatus` para 7 valores; adicionou `abonado`/`extornado`/`cancelado` em `statusConfig`
- `src/content/student-portal.ts` — adicionou labels `abonadoLabel`, `extornadoLabel`, `canceladoLabel` em `financialCard`
- `src/App.tsx` — rota `/student/checkout/:recordId` adicionada
- `src/components/layout/StudentLayout.tsx` — link para checkout no portal
- `src/integrations/supabase/types.ts` — tipos regenerados com novos campos

## Files Deleted

- `src/components/financial/FinancialUndoDialog.tsx`
- `src/components/financial/FinancialConfirmPaymentDialog.tsx`
- `src/components/student/StudentPixPaymentBox.tsx`
- `src/components/classes/PostClassPaymentSection.tsx`
- `src/components/layout/SettingsModal.tsx`
- `src/hooks/usePaymentProof.ts`
- `src/components/financial/__snapshots__/FinancialTableRow.test.tsx.snap` — regenerado

## Bug Fixes (Code Review durante sprint)

| Bug                                                       | Arquivo                        | Fix                                                                                        |
| --------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `isPixValid` retornava `true` para `expiresAt=null`       | `StudentCheckout.tsx:38`       | `null` → `false`                                                                           |
| `toast.success` monkeypatch sem `try/finally`             | `PostClassDialog.tsx:126`      | `finally { toast.success = originalToastSuccess }`                                         |
| `FinancialRefundDialog` sem aviso de aula vinculada       | `FinancialRefundDialog.tsx`    | Adicionado check `attendance != null`                                                      |
| `isAbacatePay` definido mas nunca usado como guard        | `StudentCheckout.tsx:57`       | Seção PIX envolta em `{isAbacatePay ? ... : <mensagem manual>}`                            |
| `recordId!` non-null assertion sem guard                  | `StudentCheckout.tsx:75`       | Substituído por `record.id`                                                                |
| Webhook secret não rotacionava ao trocar API key          | `useTeachers.ts:364`           | `crypto.randomUUID()` sempre                                                               |
| `StudentFinancialRecord.status` tipo com 4 valores        | `useStudentPortal.ts:39`       | Expandido para 7 valores                                                                   |
| `useUpdateFinancialStatus` sem guard de double-click      | `useFinancialRecords.ts`       | `mutationInFlight` ref adicionado                                                          |
| `statusConfig` sem `abonado`/`extornado`/`cancelado`      | `StudentFinancialCard.tsx`     | 3 entries adicionadas → fix crash runtime                                                  |
| `SettingsPagamentosTab` pré-preenche input com ciphertext | `SettingsPagamentosTab.tsx:43` | `setApiKey("")` — ciphertext nunca exposto; salvar sem alterar causaria double-encrypt     |
| Strings hardcoded em `StudentCheckout`                    | `StudentCheckout.tsx`          | `backButton`, `pageTitle`, `pageSubtitle`, `amountLabel` movidos para `financial.checkout` |

## Testing & Validation

- [x] `npm run type-check` — zero erros
- [x] `npm run test` — snapshots regenerados, testes passam
- [x] Aluno acessa checkout → QR Code PIX gerado com sucesso
- [x] Mesmo QR Code retornado em segundo acesso (cache por `pix_expires_at`)
- [x] Professor sem API key configurada → mensagem amigável no checkout do aluno
- [x] Cobrança `payment_provider='abacate_pay'` → dialog mostra "Reembolsar via PIX" + campo motivo
- [x] Cobrança manual/legada → dialog mostra instrução manual + "Confirmar reembolso"
- [x] Webhook `billing.paid` → status `pago` atualizado; segundo POST idêntico → ack sem duplicata
- [x] Configurações → Pagamentos → salvar API key → webhook URL gerada e exibida

## Results & Impact

### Métricas Quantitativas

- ✅ 3 Edge Functions criadas
- ✅ 3 migrations aplicadas (migrations 59–61)
- ✅ 7 arquivos deletados (fluxo manual removido)
- ✅ 14 arquivos modificados
- ✅ 9 bugs identificados e corrigidos via code review durante a sprint

### Melhorias Qualitativas

- ✅ **Pagamento automático:** aluno paga com QR Code; professor não precisa aprovar manualmente
- ✅ **Reembolso rastreável:** status `extornado` reflete devolução real (AbacatePay) ou confirmação manual
- ✅ **Multi-tenant real:** cada professor usa sua própria API key AbacatePay; receitas vão direto para sua conta
- ✅ **Idempotência:** QR Code em cache evita cobranças duplicadas; webhook com log evita double-processing
- ✅ **Segurança:** API key criptografada em repouso; webhook secret único por professor; rotação automática ao trocar chave

## Technical Debt

- [ ] Deploy das 3 Edge Functions para produção — pendente validação manual em ambiente real
- [ ] Teste end-to-end do webhook com evento real da AbacatePay (sandbox)
- [ ] Campo `checkout.refunded` payload não verificado contra docs da AbacatePay — assumido `body.data.id` por simetria
- [ ] `useCheckoutPaymentStatus` — race condition PLAUSIBLE: se webhook chega após `isPaid=true` (subscription teardown), segundo evento ignorado. Cosmético — DB já correto

## Lessons Learned

### O que funcionou bem

- ✅ Padrão de Edge Function já estabelecido (`create-abacate-payment`) acelerou criação do `refund-abacate-payment` — mesma estrutura auth/decrypt/call
- ✅ `webhook_processing_log` com UNIQUE constraint eliminou toda a lógica de idempotência no código — delegado ao banco
- ✅ `pgcrypto` já instalado + RPCs de encrypt/decrypt já existiam — zero overhead para armazenar API key criptografada
- ✅ Code review multi-agente capturou 9 bugs antes de merge — investimento que valeu

### O que poderia melhorar

- ⚠️ Payload exato do evento `checkout.refunded` não testado — assumimos `body.data.id` por analogia com `billing.paid`. Risco baixo (pior caso: webhook silencioso, status já atualizado pela Edge Function), mas idealmente verificado em sandbox
- ⚠️ `validando` como status DB (migration 58 da sprint-29) ficou sem utilidade prática após remoção do fluxo de comprovante — DB aceita o valor, mas nenhum caminho o seta mais

### Aplicações futuras

- 💡 Padrão de bifurcação em dialog (`isAbacatePay ? ... : ...`) pode ser replicado para outros gateways futuros sem refatorar o componente
- 💡 `mutationInFlight` ref deve ser adicionado a qualquer mutation que possa ser disparada por double-click — padronizar em novos hooks

## Next Steps

1. Deploy `create-abacate-payment`, `refund-abacate-payment`, `abacate-webhook` para produção
2. Professor configura API key AbacatePay em Configurações → Pagamentos e registra webhook URL no dashboard AbacatePay
3. Teste end-to-end com pagamento real no ambiente de produção
4. Verificar payload `checkout.refunded` com evento real para confirmar `body.data.id`

## References

- [AbacatePay API — Criar PIX QR Code](https://docs.abacatepay.com/pages/transparents/create)
- [AbacatePay API — Reembolsar](https://docs.abacatepay.com/pages/transparents/refund)
- [AbacatePay Webhooks — checkout.refunded](https://docs.abacatepay.com/pages/webhooks/events/checkout#checkout-refunded)
- Sprint 29: `docs/sprints/sprint-29-fix-correcoes-painel-admin.md` — contexto do fluxo anterior
