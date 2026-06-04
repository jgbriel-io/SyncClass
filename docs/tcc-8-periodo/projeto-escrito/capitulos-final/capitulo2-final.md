# 2 REFERENCIAL TEÓRICO

Este capítulo apresenta os fundamentos teóricos que sustentam o desenvolvimento do SyncClass e embasam as três hipóteses do trabalho. A seção 2.1 contextualiza o domínio de aplicação: o mercado de professores autônomos de inglês no Brasil. As seções seguintes cobrem os conceitos que orientaram as decisões de arquitetura (H2), a metodologia de desenvolvimento (H1) e o uso de Inteligência Artificial como aceleradora (H3). Completam o conjunto a norma ISO/IEC 25010, a Lei Geral de Proteção de Dados e as práticas de integração e entrega contínuas.

## 2.1 Contexto do Domínio

O ensino de inglês por professores autônomos constitui um segmento expressivo do mercado educacional brasileiro. Segundo o Instituto Brasileiro de Geografia e Estatística (IBGE, 2022), o trabalho por conta própria apresentou crescimento consistente na última década, movimento que alcança também o setor de educação e reflete a expansão do ensino particular informal. O British Council (2023) documenta a relevância global do inglês como fator de empregabilidade e desenvolvimento profissional, contexto que sustenta a demanda contínua por aulas particulares do idioma. O Centro de Inovação para a Educação Brasileira (CIEB, 2024), por sua vez, aponta que a adoção de tecnologia na educação brasileira ocorre de forma desigual entre redes e contextos de ensino, panorama do qual se depreende a carência de ferramentas especializadas para profissionais que atuam fora de instituições estruturadas.

Esse contexto caracteriza um problema prático e verificável: profissionais com agenda diversificada, múltiplos alunos e fluxo financeiro recorrente operam, na maioria dos casos, sem ferramentas especializadas de gestão. Planilhas eletrônicas, aplicativos de mensagens e controles manuais são os instrumentos mais comuns, gerando retrabalho e risco de perda de informação. Em entrevista conduzida na fase de levantamento de requisitos deste trabalho, um professor autônomo de inglês relatou dedicar mais de cinco horas semanais a tarefas administrativas (agendamento, controle de frequência e cobrança) em detrimento da atividade pedagógica.

O SyncClass foi concebido para eliminar essa fricção operacional, reunindo em uma única plataforma web o controle de alunos, aulas, frequência, atividades e cobranças. A constatação do problema antecedeu o desenvolvimento: o sistema originou-se de uma demanda real de um professor autônomo de inglês, cujos requisitos foram coletados por meio de entrevistas diretas antes do início da implementação. A existência de um problema de domínio concreto sustenta as hipóteses H2 e H3: a adoção de _Backend as a Service_ e de Inteligência Artificial como aceleradora só se justifica se o produto gerado for relevante e viável para o público-alvo.

## 2.2 Sistemas de Informação

Sistemas de Informação (SI) são conjuntos organizados de pessoas, processos, dados e tecnologia que coletam, processam, armazenam e distribuem informações para apoiar a tomada de decisão (LAUDON; LAUDON, 2014). A categoria abrange desde sistemas transacionais operacionais até sistemas de apoio gerencial e estratégico, diferenciados pelo nível organizacional que atendem.

O SyncClass enquadra-se como um SI operacional voltado à gestão de processos educacionais e financeiros, cobrindo desde o cadastro de alunos até a emissão e o acompanhamento de cobranças recorrentes. A natureza transacional do sistema (registros de aulas, pagamentos e atividades) orientou decisões de modelagem apresentadas na seção 3.5, em especial a exigência de consistência nos dados financeiros.

## 2.3 SaaS e Computação em Nuvem

A computação em nuvem é definida pelo _National Institute of Standards and Technology_ (NIST) como um modelo que permite acesso ubíquo, conveniente e sob demanda a um conjunto compartilhado de recursos computacionais configuráveis, provisionados e liberados com mínimo esforço de gerenciamento (MELL; GRANCE, 2011). A taxonomia do NIST estabelece três modelos de serviço:

- **IaaS (_Infrastructure as a Service_):** infraestrutura virtualizada sob demanda, como máquinas virtuais, redes e armazenamento (ex.: AWS EC2, Google Compute Engine);
- **PaaS (_Platform as a Service_):** plataforma de desenvolvimento gerenciada, abstraindo a infraestrutura subjacente (ex.: Heroku, Railway);
- **SaaS (_Software as a Service_):** software entregue via web, sem instalação local, consumido diretamente pelo usuário final (ex.: Google Workspace, Salesforce).

O SyncClass adota o modelo SaaS para o produto final, acessível por professores e alunos diretamente no navegador, e utiliza o Supabase como camada de _Backend as a Service_ (BaaS). Embora a taxonomia do NIST não contemple o BaaS como categoria própria, este trabalho o posiciona funcionalmente no nível PaaS, por oferecer plataforma gerenciada de serviços de backend consumida pelo desenvolvedor. A distinção entre o modelo de entrega do produto (SaaS) e o modelo de consumo de infraestrutura (BaaS) é relevante para a hipótese H2, detalhada na seção 2.7.2.

## 2.4 Ciclo de Vida e Metodologia de Desenvolvimento

O desenvolvimento do SyncClass adotou um modelo iterativo incremental, no qual cada iteração entregou funcionalidades completas e testadas, sem fases sequenciais rígidas (PRESSMAN; MAXIM, 2016). Nesse modelo, o software evolui por incrementos sucessivos: cada iteração parte de um escopo definido, produz uma versão funcional e alimenta o planejamento da iteração seguinte. Essa estrutura permite ajustes contínuos de escopo e prioridade sem comprometer a rastreabilidade do progresso, característica relevante para um projeto conduzido por um único desenvolvedor.

Anderson (2010) descreve a evolução de sistemas de gestão de fluxo de trabalho como processo gradual, orientado pela limitação de trabalho em progresso. O projeto incorporou esse princípio ao manter um único foco por iteração, gerenciado via _branches_ git e _commits_ semânticos, sem cerimônias formais de _sprint_ ou quadros visuais explícitos. A justificativa completa da escolha metodológica, incluindo o enquadramento como pesquisa-ação, é apresentada no Capítulo 3.

## 2.5 Qualidade de Software — ISO/IEC 25010

A norma ISO/IEC 25010 define um modelo de qualidade de produto de software composto por oito características principais (ISO/IEC, 2011), apresentadas no Quadro 2.1.

**Quadro 2.1 — Características de qualidade da ISO/IEC 25010**

| Característica           | Descrição                                             |
| :----------------------- | :---------------------------------------------------- |
| Adequação funcional      | O software realiza as funções especificadas           |
| Eficiência de desempenho | Uso adequado de recursos sob condições estabelecidas  |
| Compatibilidade          | Coexistência e interoperabilidade com outros sistemas |
| Usabilidade              | Facilidade de aprendizado e operação                  |
| Confiabilidade           | Disponibilidade e tolerância a falhas                 |
| Segurança                | Proteção de dados e controle de acesso                |
| Manutenibilidade         | Facilidade de modificação e evolução                  |
| Portabilidade            | Adaptabilidade a diferentes ambientes                 |

Fonte: Adaptado de ISO/IEC (2011).

Para o SyncClass, quatro características foram priorizadas com base nas restrições do domínio e do contexto de desenvolvimento:

- **Segurança:** o sistema opera em modelo _multi-tenant_, com dados financeiros e pessoais de múltiplos professores e alunos. O isolamento por _Row Level Security_ (RLS) e a conformidade com a LGPD são requisitos não negociáveis;
- **Confiabilidade:** o módulo financeiro (cobranças recorrentes e histórico de pagamentos) exige consistência e disponibilidade, pois falhas nesse módulo impactam diretamente a receita do professor;
- **Manutenibilidade:** com um único desenvolvedor responsável pelo ciclo completo, a facilidade de modificação e extensão do código é fator crítico de sustentabilidade do projeto;
- **Usabilidade:** o público-alvo são professores autônomos sem suporte de TI; a interface deve ser operável sem treinamento formal, minimizando a fricção de adoção.

O método de avaliação é descrito na seção 3.7, e os resultados são apresentados no Capítulo 4.

## 2.6 Engenharia de Requisitos

Requisitos de software são descrições dos serviços que o sistema deve fornecer e das restrições sob as quais deve operar (SOMMERVILLE, 2011). Dividem-se em duas categorias principais:

- **Requisitos Funcionais (RF):** especificam o que o sistema deve fazer: funcionalidades, comportamentos e respostas a entradas;
- **Requisitos Não Funcionais (RNF):** especificam restrições de qualidade, desempenho e segurança que governam o comportamento do sistema.

A engenharia de requisitos compreende não apenas a especificação, mas o processo de elicitação, análise, validação e gerenciamento dos requisitos ao longo do ciclo de vida (SOMMERVILLE, 2011). No SyncClass, a elicitação foi realizada por meio de entrevistas com um professor autônomo de inglês, usuário real do sistema, e análise comparativa de ferramentas de gestão disponíveis no mercado. O processo é documentado na seção 3.4, e a especificação completa dos 30 requisitos funcionais implementados consta do Apêndice B.

## 2.7 Arquitetura de Software

### 2.7.1 Arquitetura Monolítica Modular

O SyncClass adota arquitetura monolítica modular no frontend, com separação de responsabilidades por camadas: componentes de interface, _hooks_ de lógica, serviços de acesso a dados e banco. Essa decisão segue a recomendação de Fowler (2015) de iniciar novos projetos com arquitetura monolítica, abordagem denominada _MonolithFirst_, e extrair microsserviços apenas quando os limites de domínio estiverem estabilizados e a escala justificar a complexidade operacional adicional. Para um projeto conduzido por um único desenvolvedor em prazo acadêmico, o monolito modular reduz a sobrecarga de infraestrutura e mantém o ciclo de desenvolvimento coeso.

### 2.7.2 BaaS (_Backend as a Service_)

_Backend as a Service_ (BaaS) é um modelo em que o provedor oferece infraestrutura de backend gerenciada (banco de dados, autenticação, armazenamento e funções _serverless_) consumida via SDK ou API, eliminando a necessidade de desenvolver e operar uma API REST tradicional (SUPABASE, 2024; MELL; GRANCE, 2011).

O Supabase é um BaaS de código aberto que provê PostgreSQL gerenciado, autenticação baseada em JWT (_JSON Web Token_), armazenamento de arquivos, comunicação em tempo real via WebSocket e funções _serverless_ (Edge Functions). A escolha do Supabase como plataforma BaaS fundamenta diretamente a hipótese H2: serviços de backend que demandariam implementação manual em uma stack Node.js + Express + PostgreSQL (autenticação, API de dados, controle de acesso e armazenamento) foram provisionados pela plataforma. A quantificação dessa redução de esforço é apresentada na seção 3.5 e no Capítulo 4.

## 2.8 Banco de Dados Relacional

O PostgreSQL é adotado como banco de dados nativo do Supabase: a escolha da plataforma BaaS determinou o banco, não o contrário. O PostgreSQL oferece suporte a tipos avançados (UUID, JSONB, TIMESTAMPTZ) e ao mecanismo de _Row Level Security_ (RLS), que restringe o acesso a linhas individuais de uma tabela com base na identidade do usuário autenticado (POSTGRESQL GLOBAL DEVELOPMENT GROUP, 2024).

O RLS é o mecanismo central de isolamento _multi-tenant_ do SyncClass: cada professor acessa exclusivamente os dados associados ao seu identificador de usuário, com a restrição aplicada no nível do banco de dados, independentemente de filtros na camada de aplicação. A implementação detalhada das políticas RLS é apresentada na seção 3.5.

## 2.9 Lei Geral de Proteção de Dados

A Lei nº 13.709/2018, Lei Geral de Proteção de Dados Pessoais (LGPD), estabelece regras para coleta, armazenamento e tratamento de dados pessoais no Brasil (BRASIL, 2018). O Art. 16, inciso I, determina que os dados pessoais devem ser eliminados após o término do tratamento, salvo nas hipóteses previstas em lei, dispositivo que orienta diretamente a implementação de _soft delete_ e anonimização no sistema.

O SyncClass implementa os seguintes mecanismos de conformidade:

- anonimização de dados pessoais por meio de campo dedicado de controle (`anonymized_at`);
- _soft delete_ com preservação de registros para fins de auditoria, sem exposição de dados ativos;
- coleta de dados mínimos necessários para a operação do serviço, sem obrigatoriedade de CPF;
- registros de auditoria para rastreabilidade de operações sensíveis.

## 2.10 DevOps e CI/CD

CI/CD (_Continuous Integration / Continuous Delivery_) é a prática de automatizar _build_, testes e _deploy_ a cada mudança de código, reduzindo o tempo entre a escrita do código e sua entrega em produção (HUMBLE; FARLEY, 2010). A integração contínua garante que cada alteração seja validada automaticamente; a entrega contínua estende essa validação até a publicação do software.

O SyncClass utiliza GitHub Actions para integração contínua, com execução automática de análise estática, verificação de tipos, testes e _build_ a cada _push_. A entrega contínua é realizada via _deploy_ automático para o Cloudflare Pages: após aprovação no pipeline de CI, a _build_ é publicada na CDN global da Cloudflare sem intervenção manual. Essa automação completa o ciclo CI/CD e garante que cada iteração resulte em uma versão acessível ao usuário final. O pipeline é detalhado na seção 3.9.

## 2.11 IA no Desenvolvimento de Software

O uso de _Large Language Models_ (LLMs) como assistentes de programação representa uma mudança estrutural no desenvolvimento de software, ampliando a capacidade produtiva de desenvolvedores individuais. Ferramentas como GitHub Copilot e Claude (Anthropic) são capazes de gerar código, identificar erros, sugerir refatorações e produzir documentação técnica (CHEN et al., 2021).

Peng et al. (2023) documentaram ganhos de produtividade de 55% em tarefas de programação com assistência de IA, em estudo controlado com desenvolvedores utilizando GitHub Copilot. Cabe ressaltar que esse estudo mede a aceleração em tarefas gerais de codificação, enquanto a hipótese H3 deste trabalho delimita tarefas específicas de domínio bem definido (_scaffolding_, geração de _migrations_ SQL e auditoria de segurança), nas quais o ganho esperado é superior à média geral. A reconciliação entre os dois escopos, com a delimitação metodológica e a declaração das limitações de medição, é apresentada no Capítulo 3.
