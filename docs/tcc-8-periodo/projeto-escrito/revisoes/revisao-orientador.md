# Revisão Completa — TCC SyncClass

**1ª Rodada — Data:** 03/06/2026 | **Método:** 10 agents tcc-orientador em paralelo, um por capítulo  
**2ª Rodada — Data:** 03/06/2026 | **Método:** agents tcc-orientador verificando se decisões foram aplicadas  
**Escopo dos arquivos:** `docs/tcc-8-periodo/projeto-escrito/capitulos-guia/cap*.md` (rascunhos)  
**Não cobertos:** `capitulos-final/capitulo1-final.md` e `capitulo2-final.md` — versões finalizadas de caps 1 e 2  
**Postura:** orientador severo — perguntas duras, sem suavização  
**Escopo:** argumento, evidência, coesão, estrutura, aderência ao SyncClass  
**Fora do escopo:** normas mecânicas (vírgulas, formatação Word)

> **Padrão identificado na 2ª rodada:** todas as decisões registradas em `decisoes-escrita.md` e `decisoes-transversais.md` existem como texto de planejamento mas **não foram aplicadas aos rascunhos**. Os arquivos `cap*.md` permanecem no estado da 1ª rodada.

---

## Problemas Transversais (atravessam múltiplos capítulos)

| Problema                                                                            | Capítulos afetados     |
| ----------------------------------------------------------------------------------- | ---------------------- |
| Prazo: 3 meses (H1) vs. 4 meses (cap10) vs. 4,5 meses (cap8)                        | 1, 6, 7, 8, 10         |
| Migrations: 70 correto — filesystem tem 70 arquivos, max nº é 72 mas 48/49 ausentes | verificado ✅          |
| "Kanban" declarado, mas projeto tem 31 sprints com time-boxes                       | 2, 3, 8                |
| Método de estimativa H3 ("3x") nunca declarado                                      | 1, 3, 8, 10            |
| H2 "60%" sem baseline comparativo nem método                                        | 2, 5, 9, 10            |
| Commits: cap6 diz "60+", caps 8/10 dizem "147"                                      | 6, 8, 10               |
| DER ausente — marcado como pendente no próprio arquivo                              | 5                      |
| QA Sprint 28 (116 itens) invisível no cap7 — número parcial (104) usado             | 7                      |
| Deploy automatizado (cap9) vs. VPS manual (cap10)                                   | ✅ resolvido           |
| AbacatePay implementado na Sprint 30 mas listado como trabalho futuro               | 4, 10                  |
| "significativamente" sem limiar — alvo de grep em `decisoes-transversais.md`        | 1, 2, 5                |
| Nomes antigos ("edu-core-zen", "English School")                                    | ✅ corrigidos em 03/06 |

---

## Cap. 1 — Introdução

### Críticos (bloqueiam entrega)

**H1 — Contradição de prazo**
H1 diz "~3 meses". Cap. 8 diz "4,5 meses". Cap. 10 diz "~4 meses". Cap. 7 ainda repete "3 meses". Três valores para a mesma grandeza. A banca usa o enunciado da hipótese como critério de julgamento.

**H2 — "Significativamente" sem limiar**
H2 diz "reduz significativamente o tempo de desenvolvimento". Cap. 10 usa "60 a 70%" para confirmá-la — mas esse número não está na hipótese. Hipótese sem limiar é confirmável por qualquer resultado positivo. `decisoes-transversais.md` já registra "≥60%" — não aplicado ao rascunho.

**1.1 — Afirmações de mercado sem fonte**
"Mercado composto majoritariamente por professores autônomos", "plataformas especializadas são escassas ou inacessíveis" — afirmações factuais sem citação. Decidido: IBGE (2022) + CIEB (2024). Não aplicado.

**1.3 — Pilar LGPD sem artigo de lei**
"Necessidade de conformidade com a LGPD" sem citar qual artigo se aplica ao professor autônomo como controlador de dados. Migrations já citam "Art. 16, I" — usar isso.

### Importantes

**H3 — "3x" sem definição de unidade**
Multiplicador sem definição do que é medido (tempo? linhas? artefatos?). Cap. 8 usa estimativas retroativas de tempo — honesto, mas precisa aparecer como limitação metodológica aqui ou no cap. 3.

**1.4.1 — Objetivo geral descreve produto, não pesquisa**
H2 e H3 são sobre o processo de desenvolvimento. O objetivo geral menciona só o artefato. Decisão de corrigir registrada, não aplicada.

**Ausência de parágrafo introdutório**
Cap. começa direto em 1.1. ABNT exige parágrafo de abertura antes da primeira subseção. Decidido, não aplicado.

### Perguntas da banca

1. 3, 4 ou 4,5 meses? Qual é o número real e como sincroniza todos os capítulos?
2. Por que H2 não tem limiar se o cap. 10 usa "60-70%"?
3. Qual fonte sustenta a caracterização do mercado de idiomas no Brasil?
4. Qual é o objetivo de _pesquisa_ do TCC — não o produto?

---

## Cap. 2 — Referencial Teórico

### Críticos (bloqueiam entrega)

**Seção inexistente — "Contexto do Domínio"**
`decisoes-escrita.md` determina criar seção 2.1 com mercado de professores autônomos + IBGE (2022), CIEB (2024), British Council (2023). Ausente do arquivo inteiro. Sem ela, o capítulo não conecta o domínio ao referencial.

**2.4 — "Kanban foi adotado"**
O capítulo declara "Kanban foi adotado" e "não exige sprints fixas". `docs/sprints/README.md` registra 31 sprints numeradas com períodos fixos, escopo pré-definido e estrutura padronizada. `decisoes-transversais.md` §5 lista "Kanban" como termo a evitar. Decisão de substituir por "modelo iterativo incremental com ciclos semanais" não aplicada.

**2.10 — CI/CD sem o "CD"**
"GitHub Actions para lint, type-check, testes e build" — omite o deploy automático para Cloudflare Pages. O "D" de CI/CD desaparece exatamente no capítulo que define o conceito. Decidido incluir, não aplicado.

**2.7.1 — Monolito sem Fowler**
"Escala pequena" e "time de um" como única justificativa. Fowler "MonolithFirst" (2015) decidido e disponível em `referencias-final.md`. Não citado.

**2.7.2 — "significativamente" mantido**
`decisoes-transversais.md` lista o advérbio como alvo de grep para remover. Rascunho mantém "reduzindo _significativamente_ o tempo de desenvolvimento de backend" sem critério.

**2.8 — PostgreSQL como "escolha" ativa**
"PostgreSQL foi escolhido por sua robustez" — incorreto. É imposição do Supabase, não escolha livre. Apresentar como escolha ativa quando foi imposição da plataforma é desonestidade científica passível de questionamento.

**2.5 — ISO 25010 sem prioridades do SyncClass**
Tabela com 8 características sem indicação de relevância para o projeto. Decidido declarar 4 prioritárias: Segurança (multi-tenant/RLS/LGPD), Confiabilidade (sistema financeiro), Manutenibilidade (solo developer), Usabilidade (professor sem suporte de TI).

### Importantes

**2.7.2 — H2 sem baseline comparativo**
"Elimina a necessidade de API REST, reduzindo significativamente o tempo" — frase mais importante para H2, sem fonte nem critério de comparação. Nenhum estudo citado que mensure BaaS vs. REST tradicional.

**2.11 — H3 (3x=200%) vs. Peng et al. (55%) sem reconciliação**
O referencial cita 55% de ganho de produtividade. A hipótese exige 3x (200%). São métricas incomparáveis. `decisoes-escrita.md` decidiu: apenas apresentar Peng et al. no referencial; reconciliação no cap. 3. Não aplicado.

**2.9 — LGPD sem Art. 16, I**
Implementações corretas e verificáveis nas migrations, mas sem âncora legal específica.

**Parágrafo introdutório ausente**
Cap. vai direto para 2.1 sem parágrafo de abertura conectando os temas às hipóteses.

**2.6 — Engenharia de Requisitos sem conexão com projeto**
Define RF/RNF genericamente sem antecipar 31 RF implementados nem remeter ao cap. 4.

### Menores

- ISO 25010 sem indicar quais características são prioritárias para o SyncClass
- Nenhuma seção sobre o domínio de aplicação (mercado de professores autônomos)

### Perguntas da banca

1. "Kanban não exige sprints fixas" + 31 ciclos semanais numerados: como defender em 30 segundos?
2. Como a banca avalia H2 sem baseline de comparação BaaS vs. REST?
3. Por que a decisão arquitetural mais importante (monolito) não tem referência teórica?
4. Peng et al. (55%) e H3 (3x=200%): são métricas comparáveis?

---

## Cap. 3 — Metodologia

### Críticos (bloqueiam entrega)

**3.1 — Pesquisa-ação sem critério do ciclo reflexivo**
"O pesquisador é o próprio desenvolvedor" não define pesquisa-ação. Pesquisa-ação (Thiollent, 2011; Tripp, 2005) exige ciclo planejamento→ação→observação→reflexão. O capítulo não mostra esse ciclo. Implementado em `capitulos-final/capitulo3-final.md` — mas não no rascunho canônico.

**3.3.2 — H3 sem protocolo de medição**
H3 afirma "IA aumenta produtividade ≥3x". Para ser verificável, cap. 3 precisa descrever como esse ganho foi medido: unidade, linha de base, instrumento de coleta. As estimativas do cap. 8 ("levaria 2 dias, com IA levou 4 horas") aparecem sem protocolo definido aqui. Sem isso, H3 é opinião, não resultado.

**Cap. 3 inteiro — ausência de instrumento de coleta**
Pesquisa quantitativa (declarada em 3.1) exige instrumento de coleta definido aqui. O capítulo está silente sobre quais dados foram coletados, como e quando. Commits semânticos + estimativas retroativas não declarados como instrumento.

**"Kiro IDE" ainda presente**
Kiro IDE tem documentação oficial citável? Se não, referência ao produto pelo nome é problemática numa banca. Decidido remover/substituir.

**"Sem sprints fixas" contradiz 31 sprints documentadas**
`docs/sprints/README.md` registra 31 sprints com períodos fixos. Declaração factualmente errada.

### Importantes

**3.2 — Kanban sem referência teórica**
Cap. 2.4 cita Anderson (2010). Cap. 3 não. Por que Kanban em vez de Scrum/XP para projeto solo com prazo fixo?

**Contradição factual: "~3 meses" vs. "4,5 meses"**
H1 diz "~3 meses". Cap. 8 documenta "4,5 meses". O cap. 3 precisa ancorar o período real.

**3.3.3 — Duplicação literal com cap. 8.4.3**
Os 4 bullets de "O que a IA não fez" são idênticos nos dois capítulos sem propósito argumentativo diferente.

### Perguntas da banca

1. A pesquisa-ação foi escolhida por critério formal ou nomeada post hoc para o que aconteceu?
2. Qual é o protocolo de medição de H3? Unidade, período, linha de base?
3. H1 diz 3 meses, o projeto durou 4,5 — como o cap. 10 vai tratar isso?
4. Kanban foi escolha deliberada ou denominação aplicada depois?

---

## Cap. 4 — Engenharia de Requisitos

### Críticos (bloqueiam entrega)

**Ausência de seção de elicitação**
Não há descrição de como os requisitos foram levantados. Engenharia de requisitos não é só listar — é documentar o método. Decidido: entrevistas + análise de mercado. Não aplicado.

**4.7 — Inconsistência interna grave**
Resumo do arquivo: "30 implementados". Seção 4.7 texto: "31 implementados, 4 planejados". Tabela usa contagens incompatíveis. Três números para RF implementados no mesmo capítulo. Decidido: 31 (`decisoes-transversais.md`). Não aplicado.

**Apêndice A referenciado mas inexistente**
Formulário com professores não foi realizado. Frase precisa ser removida ou cumprida.

**RF34 — contradição estrutural**
RF34 na tabela "Não Implementados" mas marcado como implementado (Sprint 30). Dois estados incompatíveis no mesmo capítulo.

**4.4.9 a 4.4.11 — Regras de negócio ≠ decisões técnicas**
RN-049 ("paginação obrigatória") é idêntico em substância a RNF19. RN-052 ("formulários com Zod") é decisão de tecnologia. RN-056 ("skeleton screens") é componente de UI. Decisão de mover para RNF não executada.

**UC01/UC02/UC06 sem pré/pós-condição**
Decidido incluir. 23 dos 26 UCs não têm pré-condição, pós-condição, fluxo alternativo. "UC01: Cadastrar aluno" não é um caso de uso.

**Matriz de rastreabilidade — ~40% de cobertura**
RF05, RF07-09, RF14-16, RF18-19, RF22-28 ausentes. 15 de 31 RF ausentes. Decidido corrigir.

### Importantes

**RN-025 — Vencimento calculado no frontend**
Regra de negócio sem constraint no banco: qualquer cliente pode inserir `due_date` arbitrário. Trade-off real, não declarado.

**RN-032 — Status "atrasada" não persistido**
Status calculado no cliente via JavaScript, não salvo no banco. Divergência possível por fuso ou horário. Não declarado.

**RF31-33/RF35 como "planejados" com sprints específicas**
Sprints 14, 15, 16, 18 nunca foram executadas. Projeto está no Sprint 31. Pertencem aos trabalhos futuros do cap. 10.

**Sommerville/Pressman ausentes do texto**
Aparecem no planejamento mas não no rascunho.

**"100% RNF implementados" sem critério de verificação**
RNF06 (< 2s) sem teste de carga.

### Perguntas da banca

1. Como os requisitos foram elicitados? O processo está no cap. 3?
2. UC06 (confirmar pagamento): o que acontece quando o comprovante é rejeitado e o aluno não reenvia?
3. Diferença entre RN-049 e RNF19: qual é?
4. A cobertura de 75% (cap. 4.7) foi medida com qual ferramenta?

---

## Cap. 5 — Arquitetura e Modelagem

### Críticos (bloqueiam entrega)

**5.1.2 — "~60% de redução" como bullet sem fundamentação**
A afirmação mais importante para H2 está num bullet sem metodologia, sem base de comparação, sem citação. Literatura BaaS — Mell e Grance (NIST, 2011) + Supabase docs — decidida, não aplicada. A banca vai perguntar: "como chegou a 60 e não a 40 ou 80?"

**5.3.1 — Tabela errada: 9 listadas, 10 no texto, 11 no banco**
Resumo diz "10 tabelas"; tabela lista 9; `01_structure.sql` tem `RAISE NOTICE 'Tabelas: 11'`. `user_roles` (base do controle de acesso por roles) e `performance_logs` ausentes. Decidido incluir com papel arquitetural explicado.

**5.4 — RLS sem o mecanismo central `is_admin()` com SECURITY DEFINER**
"40+ policies" é vago (contagem real: ~54 ativas). `is_admin()`, `is_teacher()`, `is_student()` com `SECURITY DEFINER SET search_path = public, pg_temp` não mencionados em nenhum momento. Se a banca perguntar "o que impede um professor de executar `SELECT * FROM students` diretamente?", o capítulo não responde.

**5.3 — DER ausente**
Marcado como pendente no próprio corpo do capítulo: `🖼️ Figura: DER completo — gerar no dbdiagram.io`. Bloqueador da 1ª rodada, permanece sem resolução.

### Importantes

**5.1.1 — Monolito sem Fowler**
Justificativa por senso comum ("escala pequena", "time de um"). Fowler "MonolithFirst" (2015) decidido, não citado.

**5.1.2 — Nenhuma alternativa avaliada e descartada**
Por que não Firebase? Por que não PocketBase? H2 pressupõe comparação implícita com "APIs REST tradicionais" sem critério declarado. Firebase: NoSQL, sem RLS nativo. PocketBase: menor maturidade. Decisão registrada, não aplicada.

**Argumento central inexistente**
Cap. começa direto em §5.1 sem parágrafo de abertura conectando as decisões a H2 explicitamente.

**5.3.3 — `uuid_generate_v4()` vs. `gen_random_uuid()`**
Texto cita só a função antiga. Migrations mais recentes usam `gen_random_uuid()` (built-in PostgreSQL 13+, sem extensão). Evolução não declarada.

**5.5 — Rotas de frontend no capítulo de arquitetura**
Pertence mais naturalmente ao cap. 6.

### Menores

- Edge Functions: tabela não menciona Deno como runtime

### Perguntas da banca

1. Existe algum dado que sustente o percentual de 60% de redução de esforço?
2. `user_roles` e `profiles` coexistem com campos de role — qual é a diferença entre eles?
3. "O que impede um professor de executar query diretamente no banco?" — onde no cap. 5 está a resposta?
4. O DER tem prazo definido para geração?

---

## Cap. 6 — Implementação

### Críticos (bloqueiam entrega)

**6.5 — Tabela de métricas contradiz outros capítulos**

| Métrica     | Cap. 6                | Cap. 8                 | Cap. 10    |
| ----------- | --------------------- | ---------------------- | ---------- |
| Commits     | "60+"                 | "~147"                 | "147"      |
| Hooks       | 38 (§6.2) / 34 (§6.5) | "34"                   | —          |
| Componentes | "~184"                | —                      | —          |
| Período     | "~4 meses (jan-mai)"  | "~4,5 meses (jan-jun)" | "~4 meses" |

Commits "60+" contra "147" é contradição de 2,5x. Hooks com 3 valores diferentes no mesmo capítulo. Canônico: 37 (`decisoes-transversais.md`).

**H1/H2/H3 ausentes do capítulo inteiro**
Este é o capítulo da implementação real. As hipóteses deveriam encontrar evidência empírica aqui. Seção 6.6 "Evidências das Hipóteses" decidida em `decisoes-escrita.md` não foi criada.

**Arquivos TypeScript — 359 vs. canônico 305**
Critério de contagem não declarado (359 inclui `.d.ts` e testes). Decidido: 305.

**~55.000 linhas sem método de contagem**
Não declara se inclui `types.ts` gerado automaticamente.

### Importantes

**6.4 — Módulos como feature list**
4-5 bullets por módulo, sem decisão técnica, sem desafio, sem trade-off. Decidido: problema → solução por módulo.

**6.2 — Refatorações sem contexto do problema**
Sprint 8 corrigiu chamadas diretas do Supabase em componentes. Qual problema isso causou antes? Sem o problema, a solução perde significado acadêmico.

**Exemplo de hook com `.is("deleted_at", null)`**
Projeto usa `is_deleted`, não `deleted_at`. Exemplo incorreto.

**Idempotência via `idempotency_keys` enterrada num bullet**
Único detalhe técnico não-trivial de qualquer seção de módulo. Merecia um parágrafo com contexto.

### Menores

- Resumo diz "181 componentes", árvore de pastas diz "~184" — escolhe um
- "100% das strings UI centralizadas" — assertiva sem referência à sprint/auditoria

### Perguntas da banca

1. Removendo o cap. 8, o cap. 6 sustenta H1 e H3 por si só?
2. Qual é o número correto de commits: 60+ ou 147?
3. A decisão de não mencionar IA foi deliberada ou omissão?
4. Os módulos vão receber ao menos um parágrafo de decisão técnica?

---

## Cap. 7 — Qualidade e Testes

### Críticos (bloqueiam entrega)

**7.4 — Número do QA Sprint 28 incorreto e contraditório**
Capítulo declara "104 itens aprovados" — estado parcial da execução. `validacao-sprints.md` registra Sprint 28 com **116 itens** concluídos. Contradição interna: abertura diz "116 itens", parágrafo seguinte diz "104 aprovados". Número definitivo aprovado após correções das Sprints 29-31 ausente. `decisoes-escrita.md` determinava escrever cap. 7 final **após** conclusão da Sprint 28.

**7.5 — ISO 25010 sem metodologia e sem declaração de viés**
Parágrafo introdutório não declara método de avaliação nem que o avaliador é o próprio desenvolvedor. `decisoes-escrita.md` exige: checklist interno rastreado por sprint + "avaliação do próprio desenvolvedor sujeita a viés". Tabela apresenta julgamentos ("Alta", "Média") sem escala definida.

**7.3 — E2E como "justificativa", não limitação; Playwright não nomeado**
Seção 7.1 trata E2E como "trabalho futuro após estabilização". Seção 7.3 usa argumento "CI/CD adicional" — refutável porque Playwright roda localmente sem CI. Playwright não é nomeado em nenhum momento. `decisoes-escrita.md` exige enquadrar como limitação honesta.

**7.2 — 304 testes ausentes do texto**
`decisoes-transversais.md` §3 registra 304 como valor canônico. Capítulo menciona apenas "28 arquivos de teste". Arquivos ≠ casos de teste.

**7.5 — Manutenibilidade "Média" com resolução documentada**
Capítulo apresenta causa (arquivos grandes, Sprints 8-9) e resolução (refatoração, Sprints 10-12), mas mantém nota "Média". Inconsistência lógica: se o problema foi resolvido, qual é a justificativa atual? `decisoes-escrita.md` decidiu: rever para "Alta" ou justificar manutenção — nenhuma opção executada.

### Importantes

**7.1 — Pirâmide sem citação**
Mike Cohn (2009) ou Fowler são referências canônicas. Decidido citar.

**Sprint 24 (RLS Full Audit) ausente de "Segurança: Alta"**
Tabela lista "RLS, JWT, rate limiting, sanitização, LGPD" sem referenciar auditoria Sprint 24 (6/6 itens, 0 gaps — conforme `validacao-sprints.md`). "RLS implementado" ≠ "RLS auditado com 0 gaps".

**Testes de integração: ausência não declarada**
Para sistema com RPCs, RLS policies, triggers e Edge Functions, ausência de testes de integração automatizados não é mencionada em nenhum momento. Decidido declarar explicitamente.

### Menores

- Cabeçalho do arquivo ainda contém tabela de planejamento e seção "Assets Pendentes" — não pertencem ao texto final
- "Ver `docs/sprints/sprint-28-testes-manuais.md`" (linha 140): referência a arquivo interno, não citação acadêmica
- Responsividade mobile: dispositivos listados sem método (emulador/físico/BrowserStack)

### Perguntas da banca

1. Número definitivo do QA Sprint 28: 116 itens totais — quantos aprovados ao final?
2. Método ISO 25010: quem avaliou e com qual critério? O viés do desenvolvedor está declarado?
3. Manutenibilidade "Média": qual métrica objetiva hoje (após Sprints 10-12) sustenta essa nota?
4. Por que nenhum teste E2E foi executado sequer localmente para um fluxo crítico?

---

## Cap. 8 — Gestão do Projeto

### Críticos (bloqueiam entrega)

**8.4.4 — Estimativas de produtividade sem base declarada**
"Tarefa manual levaria 2 dias" em parêntese de bullet. `decisoes-escrita.md` exige prosa formal declarando "estimativa retrospectiva do desenvolvedor". "Equipe de 2-3 pessoas em 8-10 meses" — fonte: nenhuma. Decidido remover. Não aplicado.

**8.3 — Gap de histórico git escondido em meia frase**
"Inferência do período posterior" em meia frase. O artefato interno registra "~33 commits perdidos em Março/2026". O cap. 8 afirma "rastreabilidade com precisão de dia" — que é falsa para março. Decidido: não mencionar o gap (`decisoes-escrita.md` cap 8).

**8.1 — Kanban "de forma orgânica"**
Não é justificativa metodológica para TCC. Sem referência a Anderson (2010). Cap. 3 trata o mesmo tema sem base — cap. 8 repete sem melhorar.

**R08 ainda "✅ Resolvido"**
`logger.ts` é no-op em produção (`if (import.meta.env.DEV)`). Decidido reclassificar para "Aceito". Não aplicado.

### Importantes

**Inconsistência H1: 3/4/4,5 meses**
Cap. 8 diz "4,5 meses". Cap. 10 diz "4 meses". Cap. 1 diz "3 meses". O cap. 8 não discute a divergência.

**8.4.2 — "10x mais rápido" solto**
Declarado sem exemplo específico. Os exemplos das Sprints 9, 10, 14 no §8.4.4 são rastreáveis. O "10x" em §8.4.2 não é.

**8.5 — Tabela de riscos: prospectiva ou retrospectiva?**
R01 (perda de histórico) com probabilidade "Alta" — identificado antes ou depois de acontecer?

**Anderson (2010) citado sem justificativa**
Anderson descreve Kanban. Conexão com "ciclos semanais" não articulada.

**Docs de sprint como "fonte independente"**
Foram escritos retroativamente pelo mesmo autor — não são fontes independentes.

**H3 — seção 8.4 não remete ao cap. 3**
Seção usa estimativas sem referenciar o protocolo de medição do cap. 3.

### Menores

- Gantt retroativo ainda pendente — sem ele a seção 8.3 não tem visualização
- "Kiro IDE / CLI" sem frase de contexto para banca que não conhece a ferramenta

### Perguntas da banca

1. Base das estimativas de tempo "manual" (2 dias, 3 dias): qual é?
2. A tabela de riscos foi construída antes, durante ou após o projeto?
3. H3 seção 8.4 usa estimativas sem protocolo — o cap. 3 define esse protocolo. Onde está a remissão?
4. R08 "Monitoramento: Resolvido" — `logger.ts` desabilitado em produção: como isso é "resolvido"?

---

## Cap. 9 — Infraestrutura e Deploy

> **Nota:** cap. 9 avançou entre as rodadas — contradição VPS × cap. 10 resolvida, tabelas precisas, pipeline fiel ao `ci.yml`. Das 8 decisões de `decisoes-escrita.md`, 2 aplicadas (migrations = 70; VPS resolvido). 6 restantes ausentes.

### Críticos (bloqueiam entrega)

**9.1 — "Sem servidor próprio" sem justificativa**
A decisão mais importante de infraestrutura apresentada como fato neutro. Critérios decididos — redução de complexidade operacional, custo zero no tier gratuito, adequação a MVP solo, Mell e Grance (NIST, 2011) — ausentes do texto.

**Capítulo inteiro — H2 sem remissão**
"H2" não aparece nenhuma vez. `decisoes-escrita.md` decidiu inserir parágrafo: "a análise quantitativa de H2 é apresentada no cap. 10; este capítulo evidencia as superfícies de backend eliminadas pelo Supabase." Não foi escrito.

**9.4.1 — Testes CI com credenciais falsas não declarados**
`ci.yml` linhas 37-38: `VITE_SUPABASE_URL: https://fake-project.supabase.co`. Texto lista `npm run test` como verificação de qualidade sem declarar que nenhum teste de integração real com Supabase executa no CI.

**9.2 — Cloudflare Pages sem critério vs. alternativas**
"CDN global" não diferencia de Vercel/Netlify. Critério decidido — tier gratuito sem cold start + Workers integrado — não incorporado.

**9.5 — "40+ policies" desatualizado**
`decisoes-escrita.md` decidiu corrigir para ~54. Cap. 10 usa "54 policies" — contradição interna entre caps. Número defensável exige `SELECT count(*) FROM pg_policies` ou contagem via migrations.

### Importantes

**9.3.2 — Edge Functions sem critério de separação vs. RPC PostgreSQL**
9 funções listadas sem explicar o princípio. Critério decidido: API externa + `service_role` não exposto → Edge Function; operações internas → RPC PostgreSQL.

**CI — testes com credenciais fake**
`.github/workflows/ci.yml` usa `fake-project.supabase.co`. Nenhum teste de integração real roda no pipeline. Banca pode inferir cobertura que não existe.

### Perguntas da banca

1. Os 304 testes do CI rodam contra banco real ou credenciais falsas?
2. Por que Cloudflare Pages e não Vercel? O capítulo responde?
3. H2 é a hipótese central — por que o cap. de infraestrutura não a menciona?
4. "40+" ou "54" policies — qual número o autor defende e como verifica?

---

## Cap. 10 — Conclusão

### Críticos (bloqueiam entrega)

**10.2 — H1: hipótese reformulada para confirmar**
Cap. 1 diz "3 meses". Cap. 10 reescreve para "4 meses" antes de confirmar. Isso é mover o alvo depois de saber onde a flecha caiu. A resposta honesta: "H1 foi confirmada com ressalva — prazo estimado 3 meses, prazo real 4-4,5 meses; viabilidade de desenvolvedor solo demonstrada, estimativa subestimada."

**10.2 — H2: "Estima-se 60 a 70%"**
"Estima-se" é verbo de fuga científica. Nenhum capítulo anterior apresenta o método dessa estimativa. Decidido: substituir por enumeração de superfícies BaaS + Mell e Grance (2011). Não aplicado.

**10.2 — H3: exemplos não correspondem ao enunciado**
H3 diz "scaffolding, migrações e auditoria". Exemplos usados (Sprint 9, 10, 14) são refatoração e centralização de strings — nenhum é scaffolding, nenhum é migração SQL isolada. Decidido: Sprint 1-2 (scaffolding), Sprint 9 (migrations), Sprint 24 (auditoria). Não aplicado.

### Importantes

**10.3 — Limitações não amarram às hipóteses**
Gap de histórico git (a mais grave) recebe uma linha. Ausência de teste de carga invalida RNF06 (< 2s)? Deve aparecer como ressalva explícita.

**10.4 — "Gateway de pagamento real" como trabalho futuro**
AbacatePay foi implementado na Sprint 30. Decidido remover. Não aplicado.

**"Período: janeiro a maio de 2026"**
Sprint 31 terminou em 3 de junho. Intervalo incompleto.

**"Ganho médio 3 a 5x" — origem incerta**
Média dos 3 exemplos citados seria ~9x. De onde vem 3–5x?

**RF32–RF35 ausentes da Tabela 10.2**
Não aparecem nos trabalhos futuros.

**§10.5 não fecha ciclo das ODS abertas no cap. 1**
Abertura menciona ODS; conclusão não retoma.

### Perguntas da banca

1. H1 era "3 meses", projeto durou 4-4,5. H1 foi confirmada ou parcialmente confirmada?
2. Método por trás de "60 a 70%" de redução de esforço: qual é?
3. Os três exemplos de H3 (Sprint 9, 10, 14) não são scaffolding, migração ou auditoria. Há exemplos mais aderentes?
4. AbacatePay implementado na Sprint 30 aparece como trabalho futuro. Por quê?

---

## Checklist de Correções Prioritárias

### Antes de qualquer entrega (bloqueadores)

- [x] Sincronizar prazo: **4,5 meses** — decidido em `decisoes-transversais.md`
- [x] ~~Migrations 70 → 72~~ **ERRO DO REVISOR** — contagem real é 70 (gaps em 48/49); docs corretos
- [x] Contradição deploy cap. 9 × cap. 10 — decidido: Cloudflare Pages only, sem VPS
- [x] Remover AbacatePay de "trabalhos futuros" cap. 10 — decidido
- [x] RF implementados: **31** — decidido em `decisoes-transversais.md`
- [x] Commits: usar **152** (branch main) — decidido em `decisoes-transversais.md`
- [x] Gap de commits: não mencionar — decidido em `decisoes-escrita.md` cap 8
- [x] Nomes antigos ("edu-core-zen", "English School") — **corrigidos em 03/06/2026**
- [ ] DER: gerar e inserir no cap. 5 — **pendente (ação manual)**
- [ ] Sprint 28: verificar número final real. `validacao-sprints.md` registra **116 itens** — usar esse número no cap. 7 (não 104 parcial)
- [ ] `docs/sprints/README.md`: atualizar Sprint 28 para ✅ Concluída

### Alta prioridade (comprometem defesa)

- [x] H2: limiar "≥60%" no enunciado — decidido (`decisoes-transversais.md` §4 H2)
- [x] H2: método da estimativa — decidido: superfícies BaaS + Mell e Grance (`decisoes-escrita.md` cap 5/10)
- [x] H3: protocolo de medição cap. 3 — **implementado** em `capitulos-final/capitulo3-final.md`
- [x] H3: exemplos cap. 10 — decidido: Sprint 1-2 (scaffolding), Sprint 9 (migrations), Sprint 24 (auditoria)
- [x] Kanban vs. sprints — decidido: "modelo iterativo incremental com ciclos semanais"
- [x] Cap. 4: elicitação de requisitos — decidido: entrevistas + análise de mercado
- [x] Cap. 5: tabelas 10→11 — decidido: incluir `user_roles` + `performance_logs`
- [x] Cap. 6: conectar hipóteses — decidido: seção 6.6 "Evidências das Hipóteses"
- [x] Cap. 7: 304 testes, integração ausente, Sprint 24 — decidido
- [x] Cap. 8: base das estimativas — decidido: "estimativa retrospectiva do desenvolvedor"
- [x] Cap. 9: justificativa Cloudflare Pages — decidido: CDN + sem cold start + Workers
- [x] Cap. 10: H1 — decidido: confirmar 4,5 meses sem mencionar estimativa inicial
- [ ] **Aplicar todas as decisões acima aos rascunhos `cap*.md`** — nenhuma foi incorporada ao texto

### Média prioridade (fortalecem o argumento)

- [x] Cap. 1: fontes de mercado — decidido: IBGE (2022) + CIEB (2024)
- [x] Cap. 1: parágrafo introdutório — decidido
- [x] Cap. 2: Fowler "Monolith First" — decidido
- [x] Cap. 2: reconciliar Peng et al. / H3 — decidido: escopo diferente
- [x] Cap. 3: Thiollent/Tripp — **implementado** em `capitulos-final/capitulo3-final.md`
- [x] Cap. 4: matriz de rastreabilidade — decidido
- [x] Cap. 4: RF31-33/RF35 → trabalhos futuros — decidido
- [x] Cap. 5: separação `user_roles`/`profiles` — decidido
- [x] Cap. 6: decisão técnica por módulo — decidido
- [x] Cap. 7: Cohn (2009) pirâmide de testes — decidido
- [x] Cap. 7: Manutenibilidade — decidido: rever para "Alta" após Sprints 8-9
- [x] Cap. 8: R08 "Resolvido" → "Aceito" — decidido
- [x] Cap. 10: remover "2-3 pessoas em 8-10 meses" — decidido
