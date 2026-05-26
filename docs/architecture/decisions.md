# Decisões Arquiteturais

ADRs (Architecture Decision Records) documentando escolhas técnicas, trade-offs e alternativas consideradas no SyncClass.

## Índice

- [Quando usar este documento](#quando-usar-este-documento)
- [ADR-001: Supabase como BaaS](#adr-001-supabase-como-baas)
- [ADR-002: TanStack Query para data fetching](#adr-002-tanstack-query-para-data-fetching)
- [ADR-003: React Router em vez de Next.js](#adr-003-react-router-em-vez-de-nextjs)
- [ADR-004: shadcn/ui em vez de biblioteca completa](#adr-004-shadcnui-em-vez-de-biblioteca-completa)
- [ADR-005: Formulários como Dialogs](#adr-005-formulários-como-dialogs)
- [ADR-006: Design tokens customizados](#adr-006-design-tokens-customizados)
- [ADR-007: Centralização de strings UI](#adr-007-centralização-de-strings-ui)

## Quando usar este documento

**Use quando:**

- Questionar decisões técnicas do projeto
- Avaliar mudanças arquiteturais (migração, refatoração)
- Onboarding — entender o "por quê" das escolhas
- Documentar novas decisões arquiteturais

**Não use quando:**

- Procurar como implementar algo → `docs/architecture/patterns.md`
- Procurar fluxos de requisição → `docs/architecture/flows.md`
- Procurar problemas conhecidos → `docs/architecture/technical-debt.md`

---

## ADR-001: Supabase como BaaS

**Status:** Aceita  
**Data:** 2024-03-15  
**Contexto:** TCC — Hipótese H2

### Contexto

Projeto de TCC com prazo de ~3 meses para MVP completo. Necessário backend com autenticação, banco de dados, storage e real-time. Desenvolvedor solo sem experiência prévia em backend.

**Hipótese H2 do TCC:** Supabase reduz ≥60% do esforço de backend comparado a implementação tradicional (Node.js + Express + PostgreSQL + Auth próprio).

### Decisão

Usar Supabase como BaaS (Backend-as-a-Service) em vez de backend tradicional.

**Componentes usados:**

- PostgreSQL 15 (banco gerenciado)
- PostgREST (API REST automática)
- GoTrue (autenticação JWT)
- Storage (arquivos de atividades)
- Realtime (WebSocket para sincronização)
- Edge Functions (Deno/TS para lógica customizada)

### Consequências

**Positivas:**

- ✅ Redução de ~70% do tempo de backend (validado em Sprint 8)
- ✅ RLS (Row Level Security) nativo — segurança no banco
- ✅ API REST gerada automaticamente — zero boilerplate
- ✅ Real-time out-of-the-box — sem configurar WebSocket
- ✅ Migrations versionadas — controle de schema
- ✅ CLI poderoso — desenvolvimento local + deploy

**Negativas:**

- ❌ Vendor lock-in — migrar para outro BaaS é custoso
- ❌ Curva de aprendizado de RLS — políticas complexas
- ❌ Debugging difícil — erros de RLS são genéricos ("new row violates policy")
- ❌ Limitações de PostgREST — agregações complexas exigem RPCs
- ❌ Cold start em Edge Functions (~500ms primeira requisição)

**Riscos aceitos:**

- Dependência de serviço terceiro (mitigado: self-hosting possível)
- Custo crescente com escala (mitigado: tier gratuito até 500MB + 2GB bandwidth)

### Alternativas consideradas

#### 1. Node.js + Express + PostgreSQL

**Por que rejeitada:**

- Tempo estimado: +40h para implementar auth, migrations, API REST
- Complexidade de deploy (servidor próprio, CI/CD, monitoramento)
- Fora do escopo do TCC (foco é gestão, não infraestrutura)

#### 2. Firebase

**Por que rejeitada:**

- NoSQL (Firestore) — projeto precisa de relações complexas (alunos ↔ aulas ↔ cobranças)
- Queries limitadas — sem JOIN, agregações complexas
- Vendor lock-in maior que Supabase (sem self-hosting)

#### 3. Hasura + PostgreSQL

**Por que rejeitada:**

- GraphQL — curva de aprendizado maior que REST
- Configuração mais complexa (Docker, migrations manuais)
- Menos documentação/comunidade que Supabase

#### 4. Appwrite

**Por que rejeitada:**

- Comunidade menor — menos recursos/tutoriais
- Self-hosted apenas — sem tier gratuito gerenciado
- Funcionalidades menos maduras (real-time, storage)

### Validação

**Métricas coletadas (Sprint 8):**

- Tempo de desenvolvimento backend: ~12h (vs ~42h estimado para Node.js)
- Linhas de código backend: 43 migrations SQL + 6 Edge Functions
- Linhas de código evitadas: ~3.500 (auth, API REST, WebSocket)

**Conclusão:** Hipótese H2 validada — Supabase reduziu 71% do esforço de backend.

---

## ADR-002: TanStack Query para data fetching

**Status:** Aceita  
**Data:** 2024-03-20  
**Contexto:** Gerenciamento de estado assíncrono

### Contexto

Frontend precisa buscar dados do Supabase, cachear, invalidar e sincronizar entre componentes. Alternativas: Redux + Thunk, Zustand + SWR, TanStack Query, Apollo Client.

### Decisão

Usar TanStack Query (React Query v5) para data fetching e cache.

**Padrão adotado:**

```ts
export const useStudents = (teacherId: string) => {
  return useQuery({
    queryKey: ["students", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("teacher_id", teacherId);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
```

### Consequências

**Positivas:**

- ✅ Cache automático — reduz requisições desnecessárias
- ✅ Invalidação granular — `queryClient.invalidateQueries(['students'])`
- ✅ Loading/error states — `isLoading`, `isError`, `error`
- ✅ Refetch automático — `refetchOnWindowFocus`, `refetchOnReconnect`
- ✅ Devtools — debug de queries e cache
- ✅ Optimistic updates — `onMutate` + rollback automático

**Negativas:**

- ❌ Curva de aprendizado — query keys, staleTime, cacheTime
- ❌ Boilerplate em mutations — `onSuccess`, `onError`, `invalidateQueries`
- ❌ Debugging de invalidações — difícil rastrear quem invalidou o quê

**Riscos aceitos:**

- Query keys inconsistentes (mitigado: centralizar em `queryKeys.ts` — pendente ARQ-003)

### Alternativas consideradas

#### 1. Redux + RTK Query

**Por que rejeitada:**

- Boilerplate excessivo (slices, reducers, actions)
- Overkill para projeto sem estado global complexo
- Curva de aprendizado maior

#### 2. Zustand + SWR

**Por que rejeitada:**

- SWR menos maduro que TanStack Query (menos features)
- Zustand para estado global — não necessário (apenas AuthContext)

#### 3. Apollo Client

**Por que rejeitada:**

- GraphQL — Supabase usa REST (PostgREST)
- Overhead de configuração (schema, codegen)

#### 4. useEffect + useState

**Por que rejeitada:**

- Sem cache — requisições duplicadas
- Sem loading/error states padronizados
- Sem invalidação automática
- Race conditions em cleanup

### Validação

**Métricas:**

- 45 hooks customizados usando TanStack Query
- Cache hit rate: ~65% (estimado via DevTools)
- Redução de requisições: ~40% vs useEffect puro

---

## ADR-003: React Router em vez de Next.js

**Status:** Aceita  
**Data:** 2024-03-10  
**Contexto:** Roteamento e renderização

### Contexto

Projeto precisa de roteamento client-side com proteção por role (admin/teacher/student). Alternativas: Next.js (SSR), Remix (SSR), React Router (CSR).

### Decisão

Usar React Router v6 com Vite para SPA (Single Page Application).

**Padrão adotado:**

```tsx
<Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]} />}>
  <Route index element={<TeacherHome />} />
  <Route path="students" element={<TeacherStudents />} />
</Route>
```

### Consequências

**Positivas:**

- ✅ Simplicidade — sem complexidade de SSR
- ✅ Deploy fácil — arquivos estáticos (Vercel, Netlify, S3)
- ✅ HMR rápido — Vite <100ms
- ✅ Sem servidor Node.js — reduz custo e complexidade

**Negativas:**

- ❌ Sem SEO — não é problema (app privado, não indexável)
- ❌ Sem SSR — tempo de carregamento inicial maior (~2s)
- ❌ Sem API routes — Edge Functions do Supabase suprem

**Riscos aceitos:**

- Performance inicial (mitigado: code splitting, lazy loading)

### Alternativas consideradas

#### 1. Next.js

**Por que rejeitada:**

- SSR desnecessário — app privado (login obrigatório)
- Complexidade de deploy (servidor Node.js ou Vercel)
- Overhead de configuração (API routes, getServerSideProps)
- Fora do escopo do TCC

#### 2. Remix

**Por que rejeitada:**

- Curva de aprendizado maior (loaders, actions)
- Comunidade menor que Next.js
- SSR desnecessário

#### 3. Vue Router + Vue.js

**Por que rejeitada:**

- Ecossistema React mais maduro (shadcn/ui, TanStack Query)
- Experiência prévia com React

---

## ADR-004: shadcn/ui em vez de biblioteca completa

**Status:** Aceita  
**Data:** 2024-03-12  
**Contexto:** Biblioteca de componentes UI

### Contexto

Projeto precisa de componentes UI (botões, inputs, dialogs, tabelas). Alternativas: Material-UI, Ant Design, Chakra UI, shadcn/ui.

### Decisão

Usar shadcn/ui (Radix UI + Tailwind CSS) com componentes copiados para `src/components/ui/`.

### Consequências

**Positivas:**

- ✅ Controle total — código no projeto, não em node_modules
- ✅ Customização fácil — editar diretamente sem override complexo
- ✅ Bundle size menor — apenas componentes usados
- ✅ Acessibilidade — Radix UI tem ARIA completo
- ✅ Sem breaking changes — componentes versionados no projeto

**Negativas:**

- ❌ Sem updates automáticos — precisa copiar manualmente
- ❌ Manutenção manual — bugs do Radix exigem fix local

**Riscos aceitos:**

- Desatualização de componentes (mitigado: shadcn CLI para atualizar)

### Alternativas consideradas

#### 1. Material-UI

**Por que rejeitada:**

- Bundle size grande (~500KB gzipped)
- Estilo opinado (Material Design) — difícil customizar
- Overhead de tema (ThemeProvider, createTheme)

#### 2. Ant Design

**Por que rejeitada:**

- Estilo chinês — não alinha com design brasileiro
- Bundle size grande
- Customização complexa (less variables)

#### 3. Chakra UI

**Por que rejeitada:**

- Runtime CSS-in-JS — performance pior que Tailwind
- Bundle size maior que shadcn/ui

---

## ADR-005: Formulários como Dialogs

**Status:** Aceita  
**Data:** 2024-03-25  
**Contexto:** UX de formulários

### Contexto

Projeto tem ~30 formulários (criar/editar aluno, cobrança, aula, atividade). Alternativas: rotas separadas (`/students/new`), modals, sheets laterais.

### Decisão

Formulários são Dialogs (modals) abertos sobre a listagem, não rotas separadas.

**Padrão adotado:**

```tsx
<StudentFormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  student={editingStudent}
  onSuccess={() => setIsOpen(false)}
/>
```

### Consequências

**Positivas:**

- ✅ Contexto preservado — usuário vê listagem ao fundo
- ✅ Menos navegação — não precisa voltar após salvar
- ✅ Estado simples — `useState(false)` em vez de router state
- ✅ UX melhor — feedback imediato (toast + listagem atualiza)

**Negativas:**

- ❌ Sem deep linking — não dá pra compartilhar URL de "editar aluno X"
- ❌ Histórico do navegador — voltar não fecha modal
- ❌ Acessibilidade — precisa gerenciar foco manualmente

**Riscos aceitos:**

- Deep linking desnecessário (app privado, não compartilhável)

### Alternativas consideradas

#### 1. Rotas separadas

**Por que rejeitada:**

- Navegação excessiva (listagem → form → listagem)
- Estado perdido (filtros, paginação, scroll)
- Mais código (rotas, navegação, estado no router)

#### 2. Sheets laterais

**Por que rejeitada:**

- Ocupa muito espaço — ruim em mobile
- Menos familiar que modals

---

## ADR-006: Design tokens customizados

**Status:** Aceita  
**Data:** 2024-04-10  
**Contexto:** Sprint 3 — Design tokens

### Contexto

Projeto usa Tailwind CSS, mas classes cruas (`text-lg`, `gap-4`) são inconsistentes. Necessário padronizar tipografia, spacing e ícones.

### Decisão

Criar design tokens customizados em `src/lib/design-tokens/` com funções helper.

**Padrão adotado:**

```ts
import { typography } from '@/lib/design-tokens/typography';
import { stack } from '@/lib/design-tokens/spacing';
import { iconSize } from '@/lib/design-tokens/icon-sizes';

<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

### Consequências

**Positivas:**

- ✅ Consistência — 1 fonte de verdade para tamanhos
- ✅ Manutenção fácil — mudar `H1` atualiza todo o app
- ✅ Testável — 129 testes unitários validam tokens
- ✅ Type-safe — TypeScript valida tokens válidos

**Negativas:**

- ❌ Verbosidade — `typography('H1')` vs `text-4xl`
- ❌ Curva de aprendizado — devs precisam conhecer tokens

**Riscos aceitos:**

- Adoção gradual (mitigado: linter customizado — pendente)

### Alternativas consideradas

#### 1. Tailwind puro

**Por que rejeitada:**

- Inconsistência — cada dev escolhe tamanho diferente
- Difícil refatorar — buscar/substituir `text-lg` é frágil

#### 2. CSS-in-JS (styled-components)

**Por que rejeitada:**

- Runtime overhead — Tailwind é compile-time
- Bundle size maior

---

## ADR-007: Centralização de strings UI

**Status:** Aceita  
**Data:** 2024-05-15  
**Contexto:** Sprints 12-15 — Preparação para i18n

### Contexto

Projeto tem 860+ strings hardcoded em componentes. Necessário centralizar para futura internacionalização (inglês).

### Decisão

Centralizar strings em `src/content/{dominio}.ts` com estrutura hierárquica.

**Padrão adotado:**

```ts
// src/content/students.ts
export const students = {
  title: 'Alunos',
  actions: {
    create: 'Novo Aluno',
    edit: 'Editar',
    delete: 'Excluir',
  },
  form: {
    name: { label: 'Nome', placeholder: 'Digite o nome' },
    email: { label: 'Email', placeholder: 'email@exemplo.com' },
  },
  messages: {
    createSuccess: 'Aluno criado com sucesso!',
    createError: 'Erro ao criar aluno.',
  },
};

// Uso
import { students } from '@/content';
<h1>{students.title}</h1>
<Button>{students.actions.create}</Button>
```

### Consequências

**Positivas:**

- ✅ Preparado para i18n — trocar `students.ts` por `students.en.ts`
- ✅ Consistência — mesma mensagem em todo o app
- ✅ Manutenção fácil — mudar texto em 1 lugar
- ✅ Validação — script detecta strings hardcoded (`npm run validate:strings`)

**Negativas:**

- ❌ Verbosidade — `students.form.name.label` vs `"Nome"`
- ❌ Refatoração massiva — 860+ strings migradas em 4 sprints

**Riscos aceitos:**

- Adoção gradual (mitigado: linter bloqueia novas strings hardcoded)

### Alternativas consideradas

#### 1. i18next

**Por que rejeitada:**

- Overhead desnecessário — app ainda não tem inglês
- Complexidade de configuração (namespaces, lazy loading)

#### 2. Manter hardcoded

**Por que rejeitada:**

- Internacionalização futura seria impossível
- Inconsistência de mensagens

---

## Ver também

- [Architecture Overview](./overview.md) — Visão geral da arquitetura
- [Patterns](./patterns.md) — Padrões de design aplicados
- [Technical Debt](./technical-debt.md) — Decisões que geraram débito
- [Sprints](../sprints/README.md) — Histórico de implementação das decisões
