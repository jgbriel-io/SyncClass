# Arquitetura

Arquitetura em camadas do SyncClass usando Supabase como BaaS. Frontend React consome PostgreSQL via PostgREST com RLS, sem servidor de aplicação próprio.

**Para quem:** Desenvolvedores que precisam entender a estrutura do projeto, adicionar features ou resolver débitos técnicos.

## Índice

- [Quando usar](#quando-usar)
- [Tipo de arquitetura](#tipo-de-arquitetura)
- [Camadas do frontend](#camadas-do-frontend)
- [Documentação detalhada](#documentação-detalhada)
- [Métricas](#métricas)
- [Ver também](#ver-também)

## Quando usar

**Use esta documentação quando:**

- Adicionar nova feature e precisar entender onde colocar código
- Fazer onboarding de novo desenvolvedor
- Entender decisões técnicas do projeto
- Planejar refatorações ou melhorias

**Não use quando:**

- Procurar detalhes de schema do banco → [Database Overview](../database/overview.md)
- Procurar políticas RLS → [Security Overview](../security/overview.md)
- Procurar padrões de UI → [Frontend Overview](../frontend/overview.md)
- Procurar APIs de backend → [Backend Overview](../backend/overview.md)

## Tipo de arquitetura

**Layered Architecture** com padrão **BFF implícito** via Supabase.

Não há servidor de aplicação próprio. O Supabase atua como backend completo (PostgreSQL + Auth + Storage + Edge Functions). O frontend consome diretamente via SDK.

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                      │
│  Pages (admin/ teacher/ student/)                    │
│    └── Components (UI + domain)                      │
│         └── Hooks (TanStack Query + mutations)       │
│              └── Supabase JS Client                  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────┐
│                   SUPABASE (BaaS)                    │
│                                                      │
│  Auth (JWT)  │  PostgREST (REST API)  │  Storage     │
│              │                        │              │
│              └──── PostgreSQL ────────┘              │
│                   RLS Policies                       │
│                   Triggers / RPCs                    │
│                   Edge Functions (Deno)              │
└─────────────────────────────────────────────────────┘
```

**Legenda:**

- `└──` — Dependência direta (camada inferior depende da superior)
- `│` — Comunicação bidirecional
- `▼` — Fluxo de dados (requisição HTTP/WebSocket)

## Camadas do frontend

| Camada       | Localização                  | Responsabilidade                                  |
| ------------ | ---------------------------- | ------------------------------------------------- |
| Pages        | `src/pages/`                 | Roteamento, composição de views por role          |
| Views        | `src/components/*/View.tsx`  | Layout de página, orquestração de estado          |
| Components   | `src/components/*/`          | UI pura, formulários, tabelas, dialogs            |
| Hooks        | `src/hooks/`                 | Lógica de negócio, TanStack Query, mutations      |
| Context      | `src/contexts/`              | Estado global (apenas AuthContext)                |
| Lib          | `src/lib/`                   | Utilitários, design tokens, validações, segurança |
| Integrations | `src/integrations/supabase/` | Client Supabase, tipos gerados                    |

**Particularidades:**

- Formulários são Dialogs/Modals — não há rotas separadas para forms
- Inputs usam `id` (não `name`) para identificação
- Polling contínuo via Supabase realtime — não usar `networkidle` em testes E2E
- `supabaseSignupClient` isolado com `memoryStorage` para criação de usuários sem afetar sessão principal (`src/integrations/supabase/signup-client.ts`)

## Documentação detalhada

### [Fluxos](./flows.md)

Fluxos de requisição, autenticação e comunicação entre módulos. Inclui exemplos práticos com referências a arquivos reais.

**Conteúdo:**

- Fluxo de requisição completo (8 passos)
- Fluxo de autenticação (7 passos)
- Diagrama de módulos e conexões
- Rotas e proteção por role

### [Design Patterns](./patterns.md)

Padrões de design aplicados no projeto com exemplos de quando usar cada um.

**Conteúdo:**

- Singleton (Supabase client) — `src/integrations/supabase/client.ts:8`
- Strategy (Optimistic vs Retry mutations) — `src/hooks/useOptimisticMutation.ts:12`
- Template Method (Mutation wrappers) — `src/hooks/useOptimisticMutation.ts:12`
- Repository (Data fetching hooks) — `src/hooks/useStudents.ts:12`
- Factory (Error handlers) — `src/lib/security/errorHandler.ts:78`
- Observer (Real-time subscriptions) — `src/hooks/useFinancialRecords.ts:456`

### [Decisões Arquiteturais](./decisions.md)

ADRs (Architecture Decision Records) documentando escolhas técnicas e trade-offs.

**Conteúdo:**

- ADR-001: Supabase como BaaS (vs Node.js + Express)
- ADR-002: TanStack Query para data fetching (vs Redux)
- ADR-003: React Router em vez de Next.js
- ADR-004: shadcn/ui em vez de biblioteca completa
- ADR-005: Formulários como Dialogs
- ADR-006: Design tokens customizados
- ADR-007: Centralização de strings UI

### [Débito Técnico](./technical-debt.md)

Problemas arquiteturais e refatorações identificadas com priorização e estimativas.

**Resumo:**

- 14 itens identificados (6 arquiteturais + 8 refatorações)
- **Todos resolvidos** — débito técnico zerado

### [Troubleshooting](./troubleshooting.md)

Erros comuns, diagnóstico e soluções.

**Conteúdo:**

- Erro 1: "new row violates row-level security policy"
- Erro 2: "Failed to fetch" ou "Network request failed"
- Erro 3: "Invalid query key" ou cache desatualizado
- Erro 4: "Function is_admin() does not exist"
- Erro 5: Query lenta (>2s)

## Métricas

| Métrica                     | Valor                | Fonte                                            |
| --------------------------- | -------------------- | ------------------------------------------------ |
| **Bundle size (gzipped)**   | 287 KB               | `npm run build`                                  |
| **Tempo de build**          | ~8s                  | `npm run build`                                  |
| **Tempo de HMR**            | <100ms               | Vite DevTools                                    |
| **Cobertura de testes**     | 26 arquivos de teste | `npm run test`                                   |
| **Linhas de código (src/)** | ~50.467              | `cloc src/`                                      |
| **Arquivos (src/)**         | ~358                 | `find src/ -type f`                              |
| **Componentes React**       | ~184                 | `find src/components/ -name "*.tsx"`             |
| **Hooks customizados**      | 45                   | `find src/hooks/ -name "*.ts"`                   |
| **Páginas**                 | 24                   | `find src/pages/ -name "*.tsx"`                  |
| **Migrations SQL**          | 43                   | `supabase/migrations/`                           |
| **Edge Functions**          | 6                    | `supabase/functions/`                            |
| **RLS Policies**            | 40+                  | `supabase/migrations/04_rls_and_permissions.sql` |
| **Design tokens**           | 129 testes           | `src/lib/design-tokens/`                         |
| **Strings centralizadas**   | 860+                 | `src/content/`                                   |

## Ver também

- [Database Overview](../database/overview.md) — Schema, migrations, RPCs, triggers
- [Security Overview](../security/overview.md) — RLS policies, auth, rate limiting
- [Frontend Overview](../frontend/overview.md) — Componentes, design tokens, UI patterns
- [Backend Overview](../backend/overview.md) — Edge Functions, integrações, APIs
- [Sprints](../sprints/README.md) — Histórico de desenvolvimento e decisões por sprint
- [Validação de Sprints](../archive/gestao-projeto/validacao-sprints-1-15.md) — Evidências de implementação
