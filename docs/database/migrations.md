# Migrations

Histórico de migrations, sequência de aplicação e dependências.

## Índice

- [Quando usar](#quando-usar)
- [Sequência](#sequência)
- [Dependências críticas](#dependências-críticas)
- [Como aplicar](#como-aplicar)
- [Ver também](#ver-também)

## Quando usar

**Use migrations quando:**

- Criar/alterar tabelas, colunas, constraints
- Criar/alterar funções, triggers, views
- Criar/alterar índices
- Alterar RLS policies

**Não use quando:**

- Inserir dados (usar seeds ou scripts separados)
- Alterar dados existentes (usar data migrations separadas)

## Sequência

Localizadas em `supabase/migrations/`, aplicar em ordem sequencial.

| #   | Arquivo                           | O que faz                                                                                                                                     |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | structure                         | Tabelas base, tipos customizados, extensões, índices                                                                                          |
| 02  | logic_and_views                   | Views, triggers de updated_at, funções de anonimização LGPD                                                                                   |
| 03  | rpcs_and_triggers                 | RPCs: create_class_package, mark_as_paid, confirm_payment, undo_payment                                                                       |
| 04  | rls_and_permissions               | RLS habilitado em todas as tabelas, funções helper, 40+ policies                                                                              |
| 05  | cpf_removal_and_country           | Remove CPF, adiciona coluna country, soft delete em profiles                                                                                  |
| 06  | fix_anonymization_functions       | Corrige funções de anonimização após remoção do CPF                                                                                           |
| 07  | add_rate_limiting                 | Tabela rate_limit_tracker, função check_rate_limit() (10 req/min)                                                                             |
| 08  | add_must_change_password          | Campo must_change_password em profiles                                                                                                        |
| 09  | fix_search_path_security          | SET search_path em todas as funções (anti search_path hijacking)                                                                              |
| 10  | security_improvements             | Constraint grade 0-100, soft delete em activities, pgcrypto                                                                                   |
| 11  | fix_views_security_invoker        | Views com SECURITY INVOKER, funções de limpeza de storage                                                                                     |
| 12  | consistency_improvements          | Validação de email (is_valid_email), índices para soft delete                                                                                 |
| 13  | encrypt_pix_keys                  | View teachers_with_pix_restricted, função is_valid_pix_key()                                                                                  |
| 14  | invalidate_sessions_on_deactivate | Trigger invalida sessões ao desativar conta                                                                                                   |
| 15  | create_materialized_views         | Materialized views: activities_dashboard, financial_dashboard                                                                                 |
| 16  | fix_payment_proof_rejection       | Fix: aluno pode reenviar comprovante após rejeição                                                                                            |
| 17  | fix_rls_policies_uuid_cast        | Cast ::uuid explícito em policies de profiles e user_roles                                                                                    |
| 18  | fix_production_uuid_and_triggers  | Consolida: funções helper + trigger + RLS com cast correto                                                                                    |
| 19  | disable_sessions_trigger_temp     | Desabilita trigger de sessões (corrigido em 18, pode ser revertido)                                                                           |
| 20  | confirm_all_users                 | Confirma email de todos os usuários (usar apenas em dev/homolog)                                                                              |
| 21  | fix_critical_bugs                 | 4 fixes críticos: is_admin() SECURITY DEFINER, validate_financial_logic() CASE+ELSE, vincula profiles com teachers/students, sincroniza roles |

## Dependências críticas

**04 depende de 02:**

- 04 cria RLS policies que usam funções helper criadas em 02
- Sem 02, 04 falha com "function does not exist"

**07 depende de 03:**

- 07 atualiza RPCs criadas em 03 para adicionar rate limiting
- Sem 03, 07 falha com "function does not exist"

**14 depende de 04:**

- 14 cria trigger em `profiles` que depende de RLS habilitado em 04
- Sem 04, 14 pode causar recursão infinita

**17 e 18 corrigem bugs introduzidos em 04:**

- 04 criou policies com cast UUID incorreto
- 17 e 18 corrigem essas policies
- Sem 17/18, queries em `profiles` e `user_roles` falham com "invalid input syntax for type uuid"

**21 deve ser aplicada após 04 e 10:**

- 21 corrige bugs introduzidos em 04 (is_admin() sem SECURITY DEFINER)
- 21 corrige bugs introduzidos em 10 (validate_financial_logic() sem ELSE)
- Sem 21, RLS causa recursão infinita e HTTP 500

## Como aplicar

### Aplicar todas as migrations pendentes

```bash
npx supabase db push
```

### Aplicar arquivo específico

```bash
npx supabase db execute --file supabase/migrations/21_fix_critical_bugs.sql
```

### Verificar migrations aplicadas

```bash
npx supabase db list-migrations
```

### Criar nova migration

```bash
npx supabase migration new nome_da_migration
```

## Ver também

- [Database Overview](./overview.md) — Visão geral do banco
- [Schema](./schema.md) — Tabelas e relacionamentos
- [RLS](./rls.md) — Row Level Security
