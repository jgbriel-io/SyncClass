# 3 METODOLOGIA

Este capítulo descreve as escolhas metodológicas que orientaram o desenvolvimento do SyncClass. São apresentados a classificação da pesquisa, o processo de desenvolvimento adotado, o protocolo de uso e medição da inteligência artificial como instrumento de aceleração, e o percurso técnico do projeto: engenharia de requisitos, arquitetura e modelagem, desenvolvimento do sistema, qualidade e testes, gestão e infraestrutura. O capítulo encerra com o quadro de ferramentas e tecnologias empregadas ao longo dos 4,5 meses do projeto. As evidências e a análise quantitativa das hipóteses são tratadas no Capítulo 4 (Resultados e Discussão); o cronograma executado é apresentado no capítulo de Cronograma de Atividades.

---

## 3.1 Classificação da Pesquisa

O presente trabalho classifica-se como **pesquisa aplicada**, pois tem por objetivo desenvolver um sistema funcional capaz de resolver um problema real e identificado: a ausência de ferramentas acessíveis para gestão integrada de professores autônomos de inglês. A motivação não é a produção de conhecimento teórico generalizado, mas a entrega de um artefato operacional com validação em contexto real de uso.

Quanto à abordagem, a pesquisa combina elementos **qualitativos e quantitativos**. A dimensão qualitativa manifesta-se na análise dos ciclos de desenvolvimento, nas decisões arquiteturais e na avaliação das hipóteses H1 e H2. A dimensão quantitativa sustenta a hipótese H3, com estimativas de tempo de execução de tarefas específicas comparadas a uma linha de base retrospectiva.

Do ponto de vista dos objetivos, a pesquisa tem caráter **exploratório**, pois investiga em que medida ferramentas de inteligência artificial generativa podem acelerar o desenvolvimento de software em projetos conduzidos por um único desenvolvedor, cenário ainda pouco estudado de forma sistemática na literatura de Engenharia de Software.

Quanto aos procedimentos, adota-se a **pesquisa-ação**, conforme conceituada por Thiollent (2011) e Tripp (2005). Nessa modalidade, o pesquisador não é um observador externo: ele está inserido no objeto de estudo, intervém de forma sistemática e reflexiva, e ajusta o curso da investigação com base nas observações coletadas em cada ciclo. Thiollent (2011) define a pesquisa-ação como uma estratégia metodológica em que a ação e a reflexão ocorrem de forma integrada, em ciclos iterativos de planejamento, execução, observação e retorno crítico. Tripp (2005) complementa ao caracterizar a pesquisa-ação pela alternância deliberada entre agir e investigar, com o propósito explícito de melhorar tanto a prática quanto a compreensão sobre ela.

No SyncClass, a pesquisa-ação manifestou-se de forma concreta ao longo das 31 iterações de desenvolvimento: cada ciclo semanal constituiu uma instância do ciclo reflexivo, com planejamento de escopo, ação de implementação, observação por meio de testes e commits, e reflexão documentada no backlog da iteração seguinte. A inserção do pesquisador como desenvolvedor não é uma limitação metodológica a ser mitigada, mas uma condição estrutural da pesquisa-ação, reconhecida e declarada como parte do delineamento.

---

## 3.2 Processo de Desenvolvimento

### 3.2.1 Ciclo de Desenvolvimento e Pesquisa-Ação

O processo de desenvolvimento seguiu um **modelo iterativo incremental com ciclos semanais**, conforme conceituado por Pressman e Maxim (2016). Cada ciclo semanal correspondeu a uma iteração de escopo pré-definido, totalizando 31 iterações entre janeiro e junho de 2026.

A adoção deste modelo, em detrimento de metodologias ágeis mais prescritivas, justifica-se pela natureza solo do projeto e pela necessidade de combinar cadência regular com flexibilidade de escopo. Anderson (2010), ao descrever abordagens de fluxo contínuo, observa que contextos com equipe reduzida e backlog dinâmico se beneficiam da ausência de cerimônias formais; no entanto, a presença de 31 iterações numeradas com escopo e período definidos configura um modelo iterativo incremental, e não um sistema de fluxo puro. A combinação de referências (Anderson, 2010, para justificar a ausência de overhead cerimonial; Pressman e Maxim, 2016, para a estrutura iterativa incremental) reflete adequadamente o processo adotado.

O ciclo da pesquisa-ação (THIOLLENT, 2011; TRIPP, 2005) materializou-se em cada iteração segundo quatro momentos:

1. **Planejamento:** definição do escopo da iteração, levantamento de requisitos funcionais e não funcionais a serem abordados, e identificação de riscos técnicos.
2. **Ação:** implementação das funcionalidades planejadas, com uso sistemático do assistente de IA para tarefas de scaffolding, migrations e auditorias de segurança (ver seção 3.3).
3. **Observação:** execução dos testes automatizados, realização de testes manuais exploratórios e registro de evidências via commits semânticos.
4. **Reflexão:** revisão do que foi entregue, identificação de débitos técnicos e refinamento do backlog para a iteração seguinte.

Este ciclo foi realizado de forma explícita nas trinta e uma iterações, com registros rastreáveis nos documentos de iteração em `docs/sprints/` e nos 152 commits da branch principal.

### 3.2.2 Fluxo de Trabalho e Instrumentos de Registro

O fluxo de trabalho adotado baseou-se em três instrumentos principais de registro e controle:

**Branches git** como separação de ambientes (`feature/* → homolog → main`), garantindo que código em desenvolvimento nunca contaminasse o ambiente de produção. A branch `main` acumula 152 commits ao longo do período de desenvolvimento.

**Commits semânticos** como unidade atômica de registro de progresso. A convenção Conventional Commits foi adotada sistematicamente (`feat:`, `fix:`, `refactor:`, `security:`, `docs:`), permitindo rastrear o tipo e o escopo de cada modificação ao longo do tempo. Os 152 commits constituem o principal instrumento de coleta de dados para as hipóteses H1 e H3, conforme detalhado na seção 3.3.2.

**Pull Requests** como pontos de revisão e integração, funcionando como fronteira formal entre o ambiente de desenvolvimento e o ambiente de homologação.

```
Figura 3.1 – Fluxo de desenvolvimento iterativo do SyncClass
[Diagrama: Planejamento → Branch feature → Desenvolvimento + IA → Commit semântico → PR → Homolog → Teste manual → Merge main]
Fonte: O autor (2026).
[Figura pendente de geração — inserir diagrama antes da entrega final]
```

---

## 3.3 Uso de Inteligência Artificial

### 3.3.1 Ferramentas Utilizadas

O principal instrumento de IA empregado ao longo do desenvolvimento foi o **assistente de IA Claude (Anthropic)**, utilizado de forma interativa e sistemática para tarefas técnicas de alta repetição e domínio bem delimitado.

O assistente de IA foi acionado nos seguintes contextos:

- **Scaffolding inicial de módulos:** geração de estrutura de componentes React com TypeScript, incluindo tipos, props e integração com hooks de serviço.
- **Migrations SQL com RLS e triggers:** redação de migrations para o Supabase, incluindo Row Level Security policies e triggers de atualização de `updated_at`.
- **Auditoria de segurança:** revisão sistemática de policies RLS para verificar cobertura e ausência de vetores de acesso indevido.
- **Refatorações pontuais:** extração de lógica duplicada, renomeação de identificadores e padronização de padrões de código.

Em todos os casos, o código ou SQL gerado pelo assistente foi revisado, testado e aprovado pelo pesquisador antes de ser integrado ao repositório. A seção 3.3.3 detalha as atividades que permaneceram exclusivamente sob responsabilidade humana.

### 3.3.2 Tarefas Aceleradas pela IA e Protocolo de Medição de H3

A hipótese H3 afirma que o uso do assistente de IA acelerou em pelo menos três vezes o tempo de execução de tarefas específicas de scaffolding, geração de migrations SQL e auditoria de segurança.

**Instrumento de coleta:** os dados que sustentam H3 foram coletados por dois meios. O instrumento primário consiste nos commits semânticos registrados via `git log`, que documentam a data, o escopo e a natureza de cada entrega, permitindo estimar o tempo real de cada tarefa com base na proximidade temporal entre commits relacionados. O instrumento secundário consiste em estimativas retrospectivas do desenvolvedor, calibradas pela experiência prévia em projetos equivalentes conduzidos sem assistência de IA.

**Unidade de medição:** tempo de execução de tarefa específica (scaffolding de módulo, migration SQL com RLS, auditoria de policies).

**Linha de base:** estimativa retrospectiva do desenvolvedor com base em experiência anterior em projetos de complexidade equivalente, sem suporte de IA. Não há grupo de controle formal nem coleta prospectiva de tempo.

**Posicionamento em relação à literatura:** Peng et al. (2023), em estudo controlado com 95 desenvolvedores profissionais, identificaram ganho médio de 55,8% de produtividade em tarefas gerais de programação com o GitHub Copilot. O presente trabalho não replica esse delineamento experimental, mas utiliza o resultado como referência de mercado para calibrar as estimativas. A hipótese H3, ao afirmar ganho de pelo menos três vezes (equivalente a aproximadamente 200%), refere-se a um subconjunto específico de tarefas (scaffolding inicial de módulos, geração de migrations SQL com RLS e triggers, e auditorias sistemáticas de segurança) nas quais a IA opera sobre domínios bem delimitados e repetitivos, onde ganhos substancialmente maiores que a média geral são esperados. Esta distinção de escopo é metodologicamente relevante e não configura contradição com Peng et al., cujo estudo mediu produtividade em tarefas heterogêneas de programação geral.

**Exemplos rastreáveis:** a primeira iteração (scaffolding inicial do projeto: configuração de autenticação, estrutura de pastas, primeiros componentes) foi concluída em aproximadamente dois dias; a estimativa retrospectiva indica que o mesmo escopo, sem assistência de IA, demandaria entre cinco e seis dias de desenvolvimento. A nona iteração (geração de doze migrations SQL com RLS policies e triggers) foi concluída em um dia; sem IA, a redação manual de policies para cada tabela demandaria três a quatro dias. A vigésima quarta iteração (auditoria completa de RLS em todas as policies ativas) foi concluída em uma sessão de trabalho; uma auditoria equivalente sem IA demandaria ao menos três dias.

**Limitação metodológica declarada:** as estimativas acima são retrospectivas, realizadas pelo próprio desenvolvedor, sem grupo de controle formal e sem registro prospectivo de tempo. Estão, portanto, sujeitas a viés de confirmação inerente ao executor. O Capítulo 4 trata dessa limitação de forma explícita na análise de H3.

**Validação em ambiente real:** o sistema SyncClass encontra-se em uso por um professor autônomo de inglês e seus alunos desde o período final de desenvolvimento. Essa condição complementa os testes internos automatizados e manuais, adicionando evidência de operabilidade em contexto real, o que reforça a validade externa dos resultados observados.

### 3.3.3 Delimitação: O que a IA Não Realizou

A delimitação do papel da IA é parte integrante do protocolo metodológico, pois circunscreve os limites de validade das hipóteses H2 e H3.

As seguintes atividades foram realizadas exclusivamente pelo pesquisador, sem geração ou decisão automatizada:

- **Decisões de produto:** escopo do sistema, priorização de funcionalidades, definição de regras de negócio e modelagem do domínio (quais entidades, quais relacionamentos, qual semântica).
- **Validação de fluxos reais:** todos os testes manuais, incluindo o QA estruturado da vigésima oitava iteração, com 116 itens verificados em 20 rotas e 5 perfis de acesso, foram executados pelo pesquisador.
- **Decisões arquiteturais:** a escolha do Supabase como BaaS, a adoção de React com TypeScript, a estrutura de camadas e a política de RLS foram decisões do pesquisador; a IA implementou conforme as diretrizes definidas, não as definiu.
- **Revisão e aprovação:** todo código gerado pela IA foi revisado, testado e aprovado pelo pesquisador antes de ser integrado. Nenhum commit foi aceito sem validação humana explícita.
- **Configuração de infraestrutura e deploy:** provisionamento do ambiente Supabase, configuração de domínio, variáveis de ambiente e pipeline de deploy foram realizados diretamente pelo pesquisador.

Esta delimitação é relevante para H3: o ganho de produtividade mensurado refere-se ao tempo de execução de tarefas técnicas definidas, não à redução do esforço cognitivo de concepção do sistema, que permaneceu integralmente sob responsabilidade humana.

---

## 3.4 Engenharia de Requisitos

### 3.4.1 Público-Alvo e Processo de Elicitação

Os requisitos do SyncClass foram coletados por meio de entrevistas com um professor de inglês autônomo e de análise comparativa de ferramentas de gestão disponíveis no mercado. O projeto originou-se de uma demanda real desse profissional, o que permitiu a coleta de requisitos em contexto de uso genuíno e a validação empírica das funcionalidades durante o período de desenvolvimento. A avaliação formal de satisfação e impacto com usuários finais está mapeada como trabalho futuro.

A plataforma atende a três perfis de usuários, descritos na Tabela 3.1.

**Tabela 3.1 — Perfis de usuários do SyncClass**

| Perfil             | Descrição                                                     |
| ------------------ | ------------------------------------------------------------- |
| Professor autônomo | Gerencia seus próprios alunos, aulas, cobranças e atividades  |
| Aluno              | Acessa seu histórico, realiza pagamentos e entrega atividades |
| Administrador      | Visão global da plataforma; gerencia professores e usuários   |

### 3.4.2 Síntese Quantitativa dos Requisitos

Os requisitos funcionais descrevem as funcionalidades que o sistema deve oferecer aos seus usuários (SOMMERVILLE, 2011), enquanto os requisitos não funcionais definem critérios de qualidade, restrições técnicas e atributos de desempenho (PRESSMAN; MAXIM, 2016). No SyncClass, 31 requisitos funcionais foram implementados ao longo das 31 iterações de desenvolvimento, divididos em requisitos principais (RF01–RF20) e adicionais (RF21–RF31). Outros 4 requisitos foram identificados como desejáveis, mas mantidos fora do escopo do MVP e registrados como trabalhos futuros (RF32–RF35): sistema de notificações, exportação de relatórios em PDF, integração com Google Calendar e gamificação. O sistema implementa ainda 36 requisitos não funcionais, distribuídos entre segurança, performance, usabilidade, rastreabilidade e manutenção, e 59 regras de negócio formalizadas como constraints no banco de dados, validações no frontend e lógica em procedimentos armazenados (RPCs).

A Tabela 3.2 apresenta um subconjunto representativo dos requisitos funcionais, escolhido por cobrir os módulos centrais do sistema. A relação completa dos 35 requisitos funcionais consta do Apêndice B; as 59 regras de negócio, do Apêndice C.

**Tabela 3.2 — Requisitos funcionais representativos**

| ID   | Requisito                                               | Módulo     | Prioridade |
| ---- | ------------------------------------------------------- | ---------- | ---------- |
| RF01 | Cadastro e gerenciamento de alunos (CRUD)               | Alunos     | Alta       |
| RF03 | Registro de aulas com data, horário, duração e presença | Aulas      | Alta       |
| RF06 | Geração de cobranças individuais e por pacote           | Financeiro | Alta       |
| RF10 | Pagamento via PIX com QR Code                           | Financeiro | Média      |
| RF13 | Correção de atividades com nota e feedback              | Atividades | Alta       |
| RF20 | Anonimização de dados pessoais (LGPD)                   | LGPD       | Alta       |

Entre os requisitos não funcionais de maior impacto arquitetural destacam-se o isolamento de dados por professor via RLS no PostgreSQL (RNF01), a idempotência em operações financeiras críticas (RNF04), a conformidade com a LGPD por meio de anonimização e soft delete (RNF03) e a obrigatoriedade de paginação em listagens extensas (RNF19). As regras de negócio, por sua vez, governam o comportamento do domínio: a vinculação de cada aluno a exatamente um professor (RN-012), a verificação de sobreposição de horários de aula no banco de dados (RN-019), a garantia de idempotência por meio da tabela `idempotency_keys` (RN-028) e a habilitação obrigatória de RLS em todas as tabelas (RN-036).

### 3.4.3 Casos de Uso

O modelo de casos de uso organiza-se em torno dos três atores do sistema. O professor concentra as operações de gestão (cadastro de alunos, registro de aulas, criação de pacotes, geração e confirmação de cobranças, criação e correção de atividades). O aluno dispõe de acesso predominantemente de leitura, acrescido das permissões de entrega de atividades e de envio de comprovantes de pagamento. O administrador detém visão global, com gestão de professores, usuários e dados financeiros consolidados. Os casos de uso completos, com fluxos principais, alternativos e pós-condições, constam do Apêndice D; a seguir, resumem-se três casos representativos.

**UC01 — Cadastrar aluno.** O professor autenticado preenche nome, e-mail, telefone, dia de pagamento e valor hora-aula. O sistema valida os dados e a unicidade de e-mail e telefone (RN-003, RN-004, RN-008, RN-013), persistindo o registro com o `teacher_id` do professor (RN-012). O aluno passa a ser visível apenas para o professor proprietário e para o administrador, por força da RLS.

**UC02 — Registrar aula.** O professor seleciona o aluno e define data e horários de início e fim. O sistema valida que o horário final é posterior ao inicial (RN-018) e verifica conflito de horário com outras aulas do mesmo professor (RN-019) antes de persistir o registro. A aula passa a constar no histórico do professor e do aluno.

**UC06 — Confirmar pagamento.** O professor (ou o administrador) localiza uma cobrança pendente e aciona sua confirmação. O sistema altera o status para pago, registra o instante do pagamento e grava log de auditoria (RN-030). Quando há comprovante enviado pelo aluno, o professor o examina e aprova ou rejeita antes de confirmar; a idempotência da operação é garantida via `idempotency_keys` (RN-028).

A matriz de rastreabilidade, que associa cada requisito funcional ao respectivo arquivo de implementação, migration e situação de teste, é apresentada integralmente no Apêndice E. Em síntese, aproximadamente 75% dos requisitos funcionais possuem cobertura por testes automatizados; os demais (Edge Functions, geração de QR Code e uploads) foram validados manualmente.

---

## 3.5 Arquitetura e Modelagem

As decisões arquiteturais do SyncClass foram tomadas sob a restrição de um único desenvolvedor, prazo acadêmico de 4,5 meses e custo operacional próximo de zero. Cada escolha estrutural (BaaS em lugar de API REST própria, monolito modular em lugar de microsserviços, SPA em lugar de SSR) foi orientada pela hipótese H2: a adoção do Supabase como plataforma de backend como serviço eliminaria pelo menos 60% do esforço de desenvolvimento backend estimado para uma stack tradicional equivalente.

### 3.5.1 Decisões Arquiteturais

A arquitetura adotada é monolítica modular, conforme a recomendação de Fowler (2015) no padrão _MonolithFirst_: sistemas de domínio ainda em exploração devem começar como monolito, pois os limites de serviço só se tornam evidentes após o produto amadurecer em produção. Microsserviços adicionariam complexidade operacional (service discovery, contratos de API, deploys independentes) sem ganho real em escala compatível com o porte do projeto.

O Supabase foi adotado como Backend as a Service (BaaS). Segundo Mell e Grance (2011), no modelo de computação em nuvem, plataformas dessa natureza eliminam a responsabilidade do desenvolvedor sobre infraestrutura, runtime e serviços transversais. No SyncClass, o Supabase suprimiu seis superfícies que demandariam desenvolvimento manual em uma stack Node.js, Express e PostgreSQL: autenticação (JWT, magic link, reset de senha); banco de dados gerenciado com RLS nativo; storage de arquivos integrado; subscriptions em tempo real via WebSocket; Edge Functions para lógica server-side; e sistema de migrations com versionamento. A eliminação dessas superfícies fundamenta a estimativa qualitativa de redução de esforço de pelo menos 60%, apresentada como aproximação baseada na análise das superfícies suprimidas, não como cálculo formal com grupo de controle.

Duas alternativas foram avaliadas e descartadas. O **Firebase** (Google) adota modelo de dados NoSQL sem suporte nativo a Row Level Security, o que transferiria consultas relacionais complexas para o cliente e implicaria vendor lock-in em ecossistema proprietário. O **PocketBase** apresenta menor maturidade de ecossistema e suporte insuficiente ao controle de acesso baseado em roles complexos exigido pelo modelo multi-tenant (admin, teacher, student). O Supabase, por oferecer PostgreSQL real com RLS nativo, tipagem gerada automaticamente e natureza open-source auto-hospedável, atendeu integralmente aos requisitos.

Quanto à camada de apresentação, optou-se por React em arquitetura SPA compilada pelo Vite. Por se tratar de plataforma de gestão operacional, e não de conteúdo público, SEO não constitui requisito; em contrapartida, a interatividade é elevada (formulários, tabelas com filtros, dashboards). O lazy loading por rota minimiza o bundle inicial, e a ausência de servidor SSR simplifica o pipeline de deploy para hospedagem estática.

### 3.5.2 Modelo de Dados

O banco de dados é composto por 11 tabelas, descritas na Tabela 3.3. O diagrama entidade-relacionamento correspondente será gerado a partir do schema em `supabase/migrations/` e inserido antes da entrega final.

```
Figura 3.2 – Diagrama Entidade-Relacionamento do SyncClass
Fonte: O autor (2026).
[Figura pendente de geração — gerar via dbdiagram.io a partir do schema]
```

**Tabela 3.3 — Tabelas do banco de dados**

| Tabela                        | Papel arquitetural                                                 |
| ----------------------------- | ------------------------------------------------------------------ |
| `teachers`                    | Professores cadastrados; referência central do modelo multi-tenant |
| `students`                    | Alunos por professor; isolados por `teacher_id`                    |
| `profiles`                    | Espelho de `auth.users`; une identidade de autenticação ao domínio |
| `user_roles`                  | Controle de acesso baseado em roles; consultado pelas funções RLS  |
| `class_logs`                  | Registro de aulas ministradas; base de cálculo financeiro          |
| `financial_records`           | Cobranças e pagamentos; centro do módulo financeiro                |
| `financial_record_class_logs` | Relação N:N entre cobranças e aulas (pacotes)                      |
| `activities`                  | Atividades pedagógicas enviadas e corrigidas                       |
| `audit_logs`                  | Registro imutável de operações sensíveis para rastreabilidade      |
| `idempotency_keys`            | Controle de idempotência em operações financeiras (PIX)            |
| `performance_logs`            | Monitoramento de operações lentas; alimenta análise de performance |

As decisões de schema priorizaram integridade e conformidade: `TIMESTAMPTZ` para todos os timestamps, evitando ambiguidades de fuso horário; `NUMERIC(10,2)` para valores monetários, eliminando erro de ponto flutuante; campos de status validados por `CHECK` constraints; e marcadores de soft delete e anonimização que preservam histórico auditável em conformidade com a LGPD.

### 3.5.3 Segurança via Row Level Security

O mecanismo central de segurança é o Row Level Security (RLS) do PostgreSQL, que garante que cada usuário autenticado acesse exclusivamente os dados autorizados para seu role, independentemente da query enviada pelo frontend. A política é avaliada pelo banco de dados, não pela aplicação: ainda que o frontend enviasse uma query sem filtro, o PostgreSQL retornaria apenas as linhas para as quais a policy é satisfeita para o `auth.uid()` corrente.

As políticas apoiam-se em funções auxiliares de role, das quais `is_admin()` é representativa:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

A cláusula `SECURITY DEFINER SET search_path = public, pg_temp` é obrigatória: garante que a função execute com os privilégios do criador, e não do chamador, e previne ataques de substituição de schema via `search_path`. Sem ela, um usuário com permissão de criar schemas poderia redirecionar a função para uma versão maliciosa de `user_roles`. O sistema conta com aproximadamente 54 políticas ativas cobrindo as 11 tabelas para os três roles, assegurando isolamento de dados entre professores distintos.

### 3.5.4 Estimativa Qualitativa de H2

A estimativa de redução de esforço backend (H2) decorre diretamente do número de superfícies eliminadas pelo Supabase, enumeradas na seção 3.5.1. Em uma stack tradicional, cada uma dessas superfícies (autenticação, storage, tempo real, RLS, migrations) exigiria implementação e manutenção próprias. Apoiada no conceito de BaaS de Mell e Grance (2011), a estimativa de redução de pelo menos 60% é qualitativa e fundamentada na contagem das responsabilidades suprimidas. A análise detalhada de H2 é apresentada no Capítulo 4.

---

## 3.6 Desenvolvimento do Sistema

O desenvolvimento foi conduzido sobre a stack relacionada no Quadro de tecnologias da seção 3.10, priorizando produtividade, tipagem de ponta a ponta e qualidade de código. A separação de responsabilidades segue três camadas rígidas: os **componentes** contêm exclusivamente lógica de apresentação; os **hooks** de serviço (`src/hooks/*Service.ts`) encapsulam toda a integração com o Supabase via TanStack Query; e o SDK do Supabase opera somente dentro desses hooks, nunca diretamente nos componentes.

Quatro decisões técnicas centrais orientaram a implementação:

- **Idempotência em operações financeiras (PIX):** falhas de rede ou retentativas do cliente podem provocar o envio repetido de uma mesma solicitação de pagamento, gerando cobrança duplicada. A solução consiste em gerar uma chave única por operação antes de chamar a API de pagamento; na chegada da solicitação, o banco verifica a existência da chave na tabela `idempotency_keys` e, se já registrada, descarta a operação e retorna o resultado original, tornando qualquer número de retentativas equivalente a uma única cobrança efetiva.
- **Isolamento multi-tenant via RLS:** o isolamento entre professores é garantido no banco de dados, e não no frontend. Cada professor acessa apenas seus próprios registros, e o isolamento estende-se ao storage: arquivos são armazenados em caminhos que incluem o `teacher_id`, verificado pelas políticas do Supabase Storage antes de autorizar leitura ou escrita.
- **Centralização da integração em hooks de serviço:** a partir da oitava iteração, nenhum componente passou a chamar o Supabase diretamente, eliminando acoplamento entre apresentação e acesso a dados e concentrando a lógica de cache e invalidação em um único ponto por domínio.
- **Centralização de strings de UI:** entre a décima segunda e a décima quinta iterações, todos os textos de interface foram migrados para arquivos em `src/content/`, organizados por domínio, removendo strings literais dos componentes e preparando a base para internacionalização futura.

A magnitude do artefato produzido é resumida na Tabela 3.4.

**Tabela 3.4 — Métricas do código-fonte**

| Métrica                    | Valor                                         |
| -------------------------- | --------------------------------------------- |
| Commits (branch principal) | 152                                           |
| Arquivos TypeScript (src)  | 329 (excluindo testes, .d.ts e tipos gerados) |
| Componentes React          | 181                                           |
| Hooks customizados         | 37                                            |
| Migrations SQL             | 70                                            |
| Linhas de código (src)     | ~50.000 (excluindo tipos gerados)             |
| Tempo de desenvolvimento   | 4,5 meses (janeiro a junho de 2026)           |

---

## 3.7 Qualidade e Testes

A estratégia de testes baseia-se no modelo de pirâmide proposto por Cohn (2009): testes automatizados unitários compõem a base, e testes manuais estruturados cobrem os fluxos críticos da aplicação. Testes end-to-end automatizados não foram implementados, em decorrência da restrição de prazo; essa ausência é declarada como limitação do projeto.

```
        /\
       /E2E \       <- não implementado (limitação de prazo)
      /------\
     /Manual  \     <- 116 itens verificados, 20 rotas, 5 perfis
    /------------\
   / Unitários   \  <- 304 casos de teste, 28 arquivos Vitest
  /----------------\
```

Os testes unitários foram implementados com Vitest, integrado a Testing Library e jsdom, totalizando 304 casos em 28 arquivos que cobrem hooks de serviço, componentes de listagem, utilitários de formatação e sanitização, schemas Zod e design tokens. Os testes manuais foram conduzidos na vigésima oitava iteração em campanha estruturada que percorreu as 20 rotas da aplicação com 5 perfis de acesso (1 administrador, 2 professores, para verificar o isolamento de dados entre si, e 2 alunos vinculados a professores distintos), totalizando 116 itens verificados; os comportamentos incorretos identificados foram corrigidos nas iterações seguintes.

O sistema foi avaliado segundo o modelo ISO/IEC 25010 (2011). A avaliação foi realizada pelo próprio desenvolvedor, com base em checklist interno rastreado por iteração, e está, portanto, sujeita a viés de confirmação, conforme declarado. Entre as oito características do modelo, quatro foram priorizadas pela centralidade no projeto: a **adequação funcional** (31 requisitos implementados), a **segurança** (auditoria completa de RLS, autenticação JWT, rate limiting, sanitização e conformidade com a LGPD), a **confiabilidade** (idempotência, soft delete e logs de auditoria) e a **manutenibilidade** (refatorações que fragmentaram componentes extensos e a cobertura de 304 testes automatizados).

Reconhecem-se duas limitações da estratégia. A primeira é a ausência de testes de integração automatizados para RPCs, RLS policies, triggers e Edge Functions, cuja verificação dependeu de execução de migrations e de testes manuais. A segunda é a ausência de testes E2E automatizados, identificada como trabalho futuro.

---

## 3.8 Gestão do Projeto

A gestão do projeto apoiou-se em instrumentos de rastreabilidade de duas naturezas distintas, cuja diferenciação é metodologicamente relevante. As **fontes primárias contemporâneas** (os 152 commits com timestamps reais na branch principal e as 70 migrations SQL numeradas sequencialmente) foram registradas no momento da execução e constituem evidência direta do progresso. As **fontes retroativas** (os documentos de iteração em `docs/sprints/`, elaborados pelo próprio pesquisador após os fatos) estão sujeitas a viés de reconstrução. Essa distinção é declarada como limitação de rastreabilidade: a precisão do registro a partir de março de 2026 é estimada, não exata, assim como as estimativas de produtividade discutidas na seção 3.3.2.

Os principais riscos do projeto foram identificados e tratados ao longo do desenvolvimento, conforme a Tabela 3.5, que apresenta uma seleção representativa.

**Tabela 3.5 — Riscos representativos identificados e tratados**

| ID  | Risco                              | Mitigação                                       | Status                          |
| --- | ---------------------------------- | ----------------------------------------------- | ------------------------------- |
| R01 | Perda de histórico git             | Branches de backup (`homolog-old`)              | Ocorreu — mitigado parcialmente |
| R02 | Vulnerabilidades de RLS            | Auditorias periódicas, migrations de correção   | Mitigado                        |
| R04 | Violação de LGPD                   | Soft delete, anonimização, CPF não obrigatório  | Mitigado                        |
| R08 | Monitoramento de erros em produção | Logging restrito ao ambiente de desenvolvimento | Aceito                          |

O risco R01 efetivou-se durante o projeto e foi mitigado apenas parcialmente pela existência de branches de backup, o que motivou a reconstrução retroativa de parte do cronograma. O risco R08 foi conscientemente aceito: o logging opera apenas em ambiente de desenvolvimento, e a ausência de monitoramento de erros em produção é reconhecida como limitação do escopo do MVP. As estimativas de esforço empregadas na gestão são retrospectivas e declaradas como limitação, em coerência com o protocolo de medição de H3. O cronograma efetivamente executado, com as fases e durações reconstruídas, é apresentado no capítulo de Cronograma de Atividades.

---

## 3.9 Infraestrutura e Deploy

A infraestrutura do SyncClass organiza-se em duas camadas independentes: o frontend, servido como aplicação estática, e o backend, provido integralmente pelo Supabase na modalidade BaaS. A opção por não manter servidor de aplicação próprio decorreu de três critérios objetivos: redução da complexidade operacional associada à administração de infraestrutura dedicada; custo zero no tier gratuito das plataformas adotadas, compatível com o orçamento acadêmico; e adequação à escala de um MVP desenvolvido por um único desenvolvedor. O conceito de BaaS, conforme Mell e Grance (2011), caracteriza-se pela delegação de serviços de infraestrutura a um provedor externo gerenciado, permitindo concentrar esforço na lógica de aplicação.

A hospedagem do frontend recai sobre o **Cloudflare Pages**, preferido em relação a Vercel e Netlify por três critérios técnicos: CDN global nativa sem custo adicional; ausência de cold start no tier gratuito, ao contrário das funções gratuitas das alternativas; e integração com Cloudflare Workers, que viabiliza extensão futura sem mudança de provedor. O artefato de build (o diretório `dist/`) é publicado automaticamente pelo pipeline de CI/CD.

O pipeline de **integração e entrega contínua**, definido com GitHub Actions, é acionado por push ou Pull Request e organiza-se em dois jobs sequenciais. O job `quality-check` executa instalação reprodutível de dependências, análise estática (ESLint), verificação de tipos (`tsc --noEmit`), a suíte de 304 testes e a compilação. O job `deploy` executa exclusivamente em push para `main`, após aprovação do primeiro, publicando o build no Cloudflare Pages. Os testes no pipeline utilizam credenciais fictícias (`https://fake-project.supabase.co`): nenhum teste de integração real contra o banco é executado no CI, decisão que mantém o pipeline isolado de infraestrutura externa e garante execução determinística.

No backend, além do PostgreSQL, do Supabase Auth, do Storage e da camada PostgREST, operam quatro **Edge Functions** com runtime Deno. O critério de separação entre Edge Function e RPC PostgreSQL é objetivo: operações que exigem consumo de API externa (AbacatePay) ou uso da chave de serviço (`service_role`) não exposta no cliente são implementadas como Edge Functions; operações internas ao banco, sem necessidade de privilégio elevado, permanecem como RPCs. As quatro funções implementadas são `reset-password`, `admin-delete-user`, `invite-user` e `create-abacate-payment`. A segurança em produção é multicamada: HTTPS obrigatório no transporte, JWT na autenticação, aproximadamente 54 políticas RLS na autorização, rate limiting no banco, credenciais mantidas em GitHub Secrets fora do código e auditoria de operações críticas via `audit_logs`. A análise quantitativa de H2, sustentada pela enumeração das superfícies de backend eliminadas, é apresentada no Capítulo 4.

---

## 3.10 Ferramentas e Tecnologias

A Tabela 3.6 relaciona as tecnologias empregadas no desenvolvimento do SyncClass, com as respectivas versões utilizadas ao longo dos 4,5 meses do projeto.

**Tabela 3.6 — Ferramentas e tecnologias empregadas**

| Camada                 | Tecnologia           | Versão |
| ---------------------- | -------------------- | ------ |
| Interface do usuário   | React                | 18.3   |
| Linguagem              | TypeScript           | 5.8    |
| Build                  | Vite                 | 5.4    |
| Estilização            | Tailwind CSS         | 3.4    |
| Componentes UI         | shadcn/ui (Radix UI) | —      |
| Estado servidor        | TanStack Query       | v5     |
| Formulários            | React Hook Form      | 7      |
| Validação              | Zod                  | 3      |
| Tabelas                | TanStack Table       | 8      |
| Animações              | Framer Motion        | 12     |
| Gráficos               | Recharts             | 2      |
| Backend como Serviço   | Supabase             | 2.90   |
| Banco de dados         | PostgreSQL           | —      |
| Hospedagem do frontend | Cloudflare Pages     | —      |
| CI/CD                  | GitHub Actions       | —      |
| Controle de versão     | Git + GitHub         | —      |
| Assistente de IA       | Claude (Anthropic)   | —      |

As versões de PostgreSQL e do assistente de IA não são fixadas no `package.json` do projeto: o PostgreSQL é gerenciado pela infraestrutura do Supabase, e o assistente de IA foi utilizado de forma interativa, sem integração programática direta.

---

## Referências do Capítulo

- ANDERSON, D. J. _Kanban: Successful Evolutionary Change for Your Technology Business._ Blue Hole Press, 2010.
- COHN, M. _Succeeding with Agile: Software Development Using Scrum._ Boston: Addison-Wesley, 2009.
- FOWLER, M. _MonolithFirst._ 2015. Disponível em: martinfowler.com.
- ISO/IEC 25010:2011. _Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE)._ Genebra: ISO, 2011.
- MELL, P.; GRANCE, T. _The NIST Definition of Cloud Computing._ NIST Special Publication 800-145. Gaithersburg: National Institute of Standards and Technology, 2011.
- PENG, S. et al. The Impact of AI on Developer Productivity: Evidence from GitHub Copilot. _arXiv_, 2023.
- PRESSMAN, R. S.; MAXIM, B. R. _Engenharia de Software: uma abordagem profissional._ 8. ed. Porto Alegre: AMGH, 2016.
- SOMMERVILLE, I. _Engenharia de Software._ 9. ed. São Paulo: Pearson, 2011.
- THIOLLENT, M. _Metodologia da Pesquisa-Ação._ 18. ed. São Paulo: Cortez, 2011.
- TRIPP, D. Pesquisa-ação: uma introdução metodológica. _Educação e Pesquisa_, São Paulo, v. 31, n. 3, p. 443–466, set./dez. 2005.
- WOHLIN, C. et al. _Experimentation in Software Engineering._ Berlin: Springer, 2012.
