# Backend

Backend Supabase com Edge Functions, RPCs e integrações. Sem servidor de aplicação próprio — PostgREST gera API REST automática do schema PostgreSQL.

**Para quem:** Devs que precisam entender backend, adicionar Edge Functions, criar RPCs ou debugar integrações.

## Índice

- [Quando usar](#quando-usar)
- [Configuração](#configuração)
- [Arquitetura](#arquitetura)
- [Documentação detalhada](#documentação-detalhada)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Adicionar Edge Function (lógica server-side, service role)
- Criar RPC (operação complexa, transação atômica)
- Integrar Storage (upload, signed URLs)
- Debugar rate limiting ou idempotência
- Entender fluxos de pagamento

**Não use quando:**

- Procurar schema do banco → [Database Overview](../database/overview.md)
- Procurar políticas RLS → [Security Overview](../security/overview.md)
- Procurar padrões de query → [Architecture Patterns](../architecture/patterns.md)

## Configuração

```
Projeto: yxwtxewwszoovqrjrrfb
URL: https://yxwtxewwszoovqrjrrfb.supabase.co
```

**Variáveis de ambiente:**

- `VITE_SUPABASE_URL` — URL do projeto (frontend)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon key (frontend, segura)
- `SUPABASE_SERVICE_ROLE_KEY` — service role (Edge Functions, nunca frontend)

**Client:**

```ts
// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, anonKey);
```

## Arquitetura

**Camadas:**

```
Frontend (React)
    ↓ HTTPS
Supabase BaaS
    ├── PostgREST (API REST automática)
    ├── GoTrue (Auth JWT)
    ├── Storage (arquivos)
    ├── Realtime (WebSocket)
    └── Edge Functions (Deno/TS)
         ↓
    PostgreSQL 15
         ├── RLS Policies
         ├── Triggers
         ├── RPCs
         └── Views
```

**Sem servidor de aplicação próprio.** PostgREST expõe tabelas como endpoints REST. Edge Functions para lógica que precisa de service role ou server-side.

## Documentação detalhada

### [Edge Functions](./edge-functions.md)

6 functions Deno/TS para operações server-side.

**Conteúdo:**

- `invite-user` — criação atômica de usuário com rollback
- `admin-delete-user` — deleção com invalidação de sessões
- `reset-password` — reset via service_role
- `export-user-data` — exportação de dados pessoais (LGPD)
- `cleanup-old-records` — limpeza periódica de logs
- `cleanup-storage` — limpeza de arquivos órfãos

### [RPCs, Triggers e Views](./rpcs.md)

Operações complexas no banco.

**Conteúdo:**

- RPCs principais (create_class_package, mark_as_paid_idempotent, etc)
- Triggers ativos (validate_financial_logic, set_updated_at, etc)
- Views (students_with_stats, financial_dashboard, etc)
- Materialized views (refresh manual)

### [Integrações](./integrations.md)

Storage, rate limiting, idempotência, fluxos de pagamento.

**Conteúdo:**

- Supabase Storage (buckets, signed URLs)
- Rate limiting (10 req/min)
- Idempotência (crypto.randomUUID + useRef)
- Fluxo de pagamento (manual, sem gateway)
- Gestão de agenda (conflito de horário, status de aula)

### [Bugs Conhecidos](./bugs.md)

7 bugs identificados com severidade e fix.

**Resumo:**

- BACK-001: Race condition na criação de usuário (crítica)
- BACK-002: Timezone bug em getDateRangeForPeriod (alta)
- BACK-003: Timezone bug em isOverdue (alta)
- BACK-004: Mistura de DATE e TIMESTAMPTZ (alta)
- BACK-005: Race condition em idempotency_keys (média)
- BACK-006: Senha em texto plano no response (média)
- BACK-007: Fallback silencioso na criptografia (baixa)

## Ver também

- [Database Overview](../database/overview.md) — Schema, migrations, índices
- [Security Overview](../security/overview.md) — RLS, auth, rate limiting
- [Architecture Overview](../architecture/overview.md) — Visão geral da arquitetura
- [Architecture Troubleshooting](../architecture/troubleshooting.md) — Erros comuns
