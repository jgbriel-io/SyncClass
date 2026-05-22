# Bugs Conhecidos

7 bugs identificados no backend com severidade, diagnóstico e fix.

## Índice

- [Quando usar](#quando-usar)
- [BACK-001: Race condition na criação de usuário](#back-001-race-condition-na-criação-de-usuário)
- [BACK-002: Timezone bug em getDateRangeForPeriod](#back-002-timezone-bug-em-getdaterangeforperiod)
- [BACK-003: Timezone bug em isOverdue](#back-003-timezone-bug-em-isoverdue)
- [BACK-004: Mistura de DATE e TIMESTAMPTZ](#back-004-mistura-de-date-e-timestamptz)
- [BACK-005: Race condition em idempotency_keys](#back-005-race-condition-em-idempotency_keys)
- [BACK-006: Senha em texto plano no response](#back-006-senha-em-texto-plano-no-response)
- [BACK-007: Fallback silencioso na criptografia](#back-007-fallback-silencioso-na-criptografia)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Debugar erro relacionado a bugs conhecidos
- Planejar sprint de correção
- Avaliar impacto de bug em produção
- Entender trade-offs de fixes

**Não use quando:**

- Procurar bugs funcionais → Issues do GitHub
- Procurar vulnerabilidades de segurança → [Security Overview](../security/overview.md)
- Procurar débito técnico → [Architecture Technical Debt](../architecture/technical-debt.md)

---

## BACK-001: Race condition na criação de usuário

**Severidade:** 🔴 Crítica  
**Arquivo:** `supabase/functions/invite-user/invite-user.ts`  
**Descoberto:** Sprint 4

### Sintoma

Dois requests simultâneos com mesmo email podem ambos criar usuário, causando duplicação.

### Causa

`invite-user` Edge Function verifica duplicidade de email com SELECT antes de criar usuário, mas não usa transação atômica:

```ts
// ❌ Race condition
const { data: existing } = await supabase
  .from("profiles")
  .select("email")
  .eq("email", email)
  .maybeSingle();

if (existing) throw new Error("Email já cadastrado");

// Se 2 requests chegam aqui ao mesmo tempo, ambos passam
const { data: authUser } = await supabaseAdmin.auth.admin.createUser({ email });
```

**Timeline:**

```
Request A: SELECT email → não encontra → continua
Request B: SELECT email → não encontra → continua
Request A: INSERT auth user → sucesso
Request B: INSERT auth user → sucesso (duplicado!)
```

### Diagnóstico

1. Verificar logs da Edge Function para requests simultâneos
2. Buscar duplicatas: `SELECT email, COUNT(*) FROM profiles GROUP BY email HAVING COUNT(*) > 1`
3. Verificar `auth.users` para emails duplicados

### Fix

**Opção 1:** Usar constraint UNIQUE no banco (preferido)

```sql
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
```

**Opção 2:** Garantir rollback em caso de erro

```ts
let userId: string | null = null;

try {
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email,
  });
  userId = authUser.user.id;

  await waitForProfile(userId, supabaseAdmin);

  // Resto da lógica...
} catch (err) {
  // Rollback: deletar auth user se foi criado
  if (userId) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
  throw err;
}
```

**Opção 3:** Usar lock pessimista (mais lento)

```sql
SELECT * FROM profiles WHERE email = $1 FOR UPDATE;
```

### Impacto

- Duplicação de usuários (dados inconsistentes)
- Conflito de login (qual usuário autenticar?)
- Violação de constraint se email for UNIQUE

### Prevenção

- Adicionar constraint UNIQUE em `profiles.email`
- Adicionar constraint UNIQUE em `auth.users.email` (já existe por padrão)
- Testar com requests simultâneos (load testing)

---

## BACK-002: Timezone bug em getDateRangeForPeriod

**Severidade:** 🟡 Alta  
**Arquivo:** `src/lib/utils/dateHelpers.ts`  
**Descoberto:** Sprint 11

### Sintoma

Filtro de "mês atual" inclui dias do mês seguinte para usuários em UTC-3 (Brasil) após 21h.

### Causa

`toISOString()` converte para UTC, mas servidor pode estar em fuso diferente:

```ts
// ❌ Bug
function getDateRangeForPeriod(period: "month" | "week"): {
  start: string;
  end: string;
} {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  return {
    start: start.toISOString().split("T")[0], // UTC!
    end: end.toISOString().split("T")[0], // UTC!
  };
}
```

**Exemplo:**

```
Usuário em UTC-3, 31/01/2026 às 22h local
→ new Date() = 01/02/2026 01:00 UTC
→ toISOString() = "2026-02-01T01:00:00.000Z"
→ split('T')[0] = "2026-02-01"
→ Filtro busca fevereiro em vez de janeiro!
```

### Diagnóstico

1. Verificar timezone do servidor: `SELECT current_setting('TIMEZONE');`
2. Verificar timezone do usuário: `Intl.DateTimeFormat().resolvedOptions().timeZone`
3. Testar filtro após 21h local (quando UTC já mudou de dia)

### Fix

Usar formatação local:

```ts
// ✅ Fix
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateRangeForPeriod(period: "month" | "week"): {
  start: string;
  end: string;
} {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
  };
}
```

### Impacto

- Filtros de data retornam dados errados
- Relatórios mensais incluem dias do mês seguinte
- Dashboards mostram estatísticas incorretas

### Prevenção

- Sempre usar `toLocalDateString()` para comparações de data
- Nunca usar `toISOString()` para datas sem hora
- Testar com timezone diferente de UTC

---

## BACK-003: Timezone bug em isOverdue

**Severidade:** 🟡 Alta  
**Arquivo:** `src/lib/utils/financialHelpers.ts`  
**Descoberto:** Sprint 11

### Sintoma

Cobranças aparecem como atrasadas antes do fim do dia local.

### Causa

`new Date(dueDateStr + "T12:00:00")` sem timezone explícito é interpretado como local, mas comparação com `new Date()` usa UTC:

```ts
// ❌ Bug
export function isOverdue(dueDateStr: string): boolean {
  const dueDate = new Date(dueDateStr + "T12:00:00"); // Local
  const today = new Date(); // UTC
  return dueDate < today;
}
```

**Exemplo:**

```
due_date = "2026-05-21"
→ new Date("2026-05-21T12:00:00") = 21/05 12:00 local (UTC-3 = 15:00 UTC)
→ new Date() = 21/05 10:00 local (13:00 UTC)
→ 15:00 UTC < 13:00 UTC = false (correto)

Mas em servidor com timezone UTC:
→ new Date("2026-05-21T12:00:00") = 21/05 12:00 UTC
→ new Date() = 21/05 13:00 UTC
→ 12:00 UTC < 13:00 UTC = true (errado! ainda é dia 21)
```

### Diagnóstico

1. Verificar timezone do servidor
2. Testar `isOverdue()` com data de hoje
3. Verificar se cobranças aparecem atrasadas antes de 00:00 local

### Fix

Comparar apenas partes de data:

```ts
// ✅ Fix
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dueDateStr < todayStr;
}
```

### Impacto

- Cobranças marcadas como atrasadas prematuramente
- Notificações enviadas antes do vencimento
- Relatórios de inadimplência incorretos

### Prevenção

- Sempre comparar datas sem hora (apenas YYYY-MM-DD)
- Nunca adicionar "T12:00:00" sem timezone explícito
- Testar com timezone diferente de UTC

---

## BACK-004: Mistura de DATE e TIMESTAMPTZ

**Severidade:** 🟡 Alta  
**Arquivo:** `src/lib/utils/classHelpers.ts`  
**Descoberto:** Sprint 11

### Sintoma

Status de aula incorreto (agendada aparece como pendente, ou vice-versa).

### Causa

`class_date` (DATE) e `start_at`/`end_at` (TIMESTAMPTZ) são comparados sem conversão consistente:

```ts
// ❌ Bug
export function getClassStatus(classLog: ClassLog): ClassStatus {
  const now = new Date(); // Local
  const classDate = new Date(classLog.class_date); // Local 00:00
  const startAt = new Date(classLog.start_at); // UTC convertido para local

  if (classDate > now) return "Agendada"; // Compara local com local
  if (startAt > now) return "Agendada"; // Compara UTC com local (errado!)
}
```

**Exemplo:**

```
Professor em UTC-3 agenda aula para 08:00 local
→ start_at armazenado = 11:00 UTC
→ Frontend: new Date(start_at) = 08:00 local (correto)
→ Comparação: 08:00 local > 10:00 local = false (errado! deveria ser true)
```

### Diagnóstico

1. Verificar timezone do servidor e do usuário
2. Verificar valores de `class_date` e `start_at` no banco
3. Testar status de aula agendada para hoje

### Fix

Sempre trabalhar em UTC:

```ts
// ✅ Fix
export function getClassStatus(classLog: ClassLog): ClassStatus {
  const nowUtc = new Date(); // UTC
  const startAtUtc = classLog.start_at ? new Date(classLog.start_at) : null;
  const endAtUtc = classLog.end_at ? new Date(classLog.end_at) : null;

  if (classLog.attendance !== null) return "Concluída";
  if (startAtUtc && startAtUtc > nowUtc) return "Agendada";
  if (startAtUtc && endAtUtc && nowUtc >= startAtUtc && nowUtc < endAtUtc)
    return "Em andamento";
  return "Pendente";
}
```

### Impacto

- Status de aula incorreto
- Aulas agendadas aparecem como pendentes
- Notificações enviadas no horário errado

### Prevenção

- Sempre usar TIMESTAMPTZ (nunca DATE para comparações com hora)
- Sempre trabalhar em UTC no backend
- Converter para local apenas na UI

---

## BACK-005: Race condition em idempotency_keys

**Severidade:** 🟡 Média  
**Arquivo:** `supabase/migrations/06_idempotency.sql`  
**Descoberto:** Sprint 6

### Sintoma

Dois requests simultâneos com mesma `idempotency_key` podem ambos executar operação.

### Causa

Padrão SELECT → INSERT não é atômico:

```sql
-- ❌ Race condition
SELECT * FROM idempotency_keys WHERE key = $1;
-- Se não encontrar, insere
INSERT INTO idempotency_keys (key, operation, result) VALUES ($1, $2, $3);
```

**Timeline:**

```
Request A: SELECT key → não encontra → continua
Request B: SELECT key → não encontra → continua
Request A: INSERT key → sucesso
Request B: INSERT key → erro (UNIQUE constraint)
Request A: Executa operação → sucesso
Request B: Falha (mas operação já foi executada por A)
```

### Diagnóstico

1. Verificar logs de erro com "duplicate key value violates unique constraint"
2. Verificar se operação foi executada 2x (ex: 2 cobranças com mesmo valor)
3. Testar com requests simultâneos

### Fix

Usar `INSERT ... ON CONFLICT DO NOTHING RETURNING *`:

```sql
-- ✅ Fix
INSERT INTO idempotency_keys (key, operation, result)
VALUES ($1, $2, $3)
ON CONFLICT (key) DO NOTHING
RETURNING *;

-- Se RETURNING retornar vazio, key já existe → retornar resultado anterior
```

### Impacto

- Operações duplicadas (pagamento processado 2x)
- Inconsistência de dados
- Erro para usuário (mas operação pode ter sido executada)

### Prevenção

- Usar `ON CONFLICT` em vez de SELECT → INSERT
- Adicionar lock pessimista se necessário
- Testar com requests simultâneos

---

## BACK-006: Senha em texto plano no response

**Severidade:** 🟡 Média  
**Arquivo:** `src/hooks/useUserMutations.ts`  
**Descoberto:** Sprint 4

### Sintoma

Senha temporária retornada em texto plano no response da Edge Function.

### Causa

Frontend espera `password` no response para exibir ao admin:

```ts
// invite-user Edge Function
return jsonResponse(
  {
    userId,
    email,
    password: generatedPassword, // ⚠️ Texto plano
    studentId,
    teacherId,
  },
  200
);
```

**Fluxo intencional:** Admin precisa comunicar senha ao usuário (não há email automático).

### Diagnóstico

1. Verificar response da Edge Function no Network tab
2. Verificar se senha é logada em console
3. Verificar se senha é persistida em estado global

### Fix

**Não é bug — é feature intencional.** Mas precisa de cuidados:

```ts
// ✅ Garantir que senha não seja logada
const { data } = await supabase.functions.invoke("invite-user", { body });

// Exibir senha ao admin (modal, toast)
toast.success(`Usuário criado! Senha: ${data.password}`);

// Limpar senha do estado após exibição
setPassword(null);

// Nunca logar
// console.log(data); // ❌
```

### Impacto

- Senha exposta em logs (se houver console.log)
- Senha exposta em estado global (se persistida)
- Senha exposta em Network tab (HTTPS mitiga)

### Prevenção

- Nunca logar response com senha
- Limpar senha do estado após exibição
- Considerar envio de email automático (elimina necessidade de retornar senha)

---

## BACK-007: Fallback silencioso na criptografia

**Severidade:** 🟢 Baixa  
**Arquivo:** `supabase/migrations/10_lgpd.sql`  
**Descoberto:** Sprint 10

### Sintoma

Função `encrypt_sensitive_data()` retorna dado em texto plano se chave de criptografia não estiver configurada.

### Causa

Fallback silencioso sem aviso:

```sql
-- ❌ Fallback silencioso
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL THEN
    RETURN data; -- ⚠️ Retorna texto plano sem aviso
  END IF;

  RETURN pgp_sym_encrypt(data, encryption_key);
END;
$$ LANGUAGE plpgsql;
```

### Diagnóstico

1. Verificar se `app.encryption_key` está configurado: `SHOW app.encryption_key;`
2. Verificar se dados sensíveis estão criptografados no banco
3. Testar `encrypt_sensitive_data('teste')` e verificar se retorna criptografado

### Fix

Falhar explicitamente:

```sql
-- ✅ Fix
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured'; -- ✅ Falha explícita
  END IF;

  RETURN pgp_sym_encrypt(data, encryption_key);
END;
$$ LANGUAGE plpgsql;
```

### Impacto

- Dados sensíveis armazenados em texto plano
- Violação de LGPD (dados não protegidos)
- Falsa sensação de segurança

### Prevenção

- Sempre configurar `app.encryption_key` antes de usar
- Testar criptografia em staging antes de produção
- Adicionar validação no deploy (CI/CD)

---

## Ver também

- [Backend Overview](./overview.md) — Visão geral do backend
- [Edge Functions](./edge-functions.md) — BACK-001 (invite-user)
- [Integrations](./integrations.md) — BACK-005 (idempotency_keys)
- [Architecture Troubleshooting](../architecture/troubleshooting.md) — Erros comuns
- [Architecture Technical Debt](../architecture/technical-debt.md) — Débitos técnicos
