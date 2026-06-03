# Revisão de Orientador — TCC SyncClass

**Data:** 03/06/2026  
**Método:** 10 agents tcc-orientador em paralelo, um por capítulo
**Escopo dos arquivos:** `docs/tcc/capitulos/cap*.md` (rascunhos). Não cobertos: `docs/tcc/capitulo1-final.md` e `capitulo2-final.md` (versões finalizadas de caps 1 e 2 — revisar separadamente).  
**Postura:** orientador severo — perguntas duras, sem suavização  
**Escopo:** argumento, evidência, coesão, estrutura, aderência ao SyncClass  
**Fora do escopo:** normas mecânicas (vírgulas, formatação Word)

---

## Problemas Transversais (atravessam múltiplos capítulos)

| Problema                                                                                         | Capítulos afetados |
| ------------------------------------------------------------------------------------------------ | ------------------ |
| Prazo: 3 meses (H1) vs. 4 meses (cap10) vs. 4,5 meses (cap8)                                     | 1, 6, 7, 8, 10     |
| Migrations: docs dizem 70 (correto — filesystem tem 70 arquivos, max nº é 72 mas 48/49 ausentes) | verificado ✅      |
| Kanban declarado, mas projeto tem 31 sprints com time-boxes                                      | 2, 3, 8            |
| Método de estimativa H3 ("3x") nunca declarado                                                   | 1, 3, 8, 10        |
| H2 "60%" sem baseline comparativo nem método                                                     | 2, 5, 9, 10        |
| Commits: cap6 diz "60+", caps 8/10 dizem "147"                                                   | 6, 8, 10           |
| DER ausente — marcado como pendente no próprio arquivo                                           | 5                  |
| QA Sprint 28 (116 itens) invisível no cap7 — resumido em 4 bullets                               | 7                  |
| Deploy automatizado (cap9) vs. "VPS ainda manual" (cap10)                                        | 9, 10              |
| AbacatePay implementado na Sprint 30 mas listado como trabalho futuro                            | 4, 10              |

---

## Cap. 1 — Introdução

### Críticos (bloqueiam entrega)

**H1 — Contradição de prazo**
H1 diz "~3 meses". Cap. 8 diz "4,5 meses". Cap. 10 diz "~4 meses". Cap. 7 ainda repete "3 meses". Três valores para a mesma grandeza. A banca usa o enunciado da hipótese como critério de julgamento.

**H2 — "Significativamente" sem limiar**
H2 diz "reduz significativamente o tempo de desenvolvimento". Cap. 10 usa "60 a 70%" para confirmá-la — mas esse número não está na hipótese. Hipótese sem limiar é confirmável por qualquer resultado positivo. O CLAUDE.md interno já registra "≥60%" — colocar isso em H2.

**1.1 — Afirmações de mercado sem fonte**
"Mercado composto majoritariamente por professores autônomos", "plataformas especializadas são escassas ou inacessíveis" — afirmações factuais sobre o mercado brasileiro sem nenhuma citação (IBGE, ABRALIN, pesquisa setorial). A banca vai questionar.

**1.3 — Pilar LGPD sem artigo de lei**
"Necessidade de conformidade com a LGPD" sem citar qual artigo se aplica ao professor autônomo como controlador de dados. Os comentários das migrations já citam "Art. 16, I" — usar isso.

### Importantes

**H3 — "3x" sem definição de unidade**
Multiplicador sem definição do que é medido (tempo? linhas? artefatos?). Cap. 8 usa estimativas retroativas de tempo — honesto, mas precisa aparecer como limitação metodológica aqui ou no cap. 3.

**1.4.1 — Objetivo geral descreve produto, não pesquisa**
H2 e H3 são sobre o processo de desenvolvimento. O objetivo geral menciona só o artefato. Banca pode perguntar: "qual é o objetivo de pesquisa do TCC?"

**Ausência de parágrafo introdutório**
Cap. começa direto em 1.1. ABNT exige parágrafo de abertura antes da primeira subseção.

### Perguntas da banca

1. 3, 4 ou 4,5 meses? Qual é o número real e como sincroniza todos os capítulos?
2. Por que H2 não tem limiar se o cap. 10 usa "60-70%"?
3. Qual fonte sustenta a caracterização do mercado de idiomas no Brasil?
4. Qual é o objetivo de _pesquisa_ do TCC — não o produto?

---

## Cap. 2 — Referencial Teórico

### Críticos (bloqueiam entrega)

**2.4 — Kanban vs. 31 sprints com time-boxes**
O capítulo declara "Kanban foi adotado". O `docs/sprints/README.md` registra 31 sprints numeradas com períodos fixos, escopo pré-definido e estrutura padronizada. Isso é iterativo-incremental ou Scrum-like — não Kanban. Kanban não tem sprints. A banca vai apontar imediatamente. Contradição existe também nos caps. 3 e 8.

**2.10 — CI/CD descrito sem o CD**
"GitHub Actions para lint, type-check, testes e build" — omite o deploy automático para Cloudflare Pages. O "CD" de CI/CD não está descrito num capítulo que define exatamente esse conceito.

### Importantes

**2.7.2 — H2 sem baseline comparativo**
"Elimina a necessidade de API REST, reduzindo _significativamente_ o tempo" — frase mais importante para H2, sem fonte nem critério de comparação. Nenhum estudo citado que mensure BaaS vs. REST tradicional.

**2.7.1 — Monolito com justificativa circular**
"Escolhemos monolito porque o projeto é pequeno" não é argumento técnico. Fowler "Monolith First" sustenta a escolha — por que não está citado?

**2.11 — H3 (3x=200%) vs. Peng et al. (55%) sem reconciliação**
O referencial cita 55% de ganho de produtividade. A hipótese exige 3x (200%). São métricas incomparáveis. Sem reconciliação, o próprio referencial não sustenta a hipótese central.

### Menores

- ISO 25010 sem indicar quais características são prioritárias para o SyncClass
- PostgreSQL: "escolhido por robustez" — na verdade foi imposição do Supabase, não escolha livre
- LGPD: implementações corretas (confirmado nas migrations), mas falta citar artigo da lei para cada medida
- Nenhuma seção sobre o domínio de aplicação (mercado de professores autônomos)

### Perguntas da banca

1. O capítulo não argumenta — enuncia. Qual é a tese do referencial?
2. Como a banca avalia H2 sem baseline de comparação BaaS vs. REST?
3. Se há 31 sprints com time-boxes, por que o método é declarado Kanban?
4. Peng et al. (55%) e H3 (3x=200%): são métricas comparáveis?

---

## Cap. 3 — Metodologia

### Críticos (bloqueiam entrega)

**3.1 — Pesquisa-ação sem critério do ciclo reflexivo**
"O pesquisador é o próprio desenvolvedor" não define pesquisa-ação. Pesquisa-ação (Thiollent, 2011; Tripp, 2005) exige ciclo planejamento→ação→observação→reflexão. O capítulo não mostra esse ciclo em nenhum momento.

**3.3.2 — H3 sem protocolo de medição**
H3 afirma "IA aumenta produtividade ≥3x". Para ser verificável, cap. 3 precisa descrever como esse ganho foi medido: unidade, linha de base, instrumento de coleta. As estimativas do cap. 8 ("levaria 2 dias, com IA levou 4 horas") aparecem sem protocolo definido aqui. Sem isso, H3 é opinião, não resultado.

**Cap. 3 inteiro — ausência de instrumento de coleta**
Pesquisa quantitativa (declarada em 3.1) exige instrumento de coleta definido aqui. O capítulo está silente sobre quais dados foram coletados, como e quando.

### Importantes

**3.2 — Kanban sem referência teórica**
Cap. 2.4 cita Anderson (2010). Cap. 3 não. Por que Kanban em vez de Scrum/XP para projeto solo com prazo fixo?

**Contradição factual: "~3 meses" vs. "4,5 meses"**
H1 diz "~3 meses". Cap. 8 documenta "4,5 meses". O cap. 3 precisa ancorar o período real; o cap. 10 precisa tratar a divergência explicitamente.

**3.3.3 — Duplicação literal com cap. 8.4.3**
Os 4 bullets de "O que a IA não fez" são idênticos nos dois capítulos sem propósito argumentativo diferente.

**3.3.1 — "Claude via Kiro IDE"**
Kiro IDE tem documentação oficial citável? Se não, referência ao produto pelo nome é problemática numa banca.

### Perguntas da banca

1. A pesquisa-ação foi escolhida por critério formal ou nomeada post hoc para o que aconteceu?
2. Qual é o protocolo de medição de H3? Unidade, período, linha de base?
3. H1 diz 3 meses, o projeto durou 4,5 — como o cap. 10 vai tratar isso?
4. Kanban foi escolha deliberada ou denominação aplicada depois?

---

## Cap. 4 — Engenharia de Requisitos

### Críticos (bloqueiam entrega)

**Ausência de seção de elicitação**
Não há descrição de como os requisitos foram levantados. Engenharia de requisitos não é só listar — é documentar o método. Por que esses 35 RF e não outros?

**4.7 — Inconsistência interna grave**
Resumo do arquivo: "30 implementados". Seção 4.7 texto: "31 implementados, 4 planejados". Tabela da mesma seção usa contagens incompatíveis. Três números para RF implementados no mesmo capítulo.

**4.4.9 a 4.4.11 — Regras de negócio ≠ decisões técnicas**
RN-049 ("paginação obrigatória") é idêntico em substância a RNF19. RN-052 ("formulários com Zod") é decisão de tecnologia. RN-056 ("skeleton screens") é componente de UI. Não são regras de negócio.

### Importantes

**RN-025 — Vencimento calculado no frontend**
Regra de negócio sem constraint no banco: qualquer cliente que acesse a API pode inserir `due_date` arbitrário. Trade-off real, não declarado.

**RN-032 — Status "atrasada" não persistido**
Status calculado no cliente via JavaScript, não salvo no banco. Divergência possível por fuso ou horário de acesso. Não declarado.

**4.5.2 — Casos de uso são títulos, não UCs**
23 dos 26 UCs não têm pré-condição, pós-condição, fluxo alternativo. "UC01: Cadastrar aluno" não é um caso de uso.

**4.6 — Matriz de rastreabilidade cobre ~40% dos requisitos**
RF05, RF07-09, RF14-16, RF18-19, RF22-28 ausentes da matriz.

**RF31-33/RF35 como "planejados" com sprints específicas**
Sprints 14, 15, 16, 18 nunca foram executadas. Projeto está no Sprint 31. Pertencem aos trabalhos futuros do cap. 10.

### Perguntas da banca

1. Como os requisitos foram elicitados? O processo está no cap. 3?
2. UC06 (confirmar pagamento): o que acontece quando o comprovante é rejeitado e o aluno não reenvia?
3. Diferença entre RN-049 e RNF19: qual é?
4. A cobertura de 75% (cap. 4.7) foi medida com qual ferramenta?

---

## Cap. 5 — Arquitetura e Modelagem

### Críticos (bloqueiam entrega)

**5.1.2 — "~60% de redução" como lista não fundamentada**
A afirmação mais importante para H2 está num bullet sem metodologia, sem base de comparação, sem citação. A banca vai perguntar: "como chegou a 60 e não a 40 ou 80?"

**5.3.1 — Tabela de tabelas errada**
Capítulo diz "10 tabelas principais", lista 9. O `01_structure.sql` tem 11 tabelas: as 9 listadas + `user_roles` + `performance_logs`. `user_roles` é a base do controle de acesso por roles — ausência arquiteturalmente relevante.

**5.4 — RLS descrito sem o mecanismo central**
"40+ policies" é vago (contagem real: ~54 policies ativas). O texto descreve o que RLS faz, não como `is_admin()` com `SECURITY DEFINER` impede acesso direto ao banco. Se a banca perguntar "o que impede um professor de executar `SELECT * FROM students` diretamente?", o capítulo não responde.

**5.3 — DER ausente**
Marcado como pendente no próprio arquivo. Capítulo de Arquitetura e Modelagem sem DER é tecnicamente incompleto.

### Importantes

**5.1.1 — "Sem ganho real" para microsserviços**
Afirmação absoluta sem referência. Fowler "Monolith First" sustenta a escolha — por que não citado?

**5.1.2 — Nenhuma alternativa avaliada e descartada**
Por que não Firebase? Por que não PocketBase? H2 pressupõe comparação implícita com "APIs REST tradicionais" sem critério declarado.

**Argumento central inexistente**
O capítulo não declara qual proposição arquitetural defende. A abertura deveria conectar as decisões a H2 explicitamente.

**5.5 — Rotas de frontend no capítulo de arquitetura**
Informação de frontend num capítulo de modelagem parece acidental. Pertence mais naturalmente ao cap. 6.

### Menores

- PKs UUID: cap. 5 menciona `uuid_generate_v4()`, migrations mais recentes usam `gen_random_uuid()` — runtimes diferentes
- Edge Functions: tabela não menciona Deno como runtime
- Resumo diz "10 tabelas" — incorreto (são 11)

### Perguntas da banca

1. O referencial (cap. 2) trata BaaS e arquitetura de microsserviços? Se sim, o cap. 5 deveria referenciar.
2. Existe algum dado que sustente o percentual de 60% de redução de esforço?
3. "O que impede um professor de executar query diretamente no banco?" — onde no cap. 5 está a resposta?
4. O DER e o diagrama de arquitetura têm prazo definido para serem gerados?

---

## Cap. 6 — Implementação

### Críticos (bloqueiam entrega)

**6.5 — Tabela de métricas contradiz outros capítulos**

| Métrica     | Cap. 6               | Cap. 8                 | Cap. 10    |
| ----------- | -------------------- | ---------------------- | ---------- |
| Commits     | "60+"                | "~147"                 | "147"      |
| Hooks       | "45 arquivos"        | "34"                   | —          |
| Componentes | "~184"               | —                      | —          |
| Período     | "~4 meses (jan-mai)" | "~4,5 meses (jan-jun)" | "~4 meses" |

Commits "60+" contra "147" é contradição de 2,5x.

**H1/H2/H3 ausentes do capítulo inteiro**
Este é o capítulo da implementação real. As hipóteses deveriam encontrar evidência empírica aqui. H1, H2, H3 não são mencionadas nenhuma vez. IA não aparece no capítulo.

**H1 — contradição de prazo não explicada**
Cap. 6 diz "~4 meses". H1 diz "3 meses". O cap. 10 ajusta silenciosamente sem explicar o desvio.

### Importantes

**6.4 — Módulos como feature list**
4-5 bullets por módulo, sem decisão técnica, sem desafio, sem trade-off. "Qual foi o principal desafio do módulo financeiro?" — o capítulo não responde.

**6.1 — Stack sem alternativas descartadas**
"A stack foi escolhida priorizando Produtividade, Tipagem, Qualidade" — intenções, não critérios. Por que Supabase e não Firebase? Por que shadcn/ui e não Material UI?

**6.2 — Refatorações sem contexto do problema**
Sprint 8 corrigiu chamadas diretas do Supabase em componentes. Qual problema isso causou antes? Sem o problema, a solução perde significado acadêmico.

**Idempotência via `idempotency_keys` enterrada num bullet**
Único detalhe técnico não-trivial de qualquer seção de módulo. Merecia um parágrafo com contexto.

### Menores

- Resumo diz "181 componentes", árvore de pastas diz "~184" — escolhe um
- Design tokens: snippets mostram _o quê_, não _por quê_
- "100% das strings UI centralizadas" — assertiva sem referência à auditoria do cap. 15

### Perguntas da banca

1. Removendo o cap. 8, o cap. 6 sustenta H1 e H3 por si só?
2. Qual é o número correto de commits: 60+ ou 147?
3. A decisão de não mencionar IA foi deliberada ou omissão?
4. Os módulos vão receber ao menos um parágrafo de decisão técnica?

---

## Cap. 7 — Qualidade e Testes

### Críticos (bloqueiam entrega)

**7.4 — QA manual descrito como "4 fluxos"**
A Sprint 28 é checklist estruturada com 116 itens, 20 rotas, 5 roles — o artefato existe e é substancial. O capítulo resume em 4 bullets. Além disso, `docs/sprints/README.md` ainda marca Sprint 28 como "Pendente". Se o QA foi concluído, esse status precisa ser atualizado e o resultado consolidado (X de 116 aprovados, Y corrigidos nas Sprints 29-31) precisa aparecer no capítulo.

**7.5 — ISO 25010 sem metodologia**
Não há critério declarado. Quem avaliou? Como? ISO 25010 tem sub-características (availability, fault tolerance, modularity) — nenhuma aparece. A coluna "Evidência" associa implementações a julgamentos ("Alta") sem escala. Um desenvolvedor avaliando a própria obra sem critério externo é o ponto mais fraco do capítulo.

**7.3 — Ausência de E2E: justificativa fraca**
"Prazo não comportava CI/CD adicional" não sustenta: Playwright roda localmente sem CI/CD. Falta: (a) nomear a ferramenta descartada (Playwright), (b) citar literatura sobre custo-benefício de E2E em MVPs solo, (c) reconhecer como limitação real, não decisão neutra.

### Importantes

**304 testes não aparecem no capítulo**
O texto fala em "28 arquivos" mas nunca menciona o número 304. Dado quantitativo relevante ausente.

**7.1 — Pirâmide sem citação**
Mike Cohn (2009) ou Fowler são referências canônicas. Usar diagrama conhecido sem citar é fraqueza acadêmica.

**7.5 — Manutenibilidade: Média com problema resolvido**
Se a refatoração das Sprints 8-9 resolveu os arquivos grandes, por que a avaliação final ainda é "Média"? O argumento apresenta causa e resolução mas mantém a nota anterior.

**Testes de integração: ausência não declarada**
Para sistema com RPCs, RLS policies, triggers e Edge Functions, ausência de qualquer teste de integração é gap que nem é mencionado.

### Perguntas da banca

1. O QA da Sprint 28 foi concluído? Qual é o resultado consolidado?
2. A cobertura de 75% (cap. 4.7) foi medida com qual ferramenta?
3. Por que a avaliação ISO 25010 não usou checklists ou critério externo?
4. O Sprint 24 (RLS Full Audit) sustenta "Segurança: Alta" — por que não está citado no cap. 7?

---

## Cap. 8 — Gestão do Projeto

### Críticos (bloqueiam entrega)

**8.4.4 — Estimativas de produtividade sem base declarada**
"Tarefa manual levaria 2 dias" — base: nenhuma. "Equipe de 2-3 pessoas em 8-10 meses" — fonte: nenhuma. Se é experiência própria, declara. Se é chute, retira do TCC.

**8.4.1 — Migrations SQL: 70 (filesystem: 72)**
Dado desatualizado em capítulo cuja legitimidade depende de rastreabilidade real. Mesmo erro nos caps. 9 e 10.

**8.3 — Gap de histórico git escondido em meia frase**
"Inferência do período posterior" em meia frase. O artefato interno registra "~33 commits perdidos em Março/2026". O cap. 8 afirma "rastreabilidade com precisão de dia" — que é falsa para o período de março. A banca lê o cap. 8, não o arquivo interno.

**8.1 — Kanban "de forma orgânica"**
Não é justificativa metodológica para TCC. Sem referência a Anderson (2010). Cap. 3 trata o mesmo tema sem base — cap. 8 repete sem melhorar.

### Importantes

**Inconsistência H1: 3/4/4,5 meses**
Cap. 8 diz "4,5 meses". Cap. 10 diz "4 meses". Cap. 1 diz "3 meses". O cap. 8 não discute a divergência.

**8.4.2 — "10x mais rápido" solto**
Declarado sem exemplo específico. Os exemplos das Sprints 9, 10, 14 no §8.4.4 são rastreáveis. O "10x" em §8.4.2 não é.

**8.5 — Tabela de riscos: prospectiva ou retrospectiva?**
R01 (perda de histórico) com probabilidade "Alta" — identificado antes ou depois de acontecer? R08 ("Monitoramento: Resolvido") — `logger.ts` em dev não é monitoramento de produção. Reclassificar para "Aceito".

### Menores

- Gantt retroativo ainda pendente — sem ele a seção 8.3 não tem visualização
- "Kiro IDE / CLI" sem frase de contexto para banca que não conhece a ferramenta

### Perguntas da banca

1. Base das estimativas de tempo "manual" (2 dias, 3 dias): qual é?
2. "Equipe de 2-3 pessoas em 8-10 meses": qual é a fonte desse benchmark?
3. O gap de ~33 commits vai ser declarado explicitamente ou apenas nos arquivos internos?
4. A tabela de riscos foi construída antes, durante ou após o projeto?

---

## Cap. 9 — Infraestrutura e Deploy

### Críticos (bloqueiam entrega)

**Cap. 9 × Cap. 10 — Contradição sobre deploy**
Cap. 9: "deploy totalmente automatizado via GitHub Actions → Cloudflare Pages". Cap. 10: "O deploy final para VPS ainda é manual." Não existe VPS no projeto. A banca detecta em leitura linear.

**H2 completamente ausente do cap. 9**
Este é o capítulo onde H2 deveria ter evidência (Supabase eliminou X horas de backend). A análise foi deixada inteiramente para o cap. 10 sem nenhuma remissão explícita.

**9.1 — Migrations: 70 (filesystem: 72)**
Mesmo erro do cap. 8.

**9.1 — "Sem servidor próprio" sem justificativa**
A decisão mais importante de infraestrutura apresentada como fato neutro. Sem critérios (custo, lock-in, complexidade) e sem referência.

### Importantes

**Cloudflare Pages sem critério de escolha**
Por que não Vercel, Netlify, GitHub Pages? "CDN global" não diferencia entre as alternativas.

**CI — testes com credenciais fake não declarado**
`.github/workflows/ci.yml` usa `fake-project.supabase.co`. Nenhum teste de integração real roda no pipeline. Banca pode inferir cobertura que não existe.

**Edge Functions sem critério de separação**
Por que `create-abacate-payment` foi para Edge Function e não para RPC PostgreSQL? O critério (API externa, chave secreta) não está articulado.

**"edu-core-zen" como nome do projeto Cloudflare**
Nome diferente da aplicação aparece sem explicação.

### Perguntas da banca

1. Contradição cap. 9 × cap. 10 sobre deploy: qual está errado?
2. Por que a análise de H2 foi deixada inteiramente para o cap. 10?
3. Por que Cloudflare Pages e não Vercel?
4. Os testes do CI rodam contra credenciais falsas — isso está declarado em algum lugar?

---

## Cap. 10 — Conclusão

### Críticos (bloqueiam entrega)

**10.2 — H1: hipótese reformulada para confirmar**
Cap. 1 diz "3 meses". Cap. 10 reescreve para "4 meses" antes de confirmar. Isso é mover o alvo depois de saber onde a flecha caiu. A resposta honesta seria: "H1 foi confirmada com ressalva — o prazo estimado foi de 3 meses, o prazo real foi 4-4,5 meses; a viabilidade de desenvolvedor solo foi demonstrada, mas a estimativa de prazo foi subestimada."

**10.2 — H2: "Estima-se 60 a 70%"**
"Estima-se" é verbo de fuga científica. Nenhum capítulo anterior apresenta o método dessa estimativa. Qual foi o denominador? Quantas horas de backend foram implementadas? Quantas seriam em Node.js/NestJS?

**10.2 — H3: exemplos não correspondem ao enunciado**
H3 diz "scaffolding, migrações e auditoria". Os três exemplos (Sprint 9, 10, 14) são refatoração e centralização de strings — nenhum é scaffolding, nenhum é migração SQL isolada. Confirmação não aderente ao enunciado original da hipótese.

### Importantes

**10.3 — Limitações superficiais**
Gap de histórico git (a mais grave) recebe uma linha. A seção declara limitações mas não avalia o quanto comprometem as hipóteses confirmadas. A ausência de testes de carga invalida RNF06 (< 2s)? Isso deveria aparecer como ressalva explícita.

**10.4 — "Gateway de pagamento real" como trabalho futuro**
AbacatePay foi implementado na Sprint 30. Se está implementado, não é trabalho futuro. Remover ou atualizar.

**"Período: janeiro a maio de 2026"**
Sprint 31 terminou em 3 de junho. Intervalo incompleto.

**"Equipe de 2-3 pessoas em 8-10 meses"**
Afirmação comparativa importada do cap. 8 sem fonte. Não pertence ao TCC sem benchmark.

### Perguntas da banca

1. H1 era "3 meses", projeto durou 4-4,5. H1 foi confirmada ou parcialmente confirmada?
2. Método por trás de "60 a 70%" de redução de esforço: qual é?
3. Os três exemplos de H3 (Sprint 9, 10, 14) não são scaffolding, migração ou auditoria. Há exemplos mais aderentes ao enunciado?
4. AbacatePay implementado na Sprint 30 aparece como trabalho futuro na Tabela 10.2. Por quê?

---

## Checklist de Correções Prioritárias

### Antes de qualquer entrega (bloqueadores)

- [ ] Sincronizar prazo do projeto em todos os caps: escolher 1 número, justificar, aplicar em 1/6/7/8/10
- [x] ~~Migrations 70 → 72~~ **ERRO DO REVISOR** — contagem real é 70 (gaps em 48/49); docs corretos
- [ ] Corrigir contradição deploy cap. 9 ("automático") × cap. 10 ("VPS manual")
- [ ] Remover AbacatePay de "trabalhos futuros" no cap. 10 (implementado Sprint 30)
- [ ] DER: gerar e inserir no cap. 5
- [ ] Sprint 28: declarar resultado consolidado no cap. 7 (X de 116 itens)
- [ ] `docs/sprints/README.md`: Sprint 28 ainda marca "🔴 Pendente" e "Em andamento" — atualizar para ✅ Concluída
- [ ] Corrigir contagem de RF implementados: 30 ou 31? Unificar em cap. 4
- [ ] Commits: corrigir "60+" no cap. 6 para "147"
- [ ] Declarar gap de ~33 commits explicitamente no cap. 8 (não só em arquivo interno)

### Alta prioridade (comprometem defesa)

- [ ] H2: adicionar limiar "≥60%" no enunciado da hipótese (cap. 1)
- [ ] H2: declarar método da estimativa em algum capítulo (cap. 5 ou cap. 8)
- [ ] H3: adicionar protocolo de medição no cap. 3 (unidade, linha de base, instrumento)
- [ ] H3: corrigir exemplos do cap. 10 para que correspondam ao enunciado (scaffolding, migrações, auditoria)
- [ ] Kanban vs. sprints: resolver contradição em caps. 2, 3, 8 — escolher nomenclatura coerente com a realidade de 31 sprints com time-boxes
- [ ] Cap. 4: adicionar seção de processo de elicitação de requisitos
- [ ] Cap. 5: corrigir contagem de tabelas (10→11, incluir `user_roles` e `performance_logs`)
- [ ] Cap. 6: conectar pelo menos uma seção a cada hipótese (H1, H2, H3)
- [ ] Cap. 7: mencionar 304 testes; declarar testes de integração ausentes; citar Sprint 24 como evidência de segurança
- [ ] Cap. 8: declarar base das estimativas de tempo ("experiência do desenvolvedor") ou remover
- [ ] Cap. 9: adicionar justificativa de escolha de Cloudflare Pages vs. alternativas
- [ ] Cap. 10: reformular confirmação de H1 reconhecendo desvio de prazo honestamente

### Média prioridade (fortalecem o argumento)

- [ ] Cap. 1: adicionar fontes para afirmações de mercado (IBGE, ABRALIN, ou pesquisa setorial)
- [ ] Cap. 1: adicionar parágrafo introdutório antes de 1.1
- [ ] Cap. 2: citar Fowler "Monolith First" para justificar monolito no cap. 5
- [ ] Cap. 2: reconciliar Peng et al. (55%) com H3 (3x=200%)
- [ ] Cap. 3: citar Thiollent/Tripp para pesquisa-ação
- [ ] Cap. 4: completar matriz de rastreabilidade (RF05, RF07-09, RF14-16, RF18-19, RF22-28)
- [ ] Cap. 4: mover RF31-33/RF35 para trabalhos futuros do cap. 10
- [ ] Cap. 5: explicar decisão de separar `user_roles` de `profiles`
- [ ] Cap. 6: adicionar decisão técnica em cada módulo (§6.4)
- [ ] Cap. 7: adicionar citação para pirâmide de testes (Cohn 2009 ou Fowler)
- [ ] Cap. 7: rever avaliação "Manutenibilidade: Média" se refatoração foi concluída
- [ ] Cap. 8: reclassificar R08 de "Resolvido" para "Aceito" (`logger.ts` não é monitoramento de produção)
- [ ] Cap. 10: limitar afirmação "2-3 pessoas em 8-10 meses" ou retirar do TCC
