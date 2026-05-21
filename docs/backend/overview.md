# Backend

Documentação do backend Supabase, Edge Functions, integrações e fluxos de pagamento.

## Configuração

```
Projeto: yxwtxewwszoovqrjrrfb
URL: https://yxwtxewwszoovqrjrrfb.supabase.co
```

Variáveis de ambiente:
- `VITE_SUPABASE_URL` — URL do projeto
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon key (pública, segura para frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (apenas scripts admin, nunca no frontend)

## Client

```ts
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey)
```

## Autenticação

Supabase Auth com JWT. Roles definidos em `user_roles` e `profiles`.

Fluxo de login:
1. `supabase.auth.signInWithPassword({ email, password })`
2. `AuthContext` busca role em `user_roles` → fallback para `profiles.role`
3. Redireciona para `/admin`, `/teacher` ou `/student` conforme role

## RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Ver [security.md](./security.md) para políticas detalhadas.

Funções helper (todas com SECURITY DEFINER):
- `is_admin()` — verifica `profiles.role = 'admin'`
- `is_teacher()` — verifica `profiles.role = 'teacher'`
- `is_student()` — verifica `profiles.role = 'student'`

## RPCs principais

```ts
// Criar pacote de aulas
supabase.rpc('create_class_package', { ... })

// Marcar cobrança como paga (idempotente)
supabase.rpc('mark_as_paid_idempotent', { financial_record_id, idempotency_key })

// Confirmar pagamento
supabase.rpc('confirm_payment_idempotent', { ... })

// Desfazer pagamento
supabase.rpc('undo_payment_idempotent', { ... })
```

## Triggers ativos

| Tabela | Trigger | Quando |
|--------|---------|--------|
| financial_records | trigger_validate_financial_logic | BEFORE INSERT/UPDATE |
| profiles | trigger_invalidate_sessions_on_deactivate | AFTER UPDATE (active=false) |
| teachers, students, profiles, class_logs, financial_records, activities | trigger_set_updated_at | BEFORE UPDATE |

## Views

- `students_with_stats` — alunos com total de aulas e valores do mês
- `students_active` — alunos ativos (is_deleted=false, status=ativo)
- `students_masked` — dados anonimizados para LGPD
- `teachers_masked` — dados anonimizados para LGPD
- `teachers_with_pix_restricted` — PIX visível apenas para admin
- `class_logs_with_billing` — aulas com valores calculados
- `activities_active` — atividades não deletadas (SECURITY INVOKER)

Materialized views (refresh manual):
- `activities_dashboard` — estatísticas de atividades
- `financial_dashboard` — estatísticas financeiras

## Edge Functions

Localizadas em `supabase/functions/`. Usadas para operações que precisam de service role ou lógica server-side:

| Função | Responsabilidade |
|--------|-----------------|
| invite-user | Criação atômica de usuário (auth + profiles + student/teacher) com rollback |
| admin-delete-user | Deleção de usuário com invalidação de sessões |
| reset-password | Reset de senha via service_role |
| cleanup-old-records | Limpeza periódica de logs e idempotency_keys |
| cleanup-storage | Limpeza de arquivos órfãos no Storage |

## Supabase Storage

Buckets privados para arquivos de atividades e avatares. URLs assinadas com TTL de 1 hora via `createSignedUrl`.

## Rate limiting

Tabela `rate_limit_tracker` + função `check_rate_limit()`. Limite: 10 req/min por usuário. Aplicado nas RPCs financeiras.

## Idempotência

Tabela `idempotency_keys` previne operações duplicadas. RPCs financeiras verificam a chave antes de executar.

Chave gerada no frontend via `crypto.randomUUID()` e armazenada em `useRef` para sobreviver a re-renders.

## Gestão de agenda

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

### Status de aula
```
Agendada     → class_date > hoje OU start_at > agora
Em andamento → start_at <= agora < end_at
Pendente     → class_date <= hoje, attendance = null, end_at < agora
Concluída    → attendance != null
```

### Cálculo de vencimentos
Quando `students.pay_day` muda, a RPC `update_student_payment_day` recalcula `due_date` de todas as cobranças pendentes do aluno.

## Fluxo de pagamento

```
1. Professor cria cobrança (financial_records, status='pendente')
2. Aluno faz upload de comprovante (payment_proof_url, payment_proof_status='pending')
3. Professor aprova → confirm_payment_idempotent() → status='pago', confirmed_by_user_id
   OU
   Professor rejeita → payment_proof_status='rejected', payment_proof_rejection_reason
4. Aluno pode reenviar comprovante após rejeição (migration 16 corrigiu este bug)
```

## Pagamentos

O sistema não tem integrações com gateways de pagamento (Mercado Pago, Stripe, etc.). Pagamentos são registrados manualmente pelo professor ou confirmados via upload de comprovante pelo aluno.

RPCs financeiras usam `idempotency_keys`:
- `mark_as_paid_idempotent(record_id, payment_method, idempotency_key)`
- `confirm_payment_idempotent(record_id, idempotency_key)`
- `undo_payment_idempotent(record_id, idempotency_key)`

## Bugs identificados

### BACK-001: Race condition na criação de usuário
**Severidade:** Crítica

`invite-user` Edge Function verifica duplicidade de email com SELECT antes de criar o usuário, mas não usa transação atômica. Dois requests simultâneos com o mesmo email podem passar pela verificação antes de qualquer um inserir.

**Fix:** Garantir que o rollback (`rollbackAuthUser`) seja sempre executado em caso de erro:
```ts
let userId: string | null = null;
try {
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser(...);
  userId = authUser.user.id;
  await waitForProfile(userId, supabaseAdmin);
} catch (err) {
  if (userId) await rollbackAuthUser(supabaseAdmin, userId);
  throw err;
}
```

### BACK-002: Timezone bug em getDateRangeForPeriod
**Severidade:** Alta

Usa `toISOString()` que converte para UTC, mas o servidor pode estar em fuso diferente do usuário. Para um usuário em UTC-3 (Brasil), às 22h do dia 31/01, `new Date()` retorna 01/02 em UTC, fazendo o filtro de "mês atual" incluir dias do mês seguinte.

**Fix:** Usar formatação local:
```ts
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

### BACK-003: Timezone bug em isOverdue
**Severidade:** Alta

Usa `new Date(dueDateStr + "T12:00:00")` sem timezone explícito. Em servidores com timezone diferente de UTC-3, "T12:00:00" pode ser interpretado como UTC, fazendo cobranças aparecerem como atrasadas antes do fim do dia local.

**Fix:** Comparar apenas as partes de data sem conversão de timezone:
```ts
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return dueDateStr < todayStr;
}
```

### BACK-004: Mistura de DATE e TIMESTAMPTZ
**Severidade:** Alta

`class_date` (DATE) e `start_at`/`end_at` (TIMESTAMPTZ) são comparados sem conversão consistente. Para um professor em UTC-3 que agenda uma aula para 08:00 local, `start_at` é armazenado como `11:00 UTC`. Quando o frontend compara `startAt > now`, está comparando UTC com local.

**Fix:** Sempre trabalhar em UTC:
```ts
const nowUtc = new Date();
const startAtUtc = item.start_at ? new Date(item.start_at) : null;
if (startAtUtc && startAtUtc > nowUtc) return { label: "Agendada", variant: "info" };
```

### BACK-005: Race condition em idempotency_keys
**Severidade:** Média

O padrão SELECT → INSERT não é atômico. Dois requests simultâneos com a mesma chave podem ambos passar pelo SELECT sem encontrar registro e ambos tentarem INSERT.

**Fix:** Usar `INSERT ... ON CONFLICT DO NOTHING RETURNING *`.

### BACK-006: Senha em texto plano no response
**Severidade:** Média

Frontend em `useUserMutations.ts` espera `password` no response e usa para exibir ao admin. A senha é necessária para o admin comunicar ao usuário (fluxo intencional), mas deve ser tratada com cuidado — não logar, não persistir em estado global.

**Fix:** Garantir que a senha nunca seja logada e seja limpa do estado após exibição.

### BACK-007: Fallback silencioso na criptografia
**Severidade:** Baixa

`encrypt_sensitive_data` tem fallback silencioso — se a chave de criptografia não estiver configurada, retorna o dado em texto plano sem aviso.

**Fix:** Falhar explicitamente se a chave não estiver configurada.
