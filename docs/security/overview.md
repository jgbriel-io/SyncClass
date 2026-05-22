# Security

Autenticação, autorização (RLS), validações e proteções.

**Para quem:** Devs que precisam entender autenticação, RLS, validações ou trabalhar com segurança.

## Índice

- [Quando usar](#quando-usar)
- [Stack](#stack)
- [Documentação detalhada](#documentação-detalhada)
- [Proteções adicionais](#proteções-adicionais)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Implementar login/logout
- Verificar role do usuário
- Proteger rotas por role
- Validar inputs (Zod, triggers)
- Debugar "permission denied"

**Não use quando:**

- Procurar RLS policies detalhadas → [Database RLS](../database/rls.md)
- Procurar Edge Functions → [Backend Edge Functions](../backend/edge-functions.md)

## Stack

**Autenticação:**

- Supabase Auth (JWT)
- Roles: `admin`, `teacher`, `student`

**Autorização:**

- Row Level Security (RLS) ativo em todas as tabelas
- Funções helper: `is_admin()`, `is_teacher()`, `is_student()`

**Validações:**

- Frontend: Zod + React Hook Form
- Banco: Triggers, constraints, funções

**Proteções:**

- Rate limiting (10 req/min)
- Idempotência (previne double-click)
- Search path (anti-hijacking)
- SECURITY DEFINER (funções helper)
- SECURITY INVOKER (views)

## Documentação detalhada

### [Autenticação e Autorização](./auth-rls.md)

Supabase Auth, roles, RLS e sessões.

**Conteúdo:**

- Autenticação (Supabase Auth, JWT, login/logout)
- Roles (admin, teacher, student)
- Autorização (RLS, funções helper)
- Sessões (duração, invalidação, verificação periódica)

### [Validações](./validations.md)

Validações no banco, frontend e rate limiting.

**Conteúdo:**

- Validações no banco (triggers, constraints, funções)
- Validações no frontend (Zod + React Hook Form)
- Rate limiting (10 req/min, tabela rate_limit_tracker)
- Idempotência (previne double-click, tabela idempotency_keys)

## Proteções adicionais

**Views com SECURITY INVOKER:**

- Views herdam permissões do usuário, não do owner
- Previne escalação de privilégios

**Search path definido em todas as funções:**

- `SET search_path = public` em todas as funções
- Previne search_path hijacking

**Dados pessoais anonimizáveis (LGPD):**

- `anonymized_at` em teachers e students
- Funções de anonimização preservam integridade referencial

**Soft delete:**

- `deleted_at` em profiles preserva dados para auditoria
- `status` em students/teachers/activities

**Frontend:**

- Inputs sanitizados antes de enviar ao banco
- Mensagens de erro amigáveis (sem expor detalhes técnicos)
- Sem `data-testid` nos componentes (shadcn/ui padrão)

## Ver também

- [Database Overview](../database/overview.md) — Visão geral do banco
- [Database RLS](../database/rls.md) — Políticas RLS detalhadas
- [Backend RPCs](../backend/rpcs.md) — RPCs com validações
