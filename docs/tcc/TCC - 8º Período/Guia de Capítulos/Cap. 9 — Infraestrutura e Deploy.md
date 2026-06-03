---
capitulo: 9
titulo: Infraestrutura e Deploy
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---

> [!INFO] Resumo do Capítulo
> Descrição do ambiente de hospedagem, configuração de containers, gestão de banco de dados em nuvem e automação do pipeline de CI/CD.

---

## 9.1 Visão Geral

A infraestrutura do projeto **está dividida** em duas frentes independentes que se comunicam via SDK:

- **Frontend:** A aplicação React compilada **é servida** via Cloudflare Pages (CDN global, sem servidor dedicado).
- **Backend (BaaS):** O Supabase **gerencia** o PostgreSQL, autenticação, armazenamento e as funções de borda (Edge Functions).

Esta arquitetura elimina a necessidade de um servidor de aplicação tradicional, permitindo que o frontend consuma os serviços de backend diretamente com segurança.

## 9.2 Ambientes de Execução

O sistema **opera** sob a seguinte matriz de ambientes:

| **Ambiente**    | **Branch**    | **URL / Acesso** | **Instância de Banco** |
| :-------------- | :------------ | :--------------- | :--------------------- |
| Desenvolvimento | `dev` / local | `localhost:5173` | Supabase (Cloud)       |
| Produção        | `main`        | Cloudflare Pages | Supabase (Cloud)       |

🖼️ **Figura:** Diagrama de infraestrutura

## 9.3 Frontend — Cloudflare Pages

### 9.3.1 Estratégia de Build e Deploy

O deploy do frontend **ocorre** via Cloudflare Pages integrado ao GitHub Actions:

1.  **Build:** GitHub Actions executa `npm run build` (Vite 5.4) gerando o bundle estático em `dist/`.
2.  **Deploy:** O bundle é publicado no Cloudflare Pages (CDN global) automaticamente após cada push em `main`.

**Benefícios observados:**

- Zero custo de infraestrutura (plano gratuito Cloudflare Pages).
- CDN global com latência baixa sem configuração adicional.
- Deploy atômico com rollback imediato caso o build falhe.

### 9.3.2 Variáveis de Ambiente

O gerenciamento de segredos **ocorre** via variáveis injetadas pelo Vite em tempo de build:

| **Variável**                    | **Finalidade**                 | **Status** |
| :------------------------------ | :----------------------------- | :--------: |
| `VITE_SUPABASE_URL`             | Endpoint de conexão com o BaaS |     ✅     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública de acesso        |     ✅     |

> [!CAUTION] Alerta de Segurança
> A `SUPABASE_SERVICE_ROLE_KEY` **está restrita** exclusivamente às Edge Functions e nunca é exposta no código do frontend.

## 9.4 Backend — Supabase as a Service

O backend **sustenta-se** nos seguintes serviços gerenciados:

- **PostgreSQL:** Banco de dados relacional (gerenciado via 70 migrations ativas).
- **Supabase Auth:** Autenticação baseada em JWT e controle de sessões.
- **Supabase Storage:** Armazenamento de arquivos (atividades, comprovantes e avatares).
- **PostgREST:** Camada que expõe o banco como uma API REST de forma automática.

### 9.4.1 Edge Functions (Deno/TypeScript)

Para operações sensíveis que exigem privilégios administrativos, as seguintes funções **estão implementadas**:

| **Função**               | **Gatilho** | **Responsabilidade**                                 |
| :----------------------- | :---------- | :--------------------------------------------------- |
| `invite-user`            | HTTP POST   | Cadastro atômico de usuários com tratamento de erro. |
| `reset-password`         | HTTP POST   | Redefinição de credenciais via _service_role_.       |
| `admin-delete-user`      | HTTP POST   | Remoção de usuários do Auth de forma controlada.     |
| `cleanup-storage`        | Agendado    | Rotina de limpeza de arquivos órfãos no Storage.     |
| `cleanup-old-records`    | Agendado    | Manutenção de registros antigos.                     |
| `export-user-data`       | HTTP POST   | Exportação LGPD de dados pessoais do usuário.        |
| `create-abacate-payment` | HTTP POST   | Criação de cobrança PIX via AbacatePay.              |
| `refund-abacate-payment` | HTTP POST   | Estorno de pagamento PIX via AbacatePay.             |
| `abacate-webhook`        | HTTP POST   | Recepção de eventos de pagamento do AbacatePay.      |

## 9.5 CI/CD — Automação via GitHub Actions

A garantia de qualidade no fluxo de código **é automatizada** através de dois pipelines principais:

### 9.5.1 Pipeline de Integração (`ci.yml`)

Ativado em cada Push ou PR, o fluxo **executa**:

1.  Instalação de dependências (`npm ci`).
2.  Análise estática de código (ESLint).
3.  Checagem de tipos (TypeScript `noEmit`).
4.  Execução de testes unitários (Vitest).
5.  Validação de Build (Vite).

### 9.5.2 Pipeline de Segurança

Semanalmente, o sistema **realiza** uma auditoria automática de dependências (`npm audit`) para identificar vulnerabilidades em bibliotecas de terceiros.

🖼️ **Figura:** Diagrama do pipeline CI/CD

## 9.6 Mecanismos de Segurança em Produção

O sistema **protege** os dados através de múltiplas camadas:

- **Transporte:** Uso obrigatório de HTTPS com certificados SSL.
- **Autorização:** Aplicação rigorosa de Row Level Security (RLS) no banco.
- **Defesa:** Rate limiting implementado via função SQL (`check_rate_limit`) para mitigar ataques de força bruta.
- **Monitoramento:** Logger interno (`src/lib/logger.ts`) para captura de erros em desenvolvimento.

## 9.7 Fluxo de Deploy Atual

O deploy **segue** o seguinte fluxo automatizado:

1.  O desenvolvedor realiza o `git push` para `main`.
2.  O GitHub Actions **executa** lint → type-check → test → build.
3.  Após sucesso, o bundle estático **é publicado automaticamente** no Cloudflare Pages.

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Diagrama de infraestrutura (Cloudflare Pages + GitHub Actions + Supabase).
- [ ] 🖼️ **Figura:** Diagrama do pipeline CI/CD (GitHub Actions).
