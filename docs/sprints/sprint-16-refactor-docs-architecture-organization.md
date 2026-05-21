# Sprint 16 — Refactor: Docs Architecture Organization

**Período:** 21 mai 2026  
**Status:** 🚧 Em andamento  
**Tipo:** Refactor  
**Prioridade:** 🟡 Média

## Problem Statement

Documentação técnica do projeto estava desorganizada e difícil de navegar:

- **Arquivos avulsos na raiz de `docs/`:** `architecture.md`, `backend.md`, `database.md`, `frontend.md`, `security.md` sem estrutura hierárquica
- **Falta de profundidade:** `architecture.md` tinha 800 linhas misturando visão geral, padrões, decisões, débito técnico e troubleshooting — difícil de navegar
- **Sprints sem prefixos descritivos:** `sprint-01-fundacao.md` não indica que é MVP, dificultando busca
- **Archive desorganizado:** Requisitos, regras de negócio e gestão de projeto misturados sem estrutura clara
- **Sem padronização:** Cada overview seguia estrutura diferente, sem índice navegável ou seção "Ver também"

**Impacto:**
- Onboarding lento — devs não sabem por onde começar
- Informação duplicada — mesmos conceitos em múltiplos arquivos
- Manutenção difícil — atualizar um conceito exige editar vários arquivos
- Busca ineficiente — não há hierarquia clara de tópicos

## Requirements

- ✅ Reorganizar `docs/archive/` com subpastas por tipo (requisitos, regras, gestão)
- ✅ Criar subpastas para cada domínio (`architecture/`, `backend/`, `database/`, `frontend/`, `security/`)
- ✅ Quebrar `architecture.md` (800 linhas) em múltiplos arquivos focados
- ✅ Padronizar estrutura de overviews (índice, intro, seções, ver também)
- ✅ Renomear sprints com prefixos descritivos (`sprint-01-mvp-crud-basico-financeiro.md`)
- ✅ Criar ADRs documentando decisões arquiteturais
- ✅ Criar guia de troubleshooting com erros comuns
- ⏳ Revisar e padronizar overviews de backend, database, frontend, security

**Fora do escopo:**
- Reescrever conteúdo técnico (apenas reorganizar)
- Adicionar novos tópicos não documentados
- Traduzir documentação para inglês

## Background

### Stack de Documentação
- Markdown para todos os docs
- Estrutura hierárquica de pastas
- Referências cruzadas via links relativos
- Code blocks com language tags
- Formato `caminho:linha` para referências a código

### Convenções Existentes
- Sentence case em títulos (não Title Case)
- Índice navegável no topo de arquivos longos
- Seção "Ver também" no final
- Intro contextual (1-3 frases + para quem)
- Exemplos práticos com referências a arquivos reais

### Estrutura Atual
```
docs/
├── architecture.md          ← 800 linhas, tudo misturado
├── backend.md               ← avulso
├── database.md              ← avulso
├── frontend.md              ← avulso
├── security.md              ← avulso
├── archive/
│   └── sprint-23/           ← auditorias antigas
├── sprints/
│   ├── sprint-01-fundacao.md  ← sem prefixo de tipo
│   └── ...
└── tcc/
```

## Proposed Solution

### Estrutura Proposta

```
docs/
├── architecture/
│   ├── overview.md          ← Orquestrador (~150 linhas)
│   ├── flows.md             ← Fluxos de requisição/auth
│   ├── patterns.md          ← Design patterns aplicados
│   ├── decisions.md         ← ADRs (7 decisões)
│   ├── troubleshooting.md   ← 5 erros comuns
│   └── technical-debt.md    ← Débitos priorizados
├── backend/
│   └── overview.md          ← Edge Functions, integrações
├── database/
│   └── overview.md          ← Schema, migrations, RLS
├── frontend/
│   └── overview.md          ← Componentes, design tokens
├── security/
│   └── overview.md          ← Auth, RLS, rate limiting
├── archive/
│   ├── README.md            ← Índice do archive
│   ├── requisitos/
│   │   ├── requisitos-funcionais.md      ← RF01-RF30
│   │   └── requisitos-nao-funcionais.md  ← RNF01-RNF36
│   ├── regras-de-negocio/
│   │   └── regras-de-negocio.md          ← RN01-RN59
│   └── gestao-projeto/
│       ├── historico-desenvolvimento.md
│       └── validacao-sprints-1-15.md
├── sprints/
│   ├── README.md
│   ├── TEMPLATE.md
│   ├── sprint-01-mvp-crud-basico-financeiro.md
│   ├── sprint-02-mvp-auth-roles-profiles.md
│   └── ...
└── tcc/
```

### Padrão de Overview

Todos os overviews seguem estrutura:

1. **Título** — uma linha
2. **Intro** — 1-3 frases + para quem
3. **Índice** — links para seções
4. **Quando usar** — casos de uso + quando NÃO usar
5. **Conteúdo principal** — seções específicas do domínio
6. **Ver também** — links para docs relacionados

## Task Breakdown

### Task 1: Reorganizar `docs/archive/`

- **Objetivo:** Estruturar archive com subpastas por tipo
- **Implementação:**
  - Criar `archive/requisitos/` com RF e RNF detalhados
  - Criar `archive/regras-de-negocio/` com 59 regras sincronizadas
  - Criar `archive/gestao-projeto/` com histórico e validação
  - Criar `archive/README.md` como índice
  - Deletar `archive/sprint-23/` (auditorias obsoletas)
- **Arquivos criados:**
  - `docs/archive/README.md`
  - `docs/archive/requisitos/requisitos-funcionais.md`
  - `docs/archive/requisitos/requisitos-nao-funcionais.md`
  - `docs/archive/regras-de-negocio/regras-de-negocio.md`
  - `docs/archive/gestao-projeto/historico-desenvolvimento.md`
  - `docs/archive/gestao-projeto/validacao-sprints-1-15.md`
- **Teste:** Navegar pelo README e verificar links funcionando
- **Demo:** Estrutura hierárquica clara com 3 subpastas

### Task 2: Criar subpastas de domínio

- **Objetivo:** Mover arquivos avulsos para subpastas organizadas
- **Implementação:**
  - Criar `docs/architecture/`, `docs/backend/`, `docs/database/`, `docs/frontend/`, `docs/security/`
  - Mover `architecture.md` → `architecture/overview.md`
  - Mover `backend.md` → `backend/overview.md`
  - Mover `database.md` → `database/overview.md`
  - Mover `frontend.md` → `frontend/overview.md`
  - Mover `security.md` → `security/overview.md`
- **Arquivos criados:**
  - `docs/architecture/overview.md`
  - `docs/backend/overview.md`
  - `docs/database/overview.md`
  - `docs/frontend/overview.md`
  - `docs/security/overview.md`
- **Teste:** Verificar que arquivos antigos foram deletados
- **Demo:** 5 subpastas com overviews

### Task 3: Quebrar `architecture/overview.md`

- **Objetivo:** Separar 800 linhas em 6 arquivos focados
- **Implementação:**
  - Criar `overview.md` como orquestrador (~150 linhas)
  - Extrair fluxos → `flows.md` (requisição, auth, módulos, rotas)
  - Extrair padrões → `patterns.md` (6 design patterns com exemplos)
  - Extrair decisões → `decisions.md` (7 ADRs)
  - Extrair troubleshooting → `troubleshooting.md` (5 erros comuns)
  - Manter `technical-debt.md` (já existia)
- **Arquivos criados:**
  - `docs/architecture/flows.md`
  - `docs/architecture/patterns.md`
  - `docs/architecture/decisions.md`
  - `docs/architecture/troubleshooting.md`
- **Teste:** Verificar links entre arquivos funcionando
- **Demo:** 6 arquivos focados, cada um <400 linhas

### Task 4: Padronizar overviews

- **Objetivo:** Aplicar estrutura padrão em todos os overviews
- **Implementação:**
  - Adicionar intro contextual (1-3 frases + para quem)
  - Adicionar índice navegável no topo
  - Adicionar seção "Quando usar" / "Quando NÃO usar"
  - Adicionar seção "Ver também" no final
  - Usar sentence case em títulos
  - Adicionar referências a código (`caminho:linha`)
- **Arquivos modificados:**
  - `docs/architecture/overview.md`
  - `docs/architecture/flows.md`
  - `docs/architecture/patterns.md`
  - `docs/architecture/decisions.md`
  - `docs/architecture/troubleshooting.md`
  - `docs/architecture/technical-debt.md`
- **Teste:** Verificar que todos seguem mesmo padrão
- **Demo:** Estrutura consistente em todos os arquivos

### Task 5: Renomear sprints com prefixos

- **Objetivo:** Adicionar prefixos descritivos para facilitar busca
- **Implementação:**
  - Renomear sprints 1-7 com prefixo `mvp-`
  - Renomear sprints 8-15 com prefixo `refactor-` ou `fix-`
  - Renomear sprints 16-20 (não implementadas) mantendo sufixo `-NAO-IMPLEMENTADA`
  - Atualizar links em `README.md` e `historico-completo.md`
- **Arquivos renomeados:**
  - `sprint-01-fundacao.md` → `sprint-01-mvp-crud-basico-financeiro.md`
  - `sprint-02-autenticacao-usuarios.md` → `sprint-02-mvp-auth-roles-profiles.md`
  - `sprint-03-qualidade-infra.md` → `sprint-03-mvp-ci-soft-delete-design-tokens.md`
  - (continuar para todas as 20 sprints)
- **Teste:** Verificar que links não quebraram
- **Demo:** Nomes descritivos facilitando busca

### Task 6: Criar ADRs (Architecture Decision Records)

- **Objetivo:** Documentar 7 decisões arquiteturais com trade-offs
- **Implementação:**
  - ADR-001: Supabase como BaaS (vs Node.js + Express)
  - ADR-002: TanStack Query para data fetching (vs Redux)
  - ADR-003: React Router em vez de Next.js
  - ADR-004: shadcn/ui em vez de biblioteca completa
  - ADR-005: Formulários como Dialogs
  - ADR-006: Design tokens customizados
  - ADR-007: Centralização de strings UI
- **Arquivo criado:**
  - `docs/architecture/decisions.md`
- **Teste:** Verificar que cada ADR tem contexto, decisão, consequências, alternativas
- **Demo:** 7 ADRs documentados com trade-offs

### Task 7: Criar guia de troubleshooting

- **Objetivo:** Documentar 5 erros comuns com diagnóstico e solução
- **Implementação:**
  - Erro 1: "new row violates row-level security policy"
  - Erro 2: "Failed to fetch" ou "Network request failed"
  - Erro 3: "Invalid query key" ou cache desatualizado
  - Erro 4: "Function is_admin() does not exist"
  - Erro 5: Query lenta (>2s)
- **Arquivo criado:**
  - `docs/architecture/troubleshooting.md`
- **Teste:** Verificar que cada erro tem sintoma, causa, diagnóstico, solução, prevenção
- **Demo:** 5 erros documentados com exemplos práticos

### Task 8: Revisar overviews de outros domínios (⏳ Pendente)

- **Objetivo:** Aplicar mesmo padrão em backend, database, frontend, security
- **Implementação:**
  - Revisar `backend/overview.md` (Edge Functions, integrações)
  - Revisar `database/overview.md` (Schema, migrations, RLS)
  - Revisar `frontend/overview.md` (Componentes, design tokens)
  - Revisar `security/overview.md` (Auth, RLS, rate limiting)
- **Arquivos modificados:**
  - `docs/backend/overview.md`
  - `docs/database/overview.md`
  - `docs/frontend/overview.md`
  - `docs/security/overview.md`
- **Teste:** Verificar que todos seguem padrão de architecture/overview.md
- **Demo:** 4 overviews padronizados

## Implementation Details

### Arquivos de Arquitetura

| Arquivo | Linhas | Conteúdo |
|---------|--------|----------|
| `overview.md` | ~150 | Orquestrador, índice, métricas |
| `flows.md` | ~200 | Fluxos de requisição, auth, módulos, rotas |
| `patterns.md` | ~350 | 6 design patterns (Singleton, Strategy, Template Method, Repository, Factory, Observer) |
| `decisions.md` | ~400 | 7 ADRs com contexto, decisão, consequências, alternativas |
| `troubleshooting.md` | ~350 | 5 erros comuns com diagnóstico e solução |
| `technical-debt.md` | ~300 | 14 itens (6 problemas + 8 refatorações) priorizados |

### Sprints Renomeadas

| Antes | Depois | Tipo |
|-------|--------|------|
| `sprint-01-fundacao.md` | `sprint-01-mvp-crud-basico-financeiro.md` | MVP |
| `sprint-02-autenticacao-usuarios.md` | `sprint-02-mvp-auth-roles-profiles.md` | MVP |
| `sprint-03-qualidade-infra.md` | `sprint-03-mvp-ci-soft-delete-design-tokens.md` | MVP |
| `sprint-04-features-avancadas.md` | `sprint-04-mvp-dashboard-historico-reset-senha.md` | MVP |
| `sprint-05-estabilizacao-ux.md` | `sprint-05-mvp-mobile-atividades-pacotes-pix.md` | MVP |
| `sprint-06-seguranca-correcoes.md` | `sprint-06-mvp-idempotencia-faltas-estrangeiros.md` | MVP |
| `sprint-07-auditorias-migrations.md` | `sprint-07-mvp-hardening-rls-rate-limit.md` | MVP |
| `sprint-08-reestruturacao.md` | `sprint-08-refactor-supabase-hooks-separation.md` | Refactor |
| `sprint-09-restore-tcc.md` | `sprint-09-refactor-split-large-files.md` | Refactor |
| `sprint-10-correcao-arquitetura.md` | `sprint-10-refactor-remove-duplicate-queries.md` | Refactor |
| `sprint-11-correcao-componentes.md` | `sprint-11-fix-timezone-error-boundary.md` | Fix |
| `sprint-12-correcao-duplicacao.md` | `sprint-12-refactor-content-structure-i18n-prep.md` | Refactor |
| `sprint-13-correcoes-pre-defesa.md` | `sprint-13-refactor-centralize-ui-strings.md` | Refactor |
| `sprint-14-notificacoes.md` | `sprint-14-refactor-remove-hardcoded-strings.md` | Refactor |
| `sprint-15-exportacao-pdf.md` | `sprint-15-refactor-final-string-audit.md` | Refactor |

## Files Created

```
docs/
├── architecture/
│   ├── overview.md          ← Orquestrador (~150 linhas)
│   ├── flows.md             ← Fluxos de requisição/auth (~200 linhas)
│   ├── patterns.md          ← 6 design patterns (~350 linhas)
│   ├── decisions.md         ← 7 ADRs (~400 linhas)
│   ├── troubleshooting.md   ← 5 erros comuns (~350 linhas)
│   └── technical-debt.md    ← 14 itens priorizados (~300 linhas)
├── backend/
│   └── overview.md          ← Edge Functions, integrações
├── database/
│   └── overview.md          ← Schema, migrations, RLS
├── frontend/
│   └── overview.md          ← Componentes, design tokens
├── security/
│   └── overview.md          ← Auth, RLS, rate limiting
├── archive/
│   ├── README.md            ← Índice do archive
│   ├── requisitos/
│   │   ├── requisitos-funcionais.md      ← RF01-RF30
│   │   └── requisitos-nao-funcionais.md  ← RNF01-RNF36
│   ├── regras-de-negocio/
│   │   └── regras-de-negocio.md          ← RN01-RN59
│   └── gestao-projeto/
│       ├── historico-desenvolvimento.md   ← Análise de 165 commits
│       └── validacao-sprints-1-15.md      ← 97.8% validação
└── sprints/
    ├── sprint-01-mvp-crud-basico-financeiro.md
    ├── sprint-02-mvp-auth-roles-profiles.md
    └── ... (20 sprints renomeadas)
```

## Files Modified

- `docs/sprints/README.md` — atualizado com novos nomes de sprints
- `docs/sprints/historico-completo.md` — links atualizados
- `docs/README.md` — links para nova estrutura (se existir)

## Files Deleted

- `docs/architecture.md` — substituído por `architecture/overview.md` + 5 arquivos
- `docs/backend.md` — movido para `backend/overview.md`
- `docs/database.md` — movido para `database/overview.md`
- `docs/frontend.md` — movido para `frontend/overview.md`
- `docs/security.md` — movido para `security/overview.md`
- `docs/archive/sprint-23/` — 26 arquivos de auditorias obsoletas deletados

## Testing & Validation

- [x] Estrutura de pastas criada corretamente
- [x] Links entre arquivos funcionando
- [x] Todos os overviews seguem padrão (intro, índice, quando usar, ver também)
- [x] Sprints renomeadas com prefixos descritivos
- [x] Archive organizado com subpastas
- [x] ADRs documentam 7 decisões com trade-offs
- [x] Troubleshooting documenta 5 erros comuns
- [ ] Overviews de backend, database, frontend, security revisados (⏳ pendente)

## Results & Impact

### Métricas Quantitativas
- ✅ 6 arquivos criados em `docs/architecture/`
- ✅ 5 subpastas de domínio criadas
- ✅ 6 arquivos criados em `docs/archive/`
- ✅ 20 sprints renomeadas com prefixos descritivos
- ✅ 26 arquivos obsoletos deletados (`archive/sprint-23/`)
- ✅ 800 linhas de `architecture.md` quebradas em 6 arquivos focados
- ✅ 7 ADRs documentados
- ✅ 5 erros comuns documentados com solução
- ✅ 14 débitos técnicos priorizados

### Melhorias Qualitativas
- ✅ **Navegação facilitada:** Estrutura hierárquica clara com índices
- ✅ **Onboarding acelerado:** Devs sabem por onde começar (overview → tópicos específicos)
- ✅ **Manutenção simplificada:** Cada tópico em arquivo separado, fácil de atualizar
- ✅ **Busca eficiente:** Prefixos em sprints facilitam busca por tipo
- ✅ **Consistência:** Todos os overviews seguem mesmo padrão
- ✅ **Decisões documentadas:** ADRs explicam "por quê" das escolhas técnicas
- ✅ **Troubleshooting prático:** Erros comuns com diagnóstico e solução

## Technical Debt

Itens identificados mas não resolvidos nesta sprint:

- [ ] **Revisar overviews de backend, database, frontend, security** — aplicar mesmo padrão de architecture/overview.md (estimativa: 2h)
- [ ] **Criar diagramas visuais** — fluxos de requisição, arquitetura em camadas (estimativa: 1h)
- [ ] **Adicionar métricas de bundle size** — documentar em architecture/overview.md (estimativa: 30min)
- [ ] **Documentar Edge Functions individualmente** — criar `backend/edge-functions.md` (estimativa: 1h)
- [ ] **Documentar schema completo** — criar `database/schema.md` com todas as tabelas (estimativa: 2h)

## Lessons Learned

### O que funcionou bem
- ✅ **Quebrar arquivo grande em múltiplos focados** — 800 linhas → 6 arquivos de ~200-400 linhas cada facilita navegação
- ✅ **Padronizar estrutura de overviews** — intro + índice + quando usar + ver também cria consistência
- ✅ **Prefixos em sprints** — `mvp-`, `refactor-`, `fix-` facilitam busca e categorização
- ✅ **ADRs documentam trade-offs** — explicar "por quê" é mais valioso que apenas "o quê"
- ✅ **Troubleshooting com exemplos práticos** — código real + diagnóstico + solução é mais útil que teoria

### O que poderia melhorar
- ⚠️ **Revisar todos os overviews de uma vez** — deixar backend/database/frontend/security para depois pode gerar inconsistência
- ⚠️ **Não criar diagramas visuais** — fluxos em texto são menos intuitivos que diagramas
- ⚠️ **Não validar links quebrados** — renomear arquivos pode quebrar links em outros docs

### Aplicações futuras
- 💡 **Aplicar padrão de overview em todos os domínios** — backend, database, frontend, security devem seguir mesma estrutura
- 💡 **Criar script de validação de links** — automatizar verificação de links quebrados
- 💡 **Adicionar diagramas Mermaid** — fluxos visuais são mais intuitivos que texto
- 💡 **Documentar decisões em ADRs** — sempre que houver escolha técnica não óbvia, criar ADR

## Next Steps

1. **Revisar overviews de backend, database, frontend, security** — aplicar padrão de architecture/overview.md
2. **Criar diagramas visuais** — fluxos de requisição, arquitetura em camadas usando Mermaid
3. **Commitar trabalho** — `docs: refactor documentation structure and standardize overviews`
4. **Atualizar Cap6 do TCC** — referenciar nova estrutura de docs

## References

- `docs/architecture/overview.md` — orquestrador da documentação de arquitetura
- `docs/sprints/TEMPLATE.md` — template padrão para sprints
- `.kiro/steering/docs-style.md` — guia de estilo de documentação (se existir)
- `docs/archive/gestao-projeto/validacao-sprints-1-15.md` — validação de sprints anteriores
