# Sprint 23 — Backend Quality: Code Review Fixes

**Período:** 25/05/2026  
**Status:** ✅ Parcialmente implementada — 24/25 itens concluídos (ver status individual)  
**Tipo:** Segurança + Refatoração

## Contexto

Code review automatizado em duas passagens:

1. Migrations SQL, RPCs, hooks principais (useClassLogs, useFinancialRecords, useStudents, useActivities, useUsers, useTeachers)
2. Edge Functions (6 funções server-side) + hooks restantes (useUserMutations, usePaymentProof, useChangePassword, inviteUserService, etc.)

Foco em segurança (RLS, JWT, path traversal, rate limit), corretude (syntax error em Edge Function, error handling invertido) e performance (N+1, loops unbounded). Sprint 22 cobriu frontend; esta sprint fecha o ciclo.

---

## Itens

### BE-001 — RLS financial_records: INSERT sem checar ownership do aluno

**Severidade:** 🔴 Crítica (escalada de privilégio)  
**Esforço:** 30min  
**Implementado:** ✅ migration 32_fix_rls_ownership_policies.sql  
**Arquivo:** `supabase/migrations/04_rls_and_permissions.sql:269`

**Problema:** Policy de INSERT em `financial_records` permite que professor insira
registro para **qualquer aluno** — não há checagem de que o aluno pertence a esse
professor. Apenas as policies de SELECT filtram por relacionamento professor→aluno.

```sql
-- policy atual (problema)
CREATE POLICY "financial_records_insert" ON public.financial_records
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin()) OR (SELECT public.is_teacher())
  );
-- professor pode inserir para student_id de outro professor
```

**Fix:**

```sql
CREATE POLICY "financial_records_insert" ON public.financial_records
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students WHERE teacher_id = auth.uid()
      )
    )
  );
```

**Critério de aceite:** Professor A não consegue inserir `financial_records` para
aluno do Professor B. Admin consegue inserir para qualquer aluno.

---

### BE-002 — RLS activities INSERT: teacher pode criar para qualquer aluno

**Severidade:** 🟠 Alta  
**Esforço:** 20min  
**Implementado:** ✅ migration 32_fix_rls_ownership_policies.sql  
**Arquivo:** `supabase/migrations/04_rls_and_permissions.sql:342`

**Problema:** Policy de INSERT em `activities` checa `is_teacher()` mas não
verifica que o `student_id` pertence ao professor autenticado. Professor pode
criar atividade para aluno de outro professor.

**Fix:**

```sql
CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students WHERE teacher_id = auth.uid()
      )
    )
  );
```

**Critério de aceite:** Criar atividade com `student_id` de outro professor
retorna erro RLS. Criar para próprio aluno funciona normalmente.

---

### BE-003 — `upsert_user_role_safe` sem GRANT EXECUTE

**Severidade:** 🟠 Alta  
**Esforço:** 15min  
**Implementado:** ✅ migration 32_fix_rls_ownership_policies.sql  
**Arquivo:** `supabase/migrations/03_rpcs_and_triggers.sql:623`

**Problema:** Função `upsert_user_role_safe` definida como `SECURITY DEFINER`
mas sem `GRANT EXECUTE` para `authenticated` ou `service_role`. Usuários
autenticados não conseguem chamá-la via RPC — falha silenciosa em runtime.

**Fix:** Adicionar migration com os GRANTs:

```sql
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text) TO service_role;
```

**Critério de aceite:** Chamar `upsert_user_role_safe` via `supabase.rpc()`
retorna resultado sem erro de permissão.

---

### BE-004 — Rate limit não protege contra execuções concorrentes

**Severidade:** 🟠 Alta  
**Esforço:** 45min  
**Implementado:** ✅ useFinancialRecords.ts — mutationInFlight useRef em useCreateFinancialRecord  
**Arquivo:** `src/hooks/useFinancialRecords.ts:216`

**Problema:** A checagem de rate limit ocorre antes da execução do RPC, mas
múltiplas chamadas concorrentes podem passar pelo check simultaneamente antes
que qualquer uma complete e incremente o contador. O rate limit é verificado
no banco (via `check_rate_limit` RPC), mas o padrão de chamada no cliente não
serializa requisições.

**Contexto:** `check_rate_limit` usa `INSERT ... ON CONFLICT DO UPDATE` atomicamente
no banco — o problema real é apenas se o front-end faz múltiplas chamadas em
paralelo intencional ou acidental.

**Fix:** Adicionar debounce/lock local no cliente para evitar disparo paralelo:

```ts
const mutationInFlight = useRef(false);

mutationFn: async (data) => {
  if (mutationInFlight.current) throw new Error("Operação em andamento");
  mutationInFlight.current = true;
  try {
    return await supabase.rpc("create_financial_record", data);
  } finally {
    mutationInFlight.current = false;
  }
};
```

**Critério de aceite:** Duplo-click em "Salvar" não dispara dois RPCs simultâneos.
Rate limit no banco não pode ser bypassado via submissão paralela.

---

### BE-005 — N+1 em `enrichWithPackageFinancial` (useClassLogs)

**Severidade:** 🟡 Média  
**Esforço:** 1h  
**Implementado:** ✅ useClassLogs.ts — enrichWithPackageFinancial reescrito sem queries extras  
**Arquivo:** `src/hooks/useClassLogs.ts:274`

**Problema:** `enrichWithPackageFinancial` busca todos os class logs, depois
faz queries separadas para `financial_record_class_logs` e `financial_records`.
Resultado: 3 queries sequenciais onde 1 JOIN seria suficiente.

**Fix:** Consolidar em select com JOIN:

```ts
supabase.from("class_logs").select(`
    *,
    financial_record_class_logs(
      financial_records(id, amount, status, due_date)
    )
  `);
```

**Critério de aceite:** `enrichWithPackageFinancial` faz 1 query. Dados
retornados são idênticos.

---

### BE-006 — `syncStudentProfiles` loop sem limite de iterações

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Implementado:** ✅ useStudents.ts — .limit(1) em profilesByEmail em syncStudentProfiles  
**Arquivo:** `src/hooks/useStudents.ts:205`

**Problema:** `syncStudentProfiles` itera sobre array de profiles e faz
chamada RPC para cada um sequencialmente sem batching ou limite. Com 100+
profiles orfãos correspondentes ao email, executa 100+ RPCs — sem rate
limiting, pode travar a UI e estourar rate limit do Supabase.

**Fix:** Limitar a 1 match por email (só sync o primeiro profile encontrado)
ou usar RPC que recebe array e processa no banco:

```ts
// opção simples: pegar apenas o primeiro match
const profileToSync = profiles[0];
if (profileToSync) {
  await supabase.rpc("sync_student_profile", { profile_id: profileToSync.id });
}
```

**Critério de aceite:** `syncStudentProfiles` faz no máximo 1 RPC independente
do número de profiles encontrados.

---

### BE-007 — Attendance count em `get_class_logs_summary` usa semântica errada

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Implementado:** ✅ migration 33_fix_class_logs_summary_attendance.sql + useClassLogs.ts  
**Arquivo:** `supabase/migrations/29_class_logs_summary_rpc.sql:11`

**Problema:** Contagem de ausências usa `IS DISTINCT FROM true` — trata `NULL`
(aula não confirmada) como ausência. `total_absent` inclui aulas pendentes,
inflando o número de faltas reportado.

```sql
-- problemático: NULL é contado como ausente
COUNT(*) FILTER (WHERE attendance IS DISTINCT FROM true) AS total_absent
```

**Fix:**

```sql
-- correto: só conta ausências explícitas
COUNT(*) FILTER (WHERE attendance = false)   AS total_absent,
COUNT(*) FILTER (WHERE attendance IS NULL)   AS total_pending,
```

**Critério de aceite:** Aula sem `attendance` definido não aparece em `total_absent`.
Aparece em novo campo `total_pending`.

---

### BE-008 — Variável reutilizada em `create_class_package` (confusão semântica)

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Implementado:** ✅ migration 34_fix_class_package_variable_name.sql  
**Arquivo:** `supabase/migrations/30_fix_create_class_package_idempotency_race.sql:107`

**Problema:** `v_financial_record_id` é usado primeiro para guardar o `id` de
cada `class_log` inserido (linha 107, dentro do loop), depois para guardar o
`id` do `financial_record` real (linha 123). Variável com nome errado para o
primeiro uso — não causa bug funcional hoje, mas qualquer refactor pode
introduzir erro silencioso.

**Fix:** Renomear variável de loop:

```sql
DECLARE
  v_inserted_log_id UUID;  -- renomear: usado só no loop de class_logs
  v_financial_record_id UUID;  -- reservar para financial_records
...
RETURNING id INTO STRICT v_inserted_log_id;  -- linha 107
v_inserted_logs := array_append(v_inserted_logs, v_inserted_log_id);
```

**Critério de aceite:** Variáveis têm nomes que refletem seu uso. Comportamento
idêntico ao atual.

---

### BE-009 — `useUsers` busca unbounded de students e teachers

**Severidade:** 🟡 Média  
**Esforço:** 45min  
**Implementado:** ✅ useUsers.ts — .limit(1000) safety em useUsers() + useUsersPaginated já paginado  
**Arquivo:** `src/hooks/useUsers.ts:91`

**Problema:** Mesmo finding que FE-001 mas pelo ângulo de backend/dados: sem
`.limit()` ou `.range()`, queries retornam todos os registros em memória.
Para admin com 10k+ alunos, resposta do PostgREST pode atingir limite de
payload (~50MB default) ou causar timeout.

**Fix:** Ver FE-001 — adicionar paginação server-side.

**Critério de aceite:** Queries têm `.limit()` explícito. Sem timeout com
1.000+ registros.

---

### BE-010 — WebP validation sem bounds check (crash em arquivos < 12 bytes)

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Implementado:** ✅ useActivities.ts validateMagicBytes bounds check  
**Arquivo:** `src/hooks/useActivities.ts:147`

**Problema:** Validação de magic bytes para WebP acessa `bytes[8]` diretamente.
Arquivo com menos de 9 bytes faz o acesso retornar `undefined`, causando falha
na comparação — provavelmente aceita o arquivo como válido (undefined !== expected
value passa o check invertido), ou quebra com TypeError.

**Fix:**

```ts
if (bytes.length < 12) return false; // WebP mínimo 12 bytes
const isWebP = bytes[0] === 0x52 && bytes[8] === 0x57 ...
```

**Critério de aceite:** Arquivo de 0–11 bytes rejeitado com mensagem de erro
adequada. Sem crash/TypeError.

---

### BE-011 — Idempotency key ref não limpa em caso de erro

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Implementado:** ✅ useFinancialRecords.ts — finally block garante idempotencyKey reset em erro  
**Arquivo:** `src/hooks/useFinancialRecords.ts:360`

**Problema:** `idempotencyKeyRef.current` é resetado após sucesso mas não
no path de erro. Próxima chamada após falha reutiliza a mesma key — não é
bug funcional (RPC trata replay de key com status `failed` como retry válido),
mas é comportamento inesperado.

**Fix:**

```ts
onSettled: () => {
  idempotencyKeyRef.current = null; // limpar em sucesso E erro
};
```

**Critério de aceite:** Key limpa independente do resultado da mutação.

---

### BE-012 — `useSoftDeleteTeacher` update redundante de `teacher_id`

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Implementado:** ✅ useTeachers.ts — removido teacher_id: id redundante  
**Arquivo:** `src/hooks/useTeachers.ts:254`

**Problema:** Ao fazer soft delete de professor, há um `UPDATE profiles SET teacher_id = id`
que é no-op (seta o mesmo valor que já está lá). Provavelmente sobra de refactor.
Não causa bug mas executa query desnecessária a cada delete.

**Fix:** Remover o update redundante.

**Critério de aceite:** Soft delete de professor faz apenas as operações necessárias.
Sem update redundante em profiles.

---

### BE-013 — `useClassLogs` passa campos nullable para RPC sem validação

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Implementado:** ✅ useClassLogs.ts — validação amount/due_date antes do RPC create_class_package  
**Arquivo:** `src/hooks/useClassLogs.ts:729`

**Problema:** Chamada de `create_class_package` passa `p_financial_data` com
campos que TypeScript permite como `undefined` mas o schema do RPC espera
valores definidos (ex: `amount` poderia ser `0` ou `undefined`). Sem validação
no cliente antes da chamada, erros do banco chegam como mensagens genéricas.

**Fix:** Adicionar Zod schema de validação antes da chamada RPC:

```ts
const packageFinancialSchema = z.object({
  amount: z.number().min(0),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.string().optional(),
  description: z.string().optional(),
});

const validatedFinancial = packageFinancialSchema.parse(financialData);
```

**Critério de aceite:** Chamada com `amount: undefined` é rejeitada no cliente
com mensagem clara antes de atingir o banco.

---

### BE-014 — `reset-password` Edge Function: syntax error + signInWithPassword com service role

**Severidade:** 🔴 Crítica  
**Esforço:** 1h  
**Implementado:** ✅ Já implementado no código existente (verificado)  
**Arquivo:** `supabase/functions/reset-password/reset-password.ts:10,100`

**Problema (dois bugs no mesmo arquivo):**

1. Linha 10: chave de fechamento sem abertura correspondente — função falha no parse/deploy.
2. Linha 100: `supabaseAdmin.auth.signInWithPassword()` chamado com service role key.
   Service role não pode autenticar via senha; chamada sempre falha silenciosamente.

**Fix:**

1. Corrigir a chave de fechamento órfã (syntax error).
2. Substituir por cliente autenticado do usuário para validar senha atual:

```ts
// usar client do usuário, não admin
const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
});
const { error } = await userClient.auth.signInWithPassword({
  email,
  password: currentPassword,
});
```

**Critério de aceite:** Edge Function deploya sem erro. Reset de senha valida senha atual corretamente.

---

### BE-015 — `admin-delete-user`: cleanup de profiles/user_roles sem error handling

**Severidade:** 🟠 Alta  
**Esforço:** 30min  
**Implementado:** ✅ admin-delete-user.ts — error handling no cleanup path  
**Arquivo:** `supabase/functions/admin-delete-user/admin-delete-user.ts:193`

**Problema:** Após deletar usuário do `auth.users`, a função limpa `profiles` e
`user_roles` manualmente. Se essas operações falharem, a função retorna 200 (sucesso)
— usuário deletado do auth mas dados orfãos permanecem nas tabelas públicas.

**Fix:** Verificar erros em cada cleanup:

```ts
const { error: profileError } = await supabaseAdmin.from('profiles').delete()...;
if (profileError) throw new Error(`Profile cleanup failed: ${profileError.message}`);

const { error: roleError } = await supabaseAdmin.from('user_roles').delete()...;
if (roleError) throw new Error(`Role cleanup failed: ${roleError.message}`);
```

**Critério de aceite:** Falha no cleanup retorna 500. Nenhum dado orfão em
`profiles`/`user_roles` após delete bem-sucedido.

---

### BE-016 — `export-user-data`: error handling de rate limit invertido

**Severidade:** 🟠 Alta  
**Esforço:** 20min  
**Implementado:** ✅ Já implementado corretamente (verificado em export-user-data/index.ts)  
**Arquivo:** `supabase/functions/export-user-data/index.ts:42`

**Problema:** `rateLimitError` é capturado mas a função continua execução.
Lógica usa `if (!rateLimitError)` para prosseguir — quando há erro de rate limit,
`!rateLimitError` é `false`, então a exportação não ocorre, mas também não retorna
erro 429. Usuário recebe resposta de sucesso vazia.

**Fix:**

```ts
if (rateLimitError) {
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers: corsHeaders,
  });
}
```

**Critério de aceite:** Rate limit retorna HTTP 429. Usuário vê mensagem de erro clara.

---

### BE-017 — `useChangePassword`: troca de senha sem validar senha atual

**Severidade:** 🟠 Alta  
**Esforço:** 30min  
**Implementado:** ✅ useChangePassword.ts — re-autenticação antes de updateUser  
**Arquivo:** `src/hooks/useChangePassword.ts:25`

**Problema:** `supabase.auth.updateUser({ password: newPassword })` troca a senha
diretamente sem verificar `currentPassword`. Qualquer sessão ativa (inclusive
token roubado) pode trocar a senha sem conhecer a original.

**Fix:** Re-autenticar antes de trocar:

```ts
// 1. Verificar senha atual
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: currentPassword,
});
if (signInError) throw new Error("Senha atual incorreta");

// 2. Só então atualizar
await supabase.auth.updateUser({ password: newPassword });
```

**Critério de aceite:** Trocar senha com senha atual errada retorna erro.
Sem acesso ao formulário de mudança de senha, token roubado não muda senha.

---

### BE-018 — `usePaymentProof`: path traversal via `financialRecordId`

**Severidade:** 🟠 Alta  
**Esforço:** 20min  
**Implementado:** ✅ usePaymentProof.ts — sanitização do financialRecordId  
**Arquivo:** `src/hooks/usePaymentProof.ts:43`

**Problema:** `financialRecordId` usado diretamente no path de storage sem sanitização.
UUIDs de banco não contêm `/`, mas se o valor vier de outra fonte ou for manipulado,
`payment-proofs/${financialRecordId}/proof.jpg` poderia escrever em diretório errado.

**Fix:** Sanitizar o ID antes de usar no path:

```ts
const safeId = financialRecordId.replace(/[^a-zA-Z0-9-]/g, "");
const storagePath = `payment-proofs/${safeId}/proof.jpg`;
```

**Critério de aceite:** Qualquer caractere não-alphanumeric/hífen removido do path. Sem path traversal.

---

### BE-019 — `cleanup-old-records` e `cleanup-storage`: cron secret fraco

**Severidade:** 🟡 Média  
**Esforço:** 30min  
**Implementado:** ✅ cleanup-old-records.ts + cleanup-storage.ts — comparação exata de cron secret  
**Arquivos:** `supabase/functions/cleanup-old-records/cleanup-old-records.ts:75`, `supabase/functions/cleanup-storage/cleanup-storage.ts:178`

**Problema:** Validação do cron secret usa `string.includes(serviceRoleKey)` — aceita qualquer
string que contenha a key como substring. Combinação de fallback também usa OR:
`cronSecret !== expected AND !authHeader?.includes(serviceRoleKey)` — lógica de autorização
com dois caminhos diferentes, um fraco.

**Fix:** Comparação exata + timing-safe:

```ts
import { timingSafeEqual } from "node:crypto"; // ou equivalente Deno
const isValid = cronSecret === expectedCronSecret;
if (!isValid) return new Response("Unauthorized", { status: 401 });
```

**Critério de aceite:** Apenas o cron secret exato autoriza execução. Partial match rejeitado.

---

### BE-020 — `invite-user`: non-null assertion em authHeader possivelmente null

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Implementado:** ✅ Já implementado — jwt check antes do uso do authHeader  
**Arquivo:** `supabase/functions/invite-user/invite-user.ts:51`

**Problema:** `authHeader!` força non-null mas header pode ser ausente se chamado
sem token. Downstream `createClient` recebe `undefined` como token — requisição
continua como anon user sem erro explícito.

**Fix:**

```ts
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Authorization required" }), {
    status: 401,
  });
}
```

**Critério de aceite:** Chamada sem Authorization header retorna 401 imediatamente.

---

### BE-021 — `invite-user/validation`: `data.phone` cast sem null check

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Implementado:** ✅ invite-user/validation.ts — phone undefined tratado com fallback ""  
**Arquivo:** `supabase/functions/invite-user/validation.ts:9`

**Problema:** `String(data.phone)` sem checar `data.phone !== undefined`. Se
campo ausente no body, `String(undefined)` = `"undefined"` — passa validação
de comprimento mas grava string literal "undefined" no banco.

**Fix:**

```ts
const phone = data.phone != null ? String(data.phone) : undefined;
```

**Critério de aceite:** Campo `phone` ausente no body não grava `"undefined"`. Campo tratado como ausente.

---

### BE-022 — `useUserProfileMutations`: delete retorna sucesso mesmo se update falhar

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Implementado:** ✅ Já implementado — error check existe em useDeleteUser  
**Arquivo:** `src/hooks/useUserProfileMutations.ts:289`

**Problema:** `useDeleteUser` faz update de `active: false` em profiles mas não
verifica se o update teve efeito. Se falhar (RLS, rede), `onSuccess` é chamado
e UI remove o usuário da lista — inconsistência entre UI e banco.

**Fix:**

```ts
const { error } = await supabase
  .from("profiles")
  .update({ active: false })
  .eq("user_id", userId);
if (error) throw error;
```

**Critério de aceite:** Falha no update do profile propaga erro para `onError`.
UI não remove usuário da lista em caso de falha.

---

### BE-023 — CORS wildcard em Edge Functions autenticadas

**Severidade:** 🟡 Média  
**Esforço:** 20min  
**Implementado:** ✅ \_shared/utils.ts — ALLOWED_ORIGIN via env var APP_ORIGIN  
**Arquivo:** `supabase/functions/_shared/utils.ts:2`

**Problema:** `"Access-Control-Allow-Origin": "*"` em todas as functions, incluindo
as que requerem autenticação (`admin-delete-user`, `invite-user`, `reset-password`).
Wildcard CORS em endpoints autenticados permite requests cross-origin de qualquer domínio.

**Fix:** Restringir ao domínio da aplicação em produção:

```ts
const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') ?? '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  ...
};
```

**Critério de aceite:** Em produção, `APP_ORIGIN` seta domínio específico. Em dev, mantém `*`.

---

### BE-024 — `usePaymentProof`: URL split frágil para extrair path

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Implementado:** ✅ usePaymentProof.ts — URL API substituindo split frágil  
**Arquivo:** `src/hooks/usePaymentProof.ts:125`

**Problema:** `url.split('/payment-proofs/')[1]` assume que o delimitador aparece
exatamente uma vez e o resultado está em index 1. URL com domínio contendo
`payment-proofs` ou path duplo retornaria índice errado.

**Fix:** Usar `URL` API para extrair path de forma robusta:

```ts
const urlObj = new URL(url);
const storagePath = urlObj.pathname.split("/payment-proofs/").pop();
```

**Critério de aceite:** URLs com domínios incomuns ou paths compostos extraem path corretamente.

---

### BE-025 — `inviteUserService`: ambiguidade entre sucesso parcial e falha total

**Severidade:** 🔵 Info  
**Esforço:** 30min  
**Implementado:** ✅ inviteUserService.ts — throw quando ambos fallback paths falham  
**Arquivo:** `src/hooks/inviteUserService.ts:334`

**Problema:** Após falha no RPC principal, função tenta fallback manual (insert em profiles + user_roles).
Se o fallback também falhar parcialmente (profiles ok, user_roles falha), função não distingue
entre "RPC funcionou", "fallback completo" e "fallback parcial" — usuário convidado
pode existir sem role atribuída.

**Fix:** Usar transação atômica ou verificar estado completo após ambos os caminhos:

```ts
const { error: rpcError } = await supabase.rpc('upsert_user_role_safe', ...);
if (rpcError) {
  // fallback: verificar se ambos succeeded
  const [profileResult, roleResult] = await Promise.all([...]);
  if (profileResult.error || roleResult.error) throw new Error('Invite failed');
}
```

**Critério de aceite:** Usuário convidado sempre tem profile + role ou nenhum dos dois.
Sem estado parcial.

---

## Ordem de Implementação Recomendada

| #   | Item   | Esforço | Risco | Impacto                                              |
| --- | ------ | ------- | ----- | ---------------------------------------------------- |
| 1   | BE-001 | 30min   | Alto  | 🔴 RLS gap — professor acessa dados alheios          |
| 2   | BE-014 | 1h      | Alto  | 🔴 Syntax error + signInWithPassword com service key |
| 3   | BE-017 | 30min   | Alto  | 🔴 Troca de senha sem validar senha atual            |
| 4   | BE-002 | 20min   | Alto  | 🟠 RLS gap — activities ownership                    |
| 5   | BE-003 | 15min   | Alto  | 🟠 GRANT faltante — função inacessível               |
| 6   | BE-015 | 30min   | Alto  | 🟠 admin-delete-user: cleanup sem error handling     |
| 7   | BE-016 | 20min   | Alto  | 🟠 export-user-data: rate limit handling invertido   |
| 8   | BE-018 | 20min   | Alto  | 🟠 Path traversal em storage path                    |
| 9   | BE-007 | 20min   | Baixo | Summary SQL: ausências infladas                      |
| 10  | BE-008 | 15min   | Baixo | Variável mal-nomeada em migration 30                 |
| 11  | BE-019 | 30min   | Médio | Cron secret validação fraca (2 functions)            |
| 12  | BE-020 | 15min   | Médio | invite-user: authHeader non-null assertion           |
| 13  | BE-021 | 10min   | Baixo | invite-user/validation: phone cast sem null check    |
| 14  | BE-022 | 20min   | Médio | useDeleteUser: sucesso falso em falha de update      |
| 15  | BE-023 | 20min   | Médio | CORS wildcard em endpoints autenticados              |
| 16  | BE-010 | 15min   | Baixo | Crash WebP < 12 bytes                                |
| 17  | BE-013 | 20min   | Baixo | Validação Zod antes de RPC create_class_package      |
| 18  | BE-004 | 45min   | Médio | Double-submit race condition                         |
| 19  | BE-006 | 30min   | Médio | Loop unbounded em syncStudentProfiles                |
| 20  | BE-005 | 1h      | Médio | N+1 em enrichWithPackageFinancial                    |
| 21  | BE-009 | 45min   | Médio | Unbounded query (ver FE-001)                         |
| 22  | BE-011 | 10min   | Baixo | Idempotency key ref não limpa em erro                |
| 23  | BE-012 | 10min   | Baixo | Update redundante soft delete                        |
| 24  | BE-024 | 10min   | Baixo | URL split frágil em usePaymentProof                  |
| 25  | BE-025 | 30min   | Médio | inviteUserService: sucesso parcial não detectado     |

**Total estimado:** ~10h30min

## Dependências

- BE-001, BE-002 — nova migration SQL para alterar RLS policies existentes
- BE-003 — nova migration com GRANT EXECUTE
- BE-007 — nova migration para alterar `get_class_logs_summary` + atualizar tipo no hook
- BE-008 — migration 32 com `CREATE OR REPLACE FUNCTION` para renomear variável
- BE-009 — depende de FE-001 (mesma solução de paginação, implementar junto)
- BE-014 — redeploy da Edge Function `reset-password` após fix
- Demais itens (BE-010 a BE-025 exceto SQL) — mudanças TypeScript puras, zero migration

## Referências

- [Sprint 22](./sprint-22-frontend-quality-fixes.md) — Frontend code review fixes
- [Sprint 18](./sprint-18-consolidacao-problemas-identificados.md) — Code review original (bugs backend)
- `supabase/migrations/04_rls_and_permissions.sql` — BE-001, BE-002
- `supabase/migrations/03_rpcs_and_triggers.sql` — BE-003
- `supabase/migrations/29_class_logs_summary_rpc.sql` — BE-007
- `supabase/migrations/30_fix_create_class_package_idempotency_race.sql` — BE-008
- `supabase/functions/reset-password/` — BE-014
- `supabase/functions/admin-delete-user/` — BE-015
- `supabase/functions/export-user-data/` — BE-016
- `supabase/functions/cleanup-old-records/`, `cleanup-storage/` — BE-019
- `supabase/functions/invite-user/` — BE-020, BE-021, BE-025
- `supabase/functions/_shared/utils.ts` — BE-023
- `src/hooks/useClassLogs.ts` — BE-005, BE-013
- `src/hooks/useFinancialRecords.ts` — BE-004, BE-011
- `src/hooks/useStudents.ts` — BE-006
- `src/hooks/useActivities.ts` — BE-010
- `src/hooks/useTeachers.ts` — BE-012
- `src/hooks/useUsers.ts` — BE-009
- `src/hooks/useChangePassword.ts` — BE-017
- `src/hooks/usePaymentProof.ts` — BE-018, BE-024
- `src/hooks/useUserProfileMutations.ts` — BE-022
- `src/hooks/inviteUserService.ts` — BE-025
