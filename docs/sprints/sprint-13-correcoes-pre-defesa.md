# Sprint 13 — Correções Críticas Pré-Defesa
**Período:** Abril 2026
**Status:** ⬜ Pendente
**Estimativa:** ~1h

## Objetivo
Corrigir bugs que afetam LGPD, comportamento em produção e estabilidade antes da defesa do TCC.

## Tarefas

### 13.1 — `sendDefaultPii: true` no Sentry (LGPD)
**Arquivo:** `src/lib/sentry.ts`
**Problema:** Envia email do usuário autenticado para o Sentry — viola LGPD.
**Correção:**
```ts
// de
sendDefaultPii: true,
// para
sendDefaultPii: false,
```

---

### 13.2 — `App.tsx` sem `ErrorBoundary` global
**Arquivo:** `src/App.tsx`
**Problema:** Crash em qualquer componente derruba a aplicação inteira sem fallback.
**Correção:** Envolver `<AppContent />` com o `<ErrorBoundary>` já existente em `src/components/ErrorBoundary.tsx`.

---

### 13.3 — `gradeSchema` com `max(10)` incorreto
**Arquivo:** `src/lib/validation/schemas.ts`
**Problema:** Validação limita nota a 10, mas o banco aceita 0–100.
**Correção:** Mudar `z.number().max(10)` para `z.number().max(100)`.

---

### 13.4 — Timezone bug em `getDateRangeForPeriod`
**Arquivo:** `src/hooks/useClassLogs.ts`
**Problema:** Usa `new Date()` sem timezone — datas erradas para usuários fora de Brasília.
**Correção:** Usar `date-fns` (já instalado) com `startOfMonth`, `endOfMonth`, `subMonths` para construir as datas de forma segura.

---

### 13.5 — Timezone bug em `isOverdue` e `classTime.ts`
**Arquivo:** `src/lib/utils/classTime.ts`
**Problema:** Mistura `DATE` e `TIMESTAMPTZ` nas comparações — cobranças podem aparecer como atrasadas incorretamente.
**Correção:** Padronizar comparações usando `startOfDay`/`endOfDay` do `date-fns`.

## Critério de Conclusão
- Sentry não envia PII
- App não crasha sem fallback
- Notas aceitam 0–100
- Datas corretas independente do fuso
