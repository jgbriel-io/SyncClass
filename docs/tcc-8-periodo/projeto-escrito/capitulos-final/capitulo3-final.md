# 3 METODOLOGIA

O presente trabalho possui natureza dual: é, simultaneamente, o desenvolvimento de um produto de software e uma investigação sobre o processo que o produziu. Essa característica exige que a metodologia cubra dois planos: o método de construção do sistema e o método de verificação das hipóteses formuladas no Capítulo 1. Este capítulo apresenta ambos, descrevendo a classificação da pesquisa, o processo iterativo de desenvolvimento, o protocolo de medição do impacto da Inteligência Artificial (IA) e o percurso técnico do projeto: engenharia de requisitos, arquitetura e modelagem, desenvolvimento, qualidade, gestão e infraestrutura. As evidências e a análise das hipóteses são tratadas no Capítulo 4; o cronograma executado é apresentado no Capítulo 6.

## 3.1 Classificação da Pesquisa

O presente trabalho classifica-se como pesquisa aplicada, pois tem por objetivo desenvolver um sistema funcional capaz de resolver um problema real e identificado: a ausência de ferramentas acessíveis para gestão integrada de professores autônomos de inglês. A motivação não é a produção de conhecimento teórico generalizado, mas a entrega de um artefato operacional com validação em contexto real de uso.

Quanto à abordagem, a pesquisa combina elementos qualitativos e quantitativos. A dimensão qualitativa manifesta-se na análise dos ciclos de desenvolvimento, nas decisões arquiteturais e na avaliação das hipóteses H1 e H2. A dimensão quantitativa sustenta a hipótese H3, com estimativas de tempo de execução de tarefas específicas comparadas a uma linha de base retrospectiva.

Do ponto de vista dos objetivos, a pesquisa tem caráter exploratório, pois investiga em que medida ferramentas de Inteligência Artificial generativa podem acelerar o desenvolvimento de software em projetos conduzidos por um único desenvolvedor, cenário ainda pouco estudado de forma sistemática na literatura de Engenharia de Software.

Quanto aos procedimentos, adota-se a pesquisa-ação, conforme conceituada por Thiollent (2011) e Tripp (2005). Nessa modalidade, o pesquisador não é um observador externo: ele está inserido no objeto de estudo, intervém de forma sistemática e reflexiva, e ajusta o curso da investigação com base nas observações coletadas em cada ciclo. Thiollent (2011) define a pesquisa-ação como uma estratégia metodológica em que a ação e a reflexão ocorrem de forma integrada, em ciclos iterativos de planejamento, execução, observação e retorno crítico. Tripp (2005) complementa ao caracterizar a pesquisa-ação pela alternância deliberada entre agir e investigar, com o propósito explícito de melhorar tanto a prática quanto a compreensão sobre ela.

No SyncClass, a pesquisa-ação manifestou-se de forma concreta ao longo das 31 iterações de desenvolvimento: cada iteração constituiu uma instância do ciclo reflexivo, com planejamento de escopo, ação de implementação, observação por meio de testes e registros de versionamento, e reflexão documentada no planejamento da iteração seguinte. A inserção do pesquisador como desenvolvedor não é uma limitação metodológica a ser mitigada, mas uma condição estrutural da pesquisa-ação, reconhecida e declarada como parte do delineamento.

## 3.2 Processo de Desenvolvimento

O processo de desenvolvimento do SyncClass é descrito em duas dimensões complementares: o ciclo metodológico que estruturou cada iteração, apresentado na seção 3.2.1, e o fluxo de trabalho concreto, com os instrumentos de registro que tornaram o progresso rastreável, detalhado na seção 3.2.2.

### 3.2.1 Ciclo de Desenvolvimento e Pesquisa-Ação

O processo de desenvolvimento seguiu um modelo iterativo incremental, conforme conceituado por Pressman e Maxim (2016). Cada iteração correspondeu a um conjunto coeso de entregas de escopo previamente definido, totalizando 31 iterações temáticas no período de março a junho de 2026.

A adoção desse modelo, em detrimento de metodologias ágeis mais prescritivas, justifica-se pela natureza solo do projeto e pela necessidade de combinar cadência regular com flexibilidade de escopo. Anderson (2010), ao descrever abordagens de fluxo contínuo, observa que contextos com equipe reduzida e demandas dinâmicas se beneficiam da ausência de cerimônias formais. No entanto, a presença de 31 iterações numeradas, com escopo e período definidos, configura um modelo iterativo incremental, e não um sistema de fluxo puro. A combinação das duas referências reflete o processo adotado: Anderson (2010) fundamenta a ausência de sobrecarga cerimonial; Pressman e Maxim (2016) fundamentam a estrutura iterativa incremental.

O ciclo da pesquisa-ação (THIOLLENT, 2011; TRIPP, 2005) materializou-se em cada iteração segundo quatro momentos:

1. **Planejamento:** definição do escopo da iteração, levantamento dos requisitos funcionais e não funcionais a serem abordados e identificação de riscos técnicos;
2. **Ação:** implementação das funcionalidades planejadas, com uso sistemático do assistente de IA para tarefas de _scaffolding_, _migrations_ e auditorias de segurança (ver seção 3.3);
3. **Observação:** execução dos testes automatizados, realização de testes manuais exploratórios e registro de evidências por meio de _commits_ semânticos;
4. **Reflexão:** revisão do que foi entregue, identificação de débitos técnicos e refinamento do planejamento para a iteração seguinte.

Esse ciclo foi realizado de forma explícita nas 31 iterações, com registros rastreáveis nos documentos de cada ciclo e nos 152 _commits_ da _branch_ principal do repositório.

### 3.2.2 Fluxo de Trabalho e Instrumentos de Registro

O fluxo de trabalho baseou-se em três instrumentos principais de registro e controle.

As _branches_ git foram utilizadas como separação de ambientes (desenvolvimento, homologação e produção), garantindo que código em desenvolvimento não contaminasse o ambiente em uso. A _branch_ principal acumula 152 _commits_ ao longo do período de desenvolvimento.

Os _commits_ semânticos constituíram a unidade atômica de registro de progresso. A convenção _Conventional Commits_ foi adotada sistematicamente, com prefixos que identificam o tipo de cada modificação (funcionalidade, correção, refatoração, segurança, documentação), permitindo rastrear o escopo de cada alteração ao longo do tempo. Esses registros constituem o principal instrumento de coleta de dados para as hipóteses H1 e H3, conforme detalhado na seção 3.3.2.

Os _Pull Requests_ funcionaram como pontos de revisão e integração, estabelecendo fronteira formal entre o ambiente de desenvolvimento e o de homologação.

A Figura 3.1 ilustra o fluxo completo de uma iteração de desenvolvimento, desde o planejamento do escopo e a criação da _branch_ de funcionalidade até a integração via _Pull Request_ e o consequente ciclo de revisão, evidenciando a articulação entre as etapas metodológicas e os instrumentos de versionamento adotados.

**Figura 3.1 – Fluxo de desenvolvimento iterativo do SyncClass**

[Diagrama: Planejamento → Branch feature → Desenvolvimento com IA → Commit semântico → Pull Request → Homologação → Teste manual → Merge na branch principal]

Fonte: O autor (2026).

## 3.3 Uso de Inteligência Artificial

O uso de Inteligência Artificial generativa constituiu elemento central da metodologia. As subseções a seguir apresentam as ferramentas empregadas, o protocolo de medição que sustenta a hipótese H3 e a delimitação explícita das tarefas que permaneceram sob responsabilidade humana.

### 3.3.1 Ferramentas Utilizadas

O principal instrumento de IA empregado ao longo do desenvolvimento foi o assistente Claude (Anthropic), utilizado de forma interativa e sistemática para tarefas técnicas de natureza repetitiva e domínio bem delimitado.

A atuação do assistente concentrou-se em quatro categorias de tarefa, todas de domínio delimitado e caráter repetitivo, que correspondem ao escopo sobre o qual a hipótese H3 é avaliada:

- **_Scaffolding_ inicial de módulos:** geração de estrutura de componentes React com TypeScript, incluindo tipos, propriedades e integração com _hooks_ de serviço;
- **_Migrations_ SQL com RLS e _triggers_:** redação de _migrations_ para o Supabase, incluindo políticas de _Row Level Security_ (RLS) e gatilhos de atualização automática de campos de controle;
- **Auditoria de segurança:** revisão sistemática das políticas RLS para verificar cobertura e ausência de vetores de acesso indevido;
- **Refatorações pontuais:** extração de lógica duplicada, renomeação de identificadores e padronização de código.

Em todos os casos, o código ou SQL gerado pelo assistente foi revisado, testado e aprovado pelo pesquisador antes de ser integrado ao repositório. A seção 3.3.3 detalha as atividades que permaneceram exclusivamente sob responsabilidade humana.

### 3.3.2 Protocolo de Medição da Hipótese H3

A hipótese H3 afirma que o uso do assistente de IA acelerou em pelo menos três vezes o tempo de execução de tarefas específicas de _scaffolding_, geração de _migrations_ SQL e auditoria de segurança. Para que essa afirmação seja verificável, definem-se a seguir o instrumento de coleta, a unidade de medição, a linha de base e as limitações do protocolo.

**Instrumento de coleta:** os dados que sustentam H3 foram coletados por dois meios. O instrumento primário consiste nos _commits_ semânticos registrados no histórico do repositório, que documentam a data, o escopo e a natureza de cada entrega, permitindo estimar o tempo de cada tarefa com base na proximidade temporal entre registros relacionados. O instrumento secundário consiste em estimativas retrospectivas do desenvolvedor, calibradas pela experiência prévia em projetos equivalentes conduzidos sem assistência de IA.

**Unidade de medição:** tempo de execução de tarefa específica (montagem inicial de módulo, _migration_ SQL com RLS, auditoria de políticas de acesso).

**Linha de base:** estimativa retrospectiva do desenvolvedor, com base em experiência anterior em projetos de complexidade equivalente realizados sem suporte de IA. Não há grupo de controle formal nem coleta prospectiva de tempo.

**Posicionamento em relação à literatura:** Peng et al. (2023), em estudo controlado com 95 desenvolvedores profissionais, identificaram ganho médio de 55,8% de produtividade em tarefas gerais de programação com o GitHub Copilot. O presente trabalho não replica esse delineamento experimental, mas utiliza o resultado como referência para calibrar as estimativas. A hipótese H3, ao afirmar ganho de pelo menos três vezes, refere-se a um subconjunto específico de tarefas (montagem inicial de módulos, geração de _migrations_ SQL e auditorias sistemáticas de segurança) nas quais a IA opera sobre domínios bem delimitados e repetitivos, onde se esperam ganhos superiores à média geral. Essa distinção de escopo é metodologicamente relevante e não configura contradição com Peng et al. (2023), cujo estudo mediu produtividade em tarefas heterogêneas de programação.

**Exemplos rastreáveis:** a primeira iteração do projeto (montagem inicial, com configuração de autenticação, estrutura de pastas e primeiros componentes) foi concluída em aproximadamente dois dias; a estimativa retrospectiva indica que o mesmo escopo, sem assistência de IA, demandaria entre cinco e seis dias.

A redação das quatro _migrations_ estruturais iniciais do banco (esquema completo, lógica de _views_, procedimentos e _triggers_, e políticas RLS com permissões) foi concluída em um dia; sem IA, a redação manual das políticas e gatilhos para as 11 tabelas demandaria de três a quatro dias. Essas quatro _migrations_ constituem a base estrutural inicial; o total evoluiu para 70 _migrations_ ao longo do projeto (Tabela 3.1), incorporando correções e evoluções incrementais. A vigésima quarta iteração (auditoria completa das políticas RLS ativas) foi concluída em uma sessão de trabalho; uma auditoria equivalente sem IA demandaria ao menos três dias.

Observa-se que o ganho varia conforme a natureza da tarefa: na montagem inicial, que envolve decisões de estrutura, o fator situa-se entre duas vezes e meia e três vezes (dois dias ante cinco a seis), aproximando-se do limiar sem superá-lo de forma consistente; nas tarefas de redação de _migrations_ e auditoria, em que o domínio é mais delimitado e repetitivo, o fator supera esse limiar. Adota-se, por consequência, como critério de confirmação de H3 a verificação do limiar de três vezes por categoria de tarefa: a hipótese é confirmada para a geração de _migrations_ SQL e para a auditoria de segurança, em que o fator excede três vezes, e considerada apenas parcialmente atendida para a montagem inicial de módulos, cuja natureza decisória aproxima o ganho do limiar sem superá-lo de forma consistente. O Capítulo 4 detalha essa avaliação por categoria.

**Limitação metodológica declarada:** as estimativas acima são retrospectivas, realizadas pelo próprio desenvolvedor, sem grupo de controle formal e sem registro prospectivo de tempo. Estão, portanto, sujeitas a viés de confirmação inerente ao executor. O Capítulo 4 retoma essa limitação na análise dos resultados de H3.

**Validação em ambiente real:** o sistema encontra-se em uso por um professor autônomo de inglês e seus alunos desde o período final de desenvolvimento. Essa condição complementa os testes internos automatizados e manuais, adicionando evidência de operabilidade em contexto real, o que reforça a validade externa dos resultados observados.

### 3.3.3 Delimitação: O que a IA Não Realizou

A delimitação do papel da IA integra o protocolo metodológico, pois circunscreve os limites de validade das hipóteses H2 e H3.

As seguintes atividades foram realizadas exclusivamente pelo pesquisador, sem geração ou decisão automatizada:

- **Decisões de produto:** escopo do sistema, priorização de funcionalidades, definição de regras de negócio e modelagem do domínio (entidades, relacionamentos e semântica);
- **Validação de fluxos reais:** todos os testes manuais, incluindo a campanha estruturada de qualidade iniciada na vigésima oitava iteração, com roteiro de 175 itens de verificação em 20 rotas e 5 perfis de acesso, foram executados pelo pesquisador;
- **Decisões arquiteturais:** a escolha do Supabase como _Backend as a Service_ (BaaS), a adoção de React com TypeScript, a estrutura de camadas e a política de RLS foram decisões do pesquisador; a IA implementou conforme as diretrizes definidas, sem defini-las;
- **Revisão e aprovação:** todo código gerado pela IA foi revisado, testado e aprovado pelo pesquisador antes de ser integrado; nenhum registro foi aceito sem validação humana explícita;
- **Configuração de infraestrutura:** o provisionamento do ambiente Supabase, a configuração de domínio, as variáveis de ambiente e o pipeline de _deploy_ foram realizados diretamente pelo pesquisador.

Essa delimitação é relevante para H3: o ganho de produtividade mensurado refere-se ao tempo de execução de tarefas técnicas definidas, e não à redução do esforço cognitivo de concepção do sistema, que permaneceu integralmente sob responsabilidade humana.

## 3.4 Engenharia de Requisitos

A engenharia de requisitos do SyncClass partiu de uma demanda real e evoluiu ao longo das iterações. As subseções descrevem o público-alvo e o processo de elicitação, a síntese quantitativa dos requisitos levantados e os casos de uso que formalizam as interações do sistema.

### 3.4.1 Público-Alvo e Processo de Elicitação

Os requisitos do SyncClass foram coletados por meio de entrevistas com um professor de inglês autônomo e de análise comparativa de ferramentas de gestão disponíveis no mercado. O projeto originou-se de uma demanda real desse profissional, o que permitiu a coleta de requisitos em contexto de uso genuíno e a validação empírica das funcionalidades durante o período de desenvolvimento. A avaliação formal de satisfação com usuários externos está mapeada como trabalho futuro.

A plataforma atende a três perfis de usuário, cada qual com seu próprio conjunto de permissões e área de navegação, definidos a partir das responsabilidades distintas que cada papel exerce na operação do sistema, conforme descrito no Quadro 3.1.

**Quadro 3.1 — Perfis de usuários do SyncClass**

| Perfil             | Descrição                                                     |
| :----------------- | :------------------------------------------------------------ |
| Professor autônomo | Gerencia seus próprios alunos, aulas, cobranças e atividades  |
| Aluno              | Acessa seu histórico, realiza pagamentos e entrega atividades |
| Administrador      | Visão global da plataforma; gerencia professores e usuários   |

Fonte: O autor (2026).

### 3.4.2 Síntese Quantitativa dos Requisitos

Os requisitos funcionais descrevem as funcionalidades que o sistema deve oferecer aos seus usuários (SOMMERVILLE, 2011), enquanto os requisitos não funcionais definem critérios de qualidade, restrições técnicas e atributos de desempenho (PRESSMAN; MAXIM, 2016). No SyncClass, 32 requisitos funcionais foram implementados ao longo das 31 iterações de desenvolvimento, incluindo a exportação de dados pessoais para conformidade com a LGPD (iteração 20) e o reembolso de pagamento PIX via AbacatePay (iteração 32). Outros 4 requisitos foram identificados como desejáveis, mas mantidos fora do escopo do produto mínimo viável e registrados como trabalhos futuros (RF32 a RF35): sistema de notificações, exportação de relatórios em PDF, integração com Google Calendar e gamificação. O sistema implementa ainda 36 requisitos não funcionais, distribuídos entre segurança, desempenho, usabilidade, rastreabilidade e manutenção, e 56 regras de negócio formalizadas como restrições no banco de dados, validações no frontend e lógica em procedimentos armazenados.

O Quadro 3.2 apresenta um subconjunto representativo dos requisitos funcionais, escolhido por cobrir os módulos centrais do sistema. A relação completa consta do Apêndice B; os requisitos não funcionais e as regras de negócio, do Apêndice C.

**Quadro 3.2 — Requisitos funcionais representativos**

| ID   | Requisito                                               | Módulo     | Prioridade |
| :--- | :------------------------------------------------------ | :--------- | :--------- |
| RF01 | Cadastro e gerenciamento de alunos (CRUD)               | Alunos     | Alta       |
| RF03 | Registro de aulas com data, horário, duração e presença | Aulas      | Alta       |
| RF06 | Geração de cobranças individuais e por pacote           | Financeiro | Alta       |
| RF10 | Pagamento via PIX com QR Code                           | Financeiro | Média      |
| RF13 | Correção de atividades com nota e devolutiva            | Atividades | Alta       |
| RF20 | Anonimização de dados pessoais (LGPD)                   | LGPD       | Alta       |

Fonte: O autor (2026).

Entre os requisitos não funcionais de maior impacto arquitetural destacam-se o isolamento de dados por professor via RLS no PostgreSQL, a idempotência em operações financeiras críticas, a conformidade com a LGPD por meio de anonimização e _soft delete_ e a obrigatoriedade de paginação em listagens extensas. As regras de negócio governam o comportamento do domínio: a vinculação de cada aluno a exatamente um professor, a verificação de sobreposição de horários de aula no banco de dados, a garantia de idempotência por meio de tabela dedicada e a habilitação obrigatória de RLS em todas as tabelas.

### 3.4.3 Casos de Uso

O modelo de casos de uso organiza-se em torno dos três atores do sistema. O professor concentra as operações de gestão: cadastro de alunos, registro de aulas, criação de pacotes, geração e confirmação de cobranças, criação e correção de atividades. O aluno dispõe de acesso predominantemente de leitura, acrescido das permissões de entrega de atividades e de envio de comprovantes de pagamento. O administrador detém visão global, com gestão de professores, usuários e dados financeiros consolidados. Os casos de uso completos, com fluxos principais, alternativos e pós-condições, constam do Apêndice D; a seguir, resumem-se três casos representativos.

**UC01 (Cadastrar aluno):** o professor autenticado preenche nome, e-mail, telefone, dia de pagamento e valor hora-aula. O sistema valida os dados e a unicidade de e-mail e telefone, persistindo o registro vinculado ao identificador do professor. O aluno passa a ser visível apenas para o professor proprietário e para o administrador, por força da RLS.

**UC02 (Registrar aula):** o professor seleciona o aluno e define data e horários de início e fim. O sistema valida que o horário final é posterior ao inicial e verifica conflito de horário com outras aulas do mesmo professor antes de persistir o registro. A aula passa a constar no histórico do professor e do aluno.

**UC06 (Confirmar pagamento):** o professor, ou o administrador, localiza uma cobrança pendente e aciona sua confirmação. O sistema altera o status para pago, registra o instante do pagamento e grava registro de auditoria. Quando há comprovante enviado pelo aluno, o professor o examina e aprova ou rejeita antes de confirmar; a idempotência da operação é garantida por chave única registrada em tabela dedicada.

A matriz de rastreabilidade, que associa cada requisito funcional ao respectivo arquivo de implementação, _migration_ e situação de teste, é apresentada integralmente no Apêndice E. Em síntese, aproximadamente 63% dos requisitos funcionais (19 dos 30) possuem cobertura por testes automatizados; os demais (Edge Functions, geração de QR Code e _uploads_) foram validados manualmente ou por execução de _migration_.

## 3.5 Arquitetura e Modelagem

As decisões arquiteturais do SyncClass foram tomadas sob a restrição de um único desenvolvedor, prazo acadêmico de aproximadamente três meses e custo operacional próximo de zero. Cada escolha estrutural (BaaS em lugar de API REST própria, monolito modular em lugar de microsserviços, aplicação de página única em lugar de renderização no servidor) foi orientada pela hipótese H2: a adoção do Supabase como plataforma de backend como serviço reduziria em pelo menos 60% o esforço de desenvolvimento backend estimado para uma stack tradicional equivalente.

### 3.5.1 Decisões Arquiteturais

A arquitetura adotada é monolítica modular, conforme a recomendação de Fowler (2015) no padrão _MonolithFirst_: sistemas de domínio ainda em exploração devem começar como monolito, pois os limites de serviço só se tornam evidentes após o produto amadurecer em produção. Microsserviços adicionariam complexidade operacional (descoberta de serviços, contratos de API, _deploys_ independentes) sem ganho compatível com o porte do projeto.

O Supabase foi adotado como _Backend as a Service_. Segundo Mell e Grance (2011), plataformas dessa natureza eliminam a responsabilidade do desenvolvedor sobre infraestrutura, ambiente de execução e serviços transversais. No SyncClass, o Supabase supriu seis serviços de backend que demandariam desenvolvimento manual em uma stack Node.js, Express e PostgreSQL: autenticação (JWT, convites e redefinição de senha); autorização por _Row Level Security_ nativo no banco; API de dados gerada automaticamente pelo PostgREST; armazenamento de arquivos integrado; comunicação em tempo real via WebSocket; e sistema de _migrations_ versionadas. A supressão desses serviços fundamenta a estimativa qualitativa de redução de esforço de pelo menos 60%, apresentada como aproximação baseada na análise das responsabilidades suprimidas, e não como cálculo formal com grupo de controle.

Duas alternativas foram avaliadas e descartadas. O Firebase (Google) adota modelo de dados NoSQL sem suporte nativo a _Row Level Security_, o que transferiria consultas relacionais complexas para o cliente e implicaria dependência de ecossistema proprietário. O PocketBase apresenta menor maturidade de ecossistema e suporte insuficiente ao controle de acesso baseado em múltiplos perfis exigido pelo modelo _multi-tenant_ do sistema. O Supabase, por oferecer PostgreSQL com RLS nativo, tipagem gerada automaticamente e natureza de código aberto, atendeu integralmente aos requisitos.

Quanto à camada de apresentação, optou-se por React em arquitetura de página única (SPA) compilada pelo Vite. Por se tratar de plataforma de gestão operacional, e não de conteúdo público, a otimização para mecanismos de busca não constitui requisito; em contrapartida, a interatividade é elevada, com formulários, tabelas com filtros e painéis. O carregamento sob demanda por rota minimiza o pacote inicial, e a ausência de servidor de renderização simplifica o _deploy_ para hospedagem estática.

### 3.5.2 Modelo de Dados

O banco de dados é composto por 11 tabelas, descritas no Quadro 3.3. A Figura 3.2 apresenta o diagrama entidade-relacionamento (DER) correspondente.

**Figura 3.2 – Diagrama Entidade-Relacionamento do SyncClass**

[Figura pendente de geração a partir do schema do banco]

Fonte: O autor (2026).

**Quadro 3.3 — Tabelas do banco de dados**

| Tabela                        | Papel arquitetural                                                                                                                            |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `teachers`                    | Professores cadastrados; referência central do modelo _multi-tenant_                                                                          |
| `students`                    | Alunos por professor; isolados pelo identificador do professor                                                                                |
| `profiles`                    | Espelho da tabela de autenticação; une identidade ao domínio e é a fonte de verdade do papel de acesso (_role_), consultada pelas funções RLS |
| `class_logs`                  | Registro de aulas ministradas; base de cálculo financeiro                                                                                     |
| `financial_records`           | Cobranças e pagamentos; centro do módulo financeiro                                                                                           |
| `financial_record_class_logs` | Relação N:N entre cobranças e aulas (pacotes)                                                                                                 |
| `activities`                  | Atividades pedagógicas enviadas e corrigidas                                                                                                  |
| `audit_logs`                  | Registro imutável de operações sensíveis para rastreabilidade                                                                                 |
| `idempotency_keys`            | Controle de idempotência em operações financeiras                                                                                             |
| `rate_limits`                 | Controle de limitação de taxa por operação e perfil                                                                                           |
| `webhook_processing_log`      | Registro de processamento de eventos externos (idempotência de _webhooks_)                                                                    |

Fonte: O autor (2026).

As decisões de esquema priorizaram integridade e conformidade: tipos com fuso horário para todos os registros temporais, evitando ambiguidades; tipo numérico de precisão fixa para valores monetários, eliminando erro de ponto flutuante; campos de status validados por restrições de verificação; e marcadores de _soft delete_ e anonimização que preservam histórico auditável em conformidade com a LGPD.

### 3.5.3 Segurança via Row Level Security

O mecanismo central de segurança é o _Row Level Security_ do PostgreSQL, que garante que cada usuário autenticado acesse exclusivamente os dados autorizados para seu perfil, independentemente da consulta enviada pelo frontend. A política é avaliada pelo banco de dados, e não pela aplicação: ainda que o frontend enviasse uma consulta sem filtro, o PostgreSQL retornaria apenas as linhas para as quais a política é satisfeita para o usuário corrente.

As políticas apoiam-se em funções auxiliares de perfil, das quais `is_admin()` é representativa, conforme a Figura 3.3.

**Figura 3.3 – Definição da função is_admin() com SECURITY DEFINER**

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id::text = (auth.uid())::text
    AND role = 'admin'
  );
$$;
```

Fonte: O autor (2026).

A cláusula `SECURITY DEFINER SET search_path = public, pg_temp` é obrigatória: garante que a função execute com os privilégios do criador, e não do chamador, e previne ataques de substituição de esquema. Sem ela, um usuário com permissão de criar esquemas poderia redirecionar a função para uma versão maliciosa da tabela de perfis. A execução com privilégios do criador cumpre ainda uma segunda função: evita a recursão infinita que ocorreria caso a avaliação de uma política de RLS, ao consultar a tabela de perfis, disparasse novamente a mesma política. O sistema conta com aproximadamente 54 políticas ativas cobrindo as 11 tabelas para os três perfis, assegurando o isolamento de dados entre professores distintos.

### 3.5.4 Estimativa Qualitativa de H2

A estimativa de redução de esforço backend decorre diretamente do número de serviços supridos pelo Supabase, enumerados na seção 3.5.1. Em uma stack tradicional, cada um desses serviços (autenticação, armazenamento, tempo real, controle de acesso e _migrations_) exigiria implementação e manutenção próprias. Apoiada no conceito de computação em nuvem de Mell e Grance (2011), a estimativa de redução de pelo menos 60% é qualitativa e fundamentada na contagem das responsabilidades suprimidas. A análise detalhada de H2 é apresentada no Capítulo 4.

## 3.6 Desenvolvimento do Sistema

O desenvolvimento foi conduzido sobre a stack relacionada no Quadro 3.5 (seção 3.10), priorizando produtividade, tipagem de ponta a ponta e qualidade de código. A separação de responsabilidades segue três camadas: os componentes contêm exclusivamente lógica de apresentação; os _hooks_ de serviço encapsulam toda a integração com o Supabase; e o SDK da plataforma opera somente dentro desses _hooks_, nunca diretamente nos componentes.

Quatro decisões técnicas centrais orientaram a implementação:

- **Idempotência em operações financeiras:** falhas de rede ou retentativas do cliente podem provocar o envio repetido de uma mesma solicitação de pagamento, gerando cobrança duplicada. A solução consiste em gerar uma chave única por operação; na chegada da solicitação, o banco verifica a existência da chave em tabela dedicada e, se já registrada, descarta a operação e retorna o resultado original, tornando qualquer número de retentativas equivalente a uma única cobrança efetiva;
- **Isolamento _multi-tenant_ via RLS:** o isolamento entre professores é garantido no banco de dados, e não no frontend. O isolamento estende-se ao armazenamento de arquivos: os caminhos incluem o identificador do professor, verificado pelas políticas do serviço de _storage_ antes de autorizar leitura ou escrita;
- **Centralização da integração em _hooks_ de serviço:** a partir da oitava iteração, nenhum componente passou a chamar o Supabase diretamente. A mudança eliminou o acoplamento entre apresentação e acesso a dados e concentrou a lógica de cache e invalidação em um único ponto por domínio;
- **Centralização de textos de interface:** entre a décima segunda e a décima quinta iterações, todos os textos de interface foram migrados para arquivos organizados por domínio, removendo cadeias literais dos componentes e preparando a base para internacionalização futura.

A magnitude do artefato produzido é resumida na Tabela 3.1, que reúne as métricas de volume de código. O panorama quantitativo consolidado do sistema, que acrescenta políticas RLS, Edge Functions, tabelas do banco e cobertura de testes, é retomado na Tabela 4.1 (seção 4.2), no contexto dos resultados.

**Tabela 3.1 — Métricas do código-fonte**

| Métrica                                                            | Valor                            |
| :----------------------------------------------------------------- | :------------------------------- |
| _Commits_ (branch principal)                                       | 152                              |
| Arquivos TypeScript (excluindo testes, definições e tipos gerados) | 329                              |
| Componentes React                                                  | 181                              |
| _Hooks_ customizados                                               | 37                               |
| _Migrations_ SQL                                                   | 70                               |
| Linhas de código (excluindo tipos gerados)                         | ~50.000                          |
| Tempo de desenvolvimento                                           | ~3 meses (março a junho de 2026) |

Fonte: O autor (2026).

## 3.7 Qualidade e Testes

A estratégia de testes baseia-se no modelo de pirâmide proposto por Cohn (2009): testes automatizados unitários compõem a base, e testes manuais estruturados cobrem os fluxos críticos da aplicação. Testes de ponta a ponta automatizados não foram implementados, em decorrência da restrição de prazo; essa ausência é declarada como limitação do projeto.

Os testes unitários foram implementados com Vitest, integrado a Testing Library, totalizando 301 casos em 28 arquivos que cobrem _hooks_ de serviço, componentes de listagem, utilitários de formatação e sanitização, esquemas de validação e _design tokens_. Os testes manuais foram conduzidos em campanha estruturada iniciada na vigésima oitava iteração e estendida até a trigésima segunda, percorrendo as 20 rotas da aplicação com 5 perfis de acesso (um administrador, dois professores, para verificar o isolamento de dados entre si, e dois alunos vinculados a professores distintos), em roteiro de 175 itens de verificação organizados por módulo. Os comportamentos incorretos identificados ao longo da campanha foram corrigidos nas iterações seguintes; à data de redação, parte do roteiro permanece em verificação, condição declarada como limitação da estratégia de qualidade.

O sistema foi avaliado segundo o modelo ISO/IEC 25010 (2011). A avaliação foi realizada pelo próprio desenvolvedor, com base em lista de verificação interna rastreada por iteração, e está, portanto, sujeita a viés de confirmação, conforme declarado. Entre as oito características do modelo, quatro foram priorizadas pela centralidade no projeto: a adequação funcional (32 requisitos implementados), a segurança (auditoria completa de RLS, autenticação JWT, limitação de taxa, sanitização e conformidade com a LGPD), a confiabilidade (idempotência, _soft delete_ e registros de auditoria) e a manutenibilidade (refatorações que fragmentaram componentes extensos e a cobertura de 301 testes automatizados).

Reconhecem-se duas limitações da estratégia. A primeira é a ausência de testes de integração automatizados para procedimentos armazenados, políticas RLS, gatilhos e Edge Functions, cuja verificação dependeu da execução de _migrations_ e de testes manuais. A segunda é a ausência de testes de ponta a ponta automatizados, identificada como trabalho futuro.

## 3.8 Gestão do Projeto

A gestão do projeto apoiou-se em instrumentos de rastreabilidade de duas naturezas distintas, cuja diferenciação é metodologicamente relevante. As fontes primárias contemporâneas (os 152 _commits_ com registros temporais reais na _branch_ principal e as 70 _migrations_ SQL numeradas) foram produzidas no momento da execução e constituem evidência direta do progresso. As fontes retroativas (os documentos de iteração, elaborados pelo próprio pesquisador após os fatos) estão sujeitas a viés de reconstrução. Essa distinção é declarada como limitação de rastreabilidade, em coerência com o protocolo de medição da seção 3.3.2.

Os principais riscos do projeto foram identificados e tratados ao longo do desenvolvimento, conforme o Quadro 3.4, que apresenta uma seleção representativa.

**Quadro 3.4 — Riscos representativos identificados e tratados**

| ID  | Risco                              | Mitigação                                        | Situação |
| :-- | :--------------------------------- | :----------------------------------------------- | :------- |
| R02 | Vulnerabilidades de RLS            | Auditorias periódicas e _migrations_ de correção | Mitigado |
| R04 | Violação de LGPD                   | _Soft delete_, anonimização e dados mínimos      | Mitigado |
| R08 | Monitoramento de erros em produção | Registro restrito ao ambiente de desenvolvimento | Aceito   |

Fonte: O autor (2026).

O risco R08 foi conscientemente aceito: o registro de erros opera apenas em ambiente de desenvolvimento, e a ausência de monitoramento em produção é reconhecida como limitação do escopo do produto mínimo viável. O cronograma do desenvolvimento, derivado do histórico de versionamento, é apresentado no Capítulo 6.

## 3.9 Infraestrutura e Deploy

A infraestrutura do SyncClass organiza-se em duas camadas independentes: o frontend, servido como aplicação estática, e o backend, provido integralmente pelo Supabase. A opção por não manter servidor de aplicação próprio decorreu de três critérios objetivos: redução da complexidade operacional associada à administração de infraestrutura dedicada; custo zero no nível gratuito das plataformas adotadas, compatível com o orçamento acadêmico; e adequação à escala de um produto mínimo viável desenvolvido por um único desenvolvedor. O conceito de computação em nuvem, conforme Mell e Grance (2011), caracteriza-se pela delegação de serviços de infraestrutura a um provedor externo gerenciado, permitindo concentrar esforço na lógica de aplicação.

A hospedagem do frontend recai sobre o Cloudflare Pages, preferido em relação a Vercel e Netlify por três critérios técnicos: rede de distribuição de conteúdo global nativa sem custo adicional; ausência de latência de inicialização a frio no nível gratuito, ao contrário das funções gratuitas das alternativas; e integração com Cloudflare Workers, que viabiliza extensão futura sem mudança de provedor.

O pipeline de integração e entrega contínuas, definido com GitHub Actions, é acionado por _push_ ou _Pull Request_ e organiza-se em dois estágios sequenciais. O primeiro executa instalação reprodutível de dependências, análise estática, verificação de tipos, a suíte de 301 testes e a compilação. O segundo executa exclusivamente em _push_ para a _branch_ principal, após aprovação do primeiro, publicando o _build_ no Cloudflare Pages. Os testes no pipeline utilizam credenciais fictícias: nenhum teste de integração real contra o banco é executado na esteira, decisão que mantém o pipeline isolado de infraestrutura externa e garante execução determinística.

No backend, além do PostgreSQL, da autenticação, do armazenamento e da camada de API automática, operam nove Edge Functions com ambiente de execução Deno. O critério de separação entre Edge Function e procedimento armazenado é objetivo: operações que exigem consumo de API externa ou uso de chave de serviço não exposta no cliente são implementadas como Edge Functions; operações internas ao banco, sem necessidade de privilégio elevado, permanecem como procedimentos. As funções implementadas atendem à redefinição de senha, à exclusão administrativa de usuários, ao convite de novos usuários, a rotinas de expurgo de registros antigos e de arquivos órfãos no armazenamento e à integração de pagamentos PIX com o provedor externo AbacatePay, composta pela geração de cobrança, pela recepção de notificações de confirmação por _webhook_ e pelo processamento de reembolsos, além da exportação de dados pessoais para conformidade com a LGPD. A segurança em produção é composta por múltiplas camadas: HTTPS no transporte, JWT na autenticação, aproximadamente 54 políticas RLS na autorização, limitação de taxa no banco, credenciais mantidas em cofre de segredos fora do código e auditoria de operações críticas. A análise quantitativa de H2 é apresentada no Capítulo 4.

## 3.10 Ferramentas e Tecnologias

O Quadro 3.5 relaciona as tecnologias empregadas no desenvolvimento do SyncClass, com as respectivas versões utilizadas.

**Quadro 3.5 — Ferramentas e tecnologias empregadas**

| Camada                         | Tecnologia           |   Versão   |
| :----------------------------- | :------------------- | :--------: |
| Interface do usuário           | React                |    18.3    |
| Linguagem                      | TypeScript           |    5.8     |
| Build                          | Vite                 |    5.4     |
| Estilização                    | Tailwind CSS         |    3.4     |
| Componentes de interface       | shadcn/ui (Radix UI) |     —      |
| Estado de servidor             | TanStack Query       |     5      |
| Formulários                    | React Hook Form      |     7      |
| Validação                      | Zod                  |     3      |
| Tabelas                        | TanStack Table       |     8      |
| Animações                      | Framer Motion        |     12     |
| Gráficos                       | Recharts             |     2      |
| Backend como Serviço           | Supabase             |    2.90    |
| Banco de dados                 | PostgreSQL           | gerenciado |
| Hospedagem do frontend         | Cloudflare Pages     |     —      |
| Integração e entrega contínuas | GitHub Actions       |     —      |
| Controle de versão             | Git e GitHub         |     —      |
| Assistente de IA               | Claude (Anthropic)   |     —      |

Fonte: O autor (2026).

As versões do PostgreSQL e do assistente de IA não constam do arquivo de dependências do projeto: o PostgreSQL é gerenciado pela infraestrutura do Supabase, e o assistente de IA foi utilizado de forma interativa, sem integração programática direta com o código.

O gerenciamento do estado de servidor apoia-se na biblioteca TanStack Query (TANSTACK, 2024), responsável por cache, sincronização e revalidação das requisições à API. A camada de componentes de interface adota o sistema shadcn/ui (VERCEL, 2024), construído sobre os primitivos acessíveis do Radix UI, o que permite compor a interface a partir de blocos reutilizáveis sem dependência de uma biblioteca de componentes monolítica.
