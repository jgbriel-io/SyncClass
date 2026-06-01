---
capitulo: 8
titulo: Gestão do Projeto
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---

> [!INFO] Resumo do Capítulo
> Registro do modelo de gestão adotado, definição do escopo por fases (MVP e Incrementos) e o cronograma de execução das atividades conforme o progresso do desenvolvimento.

---

## 8.1 Metodologia de Gestão

O projeto **adota** o **Kanban** de forma orgânica para gerenciar o fluxo de trabalho. A gestão **é orientada** pelos seguintes pilares de engenharia:

- **Branches:** Separação rigorosa entre `dev`, `homolog` e `main`.
- **Pull Requests:** Utilizados como pontos de revisão obrigatórios antes de qualquer integração.
- **Commits Semânticos:** Registro padronizado do progresso (`feat:`, `fix:`, `refactor:`, `security:`, `chore:`).
- **Auditorias:** Realização de revisões periódicas de código para garantir a saúde do codebase.

Este modelo **garante** rastreabilidade total, permitindo reconstruir o histórico de evolução do software com precisão diária através dos logs do Git.

## 8.2 Definição de Escopo (MVP vs. Incrementos)

O escopo do projeto **está dividido** entre o núcleo funcional essencial (MVP) e as funcionalidades que expandem a plataforma (Incrementos).

| **Funcionalidade**               | **MVP** | **Incremento** |
| :------------------------------- | :-----: | :------------: |
| Cadastro de alunos e professores |   ✅    |       —        |
| Registro de aulas                |   ✅    |       —        |
| Cobranças individuais            |   ✅    |       —        |
| Autenticação por _role_          |   ✅    |       —        |
| Portal do aluno                  |   ✅    |       —        |
| Pacotes de aulas                 |    —    |       ✅       |
| Módulo de atividades             |    —    |       ✅       |
| QR Code PIX                      |    —    |       ✅       |
| Dashboard com gráficos           |    —    |       ✅       |
| PWA instalável                   |    —    |       ✅       |
| Suporte a alunos estrangeiros    |    —    |       ✅       |
| Visão consolidada admin          |    —    |       ✅       |

## 8.3 Cronograma de Execução

As atividades **estão distribuídas** conforme o progresso real capturado no histórico de desenvolvimento:

| **Fase**               | **Período** | **Entregas Principais**                                   |
| :--------------------- | :---------- | :-------------------------------------------------------- |
| **Fundação**           | Jan/2026    | Schema inicial, CRUD pagamentos, API de localização.      |
| **Auth & Usuários**    | Jan/2026    | Auth por role, profiles e integração com shadcn/ui.       |
| **Qualidade & Infra**  | Jan/2026    | Setup de CI/CD, design tokens, PWA e skeletons.           |
| **Features Avançadas** | Fev/2026    | Dashboard, histórico do aluno e sistema de busca.         |
| **Estabilização & UX** | Fev/2026    | Mobile-first, atividades, pacotes de aulas e testes.      |
| **Segurança**          | Fev/2026    | Idempotência, gestão de faltas e cascade delete.          |
| **Auditorias**         | Mar/2026    | Migrations de segurança (17), auditorias e docs técnicos. |
| **Reestruturação**     | Mar/2026    | Novo repositório e otimização de steering files.          |
| **Consolidação**       | Abr/2026    | Restore codebase, migrations finais e organização do TCC. |

**Duração:** Desenvolvimento ativo em curso há aproximadamente 3 meses.

🖼️ **Figura:** Gráfico de Gantt do cronograma de desenvolvimento

## 8.4 Impacto da IA na Produtividade

A Inteligência Artificial (Claude/Anthropic via Kiro IDE e CLI) **é utilizada** como um acelerador estratégico de engenharia.

### 8.4.1 Evidências Quantitativas de Progresso

| **Métrica**          | **Valor**             |
| :------------------- | :-------------------- |
| Commits realizados   | ~218                  |
| Arquivos gerenciados | 391                   |
| Linhas de código     | ~46.400               |
| Migrations SQL       | 23                    |
| Testes implementados | 161 (unitários + E2E) |

### 8.4.2 Ganhos de Aceleração

O suporte da IA **permite acelerar** significativamente:

- **Migrations SQL complexas:** Escrita de RLS e triggers até 10x mais rápido.
- **Auditorias de Segurança:** Identificação de bugs críticos em sessões únicas.
- **Refatorações:** Alterações estruturais com base no contexto de todo o repositório.

A IA **funciona** como um par de programação 24h, permitindo que um único desenvolvedor execute tarefas que tradicionalmente exigiriam uma equipe maior em um prazo similar.

## 8.5 Matriz de Riscos

O controle de riscos **ocorre** de forma proativa durante o desenvolvimento:

| **ID**  | **Risco**                | **Impacto** | **Mitigação**                         | **Situação**           |
| :------ | :----------------------- | :---------- | :------------------------------------ | :--------------------- |
| **R01** | Integridade do Histórico | Alto        | Branches de backup redundantes.       | ⚠️ Ocorrido/Controlado |
| **R02** | Vulnerabilidades RLS     | Crítico     | Auditorias constantes e migrations.   | ✅ Mitigado            |
| **R03** | Performance de Dados     | Alto        | Índices, views e paginação.           | ✅ Mitigado            |
| **R04** | Conformidade LGPD        | Crítico     | Soft delete e anonimização nativa.    | ✅ Implementado        |
| **R07** | Bugs de Timezone         | Médio       | Documentação e correção planejada.    | ⚠️ Pendente            |
| **R08** | PII no Sentry            | Alto        | Ajuste planejado em `sendDefaultPii`. | ⚠️ Pendente            |

## 8.6 Ferramentas de Gestão

| **Ferramenta**         | **Uso**                                             |
| :--------------------- | :-------------------------------------------------- |
| **GitHub**             | Versionamento, branches, PRs e Issues.              |
| **GitHub Actions**     | CI/CD automatizado para garantia de build e testes. |
| **Kiro IDE / CLI**     | Desenvolvimento e auditoria assistidos por IA.      |
| **Obsidian**           | Centralização da documentação e escrita do TCC.     |
| **Supabase Dashboard** | Gestão de banco, autenticação e Edge Functions.     |

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Gráfico de Gantt do cronograma de desenvolvimento.
