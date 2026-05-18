---
name: syncclass-database
description: SyncClass database guide — Supabase migrations, PostgreSQL schema (11 tables), TypeScript type generation, RLS policies. Use when creating or modifying tables, columns, indexes, constraints, RLS policies, or generating types after schema changes.
---

# Database — SyncClass

Schema management — Supabase, migrations, type generation.

## Objetivo

Gerenciar schema PostgreSQL via Supabase, criar migrations, gerar tipos TypeScript, sincronizar com código.

## Setup (One-time)

### Pré-requisitos
- Supabase CLI instalado (`supabase --version`)
- Supabase CLI logado (`supabase projects list`)
- Projeto linkado (`supabase link --project-ref <id>`)

### Verificar Setup
```bash
supabase projects list                       # Verificar login
supabase status                              # Verificar projeto linkado
# PowerShell:
Get-Content supabase/.temp/project-ref       # Project ref
# Bash (WSL/Git Bash):
cat supabase/.temp/project-ref
```

## Workflow: Atualizar Schema

### 1. Inspecionar Tabelas Atuais
```bash
supabase db pull                              # Puxa schema remoto
# PowerShell — última migration:
Get-ChildItem supabase/migrations/ | Sort-Object LastWriteTime | Select-Object -Last 1
```

### 2. Criar/Modificar Tabela
```bash
supabase migration create --name add_column_to_students
# Edita supabase/migrations/YYYYMMDDHHMMSS_add_column_to_students.sql
```

### 3. Aplicar Migração ao Banco Remoto
```bash
supabase db push                    # Apply migrations to hosted DB
```

### 4. Gerar Tipos TypeScript
```bash
supabase gen types --linked > src/integrations/supabase/types.ts
# ou redirecioná-lo para arquivo específico
```

### 5. Atualizar Código
- Verificar se tipos mudaram em `src/integrations/supabase/types.ts`.
- Atualizar consultas/mutations em `src/hooks/` (services e useXxx ficam juntos).
- Rodar TypeScript compiler: `npm run type-check` (atenção: hífen).

### 6. Sincronizar Local (se necessário)
```bash
supabase migration fetch --yes      # Puxa migrations remotas pra local
supabase db diff --linked           # Detecta drift entre local e remoto
```

## Schema Atual — Tabelas Principais

| Tabela | Descrição | Colunas Chave |
|--------|-----------|---------------|
| `teachers` | Professores | id, name, email, phone, hourly_rate, pix_key, status, anonymized_at |
| `students` | Alunos | id, name, email, phone, pay_day, hourly_rate, status, teacher_id, birth_date, origin, anonymized_at |
| `profiles` | Usuários | id, user_id, full_name, role, student_id, teacher_id, active, deleted_at |
| `user_roles` | Controle acesso | id, user_id, role, email |
| `class_logs` | Aulas | id, student_id, teacher_id, class_date, start_at, end_at, duration_minutes, attendance, title, grade, feedback |
| `financial_records` | Cobranças | id, student_id, class_log_id, amount, due_date, status, paid_at, payment_proof_url, payment_proof_status |
| `financial_record_class_logs` | N:N aulas-cobranças | financial_record_id, class_log_id |
| `activities` | Atividades | id, student_id, teacher_id, title, due_date, status, file_url, response_file_url, correction_file_url, grade |
| `audit_logs` | Auditoria | id, user_id, action_type, table_name, record_id, metadata |
| `idempotency_keys` | Idempotência | id, idempotency_key, operation, status |
| `performance_logs` | Performance | id, user_id, operation, duration_ms, metadata |

Ver: `supabase/migrations/` pra histórico completo (25 migrations atualmente).

## RLS (Row Level Security)

**Regra:** Cada tabela com dados de user deve ter policy RLS.

### Policy Padrão (Isolamento por Teacher)
```sql
-- Todos podem ver/editar apenas seus próprios dados
CREATE POLICY "Teachers can view own data"
  ON teachers FOR SELECT
  USING (auth.uid() = user_id);

-- Alunos isolados por professor
CREATE POLICY "Teachers can view own students"
  ON students FOR SELECT
  USING (teacher_id = (
    SELECT teacher_id FROM profiles WHERE user_id = auth.uid()
  ));
```

**Verificar:** Auditoria manual via SQL no Supabase Studio. Suítes E2E não implementadas ainda.

## Type Generation Issues

### Erro: "Could not find the '<column>' column"
- Schema mudou no banco remoto.
- Solução:
  ```bash
  supabase gen types --linked > src/integrations/supabase/types.ts
  npm run type-check
  # Atualizar código pra nova tipagem
  ```

### Erro: Tipos desync com código
```bash
supabase db diff --linked           # Detectar drift
supabase db pull MIGRATION_NAME     # Trazer migration local
supabase gen types --linked > src/integrations/supabase/types.ts
```

## Checklist Antes de Commitar Migration

- [ ] SQL syntax válido (testar localmente se possível)?
- [ ] Segurança: RLS policies aplicadas?
- [ ] Índices criados pra colunas frequentes de filter?
- [ ] Foreign keys com `ON DELETE CASCADE` ou `SET NULL` conforme apropriado?
- [ ] Tipos TypeScript atualizados (`supabase gen types --linked > src/integrations/supabase/types.ts`)?
- [ ] Código atualizado pra refletir novo schema?
- [ ] `npm run type-check` passa?
- [ ] `npm run test` (Vitest) ainda passa?
- [ ] `npm run lint` limpo?

## Troubleshooting

| Problema | Solução |
|----------|---------|
| MCP tools não conectam | Reconectar MCP em Kiro, fazer login Supabase no browser |
| Migration falha ao push | Rodar `supabase migration list` pra ver histórico, `supabase db pull` pra sincronizar |
| Types desincronizados | `supabase gen types --linked > src/integrations/supabase/types.ts` + atualizar código |
| Data não aparece na UI | Verificar RLS policies via Supabase Studio (SQL Editor) |
| Schema drift entre local/remoto | `supabase db diff --linked`, sincronizar com `supabase db pull` |

## Quando Usar Esta Skill

- Adicionar/modificar tabela ou coluna.
- Criar índice ou constraint.
- Implementar RLS policy.
- Gerar tipos TypeScript.
- Resolver conflitos de schema/tipos.
- Troubleshooting de dados não aparecendo.
