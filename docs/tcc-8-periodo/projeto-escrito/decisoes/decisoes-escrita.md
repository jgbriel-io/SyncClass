# Decisões de Escrita — Blockers Resolvidos por Capítulo

Registro das decisões tomadas antes de escrever cada capítulo final.
Complementa `decisoes-transversais.md` (valores canônicos globais).

---

## Cap. 3 — Metodologia

**Data:** 2026-06-03

| Blocker                                   | Decisão                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instrumento de coleta (crítico)           | Commits semânticos (git log) + estimativas retrospectivas de tempo baseadas na experiência do desenvolvedor. **Instrumento complementar futuro:** Forms exploratório com professores/alunos voluntários (Apêndice A — executar antes de finalizar cap 3)                                                                        |
| Validação com usuário real                | O sistema está em produção — professor cliente e seus alunos usam ativamente. Isso pode ser citado como "validação em ambiente real" no cap 3 §3.3, complementando os testes internos                                                                                                                                           |
| H3 baseline vs. Peng et al. (crítico)     | Escopo diferente: Peng et al. mede coding geral com Copilot (55%); H3 mede tarefas específicas de alta alavancagem (scaffolding, migrations SQL, auditoria de RLS) com Claude — ganhos maiores nesses nichos. Citar ambos, posicionar H3 como subconjunto, declarar limitação de estimativa retrospectiva sem grupo de controle |
| H3 protocolo de medição (crítico)         | Unidade: tempo de execução de tarefa específica. Linha de base: estimativa retrospectiva do desenvolvedor com base em experiência anterior. Limitação declarada: viés do próprio executor, sem controle formal                                                                                                                  |
| "O que a IA não fez" — duplicação cap 3/8 | Cap 3: delimitação do instrumento (limites metodológicos — o que ficou fora da IA). Cap 8: análise de produtividade (o que rendeu, quanto estimou). Ângulos distintos, sem duplicação literal                                                                                                                                   |
| Nomenclatura metodológica                 | "modelo iterativo incremental com ciclos semanais" (Anderson, 2010; Pressman e Maxim, 2016). Remover "Kanban" e "sprints fixas"                                                                                                                                                                                                 |
| "Claude via Kiro IDE"                     | Substituir por "assistente de IA Claude (Anthropic)" em todas as ocorrências                                                                                                                                                                                                                                                    |
| Prazo                                     | ~3 meses (março a junho de 2026) — ver decisoes-transversais.md §1                                                                                                                                                                                                                                                              |

---

## Cap. 1 — Introdução

**Data:** 2026-06-03

| Blocker                   | Decisão                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 prazo                  | ~3 meses (março a junho de 2026), conforme histórico de versionamento; focar no resultado                                                                                                                                                                                                                  |
| H2 limiar                 | Inserir "≥60%" no enunciado de H2 — eliminar "significativamente" vago                                                                                                                                                                                                                                     |
| H3 unidade                | Já resolvido no cap 3: "tempo de execução de tarefas específicas de scaffolding, migrations e auditoria"                                                                                                                                                                                                   |
| 1.1 afirmações de mercado | IBGE (2022) + CIEB (2024) — já em referencias-final.md                                                                                                                                                                                                                                                     |
| 1.3 LGPD                  | Art. 16, I da Lei nº 13.709/2018                                                                                                                                                                                                                                                                           |
| 1.4.1 objetivo geral      | Reformular para pesquisa: "Investigar a viabilidade de desenvolver e entregar um SaaS funcional para gestão de professores autônomos, por um único desenvolvedor com suporte de IA generativa, em prazo acadêmico" — cobre H1, H2, H3                                                                      |
| Parágrafo de abertura     | Inserir 2–3 frases contextualizadoras antes da seção 1.1 (ABNT exige)                                                                                                                                                                                                                                      |
| Origem do projeto         | O SyncClass surgiu de um freela real: o desenvolvedor foi contratado por um professor autônomo de inglês para construir a plataforma. Os requisitos são reais, coletados com um usuário real. Mencionar como validação prática do problema descrito em 1.1 — identificado antes de construir, não post hoc |
| Sistema em produção       | O sistema já está em uso em produção pelo professor e seus alunos. Isso valida H1 (SaaS funcional entregue) com evidência além da build — há usuários reais operando. Mencionar em 1.1 ou 1.4 como evidência de viabilidade                                                                                |

---

## Cap. 2 — Referencial Teórico

**Data:** 2026-06-03

| Blocker                             | Decisão                                                                                                                                                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.4 Kanban vs. 31 sprints           | Substituir "Kanban" por "modelo iterativo incremental com ciclos semanais" — consistente com cap 3 (Anderson, 2010; Pressman e Maxim, 2016)                                                                                   |
| 2.10 CI/CD sem CD                   | Adicionar CD: GitHub Actions → Cloudflare Pages — completa o conceito que o próprio cap define                                                                                                                                |
| 2.11 H3 vs Peng et al.              | No referencial: apenas apresentar Peng et al. (55%) como dado de literatura. Reconciliação com H3 fica no cap 3 — não antecipar discussão                                                                                     |
| Afirmações sem fonte                | **Substituir todas as afirmações fictícias/sem fonte por dados reais com citação.** Ao escrever cap 2 final: ler rascunho linha a linha, identificar cada claim não citado e usar apenas fontes reais de referencias-final.md |
| 2.7.1 monolito sem justificativa    | Citar Fowler "MonolithFirst" (2015) — já em referencias-final.md                                                                                                                                                              |
| 2.7.2 H2 sem baseline               | Apresentar o conceito BaaS vs. REST; baseline quantitativo fica no cap 5 e 10                                                                                                                                                 |
| PostgreSQL "escolhido por robustez" | Substituir: "adotado como banco nativo do Supabase — não foi escolha livre, mas imposição da plataforma BaaS"                                                                                                                 |
| ISO 25010 sem prioridades           | Declarar 4 características prioritárias: **Segurança** (multi-tenant/RLS/LGPD), **Confiabilidade** (sistema financeiro), **Manutenibilidade** (solo developer), **Usabilidade** (professor sem suporte de TI)                 |
| Domínio ausente                     | **Criar seção 2.1 "Contexto do Domínio"** — mercado de professores autônomos de inglês no Brasil. Fontes: IBGE (2022) + CIEB (2024) + British Council (2023). Justifica existência do produto e sustenta H2/H3                |

---

## Cap. 4 — Engenharia de Requisitos

**Data:** 2026-06-03

| Blocker                                             | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Elicitação ausente                                  | O projeto originou de um freela real. Requisitos coletados em entrevistas com o professor autônomo de inglês cliente + análise comparativa de ferramentas. Voz acadêmica: "os requisitos foram coletados por meio de entrevistas com um professor de inglês autônomo e análise comparativa de ferramentas de gestão disponíveis no mercado"                                                                                                                                                                                                                                                                                    |
| Apêndice A — Forms exploratório                     | Será criado um formulário (Google Forms ou similar) disponibilizando a versão de homologação para professores e alunos voluntários da faculdade e da rede do desenvolvedor. Respostas = Apêndice A. **Blocker cap 4 resolvido quando Forms for executado.** Enquanto isso: não referenciar Apêndice A no texto — só após concluído. **Consentimento:** inserir no início do Forms: "Ao responder, você concorda que os dados anonimizados serão utilizados em pesquisa acadêmica." Participantes não precisam ser identificados. Professor do freela: anônimo no texto — não requer consentimento formal (não é identificável) |
| Contagem RF inconsistente                           | **31 implementados + 4 trabalhos futuros (RF32–RF35)**. Única contagem em todo o capítulo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| RF32–RF35                                           | Mover para seção de trabalhos futuros no cap 10. No cap 4: tabela separada "RF planejados"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| RN-049 (paginação), RN-052 (Zod), RN-056 (skeleton) | Mover para RNF — são decisões técnicas de qualidade/performance, não regras de domínio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| UCs sem pré/pós-condição                            | Expandir ao menos UC01, UC02, UC06 com pré-condição, pós-condição e fluxo alternativo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Matriz de rastreabilidade                           | Completar para todos os 31 RF implementados                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| RN-025 vencimento no frontend                       | Declarar como trade-off: "vencimento calculado no frontend por decisão de performance — sem constraint no banco; risco de inconsistência por acesso direto à API declarado como limitação conhecida"                                                                                                                                                                                                                                                                                                                                                                                                                           |
| RN-032 status "atrasada" não persistido             | Declarar como trade-off: "status calculado no cliente via JavaScript — divergência possível por fuso ou horário de acesso declarada como limitação conhecida"                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

---

## Cap. 5 — Arquitetura e Modelagem

**Data:** 2026-06-03

| Blocker                                       | Decisão                                                                                                                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2 "~60%" sem metodologia                     | Citar literatura BaaS (Supabase docs + Mell e Grance, NIST 2011) + declarar estimativa como qualitativa e aproximada — não apresentar como cálculo formal                                            |
| DER ausente                                   | Marcar como "Figura X — pendente de geração" com descrição textual das 11 tabelas. Inserir no Word antes da entrega                                                                                  |
| Tabela de tabelas errada (9 listadas, são 11) | Corrigir para 11: incluir `user_roles` e `performance_logs` com papel arquitetural explicado                                                                                                         |
| RLS sem mecanismo central                     | Descrever `is_admin()` com `SECURITY DEFINER` como mecanismo que impede acesso direto ao banco por roles não autorizados                                                                             |
| Alternativas descartadas                      | Firebase: NoSQL, sem RLS nativo, vendor lock-in Google. PocketBase: menor maturidade, ecossistema reduzido, sem suporte a roles complexos. Supabase: PostgreSQL real + RLS nativo + open-source      |
| Monolito sem justificativa                    | Citar Fowler "MonolithFirst" (2015) — já em referencias-final.md                                                                                                                                     |
| Argumento central ausente                     | Parágrafo de abertura do cap conectando decisões arquiteturais a H2 explicitamente                                                                                                                   |
| uuid_generate_v4() vs gen_random_uuid()       | Declarar evolução: migrations iniciais usavam `uuid_generate_v4()` (extensão `uuid-ossp`); migrations a partir da Sprint 7 migraram para `gen_random_uuid()` (built-in PostgreSQL 13+, sem extensão) |
| Edge Functions: Deno não mencionado           | Adicionar "runtime: Deno" na descrição/tabela de Edge Functions — detalhe arquitetural relevante para isolamento e segurança                                                                         |

---

## Cap. 6 — Implementação

**Data:** 2026-06-03

| Blocker                          | Decisão                                                                                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1/H2/H3 ausentes                | Seção 6.6 dedicada "Evidências das Hipóteses": H1 = período de ~3 meses documentado; H2 = módulos eliminados pelo Supabase; H3 = exemplos de uso da IA por sprint                                                                                                                       |
| Métricas contraditórias          | Usar valores canônicos: **152 commits**, 181 componentes, **329 arquivos TS**, **~50.000 LOC**, ~3 meses (março a junho)                                                                                                                                                                |
| Decisões técnicas por módulo     | 4 desafios principais a documentar: (1) Financeiro: idempotência + AbacatePay; (2) Auth/Segurança: RLS multi-tenant com is_admin(); (3) Atividades: isolação de tenant no trigger + upload; (4) Sprint 8: centralizar Supabase em hooks \*Service.ts — problema (acoplamento) → solução |
| Idempotência enterrada em bullet | Expandir `idempotency_keys` para parágrafo com contexto do problema (cobrança dupla em PIX)                                                                                                                                                                                             |

---

## Cap. 7 — Qualidade e Testes

**Data:** 2026-06-03

| Blocker                                            | Decisão                                                                                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QA Sprint 28 resumido em 4 bullets                 | Sprint 28 em andamento: 214 itens totais, 104 executados, 110 ainda pendentes. Escrever cap 7 final **após** conclusão da Sprint 28 — usar resultado real                                  |
| ISO 25010 sem metodologia                          | Checklist interno com evidências rastreadas por sprint: Sprint 24 = Segurança; refatorações Sprint 8-9 = Manutenibilidade. Declarar como avaliação do próprio desenvolvedor sujeita a viés |
| E2E ausente                                        | Nunca foi formalmente avaliado. Declarar ausência honestamente como limitação — não inventar avaliação de Playwright                                                                       |
| 304 testes não mencionados                         | Declarar 304 testes no texto explicitamente (decisoes-transversais §3)                                                                                                                     |
| Pirâmide sem citação                               | Citar Mike Cohn (2009) ou Fowler para pirâmide de testes                                                                                                                                   |
| Manutenibilidade "Média" com refatoração concluída | Rever para "Alta" após Sprints 8-9 — ou justificar por que ainda é "Média"                                                                                                                 |
| Testes de integração ausentes                      | Declarar gap explicitamente: sem testes de integração para RPCs, RLS, triggers e Edge Functions                                                                                            |

---

## Cap. 8 — Gestão do Projeto

**Data:** 2026-06-03

| Blocker                               | Decisão                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estimativas "levaria 2 dias"          | **Manter com base declarada:** "estimativa retrospectiva baseada na experiência do desenvolvedor em projetos equivalentes — declarada como limitação metodológica" |
| "Equipe de 2-3 pessoas em 8-10 meses" | Remover — sem fonte, não pertence ao TCC                                                                                                                           |
| "10x mais rápido" (§8.4.2)            | **Remover** — sem exemplo rastreável específico                                                                                                                    |
| Commits                               | **152** (branch main — único valor canônico)                                                                                                                       |
| Anderson (2010) removido              | Citar apenas Pressman e Maxim (2016) para "modelo iterativo incremental" — Anderson descreve Kanban sem time-boxes, não iterativo incremental                      |
| Nota de rastreabilidade               | Diferenciar fontes primárias contemporâneas (commits + migrations) de documentação retroativa (docs/sprints/)                                                      |
| Kanban "de forma orgânica"            | Substituir por justificativa formal: Pressman e Maxim (2016); mesma terminologia do cap 3                                                                          |
| Prazo                                 | ~3 meses (março a junho de 2026)                                                                                                                                   |
| Migrations                            | 70 — corrigir valor desatualizado                                                                                                                                  |
| R08 "Resolvido"                       | Reclassificar para "Aceito" — logger.ts em dev não é monitoramento de produção                                                                                     |
| "O que a IA não fez"                  | Referenciar cap 3 (delimitação metodológica). Cap 8: análise de produtividade com ângulo distinto                                                                  |
| Gantt                                 | Marcar como placeholder — "Figura X — pendente de geração, inserir no Word antes da entrega"                                                                       |

---

## Cap. 9 — Infraestrutura e Deploy

**Data:** 2026-06-03

| Blocker                                  | Decisão                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contradição VPS com cap 10               | Remover toda menção a VPS — não existe VPS no projeto. Deploy = GitHub Actions → Cloudflare Pages                                                                                    |
| H2 completamente ausente                 | Inserir parágrafo de remissão: "a análise quantitativa de H2 é apresentada no cap 10; este capítulo evidencia as superfícies de backend eliminadas pelo Supabase"                    |
| "Sem servidor próprio" sem justificativa | Critérios: redução de complexidade operacional, custo zero em tier gratuito, adequação a MVP solo. Citar Mell e Grance (NIST, 2011) para BaaS                                        |
| Cloudflare Pages sem critério            | Por que não Vercel/Netlify: Cloudflare = CDN global nativo + Workers + tier gratuito sem cold start. Vercel teria cold start em Edge Functions gratuitas                             |
| CI com credenciais fake                  | Declarar explicitamente: testes no CI usam `fake-project.supabase.co` — nenhum teste de integração real roda no pipeline                                                             |
| Edge Functions sem critério              | Critério de separação: API externa (AbacatePay) + chave secreta não exposta no cliente → Edge Function. Operações internas → RPC PostgreSQL                                          |
| Migrations: valor desatualizado          | Corrigir para 70                                                                                                                                                                     |
| "edu-core-zen"                           | **Remover** — nome interno desatualizado; o projeto se chama SyncClass                                                                                                               |
| Cloudflare Pages vs Vercel/Netlify       | Critério técnico: CDN global nativo + tier gratuito sem cold start + Workers integrado. Vercel/Netlify têm cold start em funções gratuitas                                           |
| Edge Functions: quais existem            | 4 funções: `reset-password`, `admin-delete-user`, `invite-user`, `create-abacate-payment`. Critério comum: API externa ou privilégio elevado (service_role) — não exposto no cliente |

---

## Cap. 10 — Conclusão

**Data:** 2026-06-03

| Blocker                                | Decisão                                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 reformulada post hoc                | **Só confirmar viabilidade:** "sistema funcional entregue por desenvolvedor solo em ~3 meses (março a junho de 2026)".                                                                                                                                                                                      |
| H2 "Estima-se 60 a 70%"                | Substituir por método: enumerar superfícies eliminadas pelo Supabase (auth, storage, realtime, RLS, migrations automáticas) + declarar estimativa qualitativa baseada em literatura BaaS (Mell e Grance, 2011)                                                                                              |
| H3 exemplos não aderentes              | **Sprint 1–2** (scaffolding) + **Sprint 9** (migrations SQL) + **Sprint 24** (auditoria RLS). Declarar limitação de estimativa retrospectiva                                                                                                                                                                |
| H3 "ganho médio 3-5x"                  | Remover — sem base calculada. Manter só os exemplos específicos com dados rastreáveis por sprint                                                                                                                                                                                                            |
| §10.5 ODS                              | Adicionar 1-2 frases fechando ciclo ODS 4/8/9: plataforma contribui para educação de qualidade e trabalho decente do professor autônomo                                                                                                                                                                     |
| AbacatePay em trabalhos futuros        | Remover — implementado na Sprint 30                                                                                                                                                                                                                                                                         |
| "Período: janeiro a maio de 2026"      | Corrigir para "março a junho de 2026"                                                                                                                                                                                                                                                                       |
| "Equipe de 2-3 pessoas em 8-10 meses"  | Remover — sem fonte                                                                                                                                                                                                                                                                                         |
| 10.3 limitações superficiais           | Expandir: ausência de testes de integração como ressalva a RNF06 (< 2s); ausência de teste de carga real                                                                                                                                                                                                    |
| 10.4 Trabalhos futuros                 | Manter: testes de integração reais no CI; multi-idioma; painel do aluno expandido; RF32–RF35 (funcionalidades planejadas não implementadas — ver cap 4)                                                                                                                                                     |
| Sistema em produção / resultados reais | O sistema está em uso real pelo professor cliente e seus alunos. Mencionar em 10.2 como evidência adicional de H1 — além de "build entregue", há "uso em produção por usuários reais".                                                                                                                      |
| Forms exploratório como resultado      | O Forms (Apêndice A) com divulgação na faculdade é o instrumento de coleta de feedback externo. **Só incluir em 10.3/10.4 após executar o Forms.** Se executado antes da entrega: citar respostas como validação qualitativa de H3 (usabilidade percebida). Se não: citar como trabalho futuro em andamento |
