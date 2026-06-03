# 9. Deploy e Infraestrutura

Este capítulo detalha a infraestrutura do projeto,
a estratégia de hospedagem do frontend no Cloudflare Pages,
o backend gerenciado pelo Supabase,
o pipeline CI/CD implementado com GitHub Actions
e os mecanismos de segurança em produção.

## 9.1 Visão Geral

A infraestrutura do projeto é dividida em duas partes independentes:

- **Frontend:** Aplicação React compilada e servida pelo Cloudflare Pages
  (CDN global, sem servidor próprio).
- **Backend:** Supabase (BaaS) —
  PostgreSQL + Auth + Storage + Edge Functions
  hospedados na infraestrutura da Supabase.

Não há servidor de aplicação próprio nem container Docker.
O frontend consome o Supabase diretamente via SDK JavaScript.

> 🖼️ **Figura:** Diagrama de infraestrutura (Cloudflare Pages + Supabase)

## 9.2 Frontend — Cloudflare Pages

O frontend é uma SPA (Single Page Application) compilada pelo Vite.
O artefato de build é um diretório `dist/` com arquivos estáticos
(HTML, JS, CSS).

O deploy é feito automaticamente pelo job `deploy` do GitHub Actions,
utilizando a action `cloudflare/wrangler-action@v3`.
O Cloudflare Pages distribui os arquivos em sua CDN global,
sem necessidade de configuração de servidor.

### 9.2.1 Variáveis de Ambiente

As variáveis são injetadas em tempo de build pelo Vite
(prefixo `VITE_`).

A Tabela 9.1 apresenta as variáveis de ambiente obrigatórias.

**Tabela 9.1 — Variáveis de ambiente obrigatórias**

| Variável                        | Descrição               | Escopo          |
| ------------------------------- | ----------------------- | --------------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase | Build (público) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon pública      | Build (público) |
| `CLOUDFLARE_API_TOKEN`          | Token de deploy         | GitHub Secret   |
| `CLOUDFLARE_ACCOUNT_ID`         | ID da conta Cloudflare  | GitHub Secret   |

A chave `SUPABASE_SERVICE_ROLE_KEY` nunca é utilizada no frontend,
apenas em Edge Functions server-side.

## 9.3 Backend — Supabase

### 9.3.1 Serviços Utilizados

A Tabela 9.2 apresenta os serviços do Supabase utilizados no projeto.

**Tabela 9.2 — Serviços Supabase utilizados**

| Serviço          | Uso                                            |
| ---------------- | ---------------------------------------------- |
| PostgreSQL       | Banco de dados principal (70 migrations)       |
| Supabase Auth    | Autenticação JWT, gestão de usuários           |
| Supabase Storage | Arquivos de atividades, avatares, comprovantes |
| Edge Functions   | Operações server-side com service_role         |
| PostgREST        | API REST automática sobre o banco              |

### 9.3.2 Edge Functions (Deno/TypeScript)

A Tabela 9.3 apresenta as 9 Edge Functions implementadas,
com trigger e descrição.

**Tabela 9.3 — Edge Functions implementadas**

| Função                   | Trigger   | Descrição                                     |
| ------------------------ | --------- | --------------------------------------------- |
| `invite-user`            | HTTP POST | Cria usuário atomicamente com rollback        |
| `reset-password`         | HTTP POST | Reset de senha via service_role               |
| `admin-delete-user`      | HTTP POST | Exclusão com invalidação de sessões           |
| `export-user-data`       | HTTP POST | Exportação de dados pessoais (LGPD)           |
| `cleanup-storage`        | Agendado  | Remove arquivos órfãos no Storage             |
| `cleanup-old-records`    | Agendado  | Remove idempotency_keys e logs antigos        |
| `create-abacate-payment` | HTTP POST | Gera QR Code PIX via AbacatePay (Sprint 30)   |
| `refund-abacate-payment` | HTTP POST | Estorna pagamento via AbacatePay (Sprint 30)  |
| `abacate-webhook`        | HTTP POST | Processa notificações de pagamento AbacatePay |

## 9.4 CI/CD — GitHub Actions

O pipeline é definido no arquivo `.github/workflows/ci.yml`
e acionado por push ou Pull Request para as branches
`main`, `dev` ou `homolog`.

O pipeline possui dois jobs sequenciais:
`quality-check` (executado em todos os eventos)
e `deploy` (executado apenas em push para `main`).

### 9.4.1 Job: quality-check

Executa em Node 20.x sobre ubuntu-latest.

**Etapas:**

1. `npm ci` — instalação de dependências
2. `npm run lint` — ESLint
3. `npm run type-check` — TypeScript (`tsc --noEmit`)
4. `npm run test` — Vitest
5. `npm run build` — Vite
6. Verificação do tamanho do bundle (`du -sh dist/`)

Erros de lint, erros de tipo ou falha no build bloqueiam o merge
e impedem o job `deploy` de executar.

### 9.4.2 Job: deploy

Executa apenas quando `quality-check` passa
e o evento é push para `main`.

**Etapas:**

1. `npm ci` — instalação de dependências
2. `npm run build` — build com variáveis de produção
   (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` dos secrets)
3. Deploy via `cloudflare/wrangler-action@v3` —
   envia o diretório `dist/` para o projeto `edu-core-zen`
   no Cloudflare Pages

O deploy é **totalmente automatizado**:
push para `main` com qualidade aprovada
resulta em publicação imediata no Cloudflare Pages.

> 🖼️ **Figura:** Diagrama do pipeline CI/CD (GitHub Actions)

## 9.5 Segurança em Produção

A Tabela 9.4 apresenta os mecanismos de segurança implementados
em cada camada da aplicação.

**Tabela 9.4 — Mecanismos de segurança por camada**

| Camada        | Mecanismo                                   |
| ------------- | ------------------------------------------- |
| Transporte    | HTTPS obrigatório (Cloudflare + Supabase)   |
| Autenticação  | JWT via Supabase Auth                       |
| Autorização   | RLS no PostgreSQL (40+ policies)            |
| Rate limiting | `check_rate_limit()` no banco (10 req/min)  |
| Secrets       | GitHub Secrets — nunca no código            |
| Auditoria     | Tabela `audit_logs` para operações críticas |

---

## Assets Necessários

- [ ] 🖼️ Figura: Diagrama de infraestrutura (Cloudflare Pages + Supabase)
- [ ] 🖼️ Figura: Diagrama do pipeline CI/CD (GitHub Actions)

---

## Referências cruzadas

- **Backend:** Ver [docs/backend/edge-functions.md](../backend/edge-functions.md)
  para detalhes das 9 Edge Functions
- **Database:** Ver [docs/database/migrations.md](../database/migrations.md)
  para histórico de 70 migrations
- **Security:** Ver [docs/security/overview.md](../security/overview.md)
  para RLS, rate limiting e auditoria
- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para separação frontend/backend
- **Git:** Ver [docs/git/workflow.md](../git/workflow.md)
  para fluxo de branches e deploy
- **Conclusão:** Ver [Cap. 10 — Conclusão](./cap10-conclusao.md)
  para melhorias planejadas
