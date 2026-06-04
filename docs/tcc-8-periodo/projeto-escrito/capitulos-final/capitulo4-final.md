# 4 RESULTADOS E DISCUSSÃO

Enquanto o Capítulo 3 estabeleceu o modo como o esforço de desenvolvimento foi conduzido e medido, o presente capítulo expõe o que dele resultou. Apresenta-se, inicialmente, o sistema efetivamente entregue e a dimensão objetiva do trabalho realizado; em seguida, relatam-se os resultados de qualidade obtidos; por fim, cada uma das três hipóteses da pesquisa é confrontada com as evidências reunidas. A discussão final posiciona esses resultados ante a literatura e delimita os limites de validade do estudo.

## 4.1 O Sistema Desenvolvido

O SyncClass foi entregue como uma plataforma web de gestão para professores autônomos de inglês, organizada em módulos funcionais que cobrem o ciclo completo de operação do profissional. O sistema atende a três perfis de acesso (administrador, professor e aluno), cada qual com sua própria área de navegação e seu próprio conjunto de permissões, conforme o isolamento de dados detalhado na seção 3.5.

Os módulos entregues compreendem:

- **Gestão de alunos:** cadastro, edição, listagem com filtros e paginação, e vínculo do aluno ao professor responsável.
- **Gestão de aulas:** registro de aulas ministradas, controle de pacotes de horas e validação de sobreposição de horários.
- **Financeiro:** geração de cobranças, pagamento por PIX integrado ao provedor AbacatePay, registro de comprovantes e fluxo de aprovação e rejeição, com tratamento de idempotência que previne cobrança duplicada.
- **Atividades:** criação de atividades pelo professor, entrega pelo aluno com anexo de arquivos e correção, preservado o isolamento de dados entre professores.
- **Portal do aluno:** área dedicada na qual o aluno acessa apenas as próprias informações de aulas, cobranças e atividades.
- **Painel do professor:** quadro de resumo com indicadores de alunos, aulas e situação financeira.

A representação visual das principais telas do sistema é apresentada nas Figuras 4.1 a 4.4.

**Figura 4.1 – Tela de listagem de alunos (perfil professor)**

[Figura pendente de inserção a partir de captura do sistema]

Fonte: O autor (2026).

**Figura 4.2 – Fluxo financeiro: geração de cobrança e pagamento PIX**

[Figura pendente de inserção a partir de captura do sistema]

Fonte: O autor (2026).

**Figura 4.3 – Portal do aluno (perfil aluno)**

[Figura pendente de inserção a partir de captura do sistema]

Fonte: O autor (2026).

**Figura 4.4 – Painel do professor**

[Figura pendente de inserção a partir de captura do sistema]

Fonte: O autor (2026).

Um aspecto central do resultado é que o sistema não permaneceu como protótipo de laboratório. O SyncClass encontra-se em operação em ambiente de produção, utilizado de forma ativa por um professor autônomo de inglês e seus alunos. Esse uso real constitui evidência de validação que extrapola a entrega técnica e ampara, em particular, a análise da hipótese H1, apresentada na seção 4.4.

## 4.2 Métricas do Desenvolvimento

O trabalho realizado pode ser dimensionado por um conjunto de métricas objetivas, extraídas diretamente do repositório de código e do histórico de versionamento. A Tabela 4.1 consolida esses valores.

**Tabela 4.1 — Métricas do desenvolvimento do SyncClass**

| Grandeza                                    | Valor                                        |
| :------------------------------------------ | :------------------------------------------- |
| Período de desenvolvimento                  | ~3 meses (março a junho de 2026)             |
| Iterações (temáticas)                       | 31                                           |
| _Commits_ na _branch_ principal             | 152                                          |
| Arquivos TypeScript (`src`)                 | 329 (exclui testes, `.d.ts` e tipos gerados) |
| Componentes React                           | 181                                          |
| _Hooks_ customizados                        | 37                                           |
| Linhas de código (`src`)                    | ~50.000 (exclui tipos gerados)               |
| Arquivos de textos de interface (`content`) | 18                                           |
| _Migrations_ SQL                            | 70                                           |
| Tabelas no banco                            | 11                                           |
| Políticas RLS                               | ~54                                          |
| Edge Functions                              | 7                                            |
| Testes automatizados                        | 304 (em 28 arquivos)                         |

Fonte: O autor (2026).

A contagem de linhas de código (~50.000) refere-se ao diretório `src`, excluídos os arquivos de teste e os tipos gerados automaticamente pelo Supabase. A contagem de arquivos TypeScript (329) adota o mesmo critério de exclusão. Esses valores são empregados de forma consistente em todo o trabalho.

A evolução do projeto ao longo das 31 iterações distribuiu-se em três fases:

- **Março (iterações 1 a 7):** construção do produto mínimo viável, com os módulos de alunos, aulas e financeiro, seguida de um primeiro ciclo de fortalecimento de segurança.
- **Abril (iterações 8 a 15):** refatorações de arquitetura, com a separação das integrações de banco em _hooks_ de serviço, a divisão de arquivos extensos, a centralização das chaves de consulta e a correção do tratamento de fuso horário, seguidas da centralização dos textos de interface.
- **Maio a junho (iterações 16 a 31):** evolução incremental dos módulos, auditorias de segurança, ciclos de qualidade e estabilização final.

## 4.3 Resultados de Qualidade

A garantia de qualidade do SyncClass apoiou-se em três frentes complementares: testes automatizados, uma campanha estruturada de testes manuais e uma avaliação do sistema segundo o modelo ISO/IEC 25010.

### 4.3.1 Testes Automatizados

Foram implementados 304 casos de teste automatizados, distribuídos em 28 arquivos, com a ferramenta Vitest em conjunto com a Testing Library. A cobertura abrange _hooks_ de dados, componentes de interface, utilitários de formatação e validação, e _design tokens_. Os testes contemplam operações de criação, leitura, atualização e remoção de alunos e professores, o registro de aulas com validação de sobreposição, mutações otimistas com reversão em caso de erro, a validação de formulários por esquemas Zod e o mapeamento de mensagens de erro do Supabase.

Cabe registrar, como limite da estratégia, que não foram implementados testes de integração automatizados para os procedimentos remotos, as políticas RLS, os gatilhos de banco e as Edge Functions, tampouco testes de ponta a ponta. Essa lacuna é discutida na seção 4.7 e retomada como limitação no Capítulo 5.

### 4.3.2 Campanha de Testes Manuais

A partir da iteração 28, passou-se a conduzir uma campanha estruturada de testes manuais que percorre as 20 rotas da aplicação com 5 perfis de acesso: um administrador, dois professores (para verificar o isolamento de dados entre eles) e dois alunos vinculados a professores distintos. O roteiro de verificação totaliza 187 itens, organizados por módulo, abrangendo desde a autenticação e a proteção de rotas até os fluxos financeiros, o módulo de atividades e a validação de mensagens de retorno ao usuário. O roteiro foi ampliado ao longo das iterações 29 e 30, à medida que itens relativos a fluxos então introduzidos foram incorporados.

Os fluxos verificados até a data de redação incluem a autenticação e a proteção de rotas por perfil, o isolamento de dados entre professores e entre alunos, o fluxo financeiro completo (geração de cobrança, pagamento PIX, registro de comprovante, aprovação e rejeição), o módulo de atividades (criação, entrega e correção) e a responsividade em dispositivos móveis. Os itens que apresentaram comportamento incorreto foram corrigidos nas iterações subsequentes. A campanha permanece em execução: parte do roteiro ainda está sob verificação, condição declarada como limitação da estratégia de qualidade na seção 4.7 e retomada no Capítulo 5.

### 4.3.3 Avaliação Segundo a ISO/IEC 25010

O sistema foi avaliado segundo o modelo de qualidade da ISO/IEC 25010 (2011). A avaliação priorizou quatro características, alinhadas às necessidades do domínio: a segurança (pela natureza multiperfil e pela conformidade com a LGPD), a confiabilidade (pelo módulo financeiro), a manutenibilidade (pela condição de desenvolvedor único) e a usabilidade (por se destinar a um professor sem suporte de tecnologia da informação). A Tabela 4.2 apresenta a avaliação das características priorizadas com suas respectivas evidências.

**Tabela 4.2 — Avaliação das características priorizadas (ISO/IEC 25010)**

| Característica   | Avaliação | Evidência                                                                                     |
| :--------------- | :-------- | :-------------------------------------------------------------------------------------------- |
| Segurança        | Alta      | Auditoria de RLS (iteração 24), JWT, limitação de taxa, sanitização e conformidade com a LGPD |
| Confiabilidade   | Alta      | Idempotência no financeiro, _soft delete_ e registros de auditoria                            |
| Manutenibilidade | Alta      | Componentes extensos refatorados (iterações 8 a 11); 304 testes automatizados                 |
| Usabilidade      | Alta      | Interface _mobile-first_, _design tokens_, estados vazios e de carregamento                   |

Fonte: O autor (2026).

A avaliação foi conduzida pelo próprio desenvolvedor, com base em lista de verificação interna rastreada por iteração, e está, portanto, sujeita a viés de confirmação. Essa condição é declarada explicitamente como limitação da avaliação e retomada na seção 4.7. A característica de manutenibilidade foi classificada como alta após a conclusão das refatorações das iterações 8 a 11, que fragmentaram componentes extensos e separaram os _hooks_ de serviço; a cobertura de 304 testes automatizados ampara essa classificação.

## 4.4 Hipótese H1 — Viabilidade de Prazo

A hipótese H1 postula que um sistema SaaS funcional para gestão de professores autônomos de inglês pode ser desenvolvido por um único desenvolvedor, com suporte de IA generativa, em prazo acadêmico. As evidências que a sustentam são objetivas e rastreáveis. O desenvolvimento abrangeu aproximadamente três meses documentados no histórico de versionamento (de março a junho de 2026), distribuídos em 31 iterações temáticas, com 152 _commits_ na _branch_ principal, 329 arquivos TypeScript e aproximadamente 50.000 linhas de código no diretório `src`.

A entrega não se limitou a um artefato funcional em ambiente controlado. O sistema encontra-se em operação em produção, com um professor autônomo de inglês e seus alunos utilizando ativamente a plataforma. Esse uso real reforça a confirmação da hipótese, pois evidencia que o produto atende às necessidades para as quais foi concebido em condições efetivas de uso.

Conclui-se que a hipótese H1 é confirmada. Um sistema funcional e em uso real foi entregue por um desenvolvedor único no prazo de aproximadamente três meses, com suporte de IA generativa.

## 4.5 Hipótese H2 — Redução de Esforço de Backend

A hipótese H2 postula que a adoção do Supabase como plataforma de _Backend as a Service_ (BaaS) reduziu em pelo menos 60% o esforço estimado de desenvolvimento de backend, em comparação com uma _stack_ tradicional equivalente baseada em Node.js, PostgreSQL e Express com autenticação própria. A avaliação dessa hipótese segue o método qualitativo definido na metodologia: enumeram-se os serviços de backend que o Supabase fornece de forma gerenciada e que, em uma _stack_ tradicional, exigiriam implementação e manutenção manuais.

Os serviços de backend dispensados de implementação manual pela adoção do Supabase são:

- **Autenticação:** emissão e renovação de tokens, gerenciamento de sessão e fluxos de convite, oferecidos nativamente sem código de servidor.
- **Autorização:** controle de acesso por linha (RLS) diretamente no banco, o que dispensa uma camada de permissões na aplicação.
- **API de dados:** o PostgREST expõe automaticamente as tabelas por REST, sem necessidade de _controllers_ ou rotas escritas manualmente.
- **Armazenamento de arquivos:** envio, recuperação e políticas de acesso a arquivos sem servidor de arquivos próprio.
- **Tempo real:** canais de publicação e assinatura sobre WebSocket prontos para uso, sem infraestrutura de mensageria implementada.
- **_Migrations_ versionadas:** o ciclo de vida do esquema é gerenciado pela ferramenta de linha de comando do Supabase, sem ferramenta adicional.

A estimativa de redução de pelo menos 60% é qualitativa e fundamenta-se na literatura de computação em nuvem e BaaS, que situa a autenticação, a autorização, a API de dados e o armazenamento entre os componentes de maior custo de implementação em _stacks_ convencionais (MELL; GRANCE, 2011). Esses são precisamente os componentes fornecidos como serviço gerenciado pela plataforma adotada.

Conclui-se que a hipótese H2 é confirmada, com ressalva metodológica. A confirmação apoia-se na enumeração dos serviços de backend dispensados e em sua sustentação na literatura, e não em uma medição experimental. Cabe explicitar que o limiar de 60% foi arbitrado a priori, no enunciado da hipótese; a evidência qualitativa reunida (a supressão de seis serviços de backend que, em uma _stack_ tradicional, demandariam implementação e manutenção próprias) torna esse patamar plausível, mas não o quantifica com precisão. Não houve grupo de controle que implementasse a mesma aplicação em _stack_ tradicional, de modo que a redução é estimada em bases qualitativas. Essa ressalva está declarada no protocolo metodológico (seção 3.3) e é retomada na seção 4.7.

## 4.6 Hipótese H3 — Aceleração por IA Generativa

A hipótese H3 postula que o uso do assistente de IA Claude (Anthropic) acelerou em pelo menos três vezes o tempo de execução de tarefas específicas de _scaffolding_, geração de _migrations_ SQL e auditoria de segurança. A unidade de análise é o tempo de execução de tarefas delimitadas, e não a quantidade de linhas de código produzida. Apresentam-se três exemplos rastreáveis, aderentes ao enunciado, conforme a Tabela 4.3.

**Tabela 4.3 — Exemplos rastreáveis de aceleração por IA (H3)**

| Iteração        | Tarefa                                                                                       | Estimativa sem IA | Com IA                      |
| :-------------- | :------------------------------------------------------------------------------------------- | :---------------- | :-------------------------- |
| Iterações 1 e 2 | _Scaffolding_ inicial: autenticação multiperfil, estrutura de pastas e primeiros componentes | 5 a 6 dias        | aprox. 2 dias               |
| Iteração 9      | Geração de _migrations_ SQL com políticas RLS e gatilhos                                     | 3 a 4 dias        | aprox. 1 dia                |
| Iteração 24     | Auditoria sistemática das políticas RLS nas 11 tabelas                                       | aprox. 3 dias     | aprox. 1 sessão de trabalho |

Fonte: O autor (2026).

A leitura dos três casos revela que o ganho varia conforme a natureza da tarefa. Na geração de _migrations_ SQL e na auditoria de segurança, atividades de domínio bem delimitado e repetitivo, a razão entre o tempo estimado sem IA e o tempo efetivamente despendido superou o fator de três vezes previsto pela hipótese. No _scaffolding_ inicial, que envolve decisões de estrutura, o ganho aproximou-se do limiar (cerca de duas vezes e meia a três vezes) sem superá-lo de forma consistente, em razão da carga de decisão de produto e de arquitetura embutida nessa etapa.

Em coerência com o critério de confirmação por categoria estabelecido na seção 3.3, conclui-se que a hipótese H3 é confirmada para as categorias de geração de _migrations_ SQL e de auditoria de segurança, nas quais o fator excede três vezes, e considerada apenas parcialmente atendida para a montagem inicial de módulos, cuja natureza decisória aproxima o ganho do limiar sem ultrapassá-lo de modo estável. As estimativas de tempo são retrospectivas, elaboradas pelo próprio desenvolvedor com base na experiência anterior em _stacks_ tradicionais, e estão sujeitas a viés de confirmação pela ausência de grupo de controle. Essa limitação e o protocolo de medição que a enquadra estão descritos na seção 3.3 e são retomados na seção 4.7.

## 4.7 Discussão

Os resultados das três hipóteses, tomados em conjunto, sustentam a viabilidade de desenvolver um SaaS funcional, seguro e em uso real por um desenvolvedor único, em prazo acadêmico, quando se combinam uma plataforma de backend como serviço e o apoio de IA generativa. Esta seção confronta esses resultados com a literatura e delimita os seus limites de validade.

### 4.7.1 Confronto com a Literatura

O resultado de H3 deve ser lido em relação ao estudo de Peng et al. (2023), que mediu ganho de produtividade da ordem de 55,8% em uma tarefa de programação geral assistida por IA. Não há contradição entre esse valor e o fator de pelo menos três vezes observado neste trabalho, porque os escopos de medição são distintos. O estudo de Peng et al. (2023) avaliou produtividade média em uma tarefa de codificação genérica, ao passo que H3 mede tarefas específicas e delimitadas, de natureza repetitiva e de domínio bem definido (geração de _migrations_ SQL com RLS e gatilhos, e auditoria de segurança), nas quais é esperado ganho superior à média. H3 deve, portanto, ser entendida como referente a um subconjunto de tarefas em que a aceleração é maior, e não como estimativa de ganho médio sobre toda a atividade de desenvolvimento.

Quanto a H2, a enumeração dos serviços de backend dispensados é coerente com a caracterização da literatura de computação em nuvem (MELL; GRANCE, 2011), que situa a autenticação, a autorização, a API de dados e o armazenamento entre os componentes de maior custo de implementação em _stacks_ convencionais. O resultado deste trabalho ilustra, em um caso concreto, o deslocamento desse custo para a plataforma gerenciada.

### 4.7.2 O que os Resultados Sugerem

Tomados em conjunto, os resultados sugerem que o arranjo entre backend como serviço e IA generativa altera o que é viável para um desenvolvedor único em prazo curto. A plataforma BaaS absorve grande parte do esforço de backend que, de outro modo, exigiria implementação manual, e a IA generativa comprime o tempo das tarefas mais repetitivas e delimitadas. O esforço do desenvolvedor concentra-se, então, nas decisões de produto, de arquitetura e de experiência de usuário, nas quais o julgamento humano permaneceu determinante. Esse deslocamento de esforço é o que torna plausível a entrega observada em H1.

### 4.7.3 Limitações de Validade

Os resultados estão sujeitos a limitações de validade que devem ser consideradas em sua interpretação:

- **Validade interna:** as estimativas de tempo que sustentam H3 e a avaliação de qualidade segundo a ISO/IEC 25010 foram produzidas pelo próprio desenvolvedor, sem grupo de controle e sem avaliador independente, o que as expõe a viés de confirmação. A redução de esforço de H2 é uma estimativa qualitativa, e não uma medição experimental.
- **Validade externa:** trata-se de um estudo de caso único, com um sistema, um desenvolvedor e um conjunto restrito de usuários reais. Os resultados não autorizam generalização direta para outros desenvolvedores, domínios ou escalas de projeto.
- **Cobertura de testes:** a ausência de testes de integração automatizados (para procedimentos remotos, políticas RLS, gatilhos e Edge Functions) e de testes de ponta a ponta significa que parte do comportamento do sistema foi validada apenas por testes manuais, e que requisitos de desempenho sob carga não foram verificados empiricamente. Acresce-se que a campanha estruturada de testes manuais permanecia em execução à data de redação, de modo que parte do roteiro de 187 itens ainda não havia sido integralmente percorrida.

Essas limitações não invalidam as confirmações das hipóteses no escopo deste estudo de caso, mas delimitam o alcance das conclusões. O detalhamento das limitações remanescentes e as direções de trabalho futuro são tratados no Capítulo 5.
