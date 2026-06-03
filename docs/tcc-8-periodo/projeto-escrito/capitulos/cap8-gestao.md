## Planejamento

### Estrutura do Capítulo

| Seção                                         | Conteúdo                                                           |
| --------------------------------------------- | ------------------------------------------------------------------ |
| 8.1 Metodologia de Gestão                     | Kanban orgânico, branches, PRs, commits semânticos, auditorias     |
| 8.2 Definição de Escopo (MVP vs. Incrementos) | Tabela: 5 funcionalidades MVP vs. 7 incrementos avançados          |
| 8.3 Cronograma de Execução                    | 14 fases retroativas jan–jun 2026 (~19 semanas, 31 sprints)        |
| 8.4 Impacto da IA na Produtividade            | Evidências quantitativas + ganhos por tipo de tarefa               |
| 8.5 Matriz de Riscos                          | R01–R08: rastreabilidade, RLS, performance, LGPD, timezone, PII    |
| 8.6 Ferramentas de Gestão                     | GitHub, GitHub Actions, Kiro IDE/CLI, Obsidian, Supabase Dashboard |

### Citações Planejadas

- Anderson (2010) — Kanban sem time-boxes: justificativa do modelo orgânico
- Peng et al. (2023) — 55% de ganho de produtividade com GitHub Copilot (base para H3)

### Pendências Abertas

- [ ] 🖼️ Figura: Gantt retroativo (Excel/Google Sheets ou draw.io)

---

> **Última Atualização:** 21/05/2026

# 8. Gestão do Projeto

Este capítulo documenta a metodologia de gestão adotada no projeto,
o escopo do MVP e incrementos posteriores,
o cronograma real retroativo reconstruído a partir do histórico git,
o impacto da IA na produtividade do desenvolvimento,
a tabela de riscos identificados e mitigados
e as ferramentas de gestão utilizadas.

## 8.1 Metodologia de Gestão

O projeto adotou Kanban de forma orgânica,
sem cerimônias formais de Scrum.
O fluxo de trabalho foi orientado por branches por funcionalidade ou fase
(`dev`, `homolog`, `main`),
Pull Requests como pontos de revisão e merge,
commits semânticos como registro de progresso
(`feat:`, `fix:`, `refactor:`, `security:`, `chore:`)
e auditorias periódicas de código como substituto de retrospectivas.

A ausência de sprints formais foi compensada pela rastreabilidade
do histórico git, que permite reconstruir o cronograma real
com precisão de dia.

## 8.2 Escopo MVP

O MVP foi definido como a plataforma funcional
para um professor gerenciar seus alunos, aulas e cobranças.
Funcionalidades além desse escopo foram consideradas incrementos.

A Tabela 8.1 apresenta a classificação de funcionalidades
entre MVP e incrementos.

**Tabela 8.1 — Classificação de funcionalidades (MVP vs Incremento)**

| Funcionalidade                   | MVP | Incremento |
| -------------------------------- | --- | ---------- |
| Cadastro de alunos e professores | ✅  | —          |
| Registro de aulas                | ✅  | —          |
| Cobranças individuais            | ✅  | —          |
| Autenticação por role            | ✅  | —          |
| Portal do aluno                  | ✅  | —          |
| Pacotes de aulas                 | —   | ✅         |
| Módulo de atividades             | —   | ✅         |
| QR Code PIX                      | —   | ✅         |
| Dashboard com gráficos           | —   | ✅         |
| PWA instalável                   | —   | ✅         |
| Suporte a alunos estrangeiros    | —   | ✅         |
| Visão consolidada admin          | —   | ✅         |

## 8.3 Cronograma Real Retroativo

O cronograma foi reconstruído a partir do histórico git
(branch `homolog-old`, 185 commits, 19 de janeiro a 18 de fevereiro de 2026)
e de artefatos retroativos para o período posterior.

**Nota de rastreabilidade:** Em março de 2026, o repositório foi reestruturado
para um novo repositório (`sync-class-platform`), resultando na perda de
aproximadamente 33 commits do período de fevereiro a março.
O cronograma das fases posteriores foi reconstruído a partir das migrations SQL
(que preservam sequência e data implícita), dos documentos de sprint
e dos timestamps dos commits do repositório atual.
A precisão do cronograma a partir de março é estimada, não exata.

A Tabela 8.2 apresenta as fases do desenvolvimento,
com período, duração e entregas principais.

**Tabela 8.2 — Cronograma retroativo do desenvolvimento**

| Fase                       | Período            | Duração  | Entregas Principais                                             |
| -------------------------- | ------------------ | -------- | --------------------------------------------------------------- |
| Fundação                   | 19–23 jan 2026     | 5 dias   | Schema inicial, CRUD pagamentos, página professores, API CEP    |
| Autenticação & Usuários    | 26–29 jan 2026     | 4 dias   | Auth por role, profiles, views compartilhadas, shadcn/ui        |
| Qualidade & Infra          | 29–30 jan 2026     | 2 dias   | CI/CD, soft delete, design tokens, PWA, formatters, skeletons   |
| Features Avançadas         | 31 jan–08 fev 2026 | 9 dias   | Dashboard, histórico aluno, reset senha, hard delete, search    |
| Estabilização & UX         | 09–13 fev 2026     | 5 dias   | Mobile-first, atividades, pacotes de aulas, QR code, 161 testes |
| Segurança & Correções      | 14–18 fev 2026     | 5 dias   | Idempotência, gestão de faltas, cascade delete, estrangeiros    |
| Auditorias & Migrations    | 19 fev–11 mar 2026 | ~20 dias | 17 migrations de segurança, 6 auditorias, docs técnicas         |
| Reestruturação             | 10–11 mar 2026     | 2 dias   | Novo repo, renomeação, steering files                           |
| Refatorações Arquiteturais | 11 mar–21 abr 2026 | ~40 dias | Separação hooks, split arquivos, query builders, timezone fix   |
| Centralização de Strings   | 21 abr–20 mai 2026 | ~30 dias | Estrutura content, substituição strings, auditoria final        |
| Qualidade Final & TCC      | 21–26 mai 2026     | 6 dias   | Segurança OWASP, RLS audit, Supabase advisors, conclusão        |
| QA Manual                  | 26 mai 2026        | 1 dia    | Sprint 28 — 116 itens, 20 rotas, 5 roles. Concluído.            |
| Fixes + AbacatePay         | 31 mai–03 jun 2026 | 4 dias   | Sprints 29–31: bugs pós-QA + integração PIX AbacatePay          |

O desenvolvimento ativo totalizou aproximadamente 4,5 meses
(janeiro a junho de 2026).

As refatorações arquiteturais (março a maio) incluíram:

- **Sprint 8 (11 mar–21 abr):** Separação Supabase/Hooks.
  Nenhum componente chama Supabase diretamente.
- **Sprint 9 (21 abr):** Split de arquivos grandes.
  6 hooks de 250 linhas foram divididos em 24 arquivos de 50 linhas.
- **Sprint 10 (21 abr):** Query builders.
  22 funções reutilizáveis eliminaram 75 linhas duplicadas.
- **Sprint 11 (21 abr):** Fix timezone + ErrorBoundary.
  Conversões UTC↔BRT, UI amigável para erros.
- **Sprint 12 (21 abr–20 mai):** Estrutura de content.
  13 arquivos, 860 linhas.
- **Sprint 13 (20 mai):** Expansão de content.
  Toasts, placeholders, validações.
- **Sprint 14 (20 mai):** Substituição de strings.
  58 componentes, 190 strings removidas.
- **Sprint 15 (20 mai):** Auditoria final.
  100% centralização, 0 strings hardcoded.

> 🖼️ **Figura:** Gantt retroativo (ver `docs/tcc/assets-pendentes.md`)

## 8.4 Impacto da IA na Produtividade

O projeto foi desenvolvido com assistência intensiva de IA
(Claude/Anthropic via Kiro IDE e Kiro CLI).

### 8.4.1 Evidências Quantitativas

A Tabela 8.3 apresenta métricas quantitativas do projeto.

**Tabela 8.3 — Métricas quantitativas do projeto**

| Métrica                     | Valor       |
| --------------------------- | ----------- |
| Commits (repo atual)        | ~147        |
| Arquivos no projeto (src)   | 359         |
| Linhas de código            | ~55.000     |
| Migrations SQL              | 70          |
| Arquivos de teste unitários | 28 (Vitest) |
| Hooks customizados          | 34          |
| Arquivos de content (UI)    | 18          |
| Desenvolvedores             | 1           |

### 8.4.2 O que a IA Acelerou

A IA acelerou significativamente as seguintes atividades:

- Geração de migrations SQL complexas (RLS, triggers, RPCs).
  Estimativa: 10x mais rápido.
- Scaffolding de componentes seguindo padrões do projeto.
- Auditorias de segurança (identificou 36 bugs em sessão única).
- Documentação técnica retroativa.
- Refatorações com contexto de todo o codebase:
  - Sprint 8: Separação de hooks (6 componentes auditados, padrão identificado)
  - Sprint 9: Split de arquivos (6 hooks grandes → 24 arquivos menores)
  - Sprint 10: Query builders (15 queries duplicadas identificadas e eliminadas)
  - Sprint 12-15: Centralização de strings
    (168 strings analisadas, classificadas UI vs Técnica)
- Geração de conteúdo estruturado (13 arquivos de content, 860 linhas).

### 8.4.3 O que Exigiu Trabalho Humano

As seguintes atividades exigiram trabalho humano:

- Decisões de produto (o que construir, para quem).
- Testes manuais e validação de fluxos reais.
- Configuração de ambiente e deploy.
- Revisão e aprovação de cada mudança gerada.

### 8.4.4 Reflexão

A IA funcionou como um par de programação disponível 24 horas,
com conhecimento técnico amplo mas sem contexto de negócio.
O desenvolvedor manteve o papel de arquiteto e tomador de decisões;
a IA acelerou a execução.

As sprints 8 a 15 (refatorações arquiteturais e centralização de strings)
demonstram o valor da IA em tarefas repetitivas e de grande escala:

- Sprint 9: Split de 6 hooks grandes em 24 arquivos.
  Tarefa manual levaria aproximadamente 2 dias,
  com IA levou aproximadamente 4 horas.
- Sprint 10: Identificação de 15 queries duplicadas.
  Análise manual levaria aproximadamente 1 dia,
  com IA levou aproximadamente 2 horas.
- Sprint 14: Substituição de 190 strings em 58 componentes.
  Tarefa manual levaria aproximadamente 3 dias,
  com IA levou aproximadamente 6 horas.

Isso permitiu que um único desenvolvedor entregasse em 4 meses
o que normalmente exigiria uma equipe de 2 a 3 pessoas
em 8 a 10 meses.

## 8.5 Tabela de Riscos

A Tabela 8.4 apresenta os riscos identificados durante o projeto,
com probabilidade, impacto, mitigação e status.

**Tabela 8.4 — Riscos identificados e mitigados**

| ID  | Risco                                          | Prob. | Impacto | Mitigação                                        | Status                             |
| --- | ---------------------------------------------- | ----- | ------- | ------------------------------------------------ | ---------------------------------- |
| R01 | Perda de histórico git                         | Alta  | Alto    | Branches de backup (`homolog-old`)               | ⚠️ Ocorreu — mitigado parcialmente |
| R02 | Vulnerabilidades de segurança (RLS)            | Média | Crítico | Auditorias periódicas, migrations de correção    | ✅ Mitigado (migrations 21–23)     |
| R03 | Performance degradada com crescimento de dados | Média | Alto    | Índices compostos, materialized views, paginação | ✅ Mitigado (migration 22)         |
| R04 | Violação de LGPD                               | Baixa | Crítico | Soft delete, anonimização, sem CPF obrigatório   | ✅ Mitigado                        |
| R05 | Dependência de serviço externo (Supabase)      | Baixa | Alto    | Risco aceito para MVP                            | 🔵 Aceito                          |
| R06 | Complexidade crescente do codebase             | Alta  | Médio   | Auditorias de clean code, sprints 10–12          | ✅ Resolvido (sprints 18–27)       |
| R07 | Bugs de timezone em produção                   | Alta  | Médio   | Documentados, Sprint 11 corrigiu                 | ✅ Resolvido                       |
| R08 | Monitoramento de erros em produção             | Baixa | Baixo   | Sentry removido — `logger.ts` cobre dev          | ✅ Resolvido                       |

## 8.6 Ferramentas de Gestão

A Tabela 8.5 apresenta as ferramentas utilizadas
para gestão do projeto.

**Tabela 8.5 — Ferramentas de gestão utilizadas**

| Ferramenta         | Uso                                         |
| ------------------ | ------------------------------------------- |
| GitHub             | Versionamento, branches, PRs, Issues        |
| GitHub Actions     | CI/CD automatizado                          |
| Kiro IDE / CLI     | Desenvolvimento e análise assistidos por IA |
| Obsidian           | Documentação do TCC                         |
| Supabase Dashboard | Gestão do banco e autenticação              |

---

## Assets Necessários

- [ ] 🖼️ Figura: Gantt retroativo (Excel/Google Sheets ou draw.io)

---

## Referências cruzadas

- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md)
  para histórico completo de 31 sprints implementadas
- **Git:** Ver [docs/git/overview.md](../git/overview.md)
  para workflow e convenções de commit
- **Metodologia:** Ver [Cap. 3 — Metodologia](./cap3-metodologia.md)
  para classificação da pesquisa e uso de IA
- **Arquitetura:** Ver [docs/architecture/technical-debt.md](../architecture/technical-debt.md)
  para débitos técnicos (R06)
- **Conclusão:** Ver [Cap. 10 — Conclusão](./cap10-conclusao.md)
  para análise das hipóteses H1, H2, H3
