# Sprint 9 — Restore & Organização para TCC
**Período:** 21 abril 2026  
**Status:** ✅ Concluída (base) / 🔄 Em andamento (pendências)

## Objetivo
Restaurar codebase completo, aplicar correções críticas de banco e organizar documentação para o TCC.

## O que foi feito

- Restore completo do codebase (`chore: restore full codebase`)
- Remoção de referências ao nome específico da escola (white-label)
- Migrations 22 e 23 aplicadas:
  - `22_dba_fixes.sql` — 13 correções de banco (índices, constraints, consistência)
  - `23_security_rls_fixes.sql` — 6 correções críticas de RLS (BOLA/IDOR)
- Configuração de MCP servers, skills e hooks do Kiro
- Validação do estado do projeto vs auditorias anteriores
- Correção de lint errors
- Documentação retroativa completa para TCC:
  - `docs/tcc/` — 10 capítulos estruturados
  - `docs/sprints/` — histórico completo por sprint
  - `docs/sprints/README.md` — sprints de correção planejadas

## Commits

| Hash | Data | Descrição |
|------|------|-----------|
| `7b6c260` | 21/04 | chore: restore full codebase |
| `a9314dd` | 21/04 | fix: lint error |
| `8d827a0` | 21/04 | chore: remove referencias de nome especifico da escola |

## Pendências identificadas (Sprint 10)

| ID | Severidade | Descrição |
|----|-----------|-----------|
| BUG-FRONT-001 | Alta | `sendDefaultPii: true` no Sentry — envia email do usuário (LGPD) |
| BUG-FRONT-002 | Alta | `useNewStudentsByMonth` carrega todos os registros sem paginação |
| BUG-FRONT-004 | Média | `App.tsx` sem `ErrorBoundary` global |
| BUG-BACK-002 | Alta | Timezone bug em `getDateRangeForPeriod` |
| BUG-BACK-003 | Alta | Timezone bug em `isOverdue` |
| BUG-BACK-004 | Alta | Mistura DATE e TIMESTAMPTZ em `classTime.ts` |
| REFORMA-001 | Alta | Dois `sanitizeErrorMessage` coexistindo com lógica diferente |
| REFORMA-003 | Alta | Detecção de overlap duplicada em 3 hooks |
| REFORMA-008 | Baixa | `gradeSchema` com `max(10)` mas banco aceita 0–100 |
