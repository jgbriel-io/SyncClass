# Integrações, Agenda e Fluxos de Backend

## Integrações Externas

### Supabase Auth
Único provedor de autenticação. JWT gerado pelo Supabase, validado em cada request via PostgREST e Edge Functions.

### Edge Functions (Deno)
Localizadas em `supabase/functions/`. Usadas para operações que precisam de `service_role` ou lógica server-side:

| Função | Responsabilidade |
|--------|-----------------|
| `invite-user` | Criação atômica de usuário (auth + profiles + student/teacher) com rollback |
| `admin-delete-user` | Deleção de usuário com invalidação de sessões |
| `reset-password` | Reset de senha via service_role |
| `cleanup-old-records` | Limpeza periódica de logs e idempotency_keys |
| `cleanup-storage` | Limpeza de arquivos órfãos no Storage |

### Supabase Storage
Buckets privados para arquivos de atividades e avatares. URLs assinadas com TTL de 1 hora (`createSignedUrl`).

### Sem webhooks externos
O sistema não tem integrações com gateways de pagamento (Mercado Pago, Stripe, etc.). Pagamentos são registrados manualmente pelo professor ou confirmados via upload de comprovante pelo aluno.

---

## Gestão de Agenda (Slots de Aulas)

### Modelo de dados
```
class_logs:
  class_date DATE          ← data da aula (sem timezone)
  start_at   TIMESTAMPTZ   ← início com timezone
  end_at     TIMESTAMPTZ   ← fim com timezone
  duration_minutes INTEGER ← calculado: EXTRACT(EPOCH FROM (end_at - start_at)) / 60
```

### Detecção de conflito de horário
Implementada via constraint de exclusão no banco (migration 03):
```sql
CONSTRAINT class_logs_no_overlap EXCLUDE USING gist (
  teacher_id WITH =,
  tstzrange(start_at, end_at) WITH &&
)
```
Validação client-side adicional em `validateNoOverlap()` antes de enviar ao banco.

### Status de aula (classTime.ts)
```
Agendada    → class_date > hoje OU start_at > agora
Em andamento → start_at <= agora < end_at
Pendente    → class_date <= hoje, attendance = null, end_at < agora
Concluída   → attendance != null
```

### Cálculo de vencimentos (pay_day)
Quando `students.pay_day` muda, a RPC `update_student_payment_day` recalcula `due_date` de todas as cobranças pendentes do aluno.

---

## Fluxo de Pagamento

```
1. Professor cria cobrança (financial_records, status='pendente')
2. Aluno faz upload de comprovante (payment_proof_url, payment_proof_status='pending')
3. Professor aprova → confirm_payment_idempotent() → status='pago', confirmed_by_user_id
   OU
   Professor rejeita → payment_proof_status='rejected', payment_proof_rejection_reason
4. Aluno pode reenviar comprovante após rejeição (migration 16 corrigiu este bug)
```

### Idempotência em pagamentos
RPCs financeiras usam `idempotency_keys`:
- `mark_as_paid_idempotent(record_id, payment_method, idempotency_key)`
- `confirm_payment_idempotent(record_id, idempotency_key)`
- `undo_payment_idempotent(record_id, idempotency_key)`

Chave gerada no frontend via `crypto.randomUUID()` e armazenada em `useRef` para sobreviver a re-renders.

---

## Sprint de Correção — Bugs de Backend

### BUG-BACK-001
**SEVERIDADE:** CRÍTICA  
**VETOR DE FALHA:** Race condition na criação de usuário — `invite-user` Edge Function verifica duplicidade de email com SELECT antes de criar o usuário, mas não usa transação atômica. Dois requests simultâneos com o mesmo email podem passar pela verificação antes de qualquer um inserir:

```ts
// Edge Function (invite-user.ts)
// Query 1: verifica se email existe
const { data: existingProfile } = await supabaseAdmin
  .from("profiles").select("id").ilike("email", normalizedEmail).maybeSingle();

if (existingProfile) return jsonResponse({ error: "Email já cadastrado" }, 400);

// ← JANELA: outro request pode criar o usuário aqui

// Query 2: cria o usuário
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({ email: normalizedEmail, ... });
```

**FIX:** O Supabase Auth já tem constraint UNIQUE em `auth.users.email`, então o segundo request vai falhar com erro de duplicidade. O problema real é que o rollback (`rollbackAuthUser`) pode não ser chamado se o erro ocorrer após a criação do auth user mas antes do profile. Garantir que o rollback seja sempre executado em caso de erro:

```ts
let userId: string | null = null;
try {
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser(...);
  userId = authUser.user.id;
  
  await waitForProfile(userId, supabaseAdmin);
  // ... resto da criação
} catch (err) {
  if (userId) await rollbackAuthUser(supabaseAdmin, userId);
  throw err;
}
```

---

### BUG-BACK-002
**SEVERIDADE:** ALTA  
**VETOR DE FALHA:** Timezone bug em `getDateRangeForPeriod` — usa `toISOString()` que converte para UTC, mas o servidor pode estar em fuso diferente do usuário. Para um usuário em UTC-3 (Brasil), às 22h do dia 31/01, `new Date()` retorna 01/02 em UTC, fazendo o filtro de "mês atual" incluir dias do mês seguinte:

```ts
function getDateRangeForPeriod(period: "week" | "month" | "3months") {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ← seta para meia-noite LOCAL
  // ...
  return {
    from: from.toISOString().split("T")[0], // ← converte para UTC antes de pegar a data
    to: to.toISOString().split("T")[0],     // ← pode ser dia diferente do local
  };
}
```

**FIX:** Usar formatação local em vez de ISO:
```ts
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Uso
return {
  from: toLocalDateString(from),
  to: toLocalDateString(to),
};
```

---

### BUG-BACK-003
**SEVERIDADE:** ALTA  
**VETOR DE FALHA:** Timezone bug em `isOverdue` — usa `new Date(dueDateStr + "T12:00:00")` sem timezone explícito. Em servidores com timezone diferente de UTC-3, "T12:00:00" pode ser interpretado como UTC, fazendo cobranças aparecerem como atrasadas antes do fim do dia local:

```ts
// financialStatus.ts
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T12:00:00"); // ← sem timezone = local do browser
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}
```

O `T12:00:00` é um workaround para evitar o bug de UTC (datas ISO sem hora são interpretadas como UTC), mas não é robusto para todos os fusos.

**FIX:** Comparar apenas as partes de data sem conversão de timezone:
```ts
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return dueDateStr < todayStr; // comparação de strings YYYY-MM-DD é segura
}
```

---

### BUG-BACK-004
**SEVERIDADE:** ALTA  
**VETOR DE FALHA:** Inconsistência de tipo entre `class_date` (DATE) e `start_at`/`end_at` (TIMESTAMPTZ). O `classTime.ts` cria datas locais para comparar com TIMESTAMPTZ do banco:

```ts
// classTime.ts
const classDate = new Date(item.class_date + "T12:00:00"); // DATE → local
const startAt = item.start_at ? new Date(item.start_at) : null; // TIMESTAMPTZ → UTC
```

Para um professor em UTC-3 que agenda uma aula para 08:00 local, `start_at` é armazenado como `11:00 UTC`. Quando o frontend compara `startAt > now`, está comparando UTC com local, podendo mostrar "Agendada" quando a aula já começou.

**FIX:** Sempre trabalhar em UTC ou sempre em local, nunca misturar:
```ts
// Opção 1: tudo em UTC
const nowUtc = new Date(); // já é UTC internamente
const startAtUtc = item.start_at ? new Date(item.start_at) : null; // TIMESTAMPTZ → UTC correto
if (startAtUtc && startAtUtc > nowUtc) return { label: "Agendada", variant: "info" };

// Opção 2: armazenar start_at como local no banco (mudar schema)
// Não recomendado — TIMESTAMPTZ é o tipo correto para horários
```

---

### BUG-BACK-005
**SEVERIDADE:** MÉDIA  
**VETOR DE FALHA:** Race condition em `idempotency_keys` — o padrão SELECT → INSERT não é atômico (documentado em BUG-SEC-008). Dois requests simultâneos com a mesma chave podem ambos passar pelo SELECT sem encontrar registro e ambos tentarem INSERT. O segundo vai falhar com violação de UNIQUE, mas o erro não é tratado graciosamente:

```sql
-- RPC mark_as_paid_idempotent
SELECT * INTO v_record FROM idempotency_keys WHERE idempotency_key = p_key;
-- ← JANELA de race condition
INSERT INTO idempotency_keys (...) VALUES (...); -- pode falhar com unique violation
```

**FIX:** Usar `INSERT ... ON CONFLICT DO NOTHING RETURNING *`:
```sql
INSERT INTO idempotency_keys (idempotency_key, operation, user_id, request_payload, status)
VALUES (p_key, 'mark_as_paid', auth.uid(), payload, 'processing')
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING *
INTO v_new_record;

-- Se não inseriu (conflito), buscar o existente
IF v_new_record IS NULL THEN
  SELECT * INTO v_record FROM idempotency_keys WHERE idempotency_key = p_key;
  IF v_record.status = 'completed' THEN
    RETURN v_record.response_payload;
  END IF;
  RAISE EXCEPTION 'Operação já está sendo processada';
END IF;
```

---

### BUG-BACK-006
**SEVERIDADE:** MÉDIA  
**VETOR DE FALHA:** `invite-user` retorna senha em texto plano no response original. A versão atual foi corrigida para não retornar a senha (`temporaryPasswordGenerated: true`), mas o frontend em `useUserMutations.ts` ainda espera `password` no response e usa para exibir ao admin:

```ts
// useUserMutations.ts — createUserLegacy (fallback)
return {
  userId,
  email: normalizedEmail,
  password, // ← senha em texto plano no objeto retornado
  ...
};

// useCreateUser.onSuccess
if (!result?.password) {
  toast.success("Usuário criado com sucesso!");
}
// Se result.password existe, o dialog mostra a senha ao admin
```

A senha é necessária para o admin comunicar ao usuário (fluxo intencional), mas deve ser tratada com cuidado — não logar, não persistir em estado global.

**FIX:** Garantir que a senha nunca seja logada e seja limpa do estado após exibição:
```ts
// Após exibir ao admin, limpar do estado
onPasswordDisplayed: () => {
  setGeneratedPassword(null); // limpar imediatamente após exibição
}
// Nunca: console.log(result.password), logger.info({ password })
```

---

### BUG-BACK-007
**SEVERIDADE:** BAIXA  
**VETOR DE FALHA:** `encrypt_sensitive_data` tem fallback silencioso — se a chave de criptografia não estiver configurada (`app.settings.encryption_key`), retorna o dado em texto plano sem aviso:

```sql
EXCEPTION
  WHEN OTHERS THEN
    -- Se não houver chave configurada, retornar texto plano (backward compatibility)
    RETURN data_input; -- ← PIX key armazenada sem criptografia silenciosamente
```

**FIX:** Falhar explicitamente se a chave não estiver configurada:
```sql
DECLARE
  v_key TEXT;
BEGIN
  v_key := current_setting('app.settings.encryption_key', true);
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Chave de criptografia não configurada. Configure app.settings.encryption_key.';
  END IF;
  -- ... resto da função
END;
```

---

## Resumo de Severidade

| Bug | Severidade | Área |
|-----|-----------|------|
| BUG-BACK-001 | CRÍTICA | Race condition na criação de usuário |
| BUG-BACK-002 | ALTA | Timezone em filtros de data |
| BUG-BACK-003 | ALTA | Timezone em cálculo de atraso |
| BUG-BACK-004 | ALTA | Mistura de DATE e TIMESTAMPTZ |
| BUG-BACK-005 | MÉDIA | Race condition em idempotency_keys |
| BUG-BACK-006 | MÉDIA | Senha em texto plano no response |
| BUG-BACK-007 | BAIXA | Fallback silencioso na criptografia |
