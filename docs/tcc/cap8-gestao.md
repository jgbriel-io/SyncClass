> **Status:** 🟠 Rascunho
> **Última Atualização:** 21/04/2026

## 8.1 Metodologia de Gestão

O projeto adotou **Kanban** de forma orgânica, sem cerimônias formais de Scrum. O fluxo de trabalho foi orientado por:

- Branches por funcionalidade/fase (`dev`, `homolog`, `main`).
- _Pull Requests_ como pontos de revisão e merge.
- Commits semânticos como registro de progresso (`feat:`, `fix:`, `refactor:`, `security:`, `chore:`).
- Auditorias periódicas de código como substituto de retrospectivas.

A ausência de sprints formais foi compensada pela rastreabilidade do histórico git, que permite reconstruir o cronograma real com precisão de dia.

## 8.2 Escopo MVP

O MVP foi definido como a plataforma funcional para um professor gerenciar seus alunos, aulas e cobranças. Tudo além disso foi incremento.

|**Funcionalidade**|**MVP**|**Incremento**|
|---|---|---|
|Cadastro de alunos e professores|✅|—|
|Registro de aulas|✅|—|
|Cobranças individuais|✅|—|
|Autenticação por _role_|✅|—|
|Portal do aluno|✅|—|
|Pacotes de aulas|—|✅|
|Módulo de atividades|—|✅|
|QR Code PIX|—|✅|
|Dashboard com gráficos|—|✅|
|PWA instalável|—|✅|
|Suporte a alunos estrangeiros|—|✅|
|Visão consolidada admin|—|✅|

## 8.3 Cronograma Real Retroativo

Reconstruído a partir do histórico git (`homolog-old`, 185 commits, 19/jan–18/fev 2026) e inferência do período posterior.

|**Fase**|**Período**|**Duração**|**Entregas Principais**|
|---|---|---|---|
|Fundação|19–23 jan 2026|5 dias|Schema inicial, CRUD pagamentos, página professores, API CEP|
|Autenticação & Usuários|26–29 jan 2026|4 dias|Auth por role, profiles, views compartilhadas, shadcn/ui|
|Qualidade & Infra|29–30 jan 2026|2 dias|CI/CD, soft delete, design tokens, PWA, formatters, skeletons|
|Features Avançadas|31 jan–08 fev 2026|9 dias|Dashboard, histórico aluno, reset senha, hard delete, search|
|Estabilização & UX|09–13 fev 2026|5 dias|Mobile-first, atividades, pacotes de aulas, QR code, 161 testes|
|Segurança & Correções|14–18 fev 2026|5 dias|Idempotência, gestão de faltas, cascade delete, estrangeiros|
|Auditorias & Migrations|19 fev–11 mar 2026|~20 dias|17 migrations de segurança, 6 auditorias, docs técnicas|
|Reestruturação|10–11 mar 2026|2 dias|Novo repo, renomeação, steering files|
|Restore & TCC|21 abr 2026|1 dia|Restore codebase, migrations 22–23, organização docs|

**Total:** ~3 meses de desenvolvimento ativo (jan–abr 2026)

> 🖼️ **Figura:** Gantt retroativo — ver `docs/tcc/assets-pendentes.md`

## 8.4 Impacto da IA na Produtividade

O projeto foi desenvolvido com assistência intensiva de IA (Claude/Anthropic via Kiro IDE e Kiro CLI).

### 8.4.1 Evidências Quantitativas

|**Métrica**|**Valor**|
|---|---|
|Commits em ~3 meses|~218|
|Arquivos no projeto|391|
|Linhas de código|~46.400|
|Migrations SQL|23|
|Testes escritos|161 (unitários + E2E)|
|Desenvolvedores|1|

### 8.4.2 O que a IA Acelerou

- Geração de migrations SQL complexas (RLS, triggers, RPCs) — estimativa: 10x mais rápido.
- _Scaffolding_ de componentes seguindo padrões do projeto.
- Auditorias de segurança (identificou 36 bugs em sessão única).
- Documentação técnica retroativa.
- Refatorações com contexto de todo o codebase.

### 8.4.3 O que Exigiu Trabalho Humano

- Decisões de produto (o que construir, para quem).
- Testes manuais e validação de fluxos reais.
- Configuração de ambiente e deploy.
- Revisão e aprovação de cada mudança gerada.

### 8.4.4 Reflexão

A IA funcionou como um par de programação disponível 24h, com conhecimento técnico amplo mas sem contexto de negócio. O desenvolvedor manteve o papel de arquiteto e tomador de decisões; a IA acelerou a execução. Isso permitiu que um único desenvolvedor entregasse em 3 meses o que normalmente exigiria uma equipe de 2–3 pessoas em 6 meses.

## 8.5 Tabela de Riscos

|**ID**|**Risco**|**Prob.**|**Impacto**|**Mitigação**|**Status**|
|---|---|---|---|---|---|
|R01|Perda de histórico git|Alta|Alto|Branches de backup (`homolog-old`)|⚠️ Ocorreu — mitigado parcialmente|
|R02|Vulnerabilidades de segurança (RLS)|Média|Crítico|Auditorias periódicas, migrations de correção|✅ Mitigado (migrations 21–23)|
|R03|Performance degradada com crescimento de dados|Média|Alto|Índices compostos, materialized views, paginação|✅ Mitigado (migration 22)|
|R04|Violação de LGPD|Baixa|Crítico|Soft delete, anonimização, sem CPF obrigatório|✅ Mitigado|
|R05|Dependência de serviço externo (Supabase)|Baixa|Alto|Risco aceito para MVP|🔵 Aceito|
|R06|Complexidade crescente do codebase|Alta|Médio|Auditorias de clean code, sprints 10–12|🔄 Em andamento|
|R07|Bugs de timezone em produção|Alta|Médio|Documentados, correção planejada|⚠️ Pendente|
|R08|Dados sensíveis no Sentry (LGPD)|Alta|Alto|Correção planejada (`sendDefaultPii: false`)|⚠️ Pendente|

## 8.6 Ferramentas de Gestão

|**Ferramenta**|**Uso**|
|---|---|
|GitHub|Versionamento, branches, PRs, Issues|
|GitHub Actions|CI/CD automatizado|
|Kiro IDE / CLI|Desenvolvimento e análise assistidos por IA|
|Obsidian|Documentação do TCC|
|Supabase Dashboard|Gestão do banco e autenticação|

---

## Assets Necessários

- [ ] 🖼️ Figura: Gantt retroativo (Excel/Google Sheets ou draw.io)
