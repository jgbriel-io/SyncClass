# 2 GESTÃO DO ENSINO AUTÔNOMO DE IDIOMAS

A gestão da carreira de um professor autônomo de idiomas envolve um conjunto
de atividades administrativas que vão além da sala de aula: controle de frequência,
cobrança de mensalidades, envio de materiais didáticos, acompanhamento do
progresso individual de cada aluno e comunicação contínua com responsáveis. Essas
atividades, quando realizadas de forma fragmentada e manual, consomem tempo
produtivo e introduzem riscos operacionais que comprometem tanto a qualidade do
ensino quanto a sustentabilidade financeira do profissional.

Entre os principais desafios enfrentados por esses profissionais, destaca-se a
ausência de um histórico consolidado do progresso de cada aluno, o que dificulta a
personalização do ensino e a tomada de decisões pedagógicas fundamentadas. Além
disso, a gestão financeira integrada, que abrange desde o controle de mensalidades
até o registro de pagamentos avulsos, é fundamental para assegurar a
sustentabilidade da carreira autônoma, mas raramente conta com suporte tecnológico
adequado. Segundo Laudon e Laudon (2014), sistemas de informação bem projetados
são capazes de transformar processos organizacionais, reduzindo custos operacionais
e aumentando a qualidade das decisões, princípio diretamente aplicável ao contexto
do ensino autônomo.

O perfil típico desse profissional revela uma dependência de ferramentas
genéricas e desconexas: um aplicativo de mensagens para comunicação, uma planilha
para controle de pagamentos, um serviço de armazenamento em nuvem para materiais
didáticos e, frequentemente, um caderno físico para registros de aula. Segundo
estimativas do Centro de Inovação para a Educação Brasileira (CIEB, 2024),
professores autônomos de idiomas chegam a gastar mais de cinco horas semanais em
tarefas administrativas não relacionadas ao ensino. Esse tempo, subtraído da
preparação pedagógica e do desenvolvimento profissional, representa um custo de
oportunidade significativo para profissionais que dependem exclusivamente de sua
produtividade individual.

Para solucionar essas questões, a crescente demanda por digitalização no setor
educacional impulsionou o surgimento de diferentes soluções tecnológicas. A análise
a seguir foi conduzida por meio de pesquisa nas plataformas Google e nas lojas de
aplicativos, utilizando termos como "gestão de aulas particulares", "controle de alunos
professor autônomo" e "plataforma de ensino individual". As principais alternativas
identificadas são descritas a seguir, com suas funcionalidades e limitações mais
relevantes.

O **Google Classroom** é a plataforma pedagógica mais amplamente adotada
no contexto educacional brasileiro. Oferece recursos robustos para distribuição de
materiais e comunicação com alunos, mas não contempla qualquer funcionalidade de
gestão financeira ou histórico de aulas. O **Moodle**, por sua vez, é um sistema de
gestão de aprendizagem de código aberto amplamente utilizado por instituições de
ensino, mas exige infraestrutura própria de hospedagem e conhecimento técnico para
configuração, tornando-se inviável para o profissional individual. Ferramentas de
produtividade genéricas como **Notion** e **Trello** são frequentemente adaptadas
por professores autônomos para organização de tarefas, mas carecem de integração
financeira e de qualquer mecanismo de conformidade com a LGPD. **Planilhas
eletrônicas** cobrem o controle financeiro de forma rudimentar, mas são propensas
a erros manuais, não oferecem histórico pedagógico integrado e não escalam
adequadamente à medida que a carteira de alunos cresce.

Ao analisar essas soluções, observa-se um mercado segmentado. De um lado,
plataformas como Google Classroom e Moodle atendem bem à dimensão pedagógica,
mas ignoram completamente a gestão financeira. De outro, planilhas e aplicativos
genéricos cobrem o financeiro de forma rudimentar, mas não oferecem histórico
pedagógico nem conformidade com a LGPD. O resultado é que o professor autônomo
continua operando com um conjunto de ferramentas incompatíveis, sem que nenhuma
delas dialogue com as demais.

Além disso, um ponto crucial identificado é que nenhuma das soluções
disponíveis integra o ciclo financeiro ao pedagógico em uma única plataforma
acessível ao profissional individual. Essa desconexão evidencia uma lacuna de
mercado, como detalhado no comparativo apresentado no Quadro 1, que destaca as
principais funcionalidades em relação ao SyncClass.

Quadro 1 — Comparativo entre soluções existentes e o SyncClass

| Funcionalidade         | Google Classroom | Moodle  | Planilha | WhatsApp | SyncClass |
| :--------------------- | :--------------: | :-----: | :------: | :------: | :-------: |
| Gestão de alunos       |        ✓         |    ✓    | Parcial  |    ✗     |     ✓     |
| Controle financeiro    |        ✗         |    ✗    | Parcial  |    ✗     |     ✓     |
| Histórico de aulas     |        ✗         | Parcial |  Manual  |    ✗     |     ✓     |
| Repositório pedagógico |        ✓         |    ✓    |    ✗     |    ✗     |     ✓     |
| Portal do aluno        |        ✓         |    ✓    |    ✗     |    ✗     |     ✓     |
| Integração PIX         |        ✗         |    ✗    |    ✗     |    ✗     |     ✓     |
| Conformidade LGPD      |     Parcial      | Parcial |    ✗     |    ✗     |     ✓     |
| Multilocação           |        ✗         |    ✓    |    ✗     |    ✗     |     ✓     |

Fonte: Elaborado pelo autor (2026).

A análise do quadro confirma que há espaço para uma plataforma que combine
gestão financeira e acompanhamento pedagógico em um único ecossistema digital,
com conformidade nativa com a LGPD e modelo SaaS acessível ao profissional
autônomo. O SyncClass se diferencia ao propor exatamente essa integração,
centralizando as operações que hoje estão dispersas entre ferramentas incompatíveis.

## 2.1 BASES TECNOLÓGICAS E SISTEMAS DE INFORMAÇÃO

A fundamentação teórica do presente trabalho articula conceitos de diferentes
áreas da Engenharia de Software e da Ciência da Computação, todos diretamente
aplicados às decisões de projeto e implementação do SyncClass.

Sistemas de Informação (SI) são conjuntos organizados de pessoas, processos,
dados e tecnologia que coletam, processam, armazenam e distribuem informações
para apoiar a tomada de decisão organizacional (LAUDON; LAUDON, 2014). O
SyncClass enquadra-se como um SI operacional e estratégico: na dimensão
operacional, automatiza processos rotineiros como o registro de aulas e a geração de
cobranças; na dimensão estratégica, consolida dados históricos que permitem ao
professor identificar padrões de desempenho e tomar decisões pedagógicas
fundamentadas em evidências.

A computação em nuvem é definida pelo Instituto Nacional de Padrões e
Tecnologia dos Estados Unidos (NIST) como um modelo que permite acesso ubíquo,
conveniente e sob demanda a recursos computacionais configuráveis, que podem ser
rapidamente provisionados com mínimo esforço de gerenciamento (MELL; GRANCE,
2011). O projeto adota o modelo **SaaS (Software as a Service)** para a entrega ao
usuário final, eliminando barreiras de adoção para professores sem conhecimento
técnico, e o modelo **BaaS (Backend as a Service)** via Supabase para a
infraestrutura, o que permite que um desenvolvedor solo entregue funcionalidades de
nível empresarial, com autenticação segura, controle de acesso granular e sincronização
em tempo real, sem manter servidores próprios (SUPABASE, 2024).

O desenvolvimento do SyncClass fundamenta-se na abordagem de Produto
Mínimo Viável (MVP) proposta por Ries (2012), que preconiza o ciclo iterativo de
construir, medir e aprender. Em vez de construir um sistema completo antes de
qualquer validação, o desenvolvimento foi organizado em incrementos semanais,
cada um focado em resolver uma dor específica do professor autônomo. Conforme
Pressman e Maxim (2016), o desenvolvimento iterativo e incremental reduz o risco
de projetos de software ao permitir a detecção precoce de desvios entre o que foi
planejado e o que é efetivamente necessário.

## 2.2 SEGURANÇA, LGPD E QUALIDADE DE SOFTWARE

A Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)
estabelece os princípios para o tratamento de dados pessoais no Brasil, incluindo
finalidade, necessidade, transparência e segurança (BRASIL, 2018). No SyncClass,
a conformidade com a LGPD é garantida por meio do conceito de Privacy by Design,
materializado pelo **Row Level Security (RLS)** do PostgreSQL, que assegura em
nível de banco de dados que cada professor acesse exclusivamente os dados de seus
próprios alunos, independentemente da lógica da aplicação (POSTGRESQL, 2024).
Essa abordagem elimina uma classe inteira de vulnerabilidades conhecidas como
BOLA (Broken Object Level Authorization), nas quais um usuário poderia acessar
dados de outros manipulando identificadores na requisição.

A norma ISO/IEC 25010 (2011) define um modelo de qualidade para sistemas
de software com oito características principais. No contexto do SyncClass, cinco
dessas características são diretamente relevantes: adequação funcional, eficiência
de desempenho, usabilidade, segurança e manutenibilidade. Essas características
são utilizadas como critérios de avaliação no Capítulo 7, fornecendo um vocabulário
comum e critérios objetivos para comparar a qualidade do sistema com padrões
reconhecidos internacionalmente.

## 2.3 METODOLOGIAS E INOVAÇÃO NO DESENVOLVIMENTO

O uso de modelos de linguagem de grande escala (LLMs) como assistentes de
desenvolvimento representa uma mudança no paradigma da Engenharia de Software.
Peng et al. (2023), em estudo controlado sobre o impacto do GitHub Copilot,
documentaram ganhos de até 55% na velocidade de conclusão de tarefas de
programação em contexto controlado. No desenvolvimento do SyncClass, o uso de IA
foi mais amplo e integrado ao ciclo completo de desenvolvimento — geração de
migrations SQL complexas, auditoria de políticas de segurança RLS e scaffolding de
componentes React seguindo os padrões do projeto —, o que fundamenta a hipótese
de ganho superior ao documentado por Peng et al. (2023) em tarefas de maior
complexidade e com contexto acumulado do repositório (H3). Ressalta-se, no entanto,
que as decisões arquiteturais, a validação de segurança e a revisão crítica de todo
o código gerado permaneceram sob responsabilidade do autor, sendo a IA utilizada
como ferramenta de apoio e não como substituta do raciocínio de engenharia. O
impacto dessas ferramentas na produtividade é analisado quantitativamente no
Capítulo 8.

Por fim, o desenvolvimento do SyncClass alinha-se a três Objetivos de
Desenvolvimento Sustentável da ONU (NAÇÕES UNIDAS BRASIL, 2025): o ODS 4
(Educação de Qualidade), ao fortalecer o acompanhamento pedagógico individualizado;
o ODS 8 (Trabalho Decente e Crescimento Econômico), ao profissionalizar a gestão
da carreira docente autônoma; e o ODS 9 (Indústria, Inovação e Infraestrutura), ao
promover a transformação digital de um setor tradicionalmente pouco tecnologizado.
Encerrada essa fundamentação, passa-se ao Capítulo 3, que descreve os
procedimentos metodológicos adotados no desenvolvimento e na avaliação do
SyncClass.
