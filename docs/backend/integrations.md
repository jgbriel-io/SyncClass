# Integrações

Storage, rate limiting, idempotência, fluxos de pagamento e gestão de agenda.

## Índice

- [Quando usar](#quando-usar)
- [Supabase Storage](#supabase-storage)
- [Rate Limiting](#rate-limiting)
- [Idempotência](#idempotência)
- [Fluxo de Pagamento](#fluxo-de-pagamento)
- [Gestão de Agenda](#gestão-de-agenda)
- [Ver também](#ver-também)

## Quando usar

**Use Storage quando:**

- Upload de arquivos (atividades, avatares, comprovantes)
- Precisa de URLs assinadas (TTL, segurança)
- Arquivos privados (não públicos)

**Use Rate Limiting quando:**

- Operação cara (criar usuário, enviar email)
- Prevenir abuso (spam, brute force)
- Proteger recursos (banco, APIs externas)

**Use Idempotência quando:**

- Operação financeira (pagamento, estorno)
- Retry automático (rede instável)
- Prevenir duplicação (double-click, race condition)

## Supabase Storage

**Buckets privados:** `activity-files`, `avatars`

**Upload:**

```ts
const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
const path = `${userId}/avatar.jpg`;

const { error } = await supabase.storage
  .from("avatars")
  .upload(path, file, { upsert: true });
```

**Signed URL (TTL 1h):**

```ts
const { data } = await supabase.storage
  .from("activity-files")
  .createSignedUrl(path, 3600); // 3600s = 1h

console.log(data.signedUrl); // https://...?token=xxx
```

**Delete:**

```ts
await supabase.storage.from("avatars").remove([path]);
```

**Validação de avatar:**

```ts
// src/lib/utils/avatarUpload.ts
export async function validateAndResizeAvatar(file: File): Promise<Blob> {
  // Max 5MB
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Arquivo muito grande (max 5MB)");

  // Apenas JPEG, PNG, WebP
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Formato inválido (apenas JPEG, PNG, WebP)");
  }

  // Resize para 512x512
  const resized = await resizeImage(file, 512, 512);
  return resized;
}
```

**Cleanup de órfãos:** Edge Function `cleanup-storage` deleta arquivos sem referência no banco.

## Rate Limiting

**Implementação:** Tabela `rate_limit_tracker` + RPC `check_rate_limit()`

**Limite padrão:** 10 req/min por usuário

**Arquivo:** `supabase/migrations/07_rate_limiting.sql`

**Uso:**

```ts
// src/lib/utils/rateLimit.ts
export const RATE_LIMIT_CONFIGS = {
  CREATE_USER: { maxRequests: 10, windowMinutes: 1 },
  UPLOAD: { maxRequests: 5, windowMinutes: 1 },
  FINANCIAL: { maxRequests: 20, windowMinutes: 1 },
};

export function checkRateLimit(operation: string, config: RateLimitConfig) {
  const key = `${operation}_${Date.now()}`;
  const lastRequest = rateLimitCache.get(operation);

  if (
    lastRequest &&
    Date.now() - lastRequest < config.windowMinutes * 60 * 1000
  ) {
    const retryAfter = Math.ceil(
      (config.windowMinutes * 60 * 1000 - (Date.now() - lastRequest)) / 1000
    );
    return { allowed: false, retryAfter };
  }

  rateLimitCache.set(operation, Date.now());
  return { allowed: true };
}
```

**Aplicado em:**

- `invite-user` Edge Function (20 req/min)
- `admin-delete-user` Edge Function (20 req/min)
- RPCs financeiras (20 req/min)
- Upload de avatar (5 req/min)

**Cleanup:** Edge Function `cleanup-old-records` deleta registros com mais de 1 dia.

## Idempotência

**Implementação:** Tabela `idempotency_keys` + RPCs idempotentes

**Arquivo:** `supabase/migrations/06_idempotency.sql`

**Schema:**

```sql
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  operation TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Geração de chave:**

```ts
// Frontend
const idempotencyKey = crypto.randomUUID();
const idempotencyKeyRef = useRef(idempotencyKey); // sobrevive a re-renders
```

**RPCs idempotentes:**

- `mark_as_paid_idempotent(record_id, payment_method, idempotency_key)`
- `confirm_payment_idempotent(record_id, idempotency_key)`
- `undo_payment_idempotent(record_id, idempotency_key)`

**Fluxo:**

```
1. Frontend gera UUID, armazena em useRef
2. Chama RPC com idempotency_key
3. RPC verifica se key existe:
   - Se existe → retorna resultado anterior (idempotente)
   - Se não existe → executa operação, salva resultado, retorna
4. Retry automático usa mesma key → não duplica operação
```

**Cleanup:** Edge Function `cleanup-old-records` deleta keys com mais de 7 dias.

**Bug conhecido:** BACK-005 — race condition em INSERT. Ver [bugs.md](./bugs.md).

## Fluxo de Pagamento

**Sem gateway de pagamento.** Pagamentos são registrados manualmente pelo professor ou confirmados via upload de comprovante pelo aluno.

**Estados:**

```
pendente → pago (via mark_as_paid ou confirm_payment)
pendente → cancelado (via soft delete)
pago → pendente (via undo_payment)
```

**Fluxo completo:**

```
1. Professor cria cobrança
   → financial_records (status='pendente')

2. Aluno faz upload de comprovante
   → payment_proof_url (Storage)
   → payment_proof_status='pending'

3. Professor aprova
   → confirm_payment_idempotent()
   → status='pago'
   → payment_proof_status='approved'
   → confirmed_by_user_id=auth.uid()
   → paid_at=NOW()

   OU

   Professor rejeita
   → payment_proof_status='rejected'
   → payment_proof_rejection_reason='...'

4. Aluno pode reenviar comprovante após rejeição
   → payment_proof_url (novo arquivo)
   → payment_proof_status='pending' (reset)
```

**Métodos de pagamento:**

- `pix` — QR Code gerado pelo frontend (não integrado com API)
- `dinheiro` — registro manual
- `transferencia` — registro manual
- `cartao` — registro manual

**Idempotência:** Todas as operações financeiras usam `idempotency_key` para prevenir duplicação.

## Gestão de Agenda

### Modelo de Dados

```sql
class_logs (
  id UUID PRIMARY KEY,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  class_date DATE NOT NULL,           -- data da aula (sem timezone)
  start_at TIMESTAMPTZ NOT NULL,      -- início com timezone
  end_at TIMESTAMPTZ NOT NULL,        -- fim com timezone
  duration_minutes INTEGER NOT NULL,  -- calculado: EXTRACT(EPOCH FROM (end_at - start_at)) / 60
  title TEXT,
  notes TEXT,
  attendance BOOLEAN,                 -- null=pendente, true=presente, false=falta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Por que DATE + TIMESTAMPTZ?**

- `class_date` — data da aula para agrupamento (sem timezone)
- `start_at`/`end_at` — horário exato com timezone (para conflito de horário)

### Detecção de Conflito de Horário

**Constraint de exclusão (migration 03):**

```sql
ALTER TABLE class_logs
ADD CONSTRAINT class_logs_no_overlap
EXCLUDE USING gist (
  teacher_id WITH =,
  tstzrange(start_at, end_at) WITH &&
);
```

**Significado:** Mesmo professor não pode ter 2 aulas com horários sobrepostos.

**Validação client-side:**

```ts
// src/lib/utils/classValidation.ts
export function validateNoOverlap(
  teacherId: string,
  startAt: Date,
  endAt: Date,
  existingClasses: ClassLog[]
): boolean {
  return existingClasses.every((c) => {
    if (c.teacher_id !== teacherId) return true;
    const cStart = new Date(c.start_at);
    const cEnd = new Date(c.end_at);
    return endAt <= cStart || startAt >= cEnd; // sem sobreposição
  });
}
```

**Erro do banco:**

```
conflicting key value violates exclusion constraint "class_logs_no_overlap"
```

**Tratamento:**

```ts
if (error.message.includes("class_logs_no_overlap")) {
  toast.error("Já existe outra aula agendada neste horário");
}
```

### Status de Aula

**Lógica:**

```ts
export function getClassStatus(classLog: ClassLog): ClassStatus {
  const now = new Date();
  const classDate = new Date(classLog.class_date);
  const startAt = classLog.start_at ? new Date(classLog.start_at) : null;
  const endAt = classLog.end_at ? new Date(classLog.end_at) : null;

  // Concluída (attendance preenchido)
  if (classLog.attendance !== null) {
    return { label: "Concluída", variant: "success" };
  }

  // Agendada (data futura ou horário futuro)
  if (classDate > now || (startAt && startAt > now)) {
    return { label: "Agendada", variant: "info" };
  }

  // Em andamento (entre start_at e end_at)
  if (startAt && endAt && now >= startAt && now < endAt) {
    return { label: "Em andamento", variant: "warning" };
  }

  // Pendente (passou do horário mas attendance não preenchido)
  return { label: "Pendente", variant: "destructive" };
}
```

### Cálculo de Vencimentos

**Quando `students.pay_day` muda:**

```ts
// RPC update_student_payment_day recalcula due_date de todas as cobranças pendentes
await supabase.rpc("update_student_payment_day", {
  p_student_id: studentId,
  p_new_pay_day: 15,
});
```

**Lógica:**

```sql
UPDATE financial_records
SET due_date = DATE_TRUNC('month', due_date) + (p_new_pay_day - 1) * INTERVAL '1 day'
WHERE student_id = p_student_id
  AND status = 'pendente';
```

**Mantém mês/ano, muda apenas o dia.**

## Ver também

- [Backend Overview](./overview.md) — Visão geral do backend
- [Edge Functions](./edge-functions.md) — cleanup-storage, cleanup-old-records
- [RPCs](./rpcs.md) — mark_as_paid_idempotent, confirm_payment_idempotent
- [Bugs](./bugs.md) — BACK-002 a BACK-005 (timezone, race conditions)
- [Security Overview](../security/overview.md) — RLS, rate limiting
