> **Status:** 🟠 Rascunho
> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo documenta a metodologia Kanban orgânica, escopo MVP vs incrementos, cronograma real retroativo (4 meses, 16 sprints), impacto da IA na produtividade (10x em migrations, 3x em refatorações), tabela de riscos e ferramentas de gestão utilizadas.

## 8.1 Metodologia de Gestão

O projeto adotou **Kanban** de forma orgânica, sem cerimônias formais de Scrum. O fluxo de trabalho foi orientado por:

- Branches por funcionalidade/fase (`dev`, `homolog`, `main`).
- _Pull Requests_ como pontos de revisão e merge.
- Commits semânticos como registro de progresso (`feat:`, `fix:`, `refactor:`, `security:`, `chore:`).
- Auditorias periódicas de código como substituto de retrospectivas.

A ausência de sprints formais foi compensada pela rastreabilidade do histórico git, que permite reconstruir o cronograma real com precisão de dia.

## 8.2 Escopo MVP

O MVP foi definido como a plataforma funcional para um professor gerenciar seus alunos, aulas e cobranças. Tudo além disso foi incremento.

| **Funcionalidade**               | **MVP** | **Incremento** |
| -------------------------------- | ------- | -------------- |
| Cadastro de alunos e professores | ✅      | —              |
| Registro de aulas                | ✅      | —              |
| Cobranças individuais            | ✅      | —              |
| Autenticação por _role_          | ✅      | —              |
| Portal do aluno                  | ✅      | —              |
| Pacotes de aulas                 | —       | ✅             |
| Módulo de atividades             | —       | ✅             |
| QR Code PIX                      | —       | ✅             |
| Dashboard com gráficos           | —       | ✅             |
| PWA instalável                   | —       | ✅             |
| Suporte a alunos estrangeiros    | —       | ✅             |
| Visão consolidada admin          | —       | ✅             |

## 8.3 Cronograma Real Retroativo

Reconstruído a partir do histórico git (`homolog-old`, 185 commits, 19/jan–18/fev 2026) e inferência do período posterior.

| **Fase**                   | **Período**        | **Duração** | **Entregas Principais**                                         |
| -------------------------- | ------------------ | ----------- | --------------------------------------------------------------- |
| Fundação                   | 19–23 jan 2026     | 5 dias      | Schema inicial, CRUD pagamentos, página professores, API CEP    |
| Autenticação & Usuários    | 26–29 jan 2026     | 4 dias      | Auth por role, profiles, views compartilhadas, shadcn/ui        |
| Qualidade & Infra          | 29–30 jan 2026     | 2 dias      | CI/CD, soft delete, design tokens, PWA, formatters, skeletons   |
| Features Avançadas         | 31 jan–08 fev 2026 | 9 dias      | Dashboard, histórico aluno, reset senha, hard delete, search    |
| Estabilização & UX         | 09–13 fev 2026     | 5 dias      | Mobile-first, atividades, pacotes de aulas, QR code, 161 testes |
| Segurança & Correções      | 14–18 fev 2026     | 5 dias      | Idempotência, gestão de faltas, cascade delete, estrangeiros    |
| Auditorias & Migrations    | 19 fev–11 mar 2026 | ~20 dias    | 17 migrations de segurança, 6 auditorias, docs técnicas         |
| Reestruturação             | 10–11 mar 2026     | 2 dias      | Novo repo, renomeação, steering files                           |
| Refatorações Arquiteturais | 11 mar–21 abr 2026 | ~40 dias    | Separação hooks, split arquivos, query builders, timezone fix   |
| Centralização de Strings   | 21 abr–20 mai 2026 | ~30 dias    | Estrutura content, substituição strings, auditoria final        |
| Restore & TCC              | 21 abr 2026        | 1 dia       | Restore codebase, migrations 24-25, organização docs            |

**Total:** ~4 meses de desenvolvimento ativo (jan–mai 2026)

**Detalhamento das Refatorações (Mar-Mai):**

- **Sprint 8 (11 mar–21 abr):** Separação Supabase/Hooks — nenhum componente chama Supabase diretamente
- **Sprint 9 (21 abr):** Split de arquivos grandes — 6 hooks de 250 linhas → 24 arquivos de 50 linhas
- **Sprint 10 (21 abr):** Query builders — 22 funções reutilizáveis eliminam 75 linhas duplicadas
- **Sprint 11 (21 abr):** Fix timezone + ErrorBoundary — conversões UTC↔BRT, UI amigável para erros
- **Sprint 12 (21 abr–20 mai):** Estrutura de content — 13 arquivos, 860 linhas
- **Sprint 13 (20 mai):** Expansão de content — toasts, placeholders, validações
- **Sprint 14 (20 mai):** Substituição de strings — 58 componentes, 190 strings removidas
- **Sprint 15 (20 mai):** Auditoria final — 100% centralização, 0 strings hardcoded

> 🖼️ **Figura:** Gantt retroativo — ver `docs/tcc/assets-pendentes.md`

## 8.4 Impacto da IA na Produtividade

O projeto foi desenvolvido com assistência intensiva de IA (Claude/Anthropic via Kiro IDE e Kiro CLI).

### 8.4.1 Evidências Quantitativas

| **Métrica**                 | **Valor**   |
| --------------------------- | ----------- |
| Commits em ~4 meses         | ~276        |
| Arquivos no projeto         | 391         |
| Linhas de código            | ~46.400     |
| Migrations SQL              | 25          |
| Arquivos de teste unitários | 26 (Vitest) |
| Query builders criados      | 22          |
| Strings UI centralizadas    | ~470        |
| Desenvolvedores             | 1           |

### 8.4.2 O que a IA Acelerou

- Geração de migrations SQL complexas (RLS, triggers, RPCs) — estimativa: 10x mais rápido.
- _Scaffolding_ de componentes seguindo padrões do projeto.
- Auditorias de segurança (identificou 36 bugs em sessão única).
- Documentação técnica retroativa.
- Refatorações com contexto de todo o codebase:
  - Sprint 8: Separação de hooks (6 componentes auditados, padrão identificado)
  - Sprint 9: Split de arquivos (6 hooks grandes → 24 arquivos menores)
  - Sprint 10: Query builders (15 queries duplicadas identificadas e eliminadas)
  - Sprint 12-15: Centralização de strings (168 strings analisadas, classificadas UI vs Técnica)
- Geração de conteúdo estruturado (13 arquivos de content, 860 linhas)

### 8.4.3 O que Exigiu Trabalho Humano

- Decisões de produto (o que construir, para quem).
- Testes manuais e validação de fluxos reais.
- Configuração de ambiente e deploy.
- Revisão e aprovação de cada mudança gerada.

### 8.4.4 Reflexão

A IA funcionou como um par de programação disponível 24h, com conhecimento técnico amplo mas sem contexto de negócio. O desenvolvedor manteve o papel de arquiteto e tomador de decisões; a IA acelerou a execução.

**Impacto nas Refatorações:**
As sprints 8-15 (refatorações arquiteturais e centralização de strings) demonstram o valor da IA em tarefas repetitivas e de grande escala:

- Sprint 9: Split de 6 hooks grandes em 24 arquivos — tarefa manual levaria ~2 dias, com IA levou ~4 horas
- Sprint 10: Identificação de 15 queries duplicadas — análise manual levaria ~1 dia, com IA levou ~2 horas
- Sprint 14: Substituição de 190 strings em 58 componentes — tarefa manual levaria ~3 dias, com IA levou ~6 horas

Isso permitiu que um único desenvolvedor entregasse em 4 meses o que normalmente exigiria uma equipe de 2–3 pessoas em 8–10 meses.

## 8.5 Tabela de Riscos

| **ID** | **Risco**                                      | **Prob.** | **Impacto** | **Mitigação**                                    | **Status**                         |
| ------ | ---------------------------------------------- | --------- | ----------- | ------------------------------------------------ | ---------------------------------- |
| R01    | Perda de histórico git                         | Alta      | Alto        | Branches de backup (`homolog-old`)               | ⚠️ Ocorreu — mitigado parcialmente |
| R02    | Vulnerabilidades de segurança (RLS)            | Média     | Crítico     | Auditorias periódicas, migrations de correção    | ✅ Mitigado (migrations 21–23)     |
| R03    | Performance degradada com crescimento de dados | Média     | Alto        | Índices compostos, materialized views, paginação | ✅ Mitigado (migration 22)         |
| R04    | Violação de LGPD                               | Baixa     | Crítico     | Soft delete, anonimização, sem CPF obrigatório   | ✅ Mitigado                        |
| R05    | Dependência de serviço externo (Supabase)      | Baixa     | Alto        | Risco aceito para MVP                            | 🔵 Aceito                          |
| R06    | Complexidade crescente do codebase             | Alta      | Médio       | Auditorias de clean code, sprints 10–12          | 🔄 Em andamento                    |
| R07    | Bugs de timezone em produção                   | Alta      | Médio       | Documentados, correção planejada                 | ⚠️ Pendente                        |
| R08    | Dados sensíveis no Sentry (LGPD)               | Alta      | Alto        | Correção planejada (`sendDefaultPii: false`)     | ⚠️ Pendente                        |

## 8.6 Ferramentas de Gestão

| **Ferramenta**     | **Uso**                                     |
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

- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md) para histórico completo de 16 sprints implementadas
- **Histórico:** Ver [docs/sprints/historico-completo.md](../sprints/historico-completo.md) para cronograma detalhado
- **Git:** Ver [docs/git/overview.md](../git/overview.md) para workflow e convenções de commit
- **Metodologia:** Ver [Cap. 3 — Metodologia](./cap3-metodologia.md) para classificação da pesquisa e uso de IA
- **Arquitetura:** Ver [docs/architecture/technical-debt.md](../architecture/technical-debt.md) para débitos técnicos (R06)
- **Conclusão:** Ver [Cap. 10 — Conclusão](./cap10-conclusao.md) para análise das hipóteses H1, H2, H3
