# Capítulo 1 — Introdução

Este capítulo apresenta o contexto que motivou o desenvolvimento do SyncClass,
uma plataforma SaaS para gestão de professores autônomos de inglês.
São definidos o problema de pesquisa, a justificativa, os objetivos, as hipóteses
que orientam o trabalho e a estrutura dos capítulos subsequentes.

## 1.1 Contextualização

O mercado de ensino de idiomas no Brasil é composto majoritariamente por
professores autônomos.
Dados do Instituto Brasileiro de Geografia e Estatística (IBGE, 2022) indicam
crescimento de 18% no número de trabalhadores autônomos na área de educação,
reflexo de um setor que opera de forma dispersa e com baixo suporte tecnológico.
O Centro de Inovação para a Educação Brasileira (CIEB, 2024) aponta que
professores autônomos dedicam mais de cinco horas semanais a tarefas
administrativas — controle de frequência, cobranças e envio de atividades —
utilizando ferramentas genéricas como planilhas, aplicativos de mensagem e
agendas pessoais.

Essa fragmentação gera retrabalho, perda de informações e dificuldade no
acompanhamento financeiro e pedagógico.
Plataformas SaaS (_Software as a Service_) especializadas para esse nicho são
escassas ou inacessíveis financeiramente para professores individuais.
O problema se agrava quando o professor precisa gerenciar múltiplos alunos com
horários, valores e históricos distintos.

O SyncClass originou-se de uma necessidade identificada em contexto profissional
real: um professor autônomo de inglês necessitava de uma plataforma integrada para
gestão de alunos, aulas e cobranças.
Os requisitos foram coletados diretamente com esse professor por meio de entrevistas,
o que conferiu ao projeto aderência às demandas práticas do domínio desde a fase
de concepção.
O sistema encontra-se em uso ativo pelo professor e seus alunos, constituindo
evidência de viabilidade além da simples entrega técnica.

## 1.2 Problema de Pesquisa

Como um professor autônomo de inglês pode gerenciar alunos, aulas, cobranças e
atividades de forma centralizada, segura e acessível, sem depender de múltiplas
ferramentas desconectadas?

## 1.3 Justificativa

O desenvolvimento do SyncClass justifica-se por quatro pilares fundamentais:

1. **Lacuna de mercado:** Ausência de ferramentas acessíveis e especializadas
   para professores autônomos, conforme evidenciado pelos dados do IBGE (2022)
   e do CIEB (2024) descritos na seção anterior.

2. **Complexidade operacional:** A gestão simultânea de agenda, financeiro e
   pedagógico exige integração técnica que ferramentas genéricas não oferecem.

3. **Segurança de dados:** O tratamento de dados de alunos menores ou adultos
   em uma plataforma educacional exige conformidade com a Lei Geral de Proteção
   de Dados Pessoais (LGPD), em especial o Art. 16, I da Lei nº 13.709/2018,
   que disciplina o término do tratamento de dados pessoais.

4. **Relevância acadêmica:** O projeto explora o ciclo completo de desenvolvimento
   de software moderno com suporte de Inteligência Artificial generativa,
   investigando hipóteses sobre produtividade e viabilidade de entrega solo
   em prazo acadêmico.

## 1.4 Objetivos

### 1.4.1 Objetivo Geral

Investigar a viabilidade de desenvolver e entregar um SaaS funcional para gestão
de professores autônomos de inglês, por um único desenvolvedor com suporte de
IA generativa, em prazo acadêmico.

### 1.4.2 Objetivos Específicos

- **Modelagem:** Implementar banco de dados relacional com isolamento de dados
  por professor (_Row Level Security_ — RLS).

- **Interface:** Desenvolver UI responsiva para três perfis de usuário
  (Administrador, Professor, Aluno).

- **Financeiro:** Implementar controle de pagamentos e gestão de comprovantes.

- **Pedagógico:** Criar módulo de atividades com suporte a _upload_ de arquivos
  e correção.

- **Compliance:** Garantir conformidade com a LGPD (anonimização e _soft
  delete_).

- **Produtividade:** Documentar o impacto do uso de IA generativa no ciclo de
  vida do desenvolvimento.

## 1.5 Hipóteses

- **H1:** O desenvolvimento de um SaaS funcional para gestão de professores
  autônomos de inglês, realizado por um único desenvolvedor com suporte de IA
  generativa, é concluído em 4,5 meses.

- **H2:** A adoção do Supabase como _Backend as a Service_ (BaaS) reduz em
  ≥60% o esforço estimado de desenvolvimento backend em comparação com uma
  stack tradicional equivalente (Node.js + PostgreSQL + Express).

- **H3:** O uso de IA generativa (Claude, Anthropic) como assistente de
  desenvolvimento acelera em pelo menos 3 vezes o tempo de execução de tarefas
  específicas de _scaffolding_, geração de _migrations_ SQL e auditoria de
  segurança.

## 1.6 Estrutura Organizacional do Trabalho

| **Capítulo** | **Título**               | **Conteúdo Resumido**                              |
| ------------ | ------------------------ | -------------------------------------------------- |
| **Cap. 1**   | Introdução               | Contexto, Problema, Objetivos e Hipóteses.         |
| **Cap. 2**   | Referencial Teórico      | SaaS, Cloud Computing, LGPD e IA no Dev.           |
| **Cap. 3**   | Metodologia              | Modelo iterativo incremental e ciclo de vida.      |
| **Cap. 4**   | Engenharia de Requisitos | Requisitos Funcionais e Não-Funcionais.            |
| **Cap. 5**   | Arquitetura e Modelagem  | DER, Diagrama de Classes e Arquitetura do Sistema. |
| **Cap. 6**   | Implementação            | Tecnologias utilizadas (React, Supabase, IA).      |
| **Cap. 7**   | Qualidade e Testes       | Testes automatizados e validação do MVP.           |
| **Cap. 8**   | Gestão do Projeto        | Cronograma executado e ferramentas de gestão.      |
| **Cap. 9**   | Infraestrutura e Deploy  | Pipeline CI/CD e Hospedagem.                       |
| **Cap. 10**  | Conclusão                | Análise das hipóteses e sugestões de melhorias.    |
