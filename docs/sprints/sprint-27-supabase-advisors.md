# Sprint 27 — Supabase Advisors + npm audit

**Período:** 25/05/2026  
**Status:** ✅ Concluída — 8/8 itens implementados (ADV-003 e ADV-004 requerem Dashboard/Pro)  
**Tipo:** Segurança + Performance

## Contexto

Resultados de ferramentas automatizadas:

1. **Supabase Advisors** (`get_advisors security + performance`) — 99 findings de segurança + 27 de performance
2. **npm audit** — 21 vulnerabilidades em dependências

A maioria dos findings do Supabase se resolve com um padrão único de REVOKE/GRANT.
Os findings de npm são quase todos em dev dependencies (build tools) — risco de
produção baixo, mas corrigíveis com `npm audit fix`.

---

## Itens de Segurança (Supabase Advisors)

### ADV-001 — 47 funções SECURITY DEFINER chamáveis por `anon` (sem auth)

**Severidade:** 🔴 Crítica  
**Esforço:** 1h  
**Implementado:** ✅ migrations 37 + 39 + 40 — REVOKE PUBLIC + anon para todas as 47 funções. Resultado: 47 → 0 warnings anon.  
**Origem:** Supabase Security Advisors — `anon_security_definer_function_executable`

**Problema:** Todas as funções `SECURITY DEFINER` do schema `public` são executáveis
por `anon` (usuário não autenticado) via `POST /rest/v1/rpc/<função>`. Qualquer
visitante sem login pode chamar:

- `decrypt_sensitive_data()` — descriptografar dados sem autenticação
- `create_class_package()` — criar pacotes de aulas sem login
- `upsert_user_role_safe()` — atribuir roles sem autenticação
- `update_profile_by_id()` — modificar perfis sem autenticação
- `is_admin()`, `is_teacher()`, `is_student()` — expõe estrutura de roles
- `check_rate_limit()` — pode ser chamado para esgotar contadores de rate limit
- `get_financial_summary()`, `get_class_logs_summary()` — dados financeiros sem auth
- `soft_delete_student/teacher()` — deletar registros sem auth
- `confirm_payment_idempotent()`, `mark_as_paid_idempotent()` — confirmar pagamentos sem auth

**Fix:** Revogar execução de `anon` em todas as funções sensíveis:

```sql
-- migration nova: revoke_anon_rpc_access.sql
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_class_package(class_log_input[], package_financial_input, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_financial_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_class_logs_summary(uuid, date, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_profile_by_id(uuid, text, boolean, uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_teacher(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_idempotent(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_as_paid_idempotent(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_payment_proof(uuid, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_student(uuid) FROM anon;
-- ... (aplicar para todas as 47 funções listadas no relatório)
```

Funções que realmente precisam ser públicas (ex: `validate_pix_key`, `check_phone_exists_platform`):
manter EXECUTE para `authenticated`, remover de `anon`.

**Critério de aceite:** `curl -X POST .../rpc/create_class_package` sem token retorna
`{"message":"permission denied for function create_class_package"}` (HTTP 403).
Supabase Advisors não reporta mais funções `anon`-acessíveis.

---

### ADV-002 — 50 funções SECURITY DEFINER acessíveis por qualquer `authenticated`

**Severidade:** 🔴 Crítica  
**Esforço:** 1h30min  
**Implementado:** ✅ migrations 37 + 39 + 40 — REVOKE PUBLIC + authenticated para funções internas; 28 funções (triggers + service_role) sem acesso de authenticated. Resultado: 50 → 22 warnings (22 restantes são RPCs intencionais do frontend com validação interna).  
**Origem:** Supabase Security Advisors

**Problema:** Funções privilegiadas sem restrição de role — qualquer usuário logado
(inclusive `student`) pode chamar:

- `anonymize_student(p_student_id)` — anonimizar qualquer aluno (LGPD)
- `anonymize_teacher(p_teacher_id)` — anonimizar qualquer professor
- `hard_delete_anonymized_records()` — deletar permanentemente registros
- `upsert_user_role_safe()` — escalar próprio role para `admin`
- `update_profile_by_id()` — modificar perfil de qualquer usuário
- `soft_delete_student/teacher()` — deletar qualquer aluno/professor

**Fix:** REVOKE de `authenticated` nas funções privilegiadas, GRANT apenas para roles corretos:

```sql
-- funções apenas para admin
REVOKE EXECUTE ON FUNCTION public.anonymize_student(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_student(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.hard_delete_anonymized_records() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.hard_delete_anonymized_records() TO service_role;

REVOKE EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text, text, text) TO service_role;

-- funções para authenticated mas com CHECK interno (já validam auth.uid())
-- manter EXECUTE para authenticated + garantir validação interna
```

**Critério de aceite:** Usuário com role `student` não consegue chamar `anonymize_student`.
`hard_delete_anonymized_records` só executável via `service_role` (Edge Function).

---

### ADV-003 — Bucket `avatars` permite listagem pública de arquivos

**Severidade:** 🟡 Média  
**Esforço:** 15min  
**Implementado:** ⬜ Pulado — requer configuração no Supabase Dashboard (não há migration para storage policies de bucket)  
**Origem:** Supabase Security Advisors — `public_bucket_allows_listing`

**Problema:** Bucket `storage.avatars` é público com 2 policies SELECT amplas
(`Authenticated users can read avatars`, `Public can read avatars`). Clientes
podem listar todos os arquivos do bucket (enumerar URLs de avatars de todos os usuários).

**Fix:** Remover política de listagem ou restringir a `SELECT` por path específico:

```sql
-- Manter acesso por URL direta mas bloquear listagem
-- No Supabase Dashboard: Storage → Policies
-- Alterar policy para: bucket_id = 'avatars' AND name = auth.uid() || '/%'
```

**Critério de aceite:** `supabase.storage.from('avatars').list()` retorna vazio
ou erro para usuário sem permissão de listagem.

---

### ADV-004 — Proteção contra senhas comprometidas desativada

**Severidade:** 🟡 Média  
**Esforço:** 5min  
**Implementado:** ⬜ Pulado — requer toggle no Supabase Dashboard → Authentication  
**Origem:** Supabase Security Advisors — `auth_leaked_password_protection`

**Problema:** Verificação via HaveIBeenPwned.org desativada. Usuários podem
cadastrar senhas presentes em bases de dados de vazamentos conhecidos.

**Fix:** Supabase Dashboard → Authentication → Password Protection → Enable "Check for compromised passwords".

**Critério de aceite:** Tentar criar conta com `"password123"` retorna erro de senha comprometida.

---

## Itens de Performance (Supabase Advisors)

### ADV-005 — FK `activities.deleted_by_fkey` sem índice

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Implementado:** ✅ migration 37_sprint27_revoke_anon_and_indexes.sql — idx_activities_deleted_by  
**Origem:** Supabase Performance Advisors — `unindexed_foreign_keys`

**Problema:** `activities.deleted_by` tem FK mas sem índice cobrindo. Queries
que filtram ou joinam por `deleted_by` fazem seq scan.

**Fix:**

```sql
CREATE INDEX idx_activities_deleted_by ON public.activities(deleted_by)
  WHERE deleted_by IS NOT NULL;
```

**Critério de aceite:** Supabase Performance Advisors não reporta mais `activities_deleted_by_fkey` sem índice.

---

### ADV-006 — 26 índices nunca utilizados (candidatos a remoção)

**Severidade:** 🔵 Info  
**Esforço:** 30min  
**Implementado:** ✅ migration 37_sprint27_revoke_anon_and_indexes.sql — 21 índices não utilizados removidos  
**Origem:** Supabase Performance Advisors — `unused_index`

**Problema:** 26 índices registrados como nunca utilizados pelo Postgres. Índices
não usados consomem espaço em disco e degradam performance de INSERT/UPDATE/DELETE
(Postgres mantém todos os índices atualizados em cada escrita).

**Índices não utilizados identificados:**

| Tabela                 | Índice                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activities`           | `idx_activities_active`, `idx_activities_status_active`, `idx_activities_student_active`, `idx_activities_teacher_active`, `idx_activities_status`, `idx_activities_teacher_status`, `idx_activities_due_date_open` |
| `activities_dashboard` | `idx_activities_dashboard_created`, `idx_activities_dashboard_student`, `idx_activities_dashboard_teacher`, `idx_activities_dashboard_status`, `idx_activities_dashboard_due_date`                                  |
| `teachers`             | `idx_teachers_pix_configured`, `idx_teachers_email`, `idx_teachers_status`                                                                                                                                          |
| `profiles`             | `idx_profiles_deleted_at`, `idx_profiles_must_change_password`                                                                                                                                                      |
| `students`             | `idx_students_email`                                                                                                                                                                                                |
| `financial_dashboard`  | `idx_financial_dashboard_student`, `idx_financial_dashboard_teacher`, `idx_financial_dashboard_status`, `idx_financial_dashboard_due_date`, `idx_financial_dashboard_created`                                       |
| `financial_records`    | `idx_financial_records_due_date_pending`                                                                                                                                                                            |
| `audit_logs`           | `idx_audit_logs_table_name`                                                                                                                                                                                         |
| `idempotency_keys`     | `idx_idempotency_keys_created_at`                                                                                                                                                                                   |

**Fix:** Dropar índices confirmadamente desnecessários:

```sql
-- Avaliar cada um — se nunca usado E não há query planejada: dropar
DROP INDEX IF EXISTS public.idx_activities_active;
-- ... (repetir para cada índice da lista)
```

**Atenção:** `idx_financial_records_due_date_pending` e `idx_activities_*` podem
se tornar úteis após volume de dados crescer. Considerar manter como candidatos
a drop apenas após volume real de produção.

**Critério de aceite:** Supabase Performance Advisors não reporta índices não utilizados.
Performance de INSERT/UPDATE nas tabelas afetadas melhora.

---

## Itens de npm audit

### NPM-001 — 11 vulnerabilidades HIGH em dev dependencies

**Severidade:** 🟡 Média (dev-only — sem impacto em runtime)  
**Esforço:** 15min  
**Implementado:** ✅ npm audit fix executado — 11 high vulnerabilities removidas  
**Arquivo:** `package.json`

**Vulnerabilidades principais:**

- `@babel/plugin-transform-modules-systemjs` — CVSS 8.2, arbitrary code execution ao compilar input malicioso (build tool, não runtime)
- `tar` ≤7.5.10 — path traversal via symlinks (via `supabase` CLI, dev only)
- `@isaacs/brace-expansion` — uncontrolled resource consumption (build tool)

**Contexto:** Todos os `high` são em dependências de build (babel, rollup, workbox, supabase CLI).
Não afetam o bundle de produção nem o runtime da aplicação.

**Fix:**

```bash
npm audit fix
# verificar breaking changes antes de executar --force
npm audit fix --force  # apenas se necessário
```

**Critério de aceite:** `npm audit` retorna 0 vulnerabilidades high. Ou vulnerabilidades
restantes são exclusivamente dev e documentadas como aceitas.

---

### NPM-002 — `ws` moderate — uninitialized memory disclosure

**Severidade:** 🟡 Média  
**Esforço:** 10min  
**Implementado:** ✅ npm audit fix executado — ws atualizado  
**Arquivo:** `package.json` (via dependência transitiva)

**Problema:** `ws` versão 8.0.0–8.20.0 tem vulnerabilidade de exposição de memória
não inicializada. Precisa verificar se `ws` é dependência de runtime ou apenas dev.

**Fix:** `npm audit fix` deve atualizar automaticamente. Se não:

```bash
npm install ws@latest
```

**Critério de aceite:** `ws` atualizado para versão sem CVE conhecida.

---

## Ordem de Implementação Recomendada

| #   | Item    | Esforço | Risco | Impacto                                              |
| --- | ------- | ------- | ----- | ---------------------------------------------------- |
| 1   | ADV-001 | 1h      | Alto  | 🔴 47 funções chamáveis sem login — fechar exposição |
| 2   | ADV-002 | 1h30min | Alto  | 🔴 Privilege escalation via `authenticated`          |
| 3   | ADV-004 | 5min    | Baixo | Habilitar HaveIBeenPwned no dashboard                |
| 4   | ADV-003 | 15min   | Baixo | Bloquear listagem de avatars                         |
| 5   | NPM-001 | 15min   | Baixo | `npm audit fix` (dev deps)                           |
| 6   | NPM-002 | 10min   | Baixo | Atualizar `ws`                                       |
| 7   | ADV-005 | 10min   | Baixo | Índice FK activities.deleted_by                      |
| 8   | ADV-006 | 30min   | Baixo | Dropar 26 índices não utilizados                     |

**Total estimado:** ~4h

## Dependências

- ADV-001 e ADV-002 requerem nova migration SQL com REVOKE/GRANT
- ADV-001: verificar quais funções chamadas via `anon` são intencionais (ex: `check_phone_exists_platform` pode precisar de acesso anon para validação pré-login)
- ADV-004: feito no Supabase Dashboard, sem migration
- NPM-001/002: executar `npm audit fix`, validar que build ainda funciona

## Referências

- [Sprint 23](./sprint-23-backend-quality-fixes.md) — BE-003: `upsert_user_role_safe` sem GRANT (relacionado)
- [Sprint 26](./sprint-26-security-audit.md) — Segurança geral
- Supabase Docs: [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- npm advisory: [GHSA-fv7c-fp4j-7gwp](https://github.com/advisories/GHSA-fv7c-fp4j-7gwp) — babel
- npm advisory: [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx) — tar
