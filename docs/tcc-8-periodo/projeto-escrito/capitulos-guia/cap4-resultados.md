# 4 RESULTADOS E DISCUSSÃO

> **Natureza deste arquivo:** rascunho-guia. O texto abaixo aproxima-se da prosa final, mas
> ainda comporta ajustes de fluência na etapa de redação (skill `tcc-rascunho`). Tabelas e
> placeholders de figura indicam onde inserir o material definitivo no Word antes da entrega.
>
> **Convenções aplicadas:** voz impessoal em 3ª pessoa; "iteração"/"ciclo" no lugar de
> "Sprint"; valores canônicos de `decisoes-transversais.md`; sem travessão como pontuação de
> prosa; sem jargão de IA. Remissões: protocolo de medição em "seção 3.3"; conclusões e
> trabalhos futuros no "Capítulo 5".

Este capítulo apresenta o que foi efetivamente produzido ao longo do desenvolvimento do
SyncClass e discute as três hipóteses da pesquisa à luz das evidências reunidas. Enquanto o
Capítulo 3 estabeleceu como o esforço seria conduzido e medido, este capítulo descreve o
sistema entregue, quantifica o trabalho realizado, relata os resultados de qualidade e
confronta cada hipótese com as evidências disponíveis. A discussão final posiciona esses
resultados frente à literatura e declara os limites de validade do estudo.

---

## 4.1 O Sistema Desenvolvido

O SyncClass foi entregue como uma plataforma web de gestão para professores autônomos de
inglês, organizada em módulos funcionais que cobrem o ciclo completo de operação do
profissional. O sistema atende a três perfis de acesso (administrador, professor e aluno),
cada um com sua própria área de navegação e seu próprio conjunto de permissões.

Os módulos entregues são:

- **Gestão de alunos:** cadastro, edição, listagem com filtros e paginação, e vínculo do aluno
  ao professor responsável.
- **Gestão de aulas:** registro de aulas ministradas, controle de pacotes de horas e validação
  de sobreposição de horários.
- **Financeiro:** geração de cobranças, pagamento por PIX integrado ao provedor AbacatePay,
  upload de comprovante e fluxo de aprovação e rejeição, com tratamento de idempotência para
  evitar cobrança duplicada.
- **Atividades:** criação de atividades pelo professor, entrega pelo aluno com anexo de
  arquivos e correção, com isolamento de dados entre professores.
- **Portal do aluno:** área dedicada na qual o aluno acessa apenas as próprias informações de
  aulas, cobranças e atividades.
- **Dashboard do professor:** painel de resumo com indicadores de alunos, aulas e situação
  financeira.

Um aspecto central do resultado é que o sistema não permaneceu como protótipo de laboratório.
O SyncClass encontra-se em operação em ambiente de produção, utilizado de forma ativa por um
professor autônomo de inglês e seus alunos. Esse uso real constitui evidência de validação que
extrapola a entrega técnica e ampara, em particular, a análise da hipótese H1 (Seção 4.4).

> **Figura 4.1 — pendente.** Tela de listagem de alunos (perfil professor). Inserir captura no
> Word antes da entrega.
>
> **Figura 4.2 — pendente.** Fluxo financeiro: geração de cobrança e pagamento PIX.
>
> **Figura 4.3 — pendente.** Portal do aluno (perfil aluno).
>
> **Figura 4.4 — pendente.** Dashboard do professor.

---

## 4.2 Métricas do Desenvolvimento

O trabalho realizado pode ser dimensionado por um conjunto de métricas objetivas, extraídas
diretamente do repositório de código e do histórico de versionamento. A Tabela 4.1 consolida
esses valores.

**Tabela 4.1 — Métricas do desenvolvimento do SyncClass**

| Grandeza                              | Valor                                        |
| ------------------------------------- | -------------------------------------------- |
| Período de desenvolvimento            | 4,5 meses (janeiro a junho de 2026)          |
| Iterações (ciclos semanais)           | 31                                           |
| Commits na branch principal           | 152                                          |
| Arquivos TypeScript (`src`)           | 329 (exclui testes, `.d.ts` e tipos gerados) |
| Componentes React                     | 181                                          |
| Hooks customizados                    | 37                                           |
| Linhas de código (`src`)              | ~50.000 (exclui tipos gerados)               |
| Arquivos de strings de UI (`content`) | 18                                           |
| Migrations SQL                        | 70                                           |
| Tabelas no banco                      | 11                                           |
| Políticas RLS                         | ~54                                          |
| Edge Functions                        | 9                                            |
| Testes automatizados                  | 304 (em 28 arquivos)                         |

A linha de código (~50.000) refere-se ao diretório `src`, excluindo os arquivos de teste e os
tipos gerados automaticamente pelo Supabase. A contagem de arquivos TypeScript (329) segue o
mesmo critério de exclusão. Esses valores são os adotados de forma consistente em todo o
trabalho.

A evolução do projeto ao longo das 31 iterações distribuiu-se em três fases:

- **Janeiro a fevereiro (iterações 1 a 7):** construção do MVP com os módulos de alunos, aulas
  e financeiro, seguida de um primeiro ciclo de fortalecimento de segurança.
- **Março a abril (iterações 8 a 11):** refatorações de arquitetura, com a separação das
  integrações de banco em hooks de serviço, a divisão de arquivos extensos, a centralização das
  chaves de consulta e a correção de tratamento de fuso horário.
- **Maio a junho (iterações 12 a 31):** centralização das strings de interface, auditorias de
  segurança, ciclos de qualidade e homologação final.

---

## 4.3 Resultados de Qualidade

A garantia de qualidade do SyncClass apoiou-se em três frentes complementares: testes
automatizados, uma campanha estruturada de testes manuais e uma avaliação do sistema segundo o
modelo ISO/IEC 25010.

### 4.3.1 Testes automatizados

Foram implementados 304 casos de teste automatizados, distribuídos em 28 arquivos, com a
ferramenta Vitest em conjunto com Testing Library. A cobertura abrange hooks de dados,
componentes de interface, utilitários de formatação e validação, e tokens de design. Os testes
cobrem operações de CRUD de alunos e professores, registro de aulas com validação de
sobreposição, mutações otimistas com reversão em caso de erro, validação de formulários por
esquemas Zod e mapeamento de mensagens de erro do Supabase.

Cabe registrar, como limite da estratégia, que não foram implementados testes de integração
automatizados para os procedimentos remotos, as políticas RLS, os gatilhos de banco e as Edge
Functions, nem testes de ponta a ponta. Essa lacuna é discutida na Seção 4.7 e retomada como
limitação no Capítulo 5.

### 4.3.2 Campanha de testes manuais

Na iteração 28 foi conduzida uma campanha estruturada de testes manuais, cobrindo as 20 rotas
da aplicação com 5 perfis de acesso: um administrador, dois professores (para verificar o
isolamento de dados entre eles) e dois alunos vinculados a professores distintos. A campanha
totalizou 116 itens verificados, distribuídos entre aprovações e correções necessárias.

Os fluxos validados incluíram autenticação e proteção de rotas por perfil, isolamento de dados
entre professores e entre alunos, o fluxo financeiro completo (geração de cobrança, pagamento
PIX, upload de comprovante, aprovação e rejeição), o módulo de atividades (criação, entrega e
correção) e a responsividade em dispositivos móveis. Os itens que apresentaram comportamento
incorreto durante a iteração 28 foram corrigidos nas iterações 29 a 31, encerrando o ciclo de
homologação antes da entrega final.

> **Observação de redação:** confirmar a distribuição exata entre aprovados e corrigidos em
> `docs/sprints/sprint-28-testes-manuais.md` ao escrever a prosa final, substituindo a
> formulação genérica "entre aprovações e correções" pelos números reais.

### 4.3.3 Avaliação segundo a ISO/IEC 25010

O sistema foi avaliado segundo o modelo de qualidade da ISO/IEC 25010 (2011). A avaliação
priorizou quatro características, alinhadas às necessidades do domínio: segurança (pela natureza
multi-perfil e pela conformidade com a LGPD), confiabilidade (pelo módulo financeiro),
manutenibilidade (pela condição de desenvolvedor único) e usabilidade (por se destinar a um
professor sem suporte de tecnologia da informação). A Tabela 4.2 apresenta a avaliação das
características priorizadas com suas evidências.

**Tabela 4.2 — Avaliação das características priorizadas (ISO/IEC 25010)**

| Característica   | Avaliação | Evidência                                                                  |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| Segurança        | Alta      | Auditoria de RLS (iteração 24), JWT, rate limiting, sanitização, LGPD      |
| Confiabilidade   | Alta      | Idempotência no financeiro, soft delete, registros de auditoria            |
| Manutenibilidade | Alta      | Componentes extensos refatorados (iterações 10 a 12); 304 testes           |
| Usabilidade      | Alta      | Interface mobile-first, tokens de design, estados vazios e de carregamento |

A avaliação foi conduzida pelo próprio desenvolvedor, com base em um checklist interno rastreado
por iteração, e está, portanto, sujeita a viés de confirmação. Essa condição é declarada
explicitamente como limitação da avaliação e retomada na Seção 4.7. A característica de
manutenibilidade foi classificada como alta após a conclusão das refatorações das iterações 10
a 12, que fragmentaram componentes extensos e separaram os hooks de serviço; a cobertura de 304
testes automatizados ampara essa classificação.

---

## 4.4 Hipótese H1 — Viabilidade de Prazo

> **Enunciado canônico (H1):** "O desenvolvimento de um SaaS funcional para gestão de
> professores autônomos de inglês, realizado por um único desenvolvedor com suporte de IA
> generativa, foi concluído em 4,5 meses."

A hipótese H1 postula que um sistema SaaS funcional para gestão de professores autônomos de
inglês pode ser desenvolvido por um único desenvolvedor, com suporte de IA generativa, em prazo
acadêmico. As evidências que a sustentam são objetivas e rastreáveis. O desenvolvimento
abrangeu 4,5 meses documentados (de janeiro a junho de 2026), distribuídos em 31 iterações de
ciclo semanal, com 152 commits na branch principal, 329 arquivos TypeScript e aproximadamente
50.000 linhas de código no diretório `src`.

A entrega não se limitou a um artefato funcional em ambiente controlado. O sistema encontra-se
em operação em produção, com um professor autônomo de inglês e seus alunos utilizando
ativamente a plataforma. Esse uso real reforça a confirmação da hipótese, pois evidencia que o
produto atende às necessidades para as quais foi concebido em condições de uso efetivo.

**A hipótese H1 é considerada confirmada.** Um sistema funcional e em uso real foi entregue por
um desenvolvedor único no prazo de 4,5 meses, com suporte de IA generativa.

---

## 4.5 Hipótese H2 — Redução de Esforço de Backend

> **Enunciado canônico (H2):** "A adoção do Supabase como BaaS reduziu em ≥60% o esforço
> estimado de desenvolvimento backend em comparação com uma stack tradicional equivalente
> (Node.js + PostgreSQL + Express)."

A hipótese H2 postula que a adoção do Supabase como plataforma de backend como serviço (BaaS)
reduziu em pelo menos 60% o esforço estimado de desenvolvimento de backend, em comparação com
uma stack tradicional equivalente baseada em Node.js, PostgreSQL e Express com autenticação
própria. A avaliação dessa hipótese segue o método qualitativo definido na metodologia:
enumeram-se os serviços de backend que o Supabase fornece de forma gerenciada e que, em uma
stack tradicional, exigiriam implementação e manutenção manuais.

Os serviços de backend dispensados de implementação manual pela adoção do Supabase são:

- **Autenticação:** emissão e renovação de tokens, gerenciamento de sessão e fluxos de convite,
  oferecidos nativamente sem código de servidor.
- **Autorização:** controle de acesso por linha (RLS) diretamente no banco, dispensando uma
  camada de permissões na aplicação.
- **API de dados:** o PostgREST expõe automaticamente as tabelas por REST, sem necessidade de
  controllers ou rotas escritas manualmente.
- **Armazenamento de arquivos:** upload, recuperação e políticas de acesso a arquivos sem um
  servidor de arquivos próprio.
- **Tempo real:** canais de publicação e assinatura sobre WebSocket prontos para uso, sem
  infraestrutura de mensageria implementada.
- **Migrations versionadas:** o ciclo de vida do esquema é gerenciado pela ferramenta de linha
  de comando do Supabase, sem ferramenta adicional.

A estimativa de redução de pelo menos 60% é qualitativa e fundamenta-se na literatura de
computação em nuvem e BaaS, que identifica a autenticação, a autorização, a API de dados e o
armazenamento como os componentes de maior custo de implementação em stacks convencionais
(MELL; GRANCE, 2011). Esses são precisamente os componentes fornecidos como serviço gerenciado
pela plataforma adotada.

**A hipótese H2 é considerada confirmada, com ressalva metodológica.** A confirmação apoia-se na
enumeração dos serviços de backend dispensados e em sua sustentação na literatura, e não em uma
medição formal. Não houve grupo de controle que implementasse a mesma aplicação em stack
tradicional, de modo que a redução é estimada em bases qualitativas, e não medida
experimentalmente. Essa ressalva está declarada no protocolo metodológico (seção 3.3) e é
retomada na Seção 4.7.

---

## 4.6 Hipótese H3 — Aceleração por IA Generativa

> **Enunciado canônico (H3):** "O uso de IA generativa (Claude) como assistente de
> desenvolvimento acelerou em pelo menos 3 vezes o tempo de execução de tarefas de scaffolding,
> geração de migrations SQL e auditoria de segurança."

A hipótese H3 postula que o uso do assistente de IA Claude (Anthropic) acelerou em pelo menos
três vezes o tempo de execução de tarefas específicas de scaffolding, geração de migrations SQL
e auditoria de segurança. A unidade de análise é o tempo de execução de tarefas delimitadas, e
não a quantidade de linhas de código produzida. Apresentam-se três exemplos rastreáveis,
aderentes ao enunciado, conforme a Tabela 4.3.

**Tabela 4.3 — Exemplos rastreáveis de aceleração por IA (H3)**

| Iteração      | Tarefa                                                                                      | Estimativa sem IA | Com IA                      |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------- | --------------------------- |
| Iterações 1–2 | Scaffolding inicial: autenticação multi-perfil, estrutura de pastas e primeiros componentes | 5 a 6 dias        | aprox. 2 dias               |
| Iteração 9    | Geração de migrations SQL complexas com políticas RLS e gatilhos                            | 3 a 4 dias        | aprox. 1 dia                |
| Iteração 24   | Auditoria sistemática das políticas RLS nas 11 tabelas                                      | aprox. 3 dias     | aprox. 1 sessão de trabalho |

Em cada um desses casos, a razão entre o tempo estimado sem IA e o tempo efetivamente
despendido com a assistência da IA aproximou-se ou superou o fator de três vezes previsto pela
hipótese. O ganho, contudo, variou conforme o tipo de tarefa: foi mais expressivo em atividades
de domínio bem delimitado e repetitivo, como a geração de scaffolding e de scripts SQL, e menos
expressivo em tarefas de decisão de produto, arquitetura e experiência de usuário, nas quais a
IA atuou como ferramenta de apoio e não substituiu o julgamento do desenvolvedor.

**A hipótese H3 é considerada confirmada para os exemplos documentados, com limitações
declaradas.** As estimativas de tempo são retrospectivas, elaboradas pelo próprio desenvolvedor
com base na experiência anterior em stacks tradicionais, e estão sujeitas a viés de
confirmação por ausência de grupo de controle. Essa limitação e o protocolo de medição que a
enquadra estão descritos na seção 3.3.

---

## 4.7 Discussão

Os resultados das três hipóteses, tomados em conjunto, sustentam a viabilidade de desenvolver
um SaaS funcional, seguro e em uso real por um desenvolvedor único, em prazo acadêmico, quando
se combinam uma plataforma de backend como serviço e o apoio de IA generativa. Esta seção
confronta esses resultados com a literatura e delimita os seus limites de validade.

### 4.7.1 Confronto com a literatura

O resultado de H3 deve ser lido em relação ao estudo de Peng et al., que mediu um ganho de
produtividade da ordem de 55% para uma tarefa de programação geral assistida por IA. Não há
contradição entre esse valor e o fator de pelo menos três vezes observado neste trabalho,
porque os escopos de medição são distintos. O estudo de Peng et al. avaliou produtividade média
em uma tarefa de codificação genérica, ao passo que H3 mede tarefas específicas e delimitadas,
de natureza repetitiva e de domínio bem definido (scaffolding, geração de migrations SQL com
RLS e gatilhos, e auditoria de segurança), nas quais é esperado um ganho superior à média. H3
deve, portanto, ser entendida como referente a um subconjunto de tarefas em que a aceleração é
maior, e não como uma estimativa de ganho médio sobre toda a atividade de desenvolvimento.

Quanto a H2, a enumeração dos serviços de backend dispensados é coerente com a caracterização
da literatura de computação em nuvem (MELL; GRANCE, 2011), que situa a autenticação, a
autorização, a API de dados e o armazenamento entre os componentes de maior custo de
implementação em stacks convencionais. O resultado deste trabalho ilustra, em um caso concreto,
o deslocamento desse custo para a plataforma gerenciada.

### 4.7.2 O que os resultados sugerem

Tomados em conjunto, os resultados sugerem que o arranjo entre backend como serviço e IA
generativa altera o que é viável para um desenvolvedor único em prazo curto. A plataforma BaaS
absorve grande parte do esforço de backend que, de outro modo, exigiria implementação manual, e
a IA generativa comprime o tempo das tarefas mais repetitivas e delimitadas. O esforço do
desenvolvedor concentra-se, então, nas decisões de produto, de arquitetura e de experiência de
usuário, nas quais o julgamento humano permaneceu determinante. Esse deslocamento de esforço é
o que torna plausível a entrega observada em H1.

### 4.7.3 Limitações de validade

Os resultados estão sujeitos a limitações de validade que devem ser consideradas em sua
interpretação:

- **Validade interna:** as estimativas de tempo que sustentam H3 e a avaliação de qualidade
  segundo a ISO/IEC 25010 foram produzidas pelo próprio desenvolvedor, sem grupo de controle e
  sem avaliador independente, o que as expõe a viés de confirmação. A redução de esforço de H2
  é uma estimativa qualitativa, não uma medição experimental.
- **Validade externa:** trata-se de um estudo de caso único, com um sistema, um desenvolvedor e
  um conjunto restrito de usuários reais. Os resultados não autorizam generalização direta para
  outros desenvolvedores, domínios ou escalas de projeto.
- **Cobertura de testes:** a ausência de testes de integração automatizados (para procedimentos
  remotos, políticas RLS, gatilhos e Edge Functions) e de testes de ponta a ponta significa que
  parte do comportamento do sistema foi validada apenas por testes manuais, e que requisitos de
  desempenho sob carga não foram verificados empiricamente.

Essas limitações não invalidam as confirmações das hipóteses no escopo deste estudo de caso,
mas delimitam o alcance das conclusões. O detalhamento das limitações remanescentes e as
direções de trabalho futuro são tratados no Capítulo 5.
