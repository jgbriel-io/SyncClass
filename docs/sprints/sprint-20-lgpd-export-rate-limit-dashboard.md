# Sprint 21 — LGPD Data Export + Rate Limit Dashboard

**Período:** 23/05/2026  
**Status:** 🟡 Em andamento  
**Tipo:** Feature + Compliance  
**Prioridade:** 🟡 Média

## Problem Statement

Dois gaps funcionais pendentes após Sprint 20:

### Gap 1 — LGPD Art. 18, V: Portabilidade de dados não implementada

Usuários têm direito à exportação dos seus dados em formato legível (LGPD Art. 18, V). Plataforma não oferece esse mecanismo. Único direito do titular ainda não atendido.

**Impacto:**

- Não conformidade parcial com LGPD (direito à portabilidade)
- Usuário sem forma de obter cópia dos seus dados

### Gap 2 — Dashboard de rate limits inexistente

`get_rate_limit_info()` existe no banco mas sem interface. Admin não consegue visualizar padrões de uso, usuários próximos ao limite ou operações bloqueadas sem acesso direto ao SQL.

**Impacto:**

- Monitoramento de segurança depende de acesso manual ao banco
- Impossível detectar padrões de abuse pela interface admin

## Requirements

### Funcionais — LGPD Export

- [ ] Edge Function `export-user-data` retorna todos os dados do usuário autenticado
- [ ] Dados exportados: perfil, dados de aluno/professor, aulas, cobranças, atividades
- [ ] Formato: JSON estruturado por entidade
- [ ] Botão "Exportar meus dados" no perfil do aluno e do professor
- [ ] Download automático do arquivo `syncclass-dados-{data}.json`
- [ ] Audit log registra operação de exportação

### Funcionais — Rate Limit Dashboard

- [ ] Página admin com visão de requisições por operação (última hora)
- [ ] Tabela: operação | requisições | usuários únicos | bloqueios
- [ ] Destacar operações próximas do limite (>80% do threshold)
- [ ] Botão de refresh manual
- [ ] Acesso restrito a `admin`

### Não-Funcionais

- [ ] Export protegido: usuário só exporta seus próprios dados (RLS via auth.uid())
- [ ] Edge Function timeout: máx 10s (query otimizada com JOINs)
- [ ] Dashboard sem polling automático (evitar sobrecarga em `rate_limits`)
- [ ] Rate limiting na própria Edge Function de export (máx 3 exports/hora por usuário)

### Critérios de Aceitação

- [ ] Download JSON gerado com dados corretos para aluno e professor
- [ ] Export bloqueado se tentativa > 3x por hora
- [ ] Dashboard admin exibe dados da última hora corretamente
- [ ] Usuário não-admin não acessa rota do dashboard
- [ ] Audit log registrado após cada export

## Background

### LGPD — Direitos do Titular (Status Atual)

| Direito           | Artigo         | Status                        |
| ----------------- | -------------- | ----------------------------- |
| Acesso            | Art. 18, I     | ✅ Portal aluno/professor     |
| Correção          | Art. 18, III   | ✅ Edição de perfil           |
| Eliminação        | Art. 18, II    | ✅ Soft delete + anonimização |
| **Portabilidade** | **Art. 18, V** | **❌ Não implementado**       |
| Informação        | Art. 18, VI    | ✅ Audit logs (admin)         |

### Rate Limits Existentes

| RPC                          | Limite | Janela |
| ---------------------------- | ------ | ------ |
| `mark_as_paid_idempotent`    | 10 req | 1 min  |
| `confirm_payment_idempotent` | 10 req | 1 min  |
| `undo_payment_idempotent`    | 5 req  | 1 min  |

Tabela `rate_limits` + `get_rate_limit_info()` disponíveis — falta apenas interface.

## Proposed Solution

### Solução LGPD Export

Edge Function `export-user-data` autentica via JWT, detecta role do usuário (aluno/professor), executa queries paralelas com `Promise.all`, retorna JSON com `Content-Disposition: attachment`.

```ts
// supabase/functions/export-user-data/index.ts
// 1. Verifica auth.uid()
// 2. Detecta role via profiles
// 3. Queries paralelas: profile + entidade + class_logs + financial_records + activities
// 4. Registra audit_log
// 5. Retorna JSON com header de download
```

### Solução Rate Limit Dashboard

Nova página admin (`/admin/rate-limits`) com hook `useRateLimitDashboard` que chama RPC customizada retornando agregados da última hora.

```sql
-- Nova RPC: get_rate_limit_summary()
SELECT
  operation,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(request_count) as total_requests,
  COUNT(*) FILTER (WHERE request_count >= 8) as near_limit_count
FROM rate_limits
WHERE window_start > NOW() - INTERVAL '1 hour'
GROUP BY operation
ORDER BY total_requests DESC;
```

## Task Breakdown

### Task 1: Edge Function `export-user-data`

**Objetivo:** Exportar todos os dados do usuário autenticado em JSON

**Estrutura do JSON retornado:**

```json
{
  "exported_at": "2026-05-23T...",
  "user": { "email": "...", "role": "..." },
  "profile": { ... },
  "student" | "teacher": { ... },
  "class_logs": [ ... ],
  "financial_records": [ ... ],
  "activities": [ ... ]
}
```

**Rate limiting interno:** `check_rate_limit('export_user_data', 3, 60)` — bloqueia após 3 exports por hora.

**Arquivo criado:** `supabase/functions/export-user-data/index.ts`

**Esforço:** 2h

---

### Task 2: UI — Botão de Export no Perfil

**Objetivo:** Botão "Exportar meus dados" em perfil de aluno e professor

**Comportamento:**

1. Clique → loading state
2. Chama Edge Function com token do usuário
3. Sucesso → download automático `syncclass-dados-2026-05-23.json`
4. Erro de rate limit → toast "Você pode exportar no máximo 3 vezes por hora"

**Arquivos modificados:**

- Página de perfil do aluno (`src/pages/student/`)
- Página de perfil do professor (`src/pages/teacher/`)

**Esforço:** 1.5h

---

### Task 3: RPC `get_rate_limit_summary()`

**Objetivo:** Agregados de rate limiting para dashboard admin

**Migration:** `supabase/migrations/28_rate_limit_summary_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.get_rate_limit_summary()
RETURNS TABLE (
  operation TEXT,
  unique_users BIGINT,
  total_requests BIGINT,
  near_limit_count BIGINT,
  window_start TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    operation,
    COUNT(DISTINCT user_id) AS unique_users,
    SUM(request_count) AS total_requests,
    COUNT(*) FILTER (WHERE request_count >= 8) AS near_limit_count,
    MIN(window_start) AS window_start
  FROM rate_limits
  WHERE window_start > NOW() - INTERVAL '1 hour'
  GROUP BY operation
  ORDER BY total_requests DESC;
$$;
```

**Esforço:** 30min

---

### Task 4: Hook `useRateLimitDashboard`

**Objetivo:** Buscar dados para o dashboard com TanStack Query

**Arquivo criado:** `src/hooks/useRateLimitDashboard.ts`

```ts
export function useRateLimitDashboard() {
  return useQuery({
    queryKey: ["rate-limit-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_rate_limit_summary");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000, // 30s — sem polling automático
  });
}
```

**Esforço:** 30min

---

### Task 5: Página Admin `/admin/rate-limits`

**Objetivo:** Interface de monitoramento de rate limits

**Layout:**

- Header: "Monitoramento de Rate Limits" + botão Atualizar
- Tabela: Operação | Requisições (1h) | Usuários únicos | Próximos do limite
- Badge vermelho em linhas com `near_limit_count > 0`
- Empty state se sem dados na última hora

**Arquivos criados:**

- `src/pages/admin/RateLimitDashboardPage.tsx`
- Rota adicionada em `src/App.tsx` (ou router config)

**Arquivos modificados:**

- Nav admin — adicionar link "Rate Limits"

**Esforço:** 2h

## Files Created

```
supabase/
├── functions/
│   └── export-user-data/
│       └── index.ts              # Edge Function exportação LGPD
└── migrations/
    └── 28_rate_limit_summary_rpc.sql  # RPC get_rate_limit_summary

src/
├── hooks/
│   └── useRateLimitDashboard.ts  # Hook TanStack Query
└── pages/
    └── admin/
        └── RateLimitDashboardPage.tsx  # Dashboard admin
```

## Files Modified

```
src/
└── pages/
    ├── student/          # Botão export no perfil
    └── teacher/          # Botão export no perfil
```

## Testing & Validation

- [ ] Export JSON contém todos os dados corretos do usuário logado
- [ ] Export bloqueado na 4ª tentativa na mesma hora
- [ ] Download automático dispara com nome correto
- [ ] Audit log gerado após export bem-sucedido
- [ ] Dashboard admin exibe tabela com dados da última hora
- [ ] Usuário teacher/student não acessa `/admin/rate-limits` (redirect)
- [ ] Build sem erros (`npm run build`)
- [ ] Type-check passou (`npm run type-check`)

## Results & Impact

> _A preencher após implementação._

## Technical Debt

- [ ] Export em CSV além de JSON — usuários não-técnicos preferem planilha
- [ ] Notificação por email quando export solicitado (confirmação de segurança)
- [ ] Dashboard com gráfico de série temporal (atualmente só última hora)
- [ ] Export incremental para usuários com muito histórico (paginação da Edge Function)

## Lessons Learned

> _A preencher após implementação._

## Next Steps

1. **Sprint 22:** Correções arquiteturais — God hooks (ARQ-001: `useUpdateStudent`, ARQ-006: `useUserMutations`)
2. **Sprint 23:** Performance — N+1 queries (ARQ-005: `useFinancialRecords`), query keys inconsistentes (ARQ-003)

## References

- [LGPD Art. 18, V](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Sprint 20](./sprint-20-lgpd-rate-limiting.md) — LGPD anonymization + rate limiting base
- Edge Function: `supabase/functions/export-user-data/index.ts`
- Migration: `supabase/migrations/28_rate_limit_summary_rpc.sql`
- Hook: `src/hooks/useRateLimitDashboard.ts`
