## Planejamento

### Estrutura do Capítulo

| Seção                     | Conteúdo                                                                      |
| ------------------------- | ----------------------------------------------------------------------------- |
| Introdução                | Importância do inglês, mercado autônomo, fragmentação das ferramentas, lacuna |
| 1.1 Problema de Pesquisa  | Questão norteadora em itálico                                                 |
| 1.2 Justificativa         | Relevância prática, social (ODS 4/8/9), tecnológica e de pesquisa (BaaS, IA)  |
| 1.3 Objetivos             | Objetivo geral + 5 objetivos específicos                                      |
| 1.4 Hipóteses             | H1 (4,5 meses solo), H2 (≥60% BaaS), H3 (≥3x IA)                              |
| 1.5 Estrutura do Trabalho | Descrição dos 10 capítulos                                                    |

### Citações Planejadas

- British Council (2023) — 5% de fluência no Brasil
- IBGE (2022) — crescimento 18% de autônomos na educação
- CIEB (2024) — mais de cinco horas semanais em tarefas admin
- Laudon e Laudon (2014) — SI e transformação organizacional (princípio geral)
- Ries (2012) — MVP e ciclo construir-medir-aprender
- Mell e Grance (2011) — definição NIST de SaaS/BaaS
- Peng et al. (2023) — produtividade com GitHub Copilot (base para H3)
- LGPD — Lei nº 13.709/2018
- Nações Unidas Brasil (2025) — ODS 4, 8 e 9

### Pendências Abertas

- [ ] Confirmar título exato e página do relatório British Council (2023) onde aparece o dado de 5%
- [ ] Confirmar qual pesquisa IBGE (2022) — PNAD ou Censo — e se isola idiomas de toda educação
- [ ] Adicionar referência ao professor autônomo do freela como validação prática (anônimo)
- [ ] Aguardar Forms exploratório com professores/alunos para referenciar como Apêndice A

---

> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo apresenta o contexto do SyncClass, uma plataforma
SaaS para gestão de professores autônomos de inglês.
Define-se o problema de pesquisa, a justificativa, os objetivos e as hipóteses
que guiam o desenvolvimento do projeto.

## 1.1 Contextualização

O mercado de ensino de idiomas no Brasil é composto majoritariamente por
professores autônomos e pequenas escolas.
Essas instituições dependem de ferramentas genéricas para gerenciar suas
operações: planilhas, WhatsApp e aplicativos de agenda.

Essa fragmentação gera retrabalho, perda de informações e dificuldade de
acompanhamento financeiro.
Plataformas SaaS (_Software as a Service_) especializadas para esse nicho são
escassas ou inacessíveis financeiramente para professores individuais.

O problema se agrava quando o professor precisa gerenciar múltiplos alunos com
horários, valores e históricos distintos.

## 1.2 Problema de Pesquisa

Como um professor autônomo de inglês pode gerenciar alunos, aulas, cobranças e
atividades de forma centralizada, segura e acessível, sem depender de múltiplas
ferramentas desconectadas?

## 1.3 Justificativa

O desenvolvimento do SyncClass justifica-se por quatro pilares fundamentais:

1. **Lacuna de mercado:** Ausência de ferramentas acessíveis e especializadas
   para professores autônomos.

2. **Complexidade operacional:** A gestão simultânea de agenda, financeiro e
   pedagógico exige integração técnica.

3. **Segurança de dados:** Necessidade de conformidade com a LGPD no tratamento
   de dados de alunos.

4. **Relevância acadêmica:** Exploração do ciclo completo de desenvolvimento de
   software moderno com auxílio de Inteligência Artificial.

## 1.4 Objetivos

### 1.4.1 Objetivo Geral

Desenvolver o SyncClass, uma plataforma SaaS web para gestão de professores de
inglês, cobrindo os módulos de alunos, aulas, financeiro e atividades, com
suporte a múltiplos níveis de acesso (_roles_).

### 1.4.2 Objetivos Específicos

- **Modelagem:** Implementar banco de dados relacional com isolamento de dados
  por professor (_Row Level Security_ - RLS).

- **Interface:** Desenvolver UI responsiva para três perfis de usuário
  (Administrador, Professor, Aluno).

- **Financeiro:** Implementar controle de pagamentos e gestão de comprovantes.

- **Pedagógico:** Criar módulo de atividades com suporte a upload de arquivos e
  correção.

- **Compliance:** Garantir conformidade com a LGPD (anonimização e _soft
  delete_).

- **Produtividade:** Documentar o impacto do uso de IA no ciclo de vida do
  desenvolvimento.

## 1.5 Hipóteses

- **H1:** É possível desenvolver o SyncClass com um único desenvolvedor em
  aproximadamente 4,5 meses utilizando ferramentas modernas e assistência de IA.
  A plataforma deve ser funcional e segura.

- **H2:** O uso de _Backend as a Service_ (Supabase) reduz significativamente o
  tempo de desenvolvimento em comparação com APIs REST tradicionais.

- **H3:** A assistência de IA (Claude/Copilot) aumenta a produtividade em pelo
  menos 3x em tarefas de _scaffolding_, migrações e auditoria de código.

## 1.6 Estrutura Organizacional do Trabalho

| **Capítulo** | **Título**               | **Conteúdo Resumido**                              |
| ------------ | ------------------------ | -------------------------------------------------- |
| **Cap. 1**   | Introdução               | Contexto, Problema, Objetivos e Hipóteses.         |
| **Cap. 2**   | Referencial Teórico      | SaaS, Cloud Computing, LGPD e IA no Dev.           |
| **Cap. 3**   | Metodologia              | Metodologias Ágeis e Ciclo de Vida do Software.    |
| **Cap. 4**   | Engenharia de Requisitos | Requisitos Funcionais e Não-Funcionais.            |
| **Cap. 5**   | Arquitetura e Modelagem  | DER, Diagrama de Classes e Arquitetura do Sistema. |
| **Cap. 6**   | Implementação            | Tecnologias utilizadas (React, Supabase, IA).      |
| **Cap. 7**   | Qualidade e Testes       | Testes unitários e validação do MVP.               |
| **Cap. 8**   | Gestão do Projeto        | Cronograma executado e ferramentas de gestão.      |
| **Cap. 9**   | Infraestrutura e Deploy  | Pipeline CI/CD e Hospedagem.                       |
| **Cap. 10**  | Conclusão                | Análise das hipóteses e sugestões de melhorias.    |

---

## Referências cruzadas

- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para detalhes técnicos da implementação
- **Backend:** Ver [docs/backend/overview.md](../backend/overview.md) para Edge
  Functions, RPCs e integrações
- **Frontend:** Ver [docs/frontend/overview.md](../frontend/overview.md) para
  componentes, hooks e design tokens
- **Database:** Ver [docs/database/overview.md](../database/overview.md) para
  schema, migrations e RLS
- **Security:** Ver [docs/security/overview.md](../security/overview.md) para
  autenticação, roles e validações
- **Git:** Ver [docs/git/overview.md](../git/overview.md) para workflow e
  convenções de commit
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md) para histórico
  completo de desenvolvimento (31 sprints implementadas)
