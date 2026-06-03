## Planejamento

### Estrutura do Capítulo

| Seção                      | Conteúdo                                                        |
| -------------------------- | --------------------------------------------------------------- |
| 5.1 Decisões Arquiteturais | Monolito vs. microsserviços, BaaS vs. REST, SPA vs. SSR         |
| 5.2 Arquitetura em Camadas | Diagrama Components→Hooks→Supabase→PostgreSQL                   |
| 5.3 Modelo de Dados        | DER (pendente), 11 tabelas, relacionamentos, decisões de schema |
| 5.4 Segurança — RLS        | ~54 policies ativas, is_admin() SECURITY DEFINER, exemplo SQL   |
| 5.5 Rotas da Aplicação     | Tabela de rotas por role (admin/teacher/student/público)        |
| 5.6 Edge Functions         | 9 Edge Functions (Deno) com motivo de server-side               |

### Citações Planejadas

- Mell e Grance (2011) — SaaS/BaaS
- Supabase (2024) — BaaS e RLS
- PostgreSQL (2024) — Row Level Security
- Fowler (2015) — "Monolith First" (justificativa de arquitetura monolítica)

### Pendências Abertas

- [ ] 🖼️ **DER completo** — gerar via dbdiagram.io a partir do schema (BLOQUEADOR principal)
- [ ] 🖼️ **Diagrama de arquitetura conceitual** — versão formal para substituir ASCII
- [ ] 🖼️ **Tabela de rotas formatada** — versão impressão
- [ ] Adicionar `user_roles` e `performance_logs` às 11 tabelas (contagem atual diz 10)
- [ ] Explicar critério RPC vs. Edge Function (quando uma operação vai para cada)
- [ ] Adicionar justificativa de Fowler "Monolith First" para escolha de monolito

---

> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo apresenta as decisões arquiteturais (monolito modular,
BaaS, SPA), arquitetura em camadas, modelo de dados (10 tabelas principais),
relacionamentos, segurança via RLS, rotas da aplicação e Edge Functions
server-side.

## 5.1 Decisões Arquiteturais

### 5.1.1 Monolito vs. Microsserviços

O projeto adota arquitetura **monolítica modular**.
A escolha se justifica por:

- Time de um desenvolvedor — microsserviços adicionam complexidade operacional
  sem ganho real.
- Escala atual não exige distribuição.
- Supabase já provê separação natural entre frontend e backend.

### 5.1.2 BaaS vs. API REST Própria

O Supabase foi escolhido como BaaS por:

- PostgreSQL gerenciado com RLS nativo.
- Auth pronto (JWT, OAuth, magic link).
- Storage integrado.
- Edge Functions para lógica server-side.
- Elimina ~60% do trabalho de backend tradicional.

### 5.1.3 Frontend SPA vs. SSR

React SPA (Vite) foi escolhido por:

- Plataforma de gestão — não há necessidade de SEO.
- Interatividade alta (formulários, tabelas, filtros).
- _Lazy loading_ por rota minimiza bundle inicial.

## 5.2 Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│           Browser (React SPA)        │
│  Components → Hooks → Supabase SDK  │
└──────────────────┬──────────────────┘
                   │ HTTPS / WebSocket
┌──────────────────▼──────────────────┐
│              Supabase                │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ PostgREST│  │   Supabase Auth  │ │
│  └────┬─────┘  └──────────────────┘ │
│  ┌────▼─────────────────────────┐   │
│  │        PostgreSQL            │   │
│  │  RLS + Triggers + RPCs       │   │
│  └──────────────────────────────┘   │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Storage  │  │  Edge Functions  │ │
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

> 🖼️ **Figura:** Diagrama de arquitetura conceitual

## 5.3 Modelo de Dados

> 🖼️ **Figura:** DER completo — gerar no [dbdiagram.io](https://dbdiagram.io)
> a partir do schema em `docs/database/schema.md`

### 5.3.1 Tabelas

| **Tabela**                    | **Descrição**              | **Linhas estimadas**              |
| ----------------------------- | -------------------------- | --------------------------------- |
| `teachers`                    | Professores cadastrados    | Dezenas                           |
| `students`                    | Alunos por professor       | Centenas                          |
| `profiles`                    | Usuários do sistema (auth) | Centenas                          |
| `class_logs`                  | Registro de aulas          | Milhares                          |
| `financial_records`           | Cobranças                  | Milhares                          |
| `financial_record_class_logs` | Relação N:N pacotes        | Milhares                          |
| `activities`                  | Atividades                 | Milhares                          |
| `audit_logs`                  | Auditoria                  | Dezenas de milhares               |
| `idempotency_keys`            | Controle de idempotência   | Centenas (com limpeza automática) |

### 5.3.2 Relacionamentos Principais

```
teachers ──< students          (1:N — professor tem muitos alunos)
teachers ──< class_logs        (1:N — professor ministra muitas aulas)
students ──< class_logs        (1:N — aluno tem muitas aulas)
students ──< financial_records (1:N — aluno tem muitas cobranças)
students ──< activities        (1:N — aluno tem muitas atividades)
class_logs >──< financial_records (N:N via financial_record_class_logs)
profiles ──── auth.users       (1:1 — cada usuário tem um perfil)
profiles ──── students         (1:1 opcional)
profiles ──── teachers         (1:1 opcional)
```

### 5.3.3 Decisões de Schema

- **PKs UUID** (`uuid_generate_v4()`) — evita enumeração e facilita merge de
  dados.
- **`TIMESTAMPTZ`** para todos os timestamps — _timezone-aware_.
- **`NUMERIC(10,2)`** para valores monetários — sem erro de ponto flutuante.
- **`TEXT` com `CHECK` constraint** para status — legível e validado.
- **`anonymized_at TIMESTAMPTZ`** para LGPD — _soft anonymization_.
- **`is_deleted BOOLEAN`** para _soft delete_.

## 5.4 Segurança — Row Level Security

O RLS garante que cada usuário acessa apenas seus próprios dados, independente
da _query_ enviada pelo frontend.

```sql
-- Exemplo: professor só vê seus próprios alunos
CREATE POLICY "teacher_own_students" ON students
  FOR ALL TO authenticated
  USING (teacher_id = (
    SELECT teacher_id FROM profiles WHERE user_id = auth.uid()
  ));
```

Políticas implementadas: **40+ policies** cobrindo todas as tabelas para os 3
_roles_.

## 5.5 Rotas da Aplicação

| **Prefixo** | **Role**  | **Páginas**                                                                    |
| ----------- | --------- | ------------------------------------------------------------------------------ |
| `/admin`    | Admin     | Dashboard, Students, Teachers, Users, Financial, Classes, Activities, Overview |
| `/teacher`  | Professor | Home, Students, Financial, Classes, Activities, Overview                       |
| `/student`  | Aluno     | Home, History, Financial, Checkout, Activities                                 |
| `/`         | Público   | Login, Esqueci senha, Redefinir senha, Policies                                |

## 5.6 Edge Functions

Operações que exigem `service_role` são executadas em Edge Functions Deno, fora
do alcance do cliente:

| **Função**               | **Motivo de ser server-side**                             |
| ------------------------ | --------------------------------------------------------- |
| `invite-user`            | Cria usuário no auth com service_role + rollback atômico  |
| `reset-password`         | Altera senha de outro usuário                             |
| `admin-delete-user`      | Deleta usuário do auth                                    |
| `export-user-data`       | Exporta dados pessoais via service_role (LGPD)            |
| `cleanup-storage`        | Acessa todos os buckets sem restrição                     |
| `cleanup-old-records`    | Deleta registros de qualquer usuário                      |
| `create-abacate-payment` | Gera QR Code PIX via AbacatePay (Sprint 30)               |
| `refund-abacate-payment` | Estorna pagamento via AbacatePay (Sprint 30)              |
| `abacate-webhook`        | Processa notificações de pagamento AbacatePay (Sprint 30) |

---

## Assets Necessários

- [ ] 🖼️ Figura: DER completo — gerar no dbdiagram.io
- [ ] 🖼️ Figura: Diagrama de arquitetura conceitual
- [ ] 🖼️ Figura: Wireframes das telas principais
- [ ] 🖼️ Figura: Tabela de rotas formatada

---

## Referências cruzadas

- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para implementação detalhada da arquitetura em camadas
- **Decisões:** Ver [docs/architecture/decisions.md](../architecture/decisions.md)
  para ADRs (Architecture Decision Records)
- **Database:** Ver [docs/database/schema.md](../database/schema.md) para schema
  completo com constraints
- **RLS:** Ver [docs/database/rls.md](../database/rls.md) para todas as 40+
  políticas implementadas
- **Backend:** Ver [docs/backend/edge-functions.md](../backend/edge-functions.md)
  para detalhes das 9 Edge Functions
- **Implementação:** Ver [Cap. 6 — Desenvolvimento](./cap6-desenvolvimento.md)
  para tecnologias e stack técnico
