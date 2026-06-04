# Capítulo 2 — Referencial Teórico

Este capítulo apresenta os fundamentos teóricos que sustentam o desenvolvimento do SyncClass e embasam as três hipóteses do trabalho. A seção 2.1 contextualiza o domínio de aplicação — o mercado de professores autônomos de inglês no Brasil — e justifica a existência do produto. As seções seguintes cobrem os conceitos técnicos que orientaram as decisões de arquitetura (H2: redução de esforço backend com BaaS), metodologia de desenvolvimento (H1: prazo com desenvolvedor solo) e uso de IA como aceleradora (H3). A norma ISO/IEC 25010, a LGPD e as práticas de CI/CD completam o conjunto de referências que permeiam os capítulos subsequentes.

## 2.1 Contexto do Domínio

O ensino de inglês por professores autônomos constitui um segmento expressivo do mercado educacional brasileiro. Segundo o Instituto Brasileiro de Geografia e Estatística (IBGE, 2022), o número de trabalhadores por conta própria no setor de educação cresceu de forma consistente na última década, refletindo a expansão do ensino particular informal. O Centro de Inovação para a Educação Brasileira (CIEB, 2024) aponta que professores autônomos dedicam parcela significativa do tempo de trabalho a tarefas administrativas — agendamento, controle de frequência e cobrança — em detrimento da atividade pedagógica. O British Council (2023) reforça a demanda por ensino de inglês no Brasil como fator de empregabilidade e desenvolvimento profissional, indicando que a procura por aulas particulares permanece aquecida.

Esse contexto caracteriza um problema prático e verificável: profissionais com agenda diversificada, múltiplos alunos e fluxo financeiro recorrente operam, na maioria dos casos, sem ferramentas especializadas de gestão. Planilhas, aplicativos de mensagens e controles manuais são os instrumentos mais comuns, gerando retrabalho e risco de perda de informação. O SyncClass foi concebido para eliminar essa fricção operacional, reunindo em uma única plataforma web o controle de alunos, aulas, frequência, atividades e cobranças. A constatação desse problema antecedeu o desenvolvimento: o sistema originou-se de uma demanda real de um professor autônomo de inglês, cujos requisitos foram coletados por meio de entrevistas diretas antes do início da implementação.

A existência de um problema de domínio concreto sustenta diretamente H2 e H3: a adoção de BaaS e de IA como aceleradora só se justifica se o produto gerado for relevante e viável para o público-alvo.

## 2.2 Sistemas de Informação

Sistemas de Informação (SI) são conjuntos organizados de pessoas, processos, dados e tecnologia que coletam, processam, armazenam e distribuem informações para apoiar a tomada de decisão (LAUDON; LAUDON, 2014).

O SyncClass enquadra-se como um SI operacional voltado à gestão de processos educacionais e financeiros, cobrindo desde o cadastro de alunos até a emissão e acompanhamento de cobranças recorrentes.

## 2.3 SaaS e Computação em Nuvem

A computação em nuvem é definida pelo NIST como um modelo que permite acesso ubíquo, conveniente e sob demanda a um conjunto compartilhado de recursos computacionais configuráveis (MELL; GRANCE, 2011). Os três modelos de serviço são:

- **IaaS (_Infrastructure as a Service_):** infraestrutura virtualizada sob demanda (ex.: AWS EC2, Google Compute Engine).
- **PaaS (_Platform as a Service_):** plataforma de desenvolvimento gerenciada (ex.: Heroku, Railway).
- **SaaS (_Software as a Service_):** software entregue via web, sem instalação local (ex.: Google Workspace, Salesforce).

O SyncClass adota o modelo SaaS para o produto final — acessível por professores e alunos diretamente no navegador — e utiliza o Supabase como camada de BaaS (_Backend as a Service_), classificado funcionalmente no nível PaaS da taxonomia NIST.

## 2.4 Ciclo de Vida e Metodologia de Desenvolvimento

O desenvolvimento do SyncClass adotou um **modelo iterativo incremental com ciclos semanais**, no qual cada iteração entregou funcionalidades completas e testadas, sem fases sequenciais rígidas (PRESSMAN; MAXIM, 2016). Esse modelo permite ajustes contínuos de escopo e prioridade sem comprometer a rastreabilidade do progresso — característica relevante para um projeto conduzido por um único desenvolvedor.

Anderson (2010) descreve a evolução de sistemas de gestão de fluxo de trabalho como processo gradual, orientado pela limitação de trabalho em progresso. O projeto incorporou esse princípio ao manter um único foco por ciclo semanal, gerenciado via _branches_ git e _commits_ semânticos, sem cerimônias formais de _sprint_ ou quadros Kanban explícitos.

## 2.5 Qualidade de Software — ISO/IEC 25010

A norma ISO/IEC 25010 define um modelo de qualidade de produto de software com oito características principais (ISO/IEC, 2011):

| Característica           | Descrição                             |
| ------------------------ | ------------------------------------- |
| Adequação funcional      | O software faz o que deve fazer       |
| Eficiência de desempenho | Uso adequado de recursos              |
| Compatibilidade          | Coexistência e interoperabilidade     |
| Usabilidade              | Facilidade de uso                     |
| Confiabilidade           | Disponibilidade e tolerância a falhas |
| Segurança                | Proteção de dados e acesso            |
| Manutenibilidade         | Facilidade de modificação             |
| Portabilidade            | Adaptabilidade a diferentes ambientes |

Para o SyncClass, quatro características foram priorizadas com base nas restrições do domínio e do contexto de desenvolvimento:

- **Segurança:** o sistema opera em modelo multi-tenant, com dados financeiros e pessoais de múltiplos professores e alunos. O isolamento por _Row Level Security_ (RLS) e a conformidade com a LGPD são requisitos não negociáveis.
- **Confiabilidade:** o módulo financeiro — cobranças recorrentes, histórico de pagamentos — exige consistência e disponibilidade; falhas nesse módulo impactam diretamente a receita do professor.
- **Manutenibilidade:** com um único desenvolvedor responsável pelo ciclo completo, a facilidade de modificação e extensão do código é fator crítico de sustentabilidade do projeto.
- **Usabilidade:** o público-alvo são professores autônomos sem suporte de TI; a interface deve ser operável sem treinamento formal, minimizando fricção de adoção.

## 2.6 Engenharia de Requisitos

Requisitos de software são descrições dos serviços que o sistema deve fornecer e as restrições sob as quais deve operar (SOMMERVILLE, 2011). Dividem-se em:

- **Requisitos Funcionais (RF):** especificam o que o sistema deve fazer — funcionalidades, comportamentos e respostas a entradas.
- **Requisitos Não Funcionais (RNF):** especificam restrições de qualidade, desempenho e segurança que governam o comportamento do sistema.

A coleta de requisitos do SyncClass foi realizada por meio de entrevistas com um professor autônomo de inglês e análise comparativa de ferramentas de gestão disponíveis no mercado.

## 2.7 Arquitetura de Software

### 2.7.1 Arquitetura Monolítica Modular

O SyncClass adota arquitetura **monolítica modular** no frontend, com separação clara de responsabilidades por camadas (`Components → Hooks → Services → Banco`). Essa decisão segue a recomendação de Fowler (2015) de iniciar novos projetos com arquitetura monolítica — _MonolithFirst_ — e extrair microsserviços apenas quando limites de domínio estiverem estabilizados e a escala justificar a complexidade operacional adicional. Para um projeto solo em prazo acadêmico, o monolito modular reduz a sobrecarga de infraestrutura e mantém o ciclo de desenvolvimento coeso.

### 2.7.2 BaaS (_Backend as a Service_)

_Backend as a Service_ (BaaS) é um modelo em que o provedor oferece infraestrutura de backend gerenciada — banco de dados, autenticação, armazenamento, funções serverless — como serviço consumido via SDK ou API, eliminando a necessidade de desenvolver e operar uma API REST tradicional (SUPABASE, 2024; MELL; GRANCE, 2011).

O Supabase é um BaaS open-source que provê PostgreSQL gerenciado, autenticação baseada em JWT, _storage_ de arquivos, _realtime_ via WebSocket e funções serverless (Edge Functions). A escolha do Supabase como plataforma BaaS para o SyncClass fundamenta diretamente H2: a hipótese sustenta que superfícies de backend que demandariam implementação manual em uma stack Node.js + Express + PostgreSQL foram provisionadas pelo Supabase, reduzindo o esforço de desenvolvimento backend em pelo menos 60%. A quantificação dessa redução é apresentada nos Capítulos 5 e 10.

## 2.8 Banco de Dados Relacional

O PostgreSQL é adotado como banco de dados nativo do Supabase — a escolha da plataforma BaaS determinou o banco, não o contrário. O PostgreSQL oferece suporte a tipos avançados (UUID, JSONB, TIMESTAMPTZ) e ao mecanismo de **_Row Level Security_ (RLS)**, que restringe o acesso a linhas individuais com base na identidade do usuário autenticado (POSTGRESQL GLOBAL DEVELOPMENT GROUP, 2024). O RLS é o mecanismo central de isolamento multi-tenant do SyncClass: cada professor acessa exclusivamente os dados associados ao seu identificador de usuário, sem necessidade de filtros adicionais nas consultas da aplicação.

## 2.9 LGPD

A Lei nº 13.709/2018 — Lei Geral de Proteção de Dados — estabelece regras para coleta, armazenamento e tratamento de dados pessoais no Brasil (BRASIL, 2018). O Art. 16, inciso I, da referida lei determina que os dados pessoais devem ser eliminados após o término do tratamento, salvo nas hipóteses previstas em lei — o que orienta a implementação de _soft delete_ e anonimização no sistema.

O SyncClass implementa os seguintes mecanismos de conformidade:

- Anonimização de dados pessoais via campo `anonymized_at`.
- _Soft delete_ com preservação de registros para fins de auditoria sem exposição de dados ativos.
- Ausência de CPF obrigatório — dados mínimos necessários para a operação do serviço.
- Logs de auditoria para rastreabilidade de operações sensíveis.

## 2.10 DevOps e CI/CD

**CI/CD (_Continuous Integration / Continuous Delivery_)** é a prática de automatizar _build_, testes e _deploy_ a cada mudança de código, reduzindo o tempo entre a escrita de código e sua entrega em produção (HUMBLE; FARLEY, 2010).

O SyncClass utiliza **GitHub Actions** para integração contínua — execução automática de lint, _type-check_, testes e _build_ a cada _push_. O **Continuous Delivery** é realizado via deploy automático para o **Cloudflare Pages**: após aprovação no pipeline de CI, a _build_ é publicada na CDN global da Cloudflare sem intervenção manual. Essa integração completa o ciclo CI/CD e garante que cada iteração semanal resulte em uma versão acessível ao usuário final.

## 2.11 IA no Desenvolvimento de Software

O uso de _Large Language Models_ (LLMs) como assistentes de programação representa uma mudança no desenvolvimento de software, ampliando a capacidade produtiva de desenvolvedores individuais. Ferramentas como GitHub Copilot e Claude (Anthropic) são capazes de gerar código, identificar erros, sugerir refatorações e produzir documentação técnica (CHEN et al., 2021).

Peng et al. (2023) documentaram ganhos de produtividade de 55% em tarefas de programação com assistência de IA em estudo com desenvolvedores usando GitHub Copilot. Esse dado constitui referência da literatura para a ordem de grandeza de aceleração possível com ferramentas de IA — relevante como contexto comparativo para as hipóteses deste trabalho. A análise do impacto específico da IA no desenvolvimento do SyncClass, com delimitação de escopo e declaração de limitações metodológicas, é apresentada no Capítulo 3.
