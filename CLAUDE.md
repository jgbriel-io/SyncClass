# CLAUDE.md — SyncClass TCC

**SyncClass** — Plataforma SaaS para professores autônomos de idiomas.  
TCC 8º período FEPI. Stack: React 18 + Vite + TypeScript + Supabase + Tailwind CSS.

---

## Skills (Primeiro)

Guias de steering por domínio. Localização: `.claude/skills/`

**Como usar:** Cite no prompt: `Usar skill: {nome}`

| Skill | Focus |
|-------|-------|
| [**tcc-writing.md**](.claude/skills/tcc-writing.md) | Escrita acadêmica (FEPI/ABNT, voz impessoal, 10 capítulos) |
| [**code.md**](.claude/skills/code.md) | React + TypeScript (componentes, hooks, validação, performance) |
| [**database.md**](.claude/skills/database.md) | Supabase (migrations, types, RLS, 11 tabelas) |
| [**architecture.md**](.claude/skills/architecture.md) | Layered (6 camadas, padrões, N+1, agregação) |
| [**security.md**](.claude/skills/security.md) | Destrutivo/credenciais (perguntar antes de agir) |

---

## Diretrizes Comportamentais

Estas diretrizes reduzem erros comuns. Priorizam cautela em detrimento de velocidade. Para tarefas triviais, use bom senso.

### 1. Pense Antes de Programar

Não faça suposições. Exponha confusão. Apresente vantagens e desvantagens.

**Antes de implementar:**
- Exponha suposições explicitamente. Em caso de dúvida, pergunte.
- Se múltiplas interpretações existirem, apresente-as — não escolha em silêncio.
- Se abordagem mais simples existir, diga-a. Questione-a quando necessário.
- Se algo não estiver claro, pare. Nomeie confusão. Pergunte.

### 2. Simplicidade em Primeiro Lugar

Código mínimo que resolve problema. Nada de especulação.

- Nenhuma funcionalidade além do solicitado.
- Sem abstrações para código de uso único.
- Sem "flexibilidade" ou "configurabilidade" não-solicitada.
- Sem tratamento de erros para cenários impossíveis.
- Se 200 linhas poderiam ser 50, reescreva.
- Pergunta: "Um engenheiro sênior diria que isso é muito complicado?" Se sim, simplifique.

### 3. Alterações Cirúrgicas

Toque apenas no necessário. Limpe apenas sua sujeira.

**Ao editar código existente:**
- Não "melhore" código, comentários ou formatação adjacentes.
- Não refatore o que não está quebrado.
- Adapte-se ao estilo existente, mesmo se faria diferente.
- Se notar código morto não-relacionado, mencione — não apague.

**Quando suas alterações criam arquivos órfãos:**
- Remova importações/variáveis/funções que SUAS alterações tornaram não-utilizadas.
- Não remova código morto pré-existente, a menos que solicitado.

**Teste:** Cada linha alterada deve estar diretamente relacionada à solicitação do usuário.

### 4. Execução Orientada a Objetivos

Defina critérios de sucesso. Repita até verificar.

**Transforme tarefas em objetivos verificáveis:**
- "Adicionar validação" → "Escrever testes para entradas inválidas e fazê-los passar"
- "Corrigir bug" → "Escrever teste que reproduza e fazê-lo passar"
- "Refatorar X" → "Garantir testes passam antes e depois"

**Para tarefas multi-etapa, apresente plano resumido:**
```
1. [Passo] → verificar: [check]
2. [Passo] → verificar: [check]
3. [Passo] → verificar: [check]
```

Critérios robustos permitem ciclos independentes. Critérios fracos ("faça funcionar") exigem clarificações constantes.

---

## Projeto — TCC

**Problema:** Fragmentação da gestão de professores autônomos (planilhas, WhatsApp, pastas).  
**Solução:** Plataforma unificada (admin + teacher + student).

### Hipóteses
- **H1:** SaaS solo em ~3 meses com IA.
- **H2:** Supabase reduz ≥60% esforço backend.
- **H3:** Unificação reduz tarefas manuais.

### Estrutura dos 10 Capítulos

| Cap. | Título | Status |
|------|--------|--------|
| 1 | Introdução | ✅ |
| 2 | Referencial Teórico | 🟠 |
| 3–10 | Metodologia, Requisitos, Arquitetura, Implementação, Testes, Gestão, Deploy, Conclusão | 🔴 |

**Arquivos:** `docs/tcc/cap{N}-*.md`  
**Referências:** `docs/tcc/tcc-8-periodo/projeto-escrito/Referências Bibliográficas.md`

---

## Stack Técnica

**Frontend:** React 18 | Vite 5.4 | TypeScript 5.8 | Tailwind CSS 3.4 | shadcn/ui (Radix UI)  
**Data:** TanStack Query 5.83 | Supabase JS 2.90 | React Hook Form + Zod  
**Backend:** Supabase (PostgreSQL + RLS + Auth + Storage + Edge Functions)  
**Testes:** Vitest (unitários) — **sem Playwright/E2E ainda**  
**Deploy:** GitHub Actions  
**Monitoring:** Sentry 10.38

---

## Estrutura do Projeto

```
src/
  components/         # UI por domínio + ErrorBoundary, NavLink
    ├── activities/   admin/  auth/  classes/  dashboard/
    ├── filters/      financial/  layout/  overview/  pwa/
    └── student/  students/  teachers/  ui/  users/
  content/            # I18n — 16 arquivos por domínio + index.ts
  hooks/              # TanStack Query + services (mistura)
                      # ex: useStudents.ts, classLogsService.ts
  pages/              # Rotas por role
  contexts/           # AuthContext
  lib/
    ├── design-tokens/# typography(), stack(), iconSize()
    ├── validation/   # Zod schemas
    ├── security/     # errorHandler, sanitize
    ├── utils/        # formatters, validators
    ├── br-locations.ts, countries.ts  # dados estáticos
    └── pwa.ts, sentry.ts, pixConfig.ts, logger.ts
  integrations/
    └── supabase/     # client.ts, env.ts, types.ts, signup-client.ts

supabase/
  ├── migrations/     # 25 SQL migrations
  └── functions/      # 5 Edge Functions
                      # invite-user, reset-password, admin-delete-user,
                      # cleanup-storage, cleanup-old-records

docs/
  ├── tcc/            # 10 capítulos + projeto-escrito (Obsidian)
  ├── architecture/   # Overview, clean code
  ├── back/           # Supabase, integrations
  ├── banco/          # Schema, migrations
  ├── security/       # RLS, audit
  └── sprints/        # 24 sprints
```

---

## Quick Start

```bash
npm install
npm run dev                  # Vite dev server (localhost:5173)
npm run lint                 # ESLint
npm run type-check           # TypeScript (note: hyphen, not "typecheck")
npm run check                # lint + type-check
npm run test                 # Vitest (run once)
npm run test:watch           # Vitest watch
npm run build                # Production build
supabase status              # Verificar link Supabase
```

---

## Convenções (Resumo)

### Código
- **Strings UI:** Centralizar em `src/content/{dominio}.ts`. Importar via `import { ui, students } from '@/content'`. NUNCA hardcoded.
- **Componentes > 200 linhas:** quebrar em subcomponentes (`components/{dominio}/subcomponents/` quando aplicável).
- **Validação:** Zod em `lib/validation/`.
- **Comentários:** Apenas WHY não-óbvio. Uma linha máximo.
- **Sem `any`:** TypeScript strict mode.

### Performance
- **N+1:** Use JOINs no Supabase (`.select('*,related(...)')`).
- **Agregação:** No banco (RPC/materialized view), não no cliente.
- **Paginação:** Obrigatória para listagens.

### Segurança
- RLS em toda tabela com dados de user. Isolamento por teacher_id.
- Nunca expor credenciais. Zod + sanitize obrigatórios.

### TCC
- Voz impessoal (passiva / 3ª pessoa). Zero "eu/nós".
- Citações curtas entre aspas, longas com recuo 4 cm.
- Referências alfabéticas, título em **negrito**.
- Figuras antes do uso no texto: `Figura X – Título` (acima) + `Fonte: O autor (2026).` (abaixo).

---

## Referências

- **Código:** `docs/architecture/`, `docs/back/`, `docs/banco/`, `docs/security/`
- **TCC:** `docs/tcc/tcc-8-periodo/projeto-escrito/` (Obsidian vault)
- **Histórico:** `docs/sprints/` (24 sprints)
- **Assets pendentes:** `docs/tcc/assets-pendentes.md`
- **Tabela referência projeto:** `docs/tcc/tcc-referencia.md`

---

Atualizado: 2026-05-16 | Modo: Caveman (terse, sem fluff)
