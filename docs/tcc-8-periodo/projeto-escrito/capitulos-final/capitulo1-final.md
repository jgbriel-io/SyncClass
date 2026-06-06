# 1 INTRODUÇÃO

O ensino de idiomas por professores autônomos constitui um segmento relevante da educação privada no Brasil, caracterizado pela dispersão organizacional e pela ausência de ferramentas tecnológicas especializadas. Nesse contexto, o SyncClass foi desenvolvido como uma plataforma _Software as a Service_ (SaaS) para a gestão integrada de alunos, aulas e cobranças, com foco no professor de inglês autônomo. O presente capítulo delimita o problema de pesquisa, apresenta a justificativa, os objetivos, as hipóteses que orientam o trabalho e a estrutura dos capítulos subsequentes.

## 1.1 Contextualização

O mercado de ensino de idiomas no Brasil é composto majoritariamente por professores autônomos que atuam de forma independente, sem vínculo empregatício com instituições de ensino. Dados do Instituto Brasileiro de Geografia e Estatística (IBGE, 2022) evidenciam o crescimento expressivo do trabalho autônomo no país, movimento que alcança também a área de educação e configura um setor que opera de maneira dispersa e com baixo suporte tecnológico. O Centro de Inovação para a Educação Brasileira (CIEB, 2024) aponta que a adoção de tecnologia na educação brasileira ocorre de forma desigual entre redes e contextos de ensino, panorama do qual se depreende a carência de ferramentas especializadas para profissionais que atuam fora de instituições estruturadas. Em escala global, o relatório de monitoramento da UNESCO (2023) adverte que a incorporação de tecnologia à educação deve subordinar-se a objetivos pedagógicos claros, ressalva pertinente ao desenho de ferramentas voltadas ao ensino. Em entrevista realizada durante a fase de levantamento de requisitos deste trabalho, um professor autônomo de inglês relatou dedicar mais de cinco horas semanais a tarefas administrativas (controle de frequência, emissão de cobranças e envio de atividades), valendo-se de ferramentas genéricas como planilhas eletrônicas, aplicativos de mensagem e agendas pessoais.

Essa fragmentação operacional gera retrabalho, perda de informações e dificuldade no acompanhamento financeiro e pedagógico dos alunos. A análise comparativa de ferramentas de gestão disponíveis no mercado, apresentada na seção 3.4, indica que plataformas SaaS especializadas nesse nicho são escassas ou inacessíveis financeiramente para profissionais individuais, o que reforça a dependência de soluções improvisadas e desconectadas entre si. O problema se intensifica quando o professor precisa gerenciar múltiplos alunos com horários, valores e históricos pedagógicos distintos.

O SyncClass originou-se de uma necessidade identificada em contexto profissional real: um professor autônomo de inglês necessitava de uma plataforma integrada para gestão de alunos, aulas e cobranças. Os requisitos foram coletados diretamente com esse professor por meio de entrevistas, o que conferiu ao projeto aderência às demandas práticas do domínio desde a fase de concepção. O sistema encontra-se em uso ativo pelo professor e seus alunos, constituindo evidência de viabilidade além da simples entrega técnica. Ao ampliar o acesso a ferramentas de gestão para profissionais autônomos de ensino, a iniciativa alinha-se ao quarto Objetivo de Desenvolvimento Sustentável (ODS 4 — Educação de Qualidade) da Organização das Nações Unidas (NAÇÕES UNIDAS BRASIL, 2025).

## 1.2 Problema de Pesquisa

Como um professor autônomo de inglês pode gerenciar alunos, aulas, cobranças e atividades de maneira centralizada e segura, sem depender de múltiplas ferramentas desconectadas?

## 1.3 Justificativa

O desenvolvimento do SyncClass justifica-se por quatro pilares fundamentais:

1. **Lacuna de mercado:** A ausência de ferramentas acessíveis e especializadas para professores autônomos é evidenciada pelos dados do IBGE (2022) e do CIEB (2024) apresentados na seção anterior. A concentração do mercado em soluções voltadas a instituições de grande porte deixa o segmento autônomo sem alternativas adequadas à sua escala operacional.

2. **Complexidade operacional:** A gestão simultânea de agenda, financeiro e pedagógico exige integração técnica que ferramentas genéricas não oferecem. A fragmentação entre múltiplos aplicativos aumenta o tempo gasto em tarefas administrativas e eleva o risco de inconsistências nos registros.

3. **Segurança de dados:** O tratamento de dados pessoais de alunos em uma plataforma educacional exige conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD), em especial o Art. 16, I da Lei nº 13.709/2018, que disciplina o término do tratamento de dados pessoais. A conformidade legal não é opcional para sistemas que armazenam dados de menores ou adultos em contexto educacional.

4. **Contribuição empírica:** O projeto investiga empiricamente o impacto combinado de Inteligência Artificial (IA) generativa e _Backend as a Service_ (BaaS) sobre a produtividade de um desenvolvedor solo, cenário ainda pouco documentado na literatura, que se concentra em equipes e em ferramentas isoladas. Os resultados oferecem evidência prática sobre viabilidade de entrega, redução de esforço de backend e aceleração de tarefas específicas de desenvolvimento.

## 1.4 Objetivos

Os objetivos do trabalho desdobram-se em um objetivo geral, que sintetiza o propósito da pesquisa, e um conjunto de objetivos específicos, que o operacionalizam em metas verificáveis.

### 1.4.1 Objetivo Geral

Investigar a viabilidade e os ganhos de produtividade do desenvolvimento de um SaaS funcional para gestão de professores autônomos de inglês, realizado por um único desenvolvedor com suporte de IA generativa e infraestrutura _Backend as a Service_, em prazo acadêmico.

### 1.4.2 Objetivos Específicos

- **Modelagem:** Implementar banco de dados relacional com isolamento de dados por professor por meio de _Row Level Security_ (RLS).

- **Interface:** Desenvolver interface de usuário responsiva para três perfis de acesso: Administrador, Professor e Aluno.

- **Financeiro:** Implementar controle de pagamentos com gestão de comprovantes e integração com gateway de pagamento via PIX.

- **Pedagógico:** Criar módulo de atividades com suporte a _upload_ de arquivos e fluxo de correção.

- **Compliance:** Garantir conformidade com a LGPD por meio de anonimização de dados e _soft delete_ rastreável.

- **Produtividade:** Documentar e analisar o impacto do uso de IA generativa no ciclo de vida do desenvolvimento de software.

## 1.5 Hipóteses

**H1:** O desenvolvimento de um SaaS funcional para gestão de professores autônomos de inglês, realizado por um único desenvolvedor com suporte de IA generativa, é concluído em aproximadamente três meses (março a junho de 2026).

**H2:** A adoção do Supabase como _Backend as a Service_ (BaaS) reduz em ≥60% o esforço estimado de desenvolvimento backend em comparação com uma stack tradicional equivalente (Node.js + PostgreSQL + Express).

**H3:** O uso de IA generativa (Claude, Anthropic) como assistente de desenvolvimento acelera em pelo menos 3 vezes o tempo de execução de tarefas específicas de _scaffolding_, geração de _migrations_ SQL e auditoria de segurança, conforme protocolo de medição e limitações metodológicas descritos no Capítulo 3.

## 1.6 Estrutura do Trabalho

O presente trabalho está organizado em cinco capítulos, conforme descrito no Quadro 1.1, complementados pelas referências bibliográficas e por seis apêndices (A a F), que reúnem o formulário de avaliação exploratória, a especificação completa de requisitos funcionais e não funcionais, as regras de negócio, os casos de uso, a matriz de rastreabilidade e o cronograma de desenvolvimento.

**Quadro 1.1 — Estrutura do trabalho**

| Capítulo | Título                 | Conteúdo                                                                                                                                        |
| :------: | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
|    1     | Introdução             | Contextualização, problema, justificativa, objetivos e hipóteses                                                                                |
|    2     | Referencial Teórico    | Domínio de aplicação, SaaS, computação em nuvem, qualidade de software, LGPD e IA no desenvolvimento                                            |
|    3     | Metodologia            | Classificação da pesquisa, processo iterativo, protocolo de medição, requisitos, modelagem, desenvolvimento, qualidade, gestão e infraestrutura |
|    4     | Resultados e Discussão | Sistema entregue, métricas do desenvolvimento e análise das hipóteses                                                                           |
|    5     | Conclusão              | Síntese, limitações, trabalhos futuros e considerações finais                                                                                   |

Fonte: O autor (2026).
