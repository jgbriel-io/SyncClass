# Backend - Supabase

## Configuração

```
Projeto: yxwtxewwszoovqrjrrfb
URL: https://yxwtxewwszoovqrjrrfb.supabase.co
```

Variáveis de ambiente:
- `VITE_SUPABASE_URL` - URL do projeto
- `VITE_SUPABASE_PUBLISHABLE_KEY` - anon key (pública, segura para frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - service role key (apenas scripts admin, nunca no frontend)

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

Todas as tabelas têm RLS habilitado. Ver `docs/back/seguranca.md` para políticas detalhadas.

Funções helper (todas com SECURITY DEFINER):
- `is_admin()` - verifica `profiles.role = 'admin'`
- `is_teacher()` - verifica `profiles.role = 'teacher'`
- `is_student()` - verifica `profiles.role = 'student'`

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

- `students_with_stats` - alunos com total de aulas e valores do mês
- `students_active` - alunos ativos (is_deleted=false, status=ativo)
- `students_masked` - dados anonimizados para LGPD
- `teachers_masked` - dados anonimizados para LGPD
- `teachers_with_pix_restricted` - PIX visível apenas para admin
- `class_logs_with_billing` - aulas com valores calculados
- `activities_active` - atividades não deletadas (SECURITY INVOKER)

Materialized views (refresh manual):
- `activities_dashboard` - estatísticas de atividades
- `financial_dashboard` - estatísticas financeiras

## Edge Functions

Localizadas em `supabase/functions/`. Usadas para operações que precisam de service role ou lógica server-side.

## Rate Limiting

Tabela `rate_limit_tracker` + função `check_rate_limit()`. Limite: 10 req/min por usuário. Aplicado nas RPCs financeiras.

## Idempotência

Tabela `idempotency_keys` previne operações duplicadas. RPCs financeiras verificam a chave antes de executar.
