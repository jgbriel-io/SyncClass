# Sprint 17 — Refactor: TCC Documentation Review

**Período:** 21 mai 2026  
**Status:** ✅ Concluída  
**Tipo:** Refactor  
**Prioridade:** 🟡 Média

## Problem Statement

Documentação do TCC (Trabalho de Conclusão de Curso) precisa de revisão e organização:

- **10 capítulos na raiz de `docs/tcc/`:** Arquivos misturados sem estrutura clara
- **Falta de padronização:** Cada capítulo segue estrutura diferente
- **Conteúdo desatualizado:** Referências a código/arquitetura antigos (pré-Sprint 16)
- **Referências não consolidadas:** `tcc-referencia.md` precisa ser renomeado e revisado
- **Sem índice navegável:** Difícil encontrar informação específica

**Impacto:**

- Escrita do TCC lenta — precisa buscar informação em múltiplos arquivos
- Risco de inconsistência — mesma informação em múltiplos lugares
- Difícil validar completude — não há checklist por capítulo

## Requirements

- ✅ Revisar estrutura de cada capítulo
- ✅ Padronizar formato (resumo, seções, referências cruzadas)
- ✅ Atualizar referências a código/arquitetura (docs/ reorganizados na Sprint 16)
- ✅ Renomear `tcc-referencia.md` → `referencias.md`
- ✅ Criar índice navegável (README.md)
- ⏳ Validar completude de cada capítulo

**Fora do escopo:**

- Escrever conteúdo novo (apenas organizar existente)
- Traduzir para inglês
- Gerar PDFs
- Criar diagramas/figuras (manter em assets-pendentes.md)

## Background

### Estrutura Atual

```
docs/tcc/
├── cap1-introducao.md
├── cap2-referencial.md
├── cap3-metodologia.md
├── cap4-requisitos.md
├── cap5-modelagem.md
├── cap6-desenvolvimento.md
├── cap7-qualidade.md
├── cap8-gestao.md
├── cap9-deploy-infra.md
├── cap10-conclusao.md
├── assets-pendentes.md
└── tcc-referencia.md
```

### Convenções de TCC

- Texto acadêmico formal (diferente de docs técnicos)
- Referências bibliográficas no formato ABNT
- Figuras e tabelas numeradas
- Seções numeradas (1.1, 1.2, etc)

## Proposed Solution

### Estrutura Proposta

```
docs/tcc/
├── README.md                    ← Índice navegável (novo)
├── cap1-introducao.md           ← Revisado
├── cap2-referencial.md          ← Revisado
├── cap3-metodologia.md          ← Revisado
├── cap4-requisitos.md           ← Revisado
├── cap5-modelagem.md            ← Revisado
├── cap6-desenvolvimento.md      ← Revisado
├── cap7-qualidade.md            ← Revisado
├── cap8-gestao.md               ← Revisado
├── cap9-deploy-infra.md         ← Revisado
├── cap10-conclusao.md           ← Revisado
├── referencias.md               ← Renomeado de tcc-referencia.md
└── assets-pendentes.md          ← Mantido como checklist global
```

### Padrão de Capítulo

Cada capítulo segue estrutura:

1. **Título** — número + nome do capítulo
2. **Resumo** — 2-3 frases sobre o capítulo
3. **Seções numeradas** — 1.1, 1.2, etc
4. **Figuras/Tabelas** — numeradas e referenciadas no texto
5. **Referências cruzadas** — links para outros capítulos e docs técnicos

**Exemplo:**

```markdown
# 1. Introdução

**Resumo:** Este capítulo apresenta o contexto, problema, objetivos e justificativa do projeto SyncClass.

## 1.1 Contexto

Conteúdo...

## 1.2 Problema

Conteúdo...

## Referências Cruzadas

- [Docs Técnicos — Architecture](../architecture/overview.md)
```

## Task Breakdown

### Task 1: Criar README do TCC

- **Objetivo:** Índice navegável de todos os capítulos
- **Implementação:**
  - Criar `docs/tcc/README.md`
  - Listar 10 capítulos com resumo de 1 linha
  - Status de completude por capítulo (✅ completo, 🟠 parcial, 🔴 pendente)
  - Links para referencias.md e assets-pendentes.md
- **Arquivos criados:**
  - `docs/tcc/README.md`
- **Teste:** Verificar links funcionando
- **Demo:** Índice navegável

### Task 2: Revisar Cap 1 — Introdução

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (contexto, problema, objetivos, justificativa, hipóteses)
  - Atualizar referências a docs/ (architecture, backend, frontend reorganizados)
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap1-introducao.md`
- **Teste:** Verificar que todas as seções estão completas
- **Demo:** Capítulo padronizado

### Task 3: Revisar Cap 2 — Referencial Teórico

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (SaaS, BaaS, React, Supabase, TanStack Query, shadcn/ui)
  - Atualizar versões de tecnologias (React 18, TypeScript 5.8, Supabase latest)
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap2-referencial.md`
- **Teste:** Verificar que todas as tecnologias estão documentadas
- **Demo:** Capítulo padronizado

### Task 4: Revisar Cap 3 — Metodologia

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (abordagem, sprints, ferramentas, Git workflow)
  - Atualizar referências a docs/sprints/ e docs/git/
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap3-metodologia.md`
- **Teste:** Verificar que metodologia está clara
- **Demo:** Capítulo padronizado

### Task 5: Revisar Cap 4 — Requisitos

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (RF, RNF, regras de negócio)
  - Atualizar referências a docs/archive/requisitos/ e docs/archive/regras-de-negocio/
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap4-requisitos.md`
- **Teste:** Verificar que todos os requisitos estão listados
- **Demo:** Capítulo padronizado

### Task 6: Revisar Cap 5 — Modelagem

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (casos de uso, diagrama ER, arquitetura de camadas)
  - Atualizar referências a docs/database/schema.md e docs/architecture/
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap5-modelagem.md`
- **Teste:** Verificar que diagramas estão referenciados
- **Demo:** Capítulo padronizado

### Task 7: Revisar Cap 6 — Desenvolvimento

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (frontend, backend, banco, segurança)
  - Atualizar referências a docs/frontend/, docs/backend/, docs/database/, docs/security/
  - Adicionar métricas atualizadas (42 hooks, 900+ strings, 21 migrations)
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap6-desenvolvimento.md`
- **Teste:** Verificar que todas as camadas estão documentadas
- **Demo:** Capítulo padronizado

### Task 8: Revisar Cap 7 — Qualidade

- **Objetivo:** Padronizar estrutura e atualizar métricas
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (testes, code review, CI/CD, RLS)
  - Atualizar métricas (161 testes: 32 unitários + 129 design tokens, 40+ RLS policies)
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap7-qualidade.md`
- **Teste:** Verificar que métricas estão atualizadas
- **Demo:** Capítulo padronizado

### Task 9: Revisar Cap 8 — Gestão

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (sprints, métricas, lições aprendidas)
  - Atualizar referências a docs/sprints/ (16 sprints implementadas)
  - Adicionar métricas finais (~218 commits, 53 docs)
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap8-gestao.md`
- **Teste:** Verificar que todas as sprints estão documentadas
- **Demo:** Capítulo padronizado

### Task 10: Revisar Cap 9 — Deploy e Infraestrutura

- **Objetivo:** Padronizar estrutura e atualizar referências
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (Supabase, CI/CD, monitoramento, Edge Functions)
  - Atualizar referências a docs/backend/edge-functions.md
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap9-deploy-infra.md`
- **Teste:** Verificar que infraestrutura está documentada
- **Demo:** Capítulo padronizado

### Task 11: Revisar Cap 10 — Conclusão

- **Objetivo:** Padronizar estrutura e atualizar métricas finais
- **Implementação:**
  - Adicionar resumo no topo
  - Revisar seções (resultados, hipóteses validadas, trabalhos futuros)
  - Atualizar métricas finais (16 sprints, 53 docs, 900+ strings, 161 testes)
  - Adicionar seção "Referências Cruzadas" no final
- **Arquivos modificados:**
  - `docs/tcc/cap10-conclusao.md`
- **Teste:** Verificar que conclusão está completa
- **Demo:** Capítulo padronizado

### Task 12: Renomear e Revisar Referências Bibliográficas

- **Objetivo:** Renomear e revisar referências ABNT
- **Implementação:**
  - Renomear `tcc-referencia.md` → `referencias.md`
  - Revisar formato ABNT de todas as referências
  - Ordenar alfabeticamente por autor
  - Adicionar referências faltantes (shadcn/ui, TanStack Query, etc)
- **Arquivos renomeados:**
  - `docs/tcc/tcc-referencia.md` → `docs/tcc/referencias.md`
- **Teste:** Verificar que todas as referências estão listadas
- **Demo:** Referências consolidadas em ABNT

### Task 13: Atualizar Assets Pendentes

- **Objetivo:** Revisar e atualizar checklist de assets
- **Implementação:**
  - Revisar `assets-pendentes.md`
  - Organizar por capítulo (Cap 1, Cap 2, etc)
  - Marcar assets já criados como ✅
  - Adicionar novos assets identificados durante revisão
- **Arquivos modificados:**
  - `docs/tcc/assets-pendentes.md`
- **Teste:** Verificar que assets estão organizados por capítulo
- **Demo:** Checklist atualizado

## Implementation Details

### Estrutura de Capítulo

```markdown
# {N}. {Título do Capítulo}

**Resumo:** 2-3 frases sobre o capítulo.

## {N}.1 Primeira Seção

Conteúdo...

### {N}.1.1 Subseção

Conteúdo...

## {N}.2 Segunda Seção

Conteúdo...

## Referências Cruzadas

- [Docs Técnicos — Architecture](../architecture/overview.md) — Descrição
```

## Files Created

```
docs/tcc/
└── README.md                    ← Índice navegável (novo)
```

## Files Modified

- `docs/tcc/cap1-introducao.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap3-metodologia.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap4-requisitos.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap5-modelagem.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap6-desenvolvimento.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap7-qualidade.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap8-gestao.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap9-deploy-infra.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/cap10-conclusao.md` — resumo + refs cruzadas + data 21/05
- `docs/tcc/assets-pendentes.md` — refs corrigidas (database/schema.md, sprints/historico-completo.md)
- `docs/tcc/referencias.md` — referências bibliográficas atualizadas

## Files Renamed

- `docs/tcc/tcc-referencia.md` → `docs/tcc/referencias.md`

## Files Deleted

Nenhum arquivo deletado nesta sprint.

## Testing & Validation

- [x] Estrutura de pastas criada corretamente
- [x] Links entre capítulos funcionando
- [x] Todos os capítulos seguem padrão (resumo, seções, referências cruzadas)
- [x] Referências bibliográficas atualizadas (TanStack Query, shadcn/ui adicionadas)
- [x] Assets com refs corrigidas (database/schema.md, sprints/historico-completo.md)
- [x] Métricas atualizadas (16 sprints, 53 docs, 900+ strings, 161 testes)

## Results & Impact

### Métricas Quantitativas

- ✅ 1 README criado
- ✅ 10 capítulos revisados e padronizados
- ✅ 1 arquivo renomeado (tcc-referencia.md → referencias.md)
- ✅ 2 referências adicionadas (TanStack Query, shadcn/ui)
- ✅ 1 arquivo de assets atualizado (refs corrigidas)
- ✅ 13 arquivos modificados no total

### Melhorias Qualitativas

- ✅ **Navegação facilitada:** README com índice navegável de todos os capítulos
- ✅ **Consistência:** Todos os capítulos seguem mesmo padrão (resumo, seções, referências cruzadas)
- ✅ **Atualização:** Referências a código/arquitetura atualizadas (pós-Sprint 16)
- ✅ **Organização:** Assets com refs corrigidas (database/schema.md, sprints/historico-completo.md)
- ✅ **Completude:** Métricas finais atualizadas (16 sprints, 53 docs, 900+ strings, 161 testes)
- ✅ **Referências:** TanStack Query e shadcn/ui adicionadas, datas atualizadas (21/mai/2026)

## Technical Debt

Itens identificados mas não resolvidos nesta sprint:

- [ ] **Gerar diagramas pendentes** — criar figuras listadas em assets pendentes (estimativa: 4h)
- [ ] **Revisar referências bibliográficas** — validar formato ABNT (estimativa: 1h)
- [ ] **Criar sumário executivo** — resumo de 1 página do TCC (estimativa: 30min)

## Lessons Learned

### O que funcionou bem

- ✅ Padrão de capítulo (resumo + refs cruzadas) trouxe consistência
- ✅ Atualização de refs a docs/ reorganizados (Sprint 16) manteve sincronização
- ✅ Adição de TanStack Query e shadcn/ui completou stack técnico nas refs

### O que poderia melhorar

- ⚠️ Guia de capítulos duplicava conteúdo — deletado pelo usuário
- ⚠️ Assets pendentes já estavam organizados — só precisou corrigir refs antigas

### Aplicações futuras

- 📝 Manter padrão de resumo + refs cruzadas em novos docs
- 📝 Sincronizar datas de atualização em batch (evitar inconsistências)
