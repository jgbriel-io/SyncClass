---
capitulo: 5
titulo: Arquitetura e Modelagem
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---

> [!INFO] Resumo do Capítulo
> Detalhamento das decisões arquiteturais, modelo de dados (DER), políticas de segurança (RLS), rotas da aplicação e lógica server-side via Edge Functions.

---

## 5.1 Decisões Arquiteturais

### 5.1.1 Monolito vs. Microsserviços

O projeto **adota** uma arquitetura monolítica modular. A escolha **se justifica** por:

- **Time de um desenvolvedor:** Microsserviços adicionariam complexidade operacional sem ganho real nesta fase.
- **Escala:** A demanda atual não exige distribuição de serviços.
- **Ecossistema:** O Supabase já **provê** uma separação natural e eficiente entre frontend e backend.

### 5.1.2 BaaS vs. API REST Própria

O **Supabase é utilizado** como Backend as a Service (BaaS) por oferecer:

- PostgreSQL gerenciado com RLS nativo.
- Autenticação pronta (JWT, OAuth, Magic Link).
- Storage integrado para arquivos de atividades.
- Edge Functions para lógica server-side sensível.
- **Impacto:** Esta escolha **elimina** aproximadamente 60% do trabalho de backend tradicional.

### 5.1.3 Frontend SPA vs. SSR

O **React SPA (Vite) é a base do frontend**, escolhido por:

- **Natureza da plataforma:** Como é um sistema de gestão, não há necessidade de indexação SEO.
- **Interatividade:** Alta demanda por formulários dinâmicos, tabelas e filtros em tempo real.
- **Performance:** O uso de _lazy loading_ por rota **minimiza** o bundle inicial enviado ao cliente.

## 5.2 Arquitetura em Camadas

A estrutura conceitual do sistema **organiza-se** da seguinte forma:

```text
┌─────────────────────────────────────┐
│         Browser (React SPA)         │
│  Components → Hooks → Supabase SDK  │
└──────────────────┬──────────────────┘
                   │ HTTPS / WebSocket
┌──────────────────▼──────────────────┐
│              Supabase               │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ PostgREST│  │   Supabase Auth  │ │
│  └────┬─────┘  └──────────────────┘ │
│  ┌────▼─────────────────────────┐   │
│  │        PostgreSQL            │   │
│  │   RLS + Triggers + RPCs      │   │
│  └──────────────────────────────┘   │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Storage  │  │  Edge Functions  │ │
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

🖼️ **Figura:** Diagrama de arquitetura conceitual

## 5.3 Modelo de Dados

🖼️ **Figura:** DER completo — Gerado via dbdiagram.io

### 5.3.1 Tabelas

O banco de dados **está estruturado** com as seguintes tabelas principais:

| Tabela                        | Descrição                              | Linhas estimadas  |
| :---------------------------- | :------------------------------------- | :---------------- |
| `teachers`                    | Professores cadastrados                | Dezenas           |
| `students`                    | Alunos por professor                   | Centenas          |
| `profiles`                    | Usuários do sistema (vínculo com Auth) | Centenas          |
| `user_roles`                  | Atribuição de papéis por usuário       | Centenas          |
| `class_logs`                  | Registro detalhado de aulas            | Milhares          |
| `financial_records`           | Gestão de cobranças e faturas          | Milhares          |
| `financial_record_class_logs` | Relação N:N para pacotes de aulas      | Milhares          |
| `activities`                  | Atividades e materiais pedagógicos     | Milhares          |
| `audit_logs`                  | Registro de logs de auditoria          | Dezenas de milhar |
| `idempotency_keys`            | Controle de duplicidade financeira     | Centenas          |

### 5.3.2 Relacionamentos Principais

A integridade referencial **baseia-se** nas seguintes conexões:

- **teachers --- students:** (1:N — Professor gerencia muitos alunos).
- **teachers --- class_logs:** (1:N — Professor ministra muitas aulas).
- **students --- class_logs:** (1:N — Aluno possui histórico de aulas).
- **students --- financial_records:** (1:N — Aluno possui muitas cobranças).
- **students --- activities:** (1:N — Aluno recebe muitas atividades).
- **class_logs --- financial_records:** (N:N via tabela de junção para pacotes).
- **profiles --- auth.users:** (1:1 — Cada usuário autenticado possui um perfil).

### 5.3.3 Decisões de Schema

Para garantir robustez, as seguintes regras **estão ativas**:

- **PKs UUID:** Uso de `uuid_generate_v4()` para evitar enumeração de IDs e facilitar merges.
- **TIMESTAMPTZ:** Todos os campos de data são _timezone-aware_.
- **NUMERIC(10,2):** Utilizado para valores monetários, evitando erros de precisão de ponto flutuante.
- **CHECK constraints:** Aplicadas em campos de texto para validar status (ex: pendente, pago).
- **LGPD:** Inclusão de `anonymized_at` para anonimização e `is_deleted` para _soft delete_.

## 5.4 Segurança — Row Level Security (RLS)

O RLS **é o pilar de segurança**, garantindo que cada usuário acesse estritamente seus próprios dados em nível de linha no banco.

```sql
-- Exemplo de política ativa: O professor só visualiza seus próprios alunos
CREATE POLICY "teacher_own_students" ON students
  FOR ALL TO authenticated
  USING (teacher_id = (
    SELECT teacher_id FROM profiles WHERE user_id = auth.uid()
  ));
```

**Estado Atual:** Mais de 40 políticas implementadas cobrindo todas as tabelas para os 3 perfis (_roles_).

## 5.5 Rotas da Aplicação

A estrutura de navegação **está dividida** por níveis de acesso:

| Prefixo    | Role      | Páginas Principais                                                 |
| :--------- | :-------- | :----------------------------------------------------------------- |
| `/admin`   | Admin     | Dashboard, Students, Teachers, Users, Financial, Classes, Overview |
| `/teacher` | Professor | Home, Students, Financial, Classes, Activities, Overview           |
| `/student` | Aluno     | Home, History, Financial, Checkout, Activities                     |
| `/`        | Público   | Login, Esqueci senha, Redefinir senha, Policies                    |

🖼️ **Figura:** Tabela de rotas formatada

## 5.6 Edge Functions

Operações que exigem privilégios de sistema (`service_role`) **são executadas** via Edge Functions (Deno), garantindo isolamento total do cliente:

| Função                | Motivo do processamento Server-side                         |
| :-------------------- | :---------------------------------------------------------- |
| `invite-user`         | Cria usuário no Auth com rollback atômico em caso de falha. |
| `reset-password`      | Permite a alteração segura de senha de outros usuários.     |
| `admin-delete-user`   | Remove usuários do Auth de forma controlada.                |
| `cleanup-storage`     | Realiza a limpeza de buckets sem as restrições do cliente.  |
| `cleanup-old-records` | Rotina de manutenção de registros antigos.                  |

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Diagrama de arquitetura conceitual.
- [ ] 🖼️ **Figura:** DER completo.
- [ ] 🖼️ **Figura:** Tabela de rotas formatada.
