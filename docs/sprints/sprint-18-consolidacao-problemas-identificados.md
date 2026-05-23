# Sprint 18 — Consolidação de Problemas Identificados

> **Status:** ✅ Implementada  
> **Período:** Implementada (2026-05)  
> **Tipo:** Documentação + Correções Críticas

## Contexto

Durante a organização da documentação técnica (Sprint 16-17),
foram identificados e documentados 41 problemas distribuídos em:

- 6 problemas arquiteturais (ARQ-001 a ARQ-006)
- 8 refatorações necessárias (REFORMA-001 a REFORMA-008)
- 7 bugs de backend (BACK-001 a BACK-007)
- 13 bugs de banco de dados (DB-001 a DB-013)
- 5 erros comuns (troubleshooting)
- 2 riscos pendentes (R07, R08)

Esta sprint consolida todos os problemas identificados,
prioriza correções críticas e documenta débito técnico aceito.

## Objetivos

1. Consolidar problemas em tabela única com priorização
2. Corrigir problemas críticos (severidade Alta/Crítica)
3. Documentar débito técnico aceito para MVP
4. Atualizar documentação com status de correções

## Problemas Identificados

### Tabela Consolidada (46 problemas únicos)

| ID          | Tipo         | Severidade     | Prioridade | Esforço   | Status                         | Arquivo                                        |
| ----------- | ------------ | -------------- | ---------- | --------- | ------------------------------ | ---------------------------------------------- |
| **CR-013**  | **Infra**    | **🔴 Crítica** | **1**      | **30min** | **✅ Resolvido**               | Sentry removido do projeto                     |
| BACK-001    | Bug          | 🔴 Crítica     | 2          | 2h        | ✅ Resolvido                   | `supabase/migrations/26_sprint18_fixes.sql`    |
| **CR-003**  | **Frontend** | **🟡 Alta**    | **3**      | **30min** | **✅ Resolvido**               | `ClassesTableRow.tsx`, `PostClassDialog.tsx`   |
| **CR-007**  | **Backend**  | **🟡 Alta**    | **4**      | **1h**    | **🟢 Aceito (débito técnico)** | `invite-user` muito grande (500L)              |
| **CR-002**  | **Frontend** | **🟡 Alta**    | **5**      | **5h**    | **🟢 Aceito (débito técnico)** | Componentes >400L (5 arquivos)                 |
| **CR-011**  | **Testes**   | **🟡 Alta**    | **6**      | **4h**    | **🟢 Aceito (sem Playwright)** | Sem testes E2E                                 |
| DB-001      | Bug          | 🟡 Alta        | 7          | 1h        | ✅ Já implementado             | migrations 01 + 22                             |
| DB-002      | Bug          | 🟡 Alta        | 8          | 15min     | ✅ Já implementado             | migrations 01 + 22                             |
| DB-003      | Bug          | 🟡 Alta        | 9          | 15min     | ✅ Já implementado             | migrations 01 + 22                             |
| DB-004      | Bug          | 🟡 Alta        | 10         | 15min     | ✅ Já implementado             | migrations 01 + 22                             |
| DB-005      | Bug          | 🟡 Alta        | 11         | 15min     | ✅ Já implementado             | migrations 01 + 22                             |
| BACK-006    | Bug          | 🟡 Alta        | 12         | 1h        | 🟢 Aceito (feature)            | `src/hooks/useUserMutations.ts`                |
| BACK-002    | Bug          | 🟡 Alta        | 13         | 1h        | ✅ Resolvido                   | `src/hooks/useClassLogs.ts` (toLocalDateStr)   |
| BACK-003    | Bug          | 🟡 Alta        | 14         | 1h        | ✅ Já seguro                   | `financialHelpers.ts` usa comparação de string |
| BACK-004    | Bug          | 🟡 Alta        | 15         | 2h        | ✅ Já seguro                   | `classHelpers.ts` usa TIMESTAMPTZ corretamente |
| ARQ-001     | Arquitetura  | 🟡 Alta        | 16         | 3h        | 🟠 Planejado                   | `src/hooks/useStudents.ts:187` (CR-001)        |
| ARQ-002     | Arquitetura  | 🟡 Alta        | 17         | 2h        | 🟠 Planejado                   | `src/hooks/useFinancialRecords.ts:245`         |
| REFORMA-001 | Refatoração  | 🟡 Alta        | 18         | 30min     | 🟠 Planejado                   | `src/lib/security/errorHandler.ts`             |
| REFORMA-003 | Refatoração  | 🟡 Alta        | 19         | 45min     | 🟠 Planejado                   | `src/hooks/useClassLogs.ts:89`                 |
| REFORMA-002 | Refatoração  | 🟡 Alta        | 20         | 1h        | 🟠 Planejado                   | `src/hooks/useClassLogs.ts:156`                |
| **CR-006**  | **Backend**  | **🟡 Média**   | **21**     | **30min** | **✅ Resolvido**               | `supabase/functions/_shared/utils.ts`          |
| **CR-009**  | **Database** | **🟡 Média**   | **22**     | **30min** | **✅ Já implementado**         | `cleanup_old_audit_logs()` (migration 10)      |
| **CR-010**  | **Testes**   | **🟡 Média**   | **23**     | **15min** | **✅ Resolvido**               | `vitest.config.ts` — 70% threshold configurado |
| **CR-012**  | **Testes**   | **🟡 Média**   | **24**     | **2h**    | **🟢 Aceito (débito técnico)** | Sem testes RLS policies (pgTAP)                |
| **CR-004**  | **Frontend** | **🟡 Média**   | **25**     | **15min** | **🟢 Aceito (N/A)**            | Cores verificadas — já usam tokens semânticos  |
| **CR-005**  | **Frontend** | **🟡 Média**   | **26**     | **10min** | **🟢 Aceito (N/A)**            | console.logs verificados — todos legítimos     |
| BACK-005    | Bug          | 🟡 Média       | 27         | 1h        | 🟠 Planejado                   | `supabase/migrations/06_idempotency.sql`       |
| DB-006      | Bug          | 🟡 Média       | 28         | 15min     | 🟠 Planejado                   | `audit_logs` (índices)                         |
| DB-007      | Bug          | 🟡 Média       | 29         | 30min     | 🟠 Planejado                   | `idempotency_keys` (expiração) — CR-009        |
| DB-008      | Bug          | 🟡 Média       | 30         | 30min     | 🟠 Planejado                   | `performance_logs` (retenção) — CR-009         |
| DB-009      | Bug          | 🟡 Média       | 31         | 15min     | 🟠 Planejado                   | `financial_records.amount` (constraint)        |
| DB-010      | Bug          | 🟡 Média       | 32         | 15min     | 🟠 Planejado                   | `class_logs.grade` (constraint)                |
| ARQ-003     | Arquitetura  | 🟡 Média       | 33         | 4h        | 🟠 Planejado                   | TanStack Query (múltiplos hooks)               |
| ARQ-004     | Arquitetura  | 🟡 Média       | 34         | 2h        | 🟠 Planejado                   | `src/hooks/useStudents.ts:210`                 |
| ARQ-005     | Arquitetura  | 🟡 Média       | 35         | 1h        | 🟠 Planejado                   | `src/hooks/useFinancialRecords.ts:89`          |
| REFORMA-004 | Refatoração  | 🟡 Média       | 36         | 30min     | 🟠 Planejado                   | `src/hooks/useClassLogs.ts:45`                 |
| REFORMA-005 | Refatoração  | 🟡 Média       | 37         | 1h        | 🟠 Planejado                   | `src/hooks/useClassLogs.ts:289`                |
| REFORMA-006 | Refatoração  | 🟡 Média       | 38         | 30min     | 🟠 Planejado                   | `src/hooks/useClassLogs.ts:334`                |
| **CR-008**  | **Database** | **🟢 Baixa**   | **39**     | **15min** | **🟢 Aceito (baixa)**          | SELECT \* em migrations — contexto de migração |
| BACK-007    | Bug          | 🟢 Baixa       | 40         | 30min     | 🟠 Planejado                   | `supabase/migrations/10_lgpd.sql`              |
| DB-011      | Bug          | 🟢 Baixa       | 41         | 15min     | 🟠 Planejado                   | `teachers/students.email` (UNIQUE)             |
| DB-012      | Bug          | 🟢 Baixa       | 42         | 15min     | 🟠 Planejado                   | `class_logs` (consistência data)               |
| DB-013      | Bug          | 🟢 Baixa       | 43         | 15min     | 🟠 Planejado                   | `financial_record_class_logs` (índice)         |
| ARQ-006     | Arquitetura  | 🟢 Baixa       | 44         | 3h        | 🟠 Planejado                   | `src/hooks/useUserMutations.ts`                |
| REFORMA-007 | Refatoração  | 🟢 Baixa       | 45         | 15min     | 🟠 Planejado                   | `src/hooks/useFinancialRecords.ts:412`         |
| REFORMA-008 | Refatoração  | 🟢 Baixa       | 46         | 15min     | 🟠 Planejado                   | `src/lib/validation/activitySchemas.ts:23`     |

**Legenda:**

- 🔴 Pendente — Não corrigido
- 🟠 Planejado — Documentado, correção planejada
- 🟢 Aceito — Débito técnico aceito para MVP
- ✅ Corrigido — Problema resolvido
- **Negrito** — Novo problema identificado no Code Review

**Nota:** R07 (Bugs timezone) agrupa BACK-002, BACK-003, BACK-004. R08 (Sentry LGPD) = CR-013 — resolvido pela remoção do Sentry.

### Problemas Críticos (Prioridade 1-2)

#### CR-013: Sentry removido do projeto — R08

**Severidade:** 🔴 Crítica → ✅ Resolvido  
**Resolução:** Sentry foi removido completamente do projeto. Não há mais risco de vazamento de PII via serviço de monitoramento externo.

**O que foi feito:**

- Removidas referências de Sentry em `src/lib/logger.ts` (no-ops `setUser`, `clearUser`, `addBreadcrumb`)
- Removidas chamadas em `src/contexts/AuthContext.tsx`
- Removido de todas as docs, caps TCC e configs do projeto

**Logging atual:** `logger.ts` loga apenas em `DEV` via `console.*` — sem envio de dados para serviços externos.

---

#### BACK-001: Race condition na criação de usuário

**Severidade:** 🔴 Crítica  
**Impacto:** Duplicação de usuários, dados inconsistentes

**Causa:** Edge Function `invite-user` verifica duplicidade de email
com SELECT antes de criar usuário, mas não usa transação atômica.
Dois requests simultâneos podem ambos criar usuário.

**Fix:**

```sql
-- Adicionar constraint UNIQUE
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
```

**Arquivo:** `supabase/functions/invite-user/invite-user.ts`

---

#### BACK-006: Senha em texto plano no response

**Severidade:** 🟡 Alta  
**Impacto:** Senha exposta em logs, Network tab

**Causa:** Frontend espera `password` no response para exibir ao admin.
Fluxo intencional (admin precisa comunicar senha ao usuário).

**Decisão:** Aceito como feature. Mitigações:

- Nunca logar response com senha
- Limpar senha do estado após exibição
- HTTPS mitiga exposição em Network tab

**Arquivo:** `src/hooks/useUserMutations.ts`

---

#### BACK-002: Timezone bug em getDateRangeForPeriod

**Severidade:** 🟡 Alta  
**Impacto:** Filtros de data retornam dados errados

**Causa:** `toISOString()` converte para UTC,
mas servidor pode estar em fuso diferente.
Filtro de "mês atual" inclui dias do mês seguinte
para usuários em UTC-3 após 21h.

**Fix:**

```ts
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

**Arquivo:** `src/lib/utils/dateHelpers.ts`

---

#### BACK-003: Timezone bug em isOverdue

**Severidade:** 🟡 Alta  
**Impacto:** Cobranças marcadas como atrasadas prematuramente

**Causa:** `new Date(dueDateStr + "T12:00:00")` sem timezone explícito
é interpretado como local, mas comparação com `new Date()` usa UTC.

**Fix:**

```ts
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dueDateStr < todayStr;
}
```

**Arquivo:** `src/lib/utils/financialHelpers.ts`

---

#### BACK-004: Mistura de DATE e TIMESTAMPTZ

**Severidade:** 🟡 Alta  
**Impacto:** Status de aula incorreto

**Causa:** `class_date` (DATE) e `start_at`/`end_at` (TIMESTAMPTZ)
são comparados sem conversão consistente.

**Fix:**

```ts
export function getClassStatus(classLog: ClassLog): ClassStatus {
  const nowUtc = new Date();
  const startAtUtc = classLog.start_at ? new Date(classLog.start_at) : null;
  const endAtUtc = classLog.end_at ? new Date(classLog.end_at) : null;

  if (classLog.attendance !== null) return "Concluída";
  if (startAtUtc && startAtUtc > nowUtc) return "Agendada";
  if (startAtUtc && endAtUtc && nowUtc >= startAtUtc && nowUtc < endAtUtc)
    return "Em andamento";
  return "Pendente";
}
```

**Arquivo:** `src/lib/utils/classHelpers.ts`

---

### Problemas Arquiteturais (Prioridade 6-14)

#### ARQ-001: God hook

**Severidade:** 🟡 Alta  
**Impacto:** Dificulta manutenção, testes e reutilização

Hook `useUpdateStudent` tem 200+ linhas com lógica de negócio complexa
misturada com data fetching. Sincroniza profiles, user_roles,
valida telefone, atualiza pay_day via RPC, tudo em uma única função.

**Fix:** Extrair lógica para RPC no banco.

**Arquivo:** `src/hooks/useStudents.ts:187`

---

#### ARQ-002: Agregação no cliente

**Severidade:** 🟡 Alta  
**Impacto:** Query lenta (>2s) com 500+ registros

Busca TODOS os registros financeiros sem paginação
para calcular totais no frontend.

**Fix:** Mover cálculo para view materializada `financial_dashboard`.

**Arquivo:** `src/hooks/useFinancialRecords.ts:245`

---

#### ARQ-003: Query keys inconsistentes

**Severidade:** 🟡 Média  
**Impacto:** Invalidações não funcionam, cache desatualizado

Falta de padronização nas query keys.
Existem 3+ padrões diferentes para a mesma entidade.

**Fix:** Centralizar query keys em `src/lib/queryKeys.ts`.

**Arquivo:** TanStack Query (múltiplos hooks)

---

#### ARQ-004: Invalidações excessivas

**Severidade:** 🟡 Média  
**Impacto:** 8 requisições ao banco após cada update

Invalida 8 query keys diferentes, incluindo queries não relacionadas.

**Fix:** Invalidar apenas o que mudou. Usar `setQueryData` para atualização otimista.

**Arquivo:** `src/hooks/useStudents.ts:210`

---

#### ARQ-005: N+1 queries

**Severidade:** 🟡 Média  
**Impacto:** 1 + N requisições ao banco

Faz N+1 queries para buscar nomes de usuários confirmadores
e aulas de pacotes.

**Fix:** Usar JOIN no Supabase.

**Arquivo:** `src/hooks/useFinancialRecords.ts:89`

---

### Refatorações (Prioridade 8-21)

#### REFORMA-001: Duplicação de sanitizeErrorMessage

**Severidade:** 🟡 Alta  
**Impacto:** Mensagens de erro inconsistentes

Existe em dois arquivos com lógica diferente.
Hooks importam de fontes diferentes.

**Fix:** Consolidar em `src/lib/security/errorHandler.ts`.

**Arquivo:** `src/lib/security/errorHandler.ts:45` e `src/lib/utils/errorMessages.ts:12`

---

#### REFORMA-003: Duplicação de detecção de overlap

**Severidade:** 🟡 Alta  
**Impacto:** Manutenção triplicada

Padrão de detecção de overlap duplicado em 3 hooks diferentes.

**Fix:** Extrair para `src/lib/utils/classTime.ts`.

**Arquivo:** `src/hooks/useClassLogs.ts:89`, `src/hooks/usePackages.ts:134`, `src/hooks/useActivities.ts:201`

---

---

### Novos Problemas (Code Review)

#### CR-002: Componentes grandes (>400L)

**Severidade:** 🟡 Alta  
**Impacto:** Dificulta manutenção e testes

**Arquivos:**

- `src/pages/admin/Users.tsx` (456L)
- `src/pages/admin/Teachers.tsx` (447L)
- `src/components/students/StudentFormDialog.tsx` (426L)
- `src/components/classes/ClassLogFormDialog.tsx` (409L)
- `src/components/activities/SendActivityDialog.tsx` (408L)

**Fix:** Extrair seções em subcomponentes.

**Esforço:** 1h por componente (5h total)

---

#### CR-003: `as any` em produção (11 ocorrências)

**Severidade:** 🟡 Alta  
**Impacto:** Bypass do type system, pode esconder bugs

**Arquivos:**

- `src/components/classes/ClassesTableRow.tsx` (2x)
- `src/components/classes/PostClassDialog.tsx` (4x)
- `src/components/users/UserFormDialog.tsx` (5x)

**Fix:** Criar tipos explícitos:

```ts
type FinancialRecordWithProof = Tables<"financial_records"> & {
  payment_proof_url?: string;
  payment_proof_filename?: string;
  payment_proof_status?: "pending" | "approved" | "rejected";
};
```

**Esforço:** 30min

---

#### CR-004: Cores hardcoded (8 ocorrências)

**Severidade:** 🟡 Média  
**Impacto:** Inconsistência visual, dificulta temas

**Arquivos:**

- `src/components/dashboard/DashboardFinancialCards.tsx` (2x)
- `src/components/financial/FinancialSummaryCards.tsx` (2x)
- `src/components/student/UnifiedStatementCard.tsx` (3x)
- `src/components/ui/status-badge.tsx` (1x)

**Fix:** Substituir por cores semânticas (`text-primary`, `text-success`).

**Esforço:** 15min

---

#### CR-005: Console.log em produção (3 ocorrências)

**Severidade:** 🟡 Média  
**Impacto:** Pode vazar informações sensíveis

**Localização provável:** `src/components/ErrorBoundary.tsx` (legítimo para debug de erros críticos)

**Fix:** Verificar se são apenas ErrorBoundary ou remover.

**Esforço:** 10min

---

#### CR-006: Duplicação em Edge Functions

**Severidade:** 🟡 Média  
**Impacto:** Manutenção triplicada

**Problema:** CORS_HEADERS e `jsonResponse()` duplicados em 5 Edge Functions.

**Fix:** Criar `supabase/functions/_shared/utils.ts`.

**Esforço:** 30min

---

#### CR-007: invite-user muito grande (500L)

**Severidade:** 🟡 Alta  
**Impacto:** Função monolítica difícil de manter

**Fix:** Extrair em módulos (validation.ts, auth.ts, domain.ts).

**Esforço:** 1h

---

#### CR-008: SELECT \* em migrations (2 ocorrências)

**Severidade:** 🟢 Baixa  
**Impacto:** Pode trazer colunas desnecessárias

**Fix:** Substituir por colunas explícitas ou verificar se é em contexto de migração (aceitável).

**Esforço:** 15min

---

#### CR-009: Sem retenção automática de logs

**Severidade:** 🟡 Média  
**Impacto:** Logs crescem indefinidamente

**Tabelas:** `audit_logs`, `performance_logs`, `idempotency_keys`

**Fix:** Criar job de limpeza via `pg_cron` (ver DB-007, DB-008).

**Esforço:** 30min

---

#### CR-010: Cobertura de testes desconhecida

**Severidade:** 🟡 Média  
**Impacto:** Não há métricas de qualidade

**Fix:** Configurar coverage no `vitest.config.ts` com thresholds (70%).

**Esforço:** 15min

---

#### CR-011: Sem testes E2E

**Severidade:** 🟡 Alta  
**Impacto:** Fluxos críticos não testados end-to-end

**Fix:** Aumentar cobertura com testes unitários para fluxos críticos.

**Esforço:** 4h (setup + 4 fluxos)

---

#### CR-012: Sem testes de RLS policies

**Severidade:** 🟡 Média  
**Impacto:** Policies não testadas automaticamente

**Fix:** Criar testes SQL em `supabase/tests/` com pgTAP.

**Esforço:** 2h (setup + 5 tabelas)

---

### Riscos Pendentes

#### R07: Bugs de timezone em produção

**Severidade:** 🟡 Alta  
**Impacto:** Filtros, cobranças e status incorretos

Agrupa BACK-002, BACK-003, BACK-004.
Correção planejada mas não implementada no MVP.

**Mitigação:** Documentado em `docs/backend/bugs.md`.

---

#### R08: Dados sensíveis no Sentry (LGPD) — ✅ Resolvido

**Resolução:** Sentry removido do projeto. Risco eliminado na origem.

---

## Entregas

### Correções Implementadas

**Críticas (Prioridade 1-2):**

- [x] CR-013: Sentry removido do projeto (R08 resolvido)
- [x] BACK-001: Constraint UNIQUE em `profiles.email` — `migration 26_sprint18_fixes.sql`

**Altas (Prioridade 3-20):**

- [x] CR-003: `as any` removido — campos `payment_proof_*` tipados em `ClassLogWithStudent`
- [~] CR-007: Aceito como débito técnico — risco de regressão, pós-MVP
- [~] CR-002: Aceito como débito técnico — 5h de refatoração, pós-MVP
- [x] BACK-002: Fix timezone em `useClassLogs.ts` — `toLocalDateStr()` helper
- [~] BACK-003: Já timezone-safe — `isOverdue` usa comparação de strings ISO
- [~] BACK-004: Já timezone-safe — `getClassStatus` usa TIMESTAMPTZ nativo
- [x] DB-001 a DB-005: Já implementados — migrations 01 e 22

**Médias (Prioridade 21-38):**

- [x] CR-006: `supabase/functions/_shared/utils.ts` — 5 functions refatoradas
- [x] CR-009: Já implementado — `cleanup_old_audit_logs()` em migration 10
- [x] CR-010: `vitest.config.ts` — coverage v8 com threshold 70%
- [~] CR-012: Aceito como débito técnico — pgTAP setup complexo, pós-MVP
- [~] CR-004: N/A — verificado: arquivos já usam tokens semânticos
- [~] CR-005: N/A — verificado: console.logs são todos de ErrorBoundary/logger (legítimos)

**Baixas (Prioridade 39-46):**

- [~] CR-008: Aceito — SELECT \* em contexto de migration é aceitável

### Débito Técnico Aceito

- [x] BACK-006: Senha em texto plano (feature intencional)
- [x] ARQ-001 a ARQ-006: Problemas arquiteturais (planejados para pós-MVP)
- [x] REFORMA-001 a REFORMA-008: Refatorações (planejadas para pós-MVP)
- [x] BACK-005, BACK-007: Bugs de severidade média/baixa (planejados)

### Documentação Atualizada

- [x] `docs/architecture/technical-debt.md` — 6 problemas arquiteturais + 8 refatorações
- [x] `docs/architecture/troubleshooting.md` — 5 erros comuns + diagnóstico
- [x] `docs/backend/bugs.md` — 7 bugs conhecidos + fix
- [x] `docs/tcc/tecnico/cap8-gestao.md` — Tabela de riscos (R07, R08)
- [x] Esta sprint — Consolidação de todos os problemas

## Métricas

| Métrica                           | Valor                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Problemas Identificados**       | **46** (36 Sprint 18 + 10 Code Review)                                                                                           |
| **Severidade Crítica**            | 2 (BACK-001, CR-013)                                                                                                             |
| **Severidade Alta**               | 20 (DB-001 a DB-005, BACK-002 a BACK-004, BACK-006, ARQ-001, ARQ-002, REFORMA-001 a REFORMA-003, CR-002, CR-003, CR-007, CR-011) |
| **Severidade Média**              | 17 (DB-006 a DB-010, BACK-005, ARQ-003 a ARQ-005, REFORMA-004 a REFORMA-006, CR-004 a CR-006, CR-009, CR-010, CR-012)            |
| **Severidade Baixa**              | 7 (DB-011 a DB-013, BACK-007, ARQ-006, REFORMA-007, REFORMA-008, CR-008)                                                         |
| **Correções Críticas Planejadas** | 12 (BACK-001, DB-001 a DB-005, BACK-002 a BACK-004, CR-003, CR-007, CR-013)                                                      |
| **Débito Técnico Aceito**         | 26 (ARQ-001 a ARQ-006, REFORMA-001 a REFORMA-008, BACK-005, BACK-007, DB-006 a DB-013)                                           |
| **Novos (Code Review)**           | 10 (CR-002 a CR-012, exceto CR-009 e CR-013 que são overlaps)                                                                    |
| **Esforço Total Estimado**        | ~48h (35h Sprint 18 + 13h Code Review)                                                                                           |
| **Esforço Crítico**               | ~11.5h (9h Sprint 18 + 2.5h Code Review)                                                                                         |

**Breakdown por origem:**

- Sprint 18 original: 36 problemas (~35h)
- Code Review novos: 10 problemas (~13h)
- Overlaps eliminados: 3 (CR-001=ARQ-001, CR-009=DB-007+DB-008, CR-013=R08)

## Lições Aprendidas

### O que Funcionou

- **Documentação estruturada** — Separar problemas por tipo (bugs, arquitetura, refatoração) facilitou priorização
- **Severidade + Esforço** — Matriz de priorização clara (severidade × frequência × esforço)
- **Débito técnico explícito** — Aceitar débito conscientemente em vez de ignorar

### O que Melhorar

- **Identificação precoce** — Muitos problemas foram descobertos apenas na Sprint 16-17 (organização de docs)
- **Testes automatizados** — Bugs de timezone (BACK-002 a BACK-004) poderiam ter sido detectados com testes
- **Code review** — Problemas arquiteturais (ARQ-001, ARQ-002) poderiam ter sido evitados com revisão

### Resultados da Implementação

**O que foi feito nesta sprint:**

| Item         | Ação                                                    | Arquivo(s)                                                      |
| ------------ | ------------------------------------------------------- | --------------------------------------------------------------- |
| CR-013       | Sentry removido do projeto                              | `logger.ts`, `AuthContext.tsx`, 13 docs                         |
| BACK-001     | UNIQUE constraint em `profiles.email`                   | `26_sprint18_fixes.sql`                                         |
| BACK-002     | `toLocalDateStr()` substitui `toISOString()`            | `useClassLogs.ts`                                               |
| CR-003       | `payment_proof_*` tipados — `as any` removidos          | `useClassLogs.ts`, `ClassesTableRow.tsx`, `PostClassDialog.tsx` |
| CR-006       | CORS + jsonResponse extraídos para `_shared`            | `_shared/utils.ts` + 5 Edge Functions                           |
| CR-009       | Já existia via `cleanup_old_audit_logs()`               | migration 10                                                    |
| CR-010       | Coverage 70% threshold configurado                      | `vitest.config.ts`                                              |
| DB-001~005   | Já existiam via migrations anteriores                   | migrations 01, 22                                               |
| BACK-003/004 | Já timezone-safe — verificado, sem alteração necessária | —                                                               |

**Débito técnico aceito (pós-MVP):**

- CR-002: Componentes >400L (5h, risco de regressão)
- CR-007: Split `invite-user` (risco de regressão)
- CR-012: Testes RLS com pgTAP (setup complexo)
- ARQ-001~006: Problemas arquiteturais (planejados)
- REFORMA-001~008: Refatorações (planejadas)

### Próximos Passos

- **Sprint 19:** LGPD — exportação de dados + Edge Function `export-user-data`
- **Sprint 20:** Rate limiting — dashboard admin UI

## Referências

- [Code Review](../code-review.md) — Review completo da plataforma (88%)
- [Architecture Technical Debt](../architecture/technical-debt.md) — 6 problemas arquiteturais + 8 refatorações
- [Architecture Troubleshooting](../architecture/troubleshooting.md) — 5 erros comuns
- [Backend Bugs](../backend/bugs.md) — 7 bugs conhecidos
- [Cap. 8 — Gestão](../tcc/tecnico/cap8-gestao.md) — Tabela de riscos
- [Sprint 16](./sprint-16-refactor-docs-architecture-organization.md) — Organização de docs
- [Sprint 17](./sprint-17-refactor-tcc-documentation-review.md) — Revisão TCC
