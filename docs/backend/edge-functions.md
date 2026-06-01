# Edge Functions

Edge Functions Deno/TS para operações server-side. Rodam em runtime isolado com acesso a service role key.

## Índice

- [Quando usar](#quando-usar)
- [Estrutura](#estrutura)
- [invite-user](#invite-user)
- [admin-delete-user](#admin-delete-user)
- [reset-password](#reset-password)
- [export-user-data](#export-user-data)
- [cleanup-old-records](#cleanup-old-records)
- [cleanup-storage](#cleanup-storage)
- [create-abacate-payment](#create-abacate-payment)
- [refund-abacate-payment](#refund-abacate-payment)
- [abacate-webhook](#abacate-webhook)
- [Deploy](#deploy)
- [Ver também](#ver-também)

## Quando usar

**Use Edge Function quando:**

- Precisa de service role key (criar usuário, deletar, admin ops)
- Lógica server-side (validação complexa, rollback atômico)
- Operações periódicas (cleanup, cron jobs)
- Integrações externas (webhooks, APIs terceiras)

**Não use quando:**

- Query simples (usar PostgREST direto)
- Lógica que pode ser RPC (preferir RPC — mais rápido)
- Operação que frontend pode fazer com anon key

## Estrutura

```
supabase/functions/
├── invite-user/
│   ├── index.ts              ← entry point (import de invite-user.ts)
│   └── invite-user.ts        ← implementação
├── admin-delete-user/
│   ├── index.ts
│   └── admin-delete-user.ts
├── reset-password/
│   ├── index.ts
│   └── reset-password.ts
├── export-user-data/
│   └── index.ts
├── cleanup-old-records/
│   └── index.ts
├── cleanup-storage/
│   └── index.ts
├── create-abacate-payment/
│   └── index.ts              ← geração de PIX QR Code via AbacatePay
├── refund-abacate-payment/
│   └── index.ts              ← reembolso automático via AbacatePay
├── abacate-webhook/
│   └── index.ts              ← webhook handler (billing.paid, checkout.refunded)
└── _shared/                  ← utilitários compartilhados
```

**Padrão:** Entry point `index.ts` importa implementação de arquivo separado (facilita testes).
**Padrão AbacatePay:** Auth JWT via `Authorization` header → `userClient.auth.getUser()` → operações privilegiadas via `serviceClient` (SERVICE_ROLE_KEY) → `decrypt_sensitive_data` RPC para descriptografar API key do professor.

## invite-user

**Responsabilidade:** Criação atômica de usuário (auth + profiles + student/teacher) com rollback em caso de erro.

**Arquivo:** `supabase/functions/invite-user/invite-user.ts`

**Fluxo:**

1. Valida role (admin, teacher, student)
2. Gera senha temporária (8 chars alfanuméricos)
3. Cria auth user via `supabaseAdmin.auth.admin.createUser()` — `email_confirm: true` (sem envio de email)
4. Aguarda profile ser criado (trigger automático)
5. Cria student/teacher se role = student/teacher
6. Vincula student_id/teacher_id no profile
7. Retorna `{ userId, email, password }` — senha exibida em modal no frontend (não enviada por email)

**Rollback:** Se qualquer passo falha, deleta auth user criado.

**Rate limiting:** 100 req/min via `check_rate_limit('invite_user', 100, 1)` (aumentado de 20 na sprint 29 para suportar QA intensivo)

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke("invite-user", {
  body: {
    email: "user@example.com",
    fullName: "João Silva",
    role: "student",
    teacherId: "uuid-do-professor", // se role = student
  },
});
```

**Response:**

```ts
{
  userId: 'uuid',
  email: 'user@example.com',
  password: 'Abc12345',
  studentId?: 'uuid',    // se role = student
  teacherId?: 'uuid',    // se role = teacher
}
```

**Bug conhecido:** BACK-001 — race condition na verificação de duplicidade de email. Ver [bugs.md](./bugs.md).

## admin-delete-user

**Responsabilidade:** Deleção hard de usuário (auth + cascade de registros) com invalidação de sessões.

**Arquivo:** `supabase/functions/admin-delete-user/admin-delete-user.ts`

**Fluxo:**

1. Verifica que caller é admin
2. Verifica que usuário está inativo (active=false)
3. Invalida todas as sessões do usuário
4. Deleta student/teacher vinculado (se existir)
5. Deleta auth user (cascade remove profile — user_roles foi removida na migration 45)

**Rate limiting:** 20 req/min via `check_rate_limit('admin_delete_user', 20, 1)`

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke("admin-delete-user", {
  body: { userId: "uuid-do-usuario" },
});
```

**Validações:**

- Usuário deve estar inativo (active=false)
- Se student/teacher ainda existe, bloqueia (deve arquivar antes)
- Caller deve ser admin

**Tolerância a falhas:** Se auth user já foi deletado (404), limpa registros do banco e retorna sucesso.

## reset-password

**Responsabilidade:** Reset de senha via service_role (admin ou self-service).

**Arquivo:** `supabase/functions/reset-password/reset-password.ts`

**Fluxo:**

1. Gera nova senha temporária (8 chars)
2. Atualiza senha via `supabaseAdmin.auth.admin.updateUserById()`
3. Marca `must_change_password=true` no profile
4. Retorna nova senha

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke("reset-password", {
  body: { userId: "uuid-do-usuario" },
});
```

**Response:**

```ts
{
  password: "Abc12345";
}
```

**Uso:**

- Admin reseta senha de qualquer usuário
- Professor reseta senha de aluno vinculado
- Usuário reseta própria senha (self-service)

## export-user-data

**Responsabilidade:** Exportação de todos os dados pessoais do usuário (conformidade LGPD).

**Arquivo:** `supabase/functions/export-user-data/index.ts`

**Fluxo:**

1. Valida identidade do solicitante (self ou admin)
2. Busca dados via service_role: profile, alunos, aulas, cobranças, atividades
3. Retorna JSON estruturado com todos os dados do usuário

**Rate limiting:** Limitado por autenticação Supabase Auth.

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke("export-user-data");
```

**Response:**

```ts
{
  profile: { ... },
  student: { ... },
  class_logs: [...],
  financial_records: [...],
  activities: [...],
}
```

**Uso:** Portal do aluno — botão "Exportar meus dados" (LGPD Art. 18, IV).

## cleanup-old-records

**Responsabilidade:** Limpeza periódica de logs e idempotency_keys antigos.

**Arquivo:** `supabase/functions/cleanup-old-records/index.ts`

**Fluxo:**

1. Deleta `idempotency_keys` com mais de 7 dias
2. Deleta `rate_limit_tracker` com mais de 1 dia
3. Retorna contagem de registros deletados

**Trigger:** Cron job (configurar no Supabase Dashboard)

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke("cleanup-old-records");
```

**Response:**

```ts
{
  idempotencyKeysDeleted: 42,
  rateLimitRecordsDeleted: 128
}
```

## cleanup-storage

**Responsabilidade:** Limpeza de arquivos órfãos no Storage (arquivos sem referência no banco).

**Arquivo:** `supabase/functions/cleanup-storage/index.ts`

**Fluxo:**

1. Lista todos os arquivos no bucket `activity-files`
2. Busca `activities` com `file_url` correspondente
3. Deleta arquivos sem referência
4. Retorna contagem de arquivos deletados

**Trigger:** Cron job (configurar no Supabase Dashboard)

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke("cleanup-storage");
```

**Response:**

```ts
{
  filesDeleted: 5;
}
```

## create-abacate-payment

**Responsabilidade:** Gera QR Code PIX via AbacatePay API usando as credenciais do professor dono da cobrança.

**Arquivo:** `supabase/functions/create-abacate-payment/index.ts`

**Auth:** JWT (caller deve ser aluno — `profile.student_id != null`)

**Fluxo:**

1. Valida JWT e identidade do aluno (`profile.student_id`)
2. Rate limit: `check_rate_limit('create_abacate_payment', 10, 1)` via `userClient`
3. Busca `financial_record` e verifica ownership (`record.student_id === profile.student_id`)
4. **Cache idempotente:** se `pix_code` existe e `pix_expires_at` ainda válido, retorna sem chamar AbacatePay
5. Resolve professor via `students.teacher_id` → busca `teachers.abacate_pay_api_key`
6. Descriptografa API key via `decrypt_sensitive_data` RPC
7. `POST https://api.abacatepay.com/v1/pixQrCode/create` com dados da cobrança e do aluno
8. Salva `brCode`, `external_payment_id`, `pix_expires_at`, `payment_provider='abacate_pay'` no record
9. Retorna `{ brCode, expiresAt }`

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke(
  "create-abacate-payment",
  {
    body: {
      financial_record_id: "uuid-da-cobrança",
      cpf: "12345678901", // CPF do aluno (11 dígitos, sem formatação)
      cellphone: "11999999999", // opcional
    },
  }
);
// data: { brCode: "00020126...", expiresAt: "2026-06-02T10:00:00Z" }
```

**Considerações de segurança:**

- API key do professor nunca chega ao frontend — descriptografada e usada apenas dentro da Edge Function
- `userClient` para rate limit garante que `auth.uid()` resolve corretamente (não via service role)

---

## refund-abacate-payment

**Responsabilidade:** Processa reembolso automático via AbacatePay API para cobranças pagas com `payment_provider='abacate_pay'`.

**Arquivo:** `supabase/functions/refund-abacate-payment/index.ts`

**Auth:** JWT (caller deve ser professor — `profile.teacher_id != null`)

**Fluxo:**

1. Valida JWT e identidade do professor (`profile.teacher_id`)
2. Busca `financial_record` com `students!inner(teacher_id)` para ownership check
3. Verifica `student.teacher_id === profile.teacher_id`
4. Valida `payment_provider = 'abacate_pay'` e `external_payment_id` presente
5. Valida `status = 'pago'` (só cobranças pagas)
6. Busca `abacate_pay_api_key` do professor e descriptografa
7. `POST https://api.abacatepay.com/v2/transparents/refund { id: external_payment_id, reason? }`
   - `reason` omitido do body se string vazia
8. Em sucesso: `UPDATE status='extornado' WHERE status='pago'` (guard idempotente)
9. Retorna `{ refundPublicId }`

**Chamada:**

```ts
const { data, error } = await supabase.functions.invoke(
  "refund-abacate-payment",
  {
    body: {
      financial_record_id: "uuid-da-cobrança",
      reason: "Aula cancelada pelo professor", // opcional
    },
  }
);
// data: { refundPublicId: "tran_refund789xyz" }
```

**Mapeamento de erros AbacatePay:**

- `INSUFFICIENT_FUNDS` → "Saldo insuficiente na conta AbacatePay para processar o reembolso."
- Outros → "Falha ao processar reembolso. Verifique se o pagamento está em estado válido na AbacatePay."

---

## abacate-webhook

**Responsabilidade:** Recebe e processa eventos de pagamento e reembolso vindos da AbacatePay.

**Arquivo:** `supabase/functions/abacate-webhook/index.ts`

**Auth:** `webhookSecret` via query param (`?webhookSecret=<uuid>`) — validado contra `teachers.abacate_pay_webhook_secret`

**Fluxo:**

1. Valida `webhookSecret` → lookup em `teachers` (multi-tenant: cada professor tem seu secret)
2. Parseia body; se vazio → ack (200)
3. **Idempotência:** INSERT em `webhook_processing_log(event_id, gateway='abacate-pay')`
   - Conflito UNIQUE (23505) = já processado → ack sem reprocessar
4. Dispatch por `body.event`:
   - `billing.paid` / `pixQrCode.paid` → `UPDATE status='pago', paid_at=NOW()` WHERE `external_payment_id = billingId` AND `status != 'pago'`
   - `checkout.refunded` → `UPDATE status='extornado'` WHERE `external_payment_id = billingId` AND `status != 'extornado'`
5. Retorna `{ received: true }`

**URL de registro no AbacatePay Dashboard:**

```
https://<project-ref>.supabase.co/functions/v1/abacate-webhook?webhookSecret=<teacher-secret>
```

**Considerações:**

- Secret rotacionado automaticamente sempre que professor atualiza API key (`useUpdateTeacherAbacatePayConfig` → `crypto.randomUUID()`)
- Health check: GET → `{ status: "ok" }` (para monitoramento)

---

## Deploy

**Local:**

```bash
supabase functions serve invite-user --env-file .env.local
```

**Produção:**

```bash
supabase functions deploy invite-user
```

**Secrets:**

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Logs:**

```bash
supabase functions logs invite-user
```

## Ver também

- [Backend Overview](./overview.md) — Visão geral do backend
- [RPCs](./rpcs.md) — Alternativa a Edge Functions (mais rápido)
- [Bugs](./bugs.md) — BACK-001 (race condition em invite-user)
- [Security Overview](../security/overview.md) — Rate limiting, auth
