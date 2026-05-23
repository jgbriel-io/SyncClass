> **Status:** 🟠 Rascunho
> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo detalha a infraestrutura do projeto (frontend Docker + backend Supabase), ambientes (dev/homolog/prod), Dockerfile multi-stage, 5 Edge Functions, pipeline CI/CD (GitHub Actions), segurança em produção e fluxo de deploy.

## 9.1 Visão Geral

A infraestrutura do projeto é dividida em duas partes independentes:

- **Frontend:** Aplicação React compilada, servida via Nginx em container Docker.
- **Backend:** Supabase (BaaS) — PostgreSQL + Auth + Storage + Edge Functions hospedados na infraestrutura da Supabase.

Não há servidor de aplicação próprio. O frontend consome o Supabase diretamente via SDK JavaScript.

## 9.2 Ambientes

| **Ambiente**    | **Branch**    | **URL**          | **Banco**                  |
| --------------- | ------------- | ---------------- | -------------------------- |
| Desenvolvimento | `dev` / local | `localhost:8080` | Supabase projeto principal |
| Homologação     | `homolog`     | —                | Supabase projeto principal |
| Produção        | `main`        | VPS própria      | Supabase projeto principal |

> 🖼️ **Figura:** Diagrama de infraestrutura

## 9.3 Frontend — Docker

### 9.3.1 Dockerfile (Multi-stage Build)

```
Estágio 1 (builder):
  - Node 18 Alpine
  - npm install
  - npm run build → gera /app/dist

Estágio 2 (runtime):
  - Nginx stable-alpine
  - Copia /app/dist → /usr/share/nginx/html
  - Expõe porta 80
```

**Vantagens do multi-stage:**

- Imagem final sem Node.js (~20MB vs ~300MB).
- Apenas os arquivos estáticos compilados em produção.
- Nginx serve o bundle com alta performance.

### 9.3.2 Variáveis de Ambiente

As variáveis são injetadas em tempo de build pelo Vite (prefixo `VITE_`):

| **Variável**                    | **Descrição**           | **Obrigatória** |
| ------------------------------- | ----------------------- | --------------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase | ✅              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon pública      | ✅              |

> ⚠️ Nunca usar `SUPABASE_SERVICE_ROLE_KEY` no frontend — apenas em Edge Functions server-side.

## 9.4 Backend — Supabase

### 9.4.1 Serviços Utilizados

| **Serviço**      | **Uso**                                        |
| ---------------- | ---------------------------------------------- |
| PostgreSQL       | Banco de dados principal (25 migrations)       |
| Supabase Auth    | Autenticação JWT, gestão de usuários           |
| Supabase Storage | Arquivos de atividades, avatares, comprovantes |
| Edge Functions   | Operações server-side com service_role         |
| PostgREST        | API REST automática sobre o banco              |
| Realtime         | Subscriptions para atualizações em tempo real  |

### 9.4.2 Edge Functions (Deno/TypeScript)

| **Função**            | **Trigger** | **Descrição**                          |
| --------------------- | ----------- | -------------------------------------- |
| `invite-user`         | HTTP POST   | Cria usuário atomicamente com rollback |
| `reset-password`      | HTTP POST   | Reset de senha via service_role        |
| `admin-delete-user`   | HTTP POST   | Exclusão com invalidação de sessões    |
| `cleanup-storage`     | Agendado    | Remove arquivos órfãos no Storage      |
| `cleanup-old-records` | Agendado    | Remove idempotency_keys e logs antigos |

## 9.5 CI/CD — GitHub Actions

### 9.5.1 Pipeline Principal (`ci.yml`)

**Gatilho:** Push ou PR para `main`, `dev`, `homolog`

```
push/PR
  └── quality-check (Node 20.x / ubuntu-latest)
        ├── npm ci
        ├── npm run lint        (ESLint)
        ├── tsc --noEmit        (TypeScript)
        ├── npm run test        (Vitest)
        └── npm run build       (Vite)
```

**O que bloqueia o merge:** erros de lint, erros de tipo TypeScript, falha no build.

### 9.5.2 Pipeline de Segurança (`dependency-check.yml`)

**Gatilho:** Toda segunda-feira às 9h UTC (ou manual)

```
schedule (semanal)
  └── audit (ubuntu-latest)
        ├── npm audit --audit-level=moderate
        └── npm outdated
```

> 🖼️ **Figura:** Diagrama do pipeline CI/CD

## 9.6 Segurança em Produção

| **Camada**    | **Mecanismo**                               |
| ------------- | ------------------------------------------- |
| Transporte    | HTTPS obrigatório (Supabase + VPS com SSL)  |
| Autenticação  | JWT via Supabase Auth                       |
| Autorização   | RLS no PostgreSQL (40+ policies)            |
| Rate limiting | `check_rate_limit()` no banco (10 req/min)  |
| Secrets       | Variáveis de ambiente — nunca no código     |
| Monitoramento | `logger.ts` + `audit_logs` no banco         |
| Auditoria     | Tabela `audit_logs` para operações críticas |

## 9.7 Fluxo de Deploy

```
Desenvolvedor
  └── git push origin main
        └── GitHub Actions (ci.yml)
              ├── lint ✅
              ├── type-check ✅
              ├── test ✅
              └── build ✅
                    └── [manual] SSH na VPS
                          └── docker compose pull
                                └── docker compose up -d
```

> O deploy final para a VPS ainda é manual. Automatização via GitHub Actions + SSH é uma melhoria planejada (ver Cap. 10).

---

## Assets Necessários

- [ ] 🖼️ Figura: Diagrama de infraestrutura (VPS + Docker + Supabase)
- [ ] 🖼️ Figura: Diagrama do pipeline CI/CD (GitHub Actions)

---

## Referências cruzadas

- **Backend:** Ver [docs/backend/edge-functions.md](../backend/edge-functions.md) para detalhes das 5 Edge Functions
- **Database:** Ver [docs/database/migrations.md](../database/migrations.md) para histórico de 25 migrations
- **Security:** Ver [docs/security/overview.md](../security/overview.md) para RLS, rate limiting e auditoria
- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md) para separação frontend/backend
- **Git:** Ver [docs/git/workflow.md](../git/workflow.md) para fluxo de branches e deploy
- **Conclusão:** Ver [Cap. 10 — Conclusão](./cap10-conclusao.md) para melhorias planejadas (deploy automatizado)
