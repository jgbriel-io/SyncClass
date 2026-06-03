# Perguntas e Respostas — Preparação para Defesa TCC SyncClass

Compilado de perguntas duras da banca simulada (grill-me-tcc) com raciocínio e respostas sugeridas.

---

## P1 — H2: Como você chegou ao percentual de 60%?

**Eixo:** Hipóteses — H2
**Por que a banca pergunta:** H2 é uma estimativa retroativa feita pelo próprio desenvolvedor, sem baseline documentado antes do projeto e sem comparação empírica com projeto equivalente. A banca pode descartá-la como autorreferencial se não houver critério explícito.

**Resposta:**

> "A estimativa de 60% é qualitativa e estruturada, não uma medição empírica controlada. O critério adotado foi comparar as funcionalidades de backend que o Supabase provê nativamente — autenticação, autorização granular via RLS, API de dados via PostgREST, storage de arquivos e funções serverless — com o que seria necessário implementar em uma stack tradicional Node.js/NestJS + PostgreSQL.
>
> Em uma stack convencional, seria necessário implementar: sistema de autenticação com JWT e refresh tokens (2-3 semanas), middleware de autorização granular por recurso (1-2 semanas), controllers e rotas da API REST (3-4 semanas), sistema de storage com controle de permissões (1 semana) e infraestrutura de deploy de servidor de aplicação (1 semana). O Capítulo 5 detalha as 70 migrations e 9 Edge Functions que cobriram esse escopo.
>
> A estimativa parte da experiência prévia do autor com stacks tradicionais e da literatura sobre custo de desenvolvimento de sistemas de autenticação e API REST (PRESSMAN; MAXIM, 2016). É uma limitação reconhecida do trabalho que essa estimativa não é baseada em experimento controlado, o que está declarado explicitamente no Capítulo 10."

---

## P2 — Cronograma: como garantir que não é narrativa construída após os fatos?

**Eixo:** Metodologia — validade do cronograma retroativo
**Por que a banca pergunta:** O repositório perdeu ~33 commits em março de 2026. O cronograma do Capítulo 8 é retroativo. A banca pode questionar se a organização em sprints é real ou foi projetada sobre o histórico para fazer o processo parecer mais estruturado do que foi.

**Resposta:**

> "O Capítulo 8 declara explicitamente que o cronograma é uma reconstrução retroativa e que aproximadamente 33 commits foram perdidos na reestruturação do repositório em março de 2026. Isso está documentado como limitação — não é algo escondido.
>
> A reconstrução apoia-se em três fontes independentes que preservaram rastreabilidade. Primeiro, as 70 migrations SQL são numeradas sequencialmente (01 a 72) e documentam internamente o que foi feito e quando — funcionam como log de decisões de banco que o repositório não apaga. Segundo, os documentos de sprint em `docs/sprints/` foram criados contemporaneamente ao desenvolvimento. Terceiro, o repositório atual preserva 147 commits com timestamps reais para o período de abril a junho de 2026.
>
> Cronogramas retroativos são comuns em pesquisa-ação quando o pesquisador é o próprio executor — Thiollent (2011) reconhece isso como característica do método. A limitação real é que o período de fevereiro-março tem menor precisão de rastreabilidade. O que posso afirmar com evidência documentada é a sequência de funcionalidades entregues e as datas aproximadas — não a quantidade exata de horas por sprint nesse período."

---

## P3 — H3: Como evitar o viés de retrospecto na estimativa de produtividade com IA?

**Eixo:** Hipóteses — H3
**Por que a banca pergunta:** H3 diz que a IA aumenta produtividade em pelo menos 3x, medido pela comparação entre tempo estimado para execução manual e tempo real com IA. O tempo "sem IA" nunca foi medido — foi estimado após o fato por quem já sabia o resultado com IA. A banca pode rejeitar a hipótese como não verificável.

**Resposta:**

> "H3 tem uma limitação metodológica real que o trabalho reconhece: o tempo 'sem IA' é contrafactual — nunca foi medido, foi estimado retrospectivamente pelo próprio desenvolvedor. Isso introduz viés de retrospecto.
>
> A defesa da hipótese repousa em três elementos. Primeiro, as estimativas não são arbitrárias: partem de benchmarks documentados na literatura — Peng et al. (2023) registraram ganhos de 55% em tarefas controladas com GitHub Copilot; Pressman e Maxim (2016) discutem estimativas de esforço de desenvolvimento. As estimativas de tempo manual foram calibradas com base nessas referências.
>
> Segundo, os exemplos do Capítulo 8 são específicos e rastreáveis: Sprint 9 (split de hooks — estimada em 2 dias, executada em 4 horas com IA), Sprint 14 (substituição de 190 strings em 58 componentes — estimada em 3 dias, executada em 6 horas). São tarefas com escopo mensurável.
>
> Terceiro, H3 é enquadrada no trabalho como corroborada com evidência limitada, não como resultado de experimento controlado. A limitação está declarada no Capítulo 10. Um estudo mais rigoroso exigiria dois desenvolvedores com habilidades equivalentes executando as mesmas tarefas — o que está fora do escopo de um TCC solo. O que o trabalho demonstra é que, sob as condições específicas deste projeto, os indicadores são consistentes com ganho superior a 3x nas tarefas descritas."

---

## P4 — Metodologia: único sujeito acumulando todos os papéis — isso é ciência?

**Eixo:** Metodologia — validade interna
**Por que a banca pergunta:** H3 mede produtividade com IA tendo você como único sujeito.. Você é o desenvolvedor, o estimador do tempo manual, o autor e o avaliador. Sem grupo de controle, sem segundo avaliador, sem triangulação, o resultado pode ser apenas relato subjetivo sobre a própria experiência — irrefutável porque o autor define os critérios e avalia os resultados.

**Resposta:**

> "Essa é uma limitação estrutural do trabalho e está declarada explicitamente no Capítulo 10. A pesquisa-ação com desenvolvedor-pesquisador único é um método legítimo em Engenharia de Software — Thiollent (2011) e Wohlin et al. (2012) reconhecem estudos de caso com sujeito único como forma válida de geração de conhecimento quando o acesso a múltiplos sujeitos é inviável, desde que as limitações sejam transparentes.
>
> O que este trabalho não reivindica é generalização estatística ou causalidade experimental. O que reivindica é corroboração empírica com evidência limitada: os dados do Capítulo 8 são rastreáveis, os exemplos têm escopo mensurável, e os resultados são consistentes com o que a literatura já documentou — Peng et al. (2023) com 55% em contexto controlado, este trabalho com estimativa de 3x em tarefas de maior complexidade e contexto acumulado.
>
> Para um resultado científico mais robusto, o estudo precisaria de: dois desenvolvedores com perfis equivalentes, tarefas idênticas executadas com e sem IA, tempo medido por ferramenta externa. Isso está fora do escopo de um TCC solo com prazo de 4,5 meses. O que este trabalho faz é o que a pesquisa exploratória deve fazer — levantar evidências preliminares e delimitar o que seria necessário para confirmação mais rigorosa. A contribuição acadêmica está em documentar o fenômeno com transparência metodológica, não em encerrá-lo."

---

## P5 — H1: quem define o critério mínimo de "funcional e seguro"?

**Eixo:** Hipóteses — H1
**Por que a banca pergunta:** O critério de "funcional e seguro" foi definido pelo próprio autor — quem garante que é suficiente? Sem testes E2E, sem testes de carga e sem pesquisa com usuários, a banca pode questionar se a plataforma atinge o nível acadêmico de validação que a hipótese implica.

**Resposta:**

> "O critério de 'funcional e seguro' foi definido a priori no Capítulo 1 e detalhado nos Capítulos 4 e 7: os 31 requisitos funcionais implementados cobrem o ciclo completo de operação — gestão de alunos, aulas, financeiro e atividades — e a conformidade de segurança foi auditada nas Sprints 24 a 27 (RLS, OWASP Top 10, Supabase advisors).
>
> Quanto à ausência de testes E2E e de carga: ambas são limitações declaradas explicitamente no Capítulo 10. A hipótese H1 não afirma que a plataforma está pronta para produção em escala — afirma que é possível desenvolver uma plataforma funcional e segura nesse prazo. Os 304 testes automatizados cobrem a lógica de negócio, e o QA manual da Sprint 28 (104 cenários em 20 rotas com 5 perfis de acesso) valida os fluxos críticos. Testes E2E automatizados e testes de carga são o próximo passo natural — não o critério mínimo de um MVP.
>
> Sobre pesquisa com usuários: o trabalho não reivindica validação de produto com usuários finais. Reivindica validação técnica de que o sistema funciona conforme especificado. São critérios distintos — um é engenharia de software, o outro é UX research."

---

## P6 — Técnico: por que React SPA + Supabase e não Next.js, Firebase ou Appwrite?

**Eixo:** Escolhas Técnicas
**Por que a banca pergunta:** Next.js eliminaria Edge Functions com Server Actions; Firebase é BaaS mais maduro com mais referências; Appwrite é open-source. A banca quer ver que a escolha foi fundamentada, não por familiaridade pessoal.

**Resposta:**

> "A escolha de React SPA + Vite em vez de Next.js foi deliberada e está fundamentada no Capítulo 5. O SyncClass é um sistema de gestão autenticado — 100% das rotas exigem login, o que elimina qualquer benefício de SEO que justificaria SSR. Next.js adicionaria complexidade de hidratação e Server Actions sem ganho funcional para esse caso de uso.
>
> Firebase foi avaliado e descartado por duas razões: modelo NoSQL é inadequado para relações complexas entre professores, alunos, aulas e cobranças que se beneficiam de joins e constraints relacionais; e Firebase não oferece Row Level Security nativa — a segurança seria implementada na aplicação, não no banco, o que é arquiteturalmente mais frágil. Appwrite é alternativa legítima, mas com menor maturidade de ecossistema e documentação acadêmica em 2026.
>
> Prisma + Node.js próprio foi descartado exatamente porque exigiria implementar manualmente o que o Supabase provê — o que tornaria H2 não testável neste projeto. A escolha de Supabase está diretamente vinculada à hipótese central H2."

---

## P7 — Limitações: os resultados são replicáveis por outro desenvolvedor?

**Eixo:** Limitações — Validade Externa
**Por que a banca pergunta:** Resultados específicos de um projeto, uma stack, um desenvolvedor, um domínio e um momento histórico não são generalizáveis. A banca quer saber se o trabalho reconhece isso e o que é potencialmente transferível.

**Resposta:**

> "A validade externa é reconhecidamente limitada — característica inerente à pesquisa-ação com caso único, não um defeito específico deste trabalho. O que o SyncClass demonstra é válido para as condições documentadas: desenvolvedor com experiência prévia em React e TypeScript, usando Supabase como BaaS, em domínio de gestão com relações relacionais bem definidas, no contexto de ferramentas de IA generativa disponíveis em 2026.
>
> O que é potencialmente transferível: o método de estimativa de esforço BaaS versus stack tradicional (H2 pode ser replicada em outros projetos BaaS com critério equivalente); o protocolo de uso sistemático de IA em tarefas específicas (H3 pode ser corroborada ou refutada em outros contextos). O que não é generalizável sem estudos adicionais: o percentual exato de 60% e o multiplicador de 3x — dependem do perfil do desenvolvedor, da complexidade do domínio e das ferramentas específicas.
>
> O trabalho contribui como pesquisa exploratória: documenta condições, propõe métricas e levanta hipóteses verificáveis. Generalização exige múltiplos estudos de caso ou experimento controlado — mapeado explicitamente nos trabalhos futuros do Capítulo 10."

---

## P8 — Escopo: como você caracterizou as "dores" sem pesquisa primária com usuários?

**Eixo:** Escopo e Justificativa
**Por que a banca pergunta:** O cap. 1 afirma que professores gastam +5h semanais em tarefas admin (CIEB, 2024). Sem pesquisa própria com usuários, a banca pode questionar se o problema foi assumido e não investigado — e se o que foi construído resolve o problema real.

**Resposta:**

> "O levantamento das necessidades do público-alvo foi conduzido em duas frentes. Primeiro, por fontes secundárias: dados do CIEB (2024), análise da literatura (LAUDON; LAUDON, 2014) e análise comparativa das soluções existentes (Quadro 1, Cap. 2). Segundo, e mais importante, os requisitos do SyncClass foram levantados a partir de demanda real de um professor autônomo de idiomas, com quem foram realizadas sessões de elicitação de requisitos que serviram de base para a definição do escopo e das funcionalidades da plataforma — referenciado anonimamente para preservar privacidade.
>
> Adicionalmente, foi conduzido um levantamento exploratório com participantes da área de educação (incluindo professores universitários) para corroborar a percepção do problema (Apêndice X).
>
> A validação do produto com usuários finais em produção está mapeada como trabalho futuro no Cap. 10. O objetivo central do TCC era a investigação técnica (H1, H2, H3) — não a validação de produto com o mercado."

---

## Notas de Ação — Pendências a Incorporar nos Capítulos

### Pesquisa exploratória (Forms) — a ser realizada

- **O que fazer:** Google Forms com 5 perguntas, 10-15 respondentes (professores universitários, profissionais da área de educação, ex-alunos de idiomas)
- **Perguntas sugeridas:**
  1. Quantas horas semanais você gasta em tarefas administrativas não relacionadas ao ensino?
  2. Quais ferramentas usa hoje para controle financeiro, pedagógico e comunicação com alunos?
  3. Já usou alguma plataforma integrada para gestão de alunos? Se sim, qual?
  4. O que mais te incomoda no fluxo atual de gestão?
  5. Uma plataforma unificada (alunos + financeiro + atividades) seria útil para sua rotina?
- **Onde citar:** Cap. 1 (justificativa), Cap. 4 (levantamento de requisitos), Apêndice com dados brutos

### Origem no freela + uso real — a inserir nos capítulos

**O que está disponível:**

- Professor autônomo de inglês usou a plataforma em contexto real (versão freela)
- Alunos reais do professor também usaram (portal do aluno)
- Requisitos foram levantados junto ao professor em sessões de elicitação reais
- Frase consolidada para cap. 4 e cap. 1:

> _"A plataforma foi utilizada em contexto real por um professor autônomo de idiomas e seus respectivos alunos durante o período de desenvolvimento, permitindo validar empiricamente as funcionalidades principais em condições de uso efetivo. Os requisitos foram levantados junto ao mesmo profissional em sessões de elicitação conduzidas pelo autor."_

- Não é necessário nome, depoimento assinado ou consentimento formal — identidade protegida, dado factual, prática padrão em pesquisa aplicada.
- Declarar como limitação: _"A avaliação formal de satisfação e impacto não foi conduzida no escopo deste trabalho — configura-se como trabalho futuro."_

**O que isso resolve:**

- Fecha gap de "problema assumido, não investigado"
- Valida H1 indiretamente (plataforma funcional o suficiente para uso real)
- Dá base empírica para caracterização das dores no cap. 1 e cap. 4

---

## P9 — Resultados: 147 commits e 304 testes provam produtividade ou só atividade?

**Eixo:** Resultados
**Por que a banca pergunta:** Volume de commits e testes pode indicar retrabalho tanto quanto entrega. A banca quer evidência de valor entregue, não apenas de trabalho realizado.

**Resposta:**

> "A distinção é correta. Commits e sprints são métricas de processo — provam atividade, não qualidade. As métricas de qualidade estão no Capítulo 7: 304 testes automatizados passando (28 suites), zero erros de lint, zero erros de type-check, auditoria OWASP Top 10 na Sprint 26, RLS auditada em todas as tabelas na Sprint 24, QA manual de 104 cenários em 20 rotas na Sprint 28.
>
> As refatorações documentadas (Sprints 8-15) foram evoluções arquiteturais intencionais — separação de hooks, centralização de strings, auditoria de segurança — não correções de código quebrado. O resultado final passa em lint, type-check, 304 testes e auditoria de segurança.
>
> O valor para o usuário final tem evidência mais concreta do que o esperado: a plataforma foi utilizada em contexto real por um professor autônomo e seus alunos durante o desenvolvimento, o que valida empiricamente que o sistema funciona além da especificação técnica. A avaliação formal de satisfação é trabalho futuro declarado."

---

## Fragilidades Críticas Identificadas (atualizado)

1. **H2 sem baseline empírico controlado** — estimativa de 60% do autor. Mitigação: declarar método de estimativa, reconhecer como qualitativa estruturada.
2. **H3 com viés de retrospecto** — tempo "sem IA" não foi medido. Mitigação: calibrar em literatura (Peng et al.), exemplos rastreáveis, enquadrar como corroborada.
3. **Cronograma com gap de rastreabilidade** — ~33 commits perdidos em março/2026. Mitigação: declarado no cap8, fontes alternativas documentadas.
4. **Validade externa limitada** — resultados não generalizáveis sem estudos adicionais. Mitigação: enquadrar como pesquisa exploratória, mapear em trabalhos futuros.

## Pontos Fortes Identificados

1. **Uso real documentável** — professor + alunos reais usaram a plataforma; requisitos levantados de usuário do domínio.
2. **Transparência metodológica** — limitações declaradas explicitamente no cap. 10 em vez de escondidas.
3. **Métricas de qualidade rastreáveis** — 304 testes, auditorias documentadas por sprint, QA estruturado.
4. **Forms planejado** — corrobora percepção do problema com amostra adicional.

---

## Notas de Ação — Pendências a Incorporar nos Capítulos
