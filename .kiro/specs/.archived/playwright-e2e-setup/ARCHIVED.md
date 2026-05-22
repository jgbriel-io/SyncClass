# Spec Arquivada: Playwright E2E Setup

**Data de arquivamento:** 22/05/2026  
**Motivo:** Decisão técnica — priorizar refatorações arquiteturais antes de E2E

## Contexto da Decisão

Após análise do projeto, decidimos **não implementar** testes E2E com Playwright no momento atual pelos seguintes motivos:

1. **14 débitos técnicos prioritários** identificados em `docs/architecture/technical-debt.md` (God hooks, N+1 queries, agregação no cliente)
2. **Arquitetura em refatoração** — componentes passaram por mudanças recentes (sprints 10-12), seletores E2E seriam instáveis
3. **Cobertura existente suficiente** — 287 testes unitários (Vitest) + testes manuais estruturados cobrem fluxos críticos
4. **ROI baixo no curto prazo** — 18h de setup + manutenção contínua vs prioridades arquiteturais
5. **Contexto TCC** — Cap. 7 já justifica ausência de E2E como decisão técnica deliberada

## Próximos Passos Recomendados

**Antes de considerar E2E:**

1. Resolver débitos ARQ-001, ARQ-002, REFORMA-001, REFORMA-003 (Sprint Refatoração 1 — 8h)
2. Validar estabilidade da arquitetura por 2-4 semanas
3. Revisar Cap. 7 do TCC para reforçar justificativa

**Pós-TCC (se projeto continuar):**

- Implementar Playwright com arquitetura estável
- Começar com 2-3 smoke tests (login + CRUD básico) antes dos 8 specs completos

## Conteúdo Arquivado

- `requirements.md` — 15 requisitos, 105 critérios de aceitação
- `design.md` — 18h de implementação, decisões arquiteturais
- `tasks.md` — 18 tarefas em 3 checkpoints
- `.config.kiro` — configuração da spec

Spec completa preservada para referência futura.
