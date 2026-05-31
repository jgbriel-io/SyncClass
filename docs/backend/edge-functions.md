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
└── _shared/                  ← utilitários compartilhados
```

**Padrão:** Entry point `index.ts` importa implementação de arquivo separado (facilita testes).

## invite-user

**Responsabilidade:** Criação atômica de usuário (auth + profiles + student/teacher) com rollback em caso de erro.

**Arquivo:** `supabase/functions/invite-user/invite-user.ts`

**Fluxo:**

1. Valida role (admin, teacher, student)
2. Gera senha temporária (8 chars alfanuméricos)
3. Cria auth user via `supabaseAdmin.auth.admin.createUser()`
4. Aguarda profile ser criado (trigger automático)
5. Cria student/teacher se role = student/teacher
6. Vincula student_id/teacher_id no profile
7. Retorna `{ userId, email, password }`

**Rollback:** Se qualquer passo falha, deleta auth user criado.

**Rate limiting:** 20 req/min via `check_rate_limit('invite_user', 20, 1)`

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
