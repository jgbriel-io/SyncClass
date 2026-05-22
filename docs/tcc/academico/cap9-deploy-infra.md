# 9. Deploy e Infraestrutura

Este capítulo detalha a infraestrutura do projeto,
dividida entre frontend (Docker + Nginx) e backend (Supabase),
os ambientes de desenvolvimento, homologação e produção,
o Dockerfile multi-stage utilizado,
as 5 Edge Functions implementadas,
o pipeline CI/CD com GitHub Actions,
os mecanismos de segurança em produção
e o fluxo de deploy.

## 9.1 Visão Geral

A infraestrutura do projeto é dividida em duas partes independentes:

- **Frontend:** Aplicação React compilada,
  servida via Nginx em container Docker.
- **Backend:** Supabase (BaaS).
  PostgreSQL + Auth + Storage + Edge Functions
  hospedados na infraestrutura da Supabase.

Não há servidor de aplicação próprio.
O frontend consome o Supabase diretamente via SDK JavaScript.

## 9.2 Ambientes

A Tabela 9.1 apresenta os três ambientes utilizados no projeto,
com branch correspondente, URL e banco de dados.

**Tabela 9.1 — Ambientes do projeto**

| Ambiente        | Branch        | URL              | Banco                      |
| --------------- | ------------- | ---------------- | -------------------------- |
| Desenvolvimento | `dev` / local | `localhost:8080` | Supabase projeto principal |
| Homologação     | `homolog`     | —                | Supabase projeto principal |
| Produção        | `main`        | VPS própria      | Supabase projeto principal |

> 🖼️ **Figura:** Diagrama de infraestrutura

## 9.3 Frontend — Docker

### 9.3.1 Dockerfile (Multi-stage Build)

O Dockerfile utiliza build multi-stage para otimizar o tamanho
da imagem final e separar dependências de build de runtime.

O primeiro estágio (builder) utiliza Node 18 Alpine,
executa `npm install` e `npm run build`,
gerando o diretório `/app/dist` com os arquivos estáticos compilados.

O segundo estágio (runtime) utiliza Nginx stable-alpine,
copia o diretório `/app/dist` para `/usr/share/nginx/html`
e expõe a porta 80.

As vantagens do multi-stage build incluem:

- Imagem final sem Node.js (aproximadamente 20MB vs 300MB).
- Apenas os arquivos estáticos compilados em produção.
- Nginx serve o bundle com alta performance.

### 9.3.2 Variáveis de Ambiente

As variáveis são injetadas em tempo de build pelo Vite
(prefixo `VITE_`).

A Tabela 9.2 apresenta as variáveis de ambiente obrigatórias.

**Tabela 9.2 — Variáveis de ambiente obrigatórias**

| Variável                        | Descrição               | Obrigatória |
| ------------------------------- | ----------------------- | ----------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase | ✅          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon pública      | ✅          |

A chave `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser utilizada no frontend,
apenas em Edge Functions server-side.

## 9.4 Backend — Supabase

### 9.4.1 Serviços Utilizados

A Tabela 9.3 apresenta os serviços do Supabase utilizados no projeto.

**Tabela 9.3 — Serviços Supabase utilizados**

| Serviço          | Uso                                            |
| ---------------- | ---------------------------------------------- |
| PostgreSQL       | Banco de dados principal (25 migrations)       |
| Supabase Auth    | Autenticação JWT, gestão de usuários           |
| Supabase Storage | Arquivos de atividades, avatares, comprovantes |
| Edge Functions   | Operações server-side com service_role         |
| PostgREST        | API REST automática sobre o banco              |
| Realtime         | Subscriptions para atualizações em tempo real  |

### 9.4.2 Edge Functions (Deno/TypeScript)

A Tabela 9.4 apresenta as 5 Edge Functions implementadas,
com trigger e descrição.

**Tabela 9.4 — Edge Functions implementadas**

| Função                | Trigger   | Descrição                              |
| --------------------- | --------- | -------------------------------------- |
| `invite-user`         | HTTP POST | Cria usuário atomicamente com rollback |
| `reset-password`      | HTTP POST | Reset de senha via service_role        |
| `admin-delete-user`   | HTTP POST | Exclusão com invalidação de sessões    |
| `cleanup-storage`     | Agendado  | Remove arquivos órfãos no Storage      |
| `cleanup-old-records` | Agendado  | Remove idempotency_keys e logs antigos |

## 9.5 CI/CD — GitHub Actions

### 9.5.1 Pipeline Principal (`ci.yml`)

O pipeline principal é acionado por push ou Pull Request
para as branches `main`, `dev` ou `homolog`.

O job `quality-check` executa em Node 20.x sobre ubuntu-latest
e realiza as seguintes etapas:

1. `npm ci` (instalação de dependências)
2. `npm run lint` (ESLint)
3. `tsc --noEmit` (verificação de tipos TypeScript)
4. `npm run test` (Vitest)
5. `npm run build` (Vite)

Erros de lint, erros de tipo TypeScript ou falha no build
bloqueiam o merge.

### 9.5.2 Pipeline de Segurança (`dependency-check.yml`)

O pipeline de segurança é acionado toda segunda-feira às 9h UTC
ou manualmente.

O job `audit` executa em ubuntu-latest
e realiza as seguintes etapas:

1. `npm audit --audit-level=moderate`
2. `npm outdated`

> 🖼️ **Figura:** Diagrama do pipeline CI/CD

## 9.6 Segurança em Produção

A Tabela 9.5 apresenta os mecanismos de segurança implementados
em cada camada da aplicação.

**Tabela 9.5 — Mecanismos de segurança por camada**

| Camada        | Mecanismo                                   |
| ------------- | ------------------------------------------- |
| Transporte    | HTTPS obrigatório (Supabase + VPS com SSL)  |
| Autenticação  | JWT via Supabase Auth                       |
| Autorização   | RLS no PostgreSQL (40+ policies)            |
| Rate limiting | `check_rate_limit()` no banco (10 req/min)  |
| Secrets       | Variáveis de ambiente — nunca no código     |
| Monitoramento | Sentry para erros de frontend               |
| Auditoria     | Tabela `audit_logs` para operações críticas |

## 9.7 Fluxo de Deploy

O fluxo de deploy inicia com o desenvolvedor executando `git push origin main`.
O GitHub Actions executa o pipeline `ci.yml`,
que realiza lint, type-check, test e build.
Se todas as etapas passam,
o desenvolvedor acessa manualmente a VPS via SSH,
executa `docker compose pull` e `docker compose up -d`.

O deploy final para a VPS ainda é manual.
Automatização via GitHub Actions + SSH é uma melhoria planejada
(ver Cap. 10).

---

## Assets Necessários

- [ ] 🖼️ Figura: Diagrama de infraestrutura (VPS + Docker + Supabase)
- [ ] 🖼️ Figura: Diagrama do pipeline CI/CD (GitHub Actions)

---

## Referências cruzadas

- **Backend:** Ver [docs/backend/edge-functions.md](../backend/edge-functions.md)
  para detalhes das 5 Edge Functions
- **Database:** Ver [docs/database/migrations.md](../database/migrations.md)
  para histórico de 25 migrations
- **Security:** Ver [docs/security/overview.md](../security/overview.md)
  para RLS, rate limiting e auditoria
- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para separação frontend/backend
- **Git:** Ver [docs/git/workflow.md](../git/workflow.md)
  para fluxo de branches e deploy
- **Conclusão:** Ver [Cap. 10 — Conclusão](./cap10-conclusao.md)
  para melhorias planejadas (deploy automatizado)
