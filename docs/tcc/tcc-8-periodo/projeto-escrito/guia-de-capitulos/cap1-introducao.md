---
capitulo: 1
titulo: Introdução
status: ✅ Concluído
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---
> [!INFO] Resumo do Capítulo
> Contextualização do mercado de ensino autônomo, definição do problema de pesquisa, justificativa fundamentada nas ODS, objetivos mensuráveis e hipóteses do projeto SyncClass.

---

## 1.1 Contextualização
O mercado de ensino de idiomas no Brasil revela um descompasso tecnológico: enquanto a digitalização avança em diversos setores, a gestão da carreira de professores autônomos ainda se baseia em métodos anacrônicos e fragmentados. A dependência de ferramentas genéricas — como planilhas isoladas, grupos de WhatsApp e pastas de nuvem desconexas — gera retrabalho, perda de dados pedagógicos e ineficiência financeira.

Nesse cenário, o **SyncClass** surge como uma solução SaaS (Software as a Service) projetada para unificar as rotinas administrativas e pedagógicas em um ecossistema digital único, permitindo que o professor foque na qualidade do ensino enquanto a plataforma gerencia a complexidade operacional.

## 1.2 Problema de Pesquisa
A fragmentação da organização docente cria barreiras ao acompanhamento do progresso do aluno e sobrecarrega o profissional com tarefas manuais. Diante disso, questiona-se: 

**De que forma a introdução de uma plataforma web unificada (SyncClass) pode reestruturar o fluxo de trabalho e o acompanhamento pedagógico de professores autônomos de idiomas, mitigando as ineficiências inerentes aos métodos de gestão fragmentados?**

## 1.3 Justificativa
O desenvolvimento do SyncClass fundamenta-se em quatro pilares de relevância:

1. **Lacuna de Mercado:** Ausência de ferramentas acessíveis que integrem o ciclo financeiro ao pedagógico para o docente individual.
2. **Complexidade Operacional:** A necessidade de centralizar agenda, pagamentos e materiais em uma infraestrutura resiliente.
3. **Segurança e Compliance:** A urgência na proteção de dados sensíveis e conformidade com a LGPD através de tecnologias como Row Level Security (RLS).
4. **Alinhamento Global (ONU):** O projeto contribui para os Objetivos de Desenvolvimento Sustentável:
    * **ODS 4 (Educação):** Melhora a qualidade do acompanhamento individual.
    * **ODS 8 (Trabalho):** Promove a profissionalização e produtividade do autônomo.
    * **ODS 9 (Inovação):** Fomenta a infraestrutura digital em setores tradicionais.

## 1.4 Objetivos

### 1.4.1 Objetivo Geral
Desenvolver e validar o **SyncClass**, uma plataforma web integrada concebida como um Produto Mínimo Viável (MVP), que centralize as rotinas administrativas, pedagógicas e de comunicação do professor de idiomas.

### 1.4.2 Objetivos Específicos
* **Mapeamento:** Identificar processos e dores dos docentes para definir funcionalidades de alto impacto.
* **Modelagem:** Implementar um banco de dados relacional com isolamento de dados nativo (PostgreSQL/RLS).
* **Interface:** Desenvolver uma UI responsiva com níveis de acesso para Administrador, Professor e Aluno.
* **Implementação:** Codificar módulos de controle financeiro (PIX), histórico de aulas e repositório de atividades.
* **Qualidade:** Validar o software através de testes automatizados e avaliação pela norma ISO 25010.
* **Análise de IA:** Documentar quantitativamente o impacto do uso de IA no ciclo de vida do desenvolvimento.

## 1.5 Hipóteses
* **H1:** É possível entregar um SaaS completo e seguro como desenvolvedor solo em ~3 meses utilizando assistência estratégica de IA.
* **H2:** O uso de Backend as a Service (Supabase) reduz em pelo menos 60% o esforço de desenvolvimento de infraestrutura de backend.
* **H3:** A unificação tecnológica reduz o tempo gasto em tarefas administrativas manuais e aumenta o profissionalismo percebido pelos alunos.

## 1.6 Estrutura Organizacional do Trabalho

| Capítulo | Título | Conteúdo Resumido |
| :--- | :--- | :--- |
| **Cap. 1** | Introdução | Problema, Objetivos, Justificativa e Hipóteses. |
| **Cap. 2** | Referencial Teórico | MVP (Eric Ries), SaaS, LGPD e ODS da ONU. |
| **Cap. 3** | Metodologia | Pesquisa-Ação, Kanban e IA como Metodologia. |
| **Cap. 4** | Engenharia de Requisitos | Requisitos Funcionais (RF), Não-Funcionais (RNF) e Casos de Uso. |
| **Cap. 5** | Arquitetura e Modelagem | DER, Monolito Modular e Segurança RLS. |
| **Cap. 6** | Implementação | Stack técnica, Estrutura de Pastas e Módulos. |
| **Cap. 7** | Qualidade e Testes | Vitest, Playwright e Norma ISO 25010. |
| **Cap. 8** | Gestão do Projeto | Cronograma, Riscos e Métricas de Produtividade (IA). |
| **Cap. 9** | Infraestrutura e Deploy | Docker, CI/CD e Hospedagem em Nuvem. |
| **Cap. 10** | Conclusão | Validação das Hipóteses e Trabalhos Futuros. |
