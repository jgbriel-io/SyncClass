# Database

PostgreSQL 15 via Supabase. Schema, migrations, RLS.

**Para quem:** Devs que precisam entender schema, criar migrations, debugar RLS ou trabalhar com banco.

## Índice

- [Quando usar](#quando-usar)
- [Stack](#stack)
- [Documentação detalhada](#documentação-detalhada)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Criar/alterar tabelas, colunas, constraints
- Criar/alterar funções, triggers, views
- Debugar "permission denied" (RLS)
- Entender relacionamentos entre tabelas

**Não use quando:**

- Procurar hooks de data fetching → [Frontend Hooks](../frontend/hooks.md)
- Procurar Edge Functions → [Backend Edge Functions](../backend/edge-functions.md)
- Procurar padrões de arquitetura → [Architecture Patterns](../architecture/patterns.md)

## Stack

**Core:**

- PostgreSQL 15 (Supabase)
- PostgREST (API REST automática)
- Row Level Security (RLS) ativo em todas as tabelas

**Extensões:**

- `uuid-ossp` — geração de UUIDs
- `pgcrypto` — criptografia (PIX keys)
- `pg_stat_statements` — métricas de performance

**Ferramentas:**

- Supabase CLI — migrations, seeds, deploy
- Supabase Studio — UI para explorar schema

## Documentação detalhada

### [Schema](./schema.md)

Tabelas, relacionamentos e integridade referencial.

**Conteúdo:**

- Diagrama de relacionamentos (auth.users → profiles → teachers/students)
- 11 tabelas principais (teachers, students, class_logs, financial_records, activities, etc)
- Relacionamentos 1:N, N:N, 1:1
- Integridade referencial (CASCADE, SET NULL, RESTRICT)
- 13 bugs identificados (DB-001 a DB-013) com fixes

### [Migrations](./migrations.md)

Histórico de migrations, sequência de aplicação e dependências.

**Conteúdo:**

- 70 migrations aplicadas (structure, logic, rpcs, rls, fixes, sprints 18–31)
- Dependências críticas (04 depende de 02, 21 corrige bugs de 04 e 10, 44 dropa materialized views não usadas)
- Como aplicar (`npx supabase db push`)
- Como criar nova migration

### [RLS](./rls.md)

Row Level Security — políticas de acesso por tabela.

**Conteúdo:**

- Funções helper (is_admin, is_teacher, is_student) com SECURITY DEFINER
- Políticas por tabela (profiles, teachers, students, financial_records, activities, class_logs)
- Troubleshooting (permission denied, infinite recursion, invalid UUID cast)

## Ver também

- [Backend Overview](../backend/overview.md) — Edge Functions, RPCs
- [Security Overview](../security/overview.md) — Autenticação, validações
- [Architecture Overview](../architecture/overview.md) — Visão geral da arquitetura
