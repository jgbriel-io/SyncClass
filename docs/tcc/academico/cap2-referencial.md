> **Status:** 🟡 Versão Acadêmica
>
> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo apresenta os fundamentos teóricos que embasam o
SyncClass: SaaS, computação em nuvem, ciclo de vida de software, metodologias
ágeis, qualidade (ISO 25010), arquitetura, banco de dados, LGPD, DevOps e o
papel da IA no desenvolvimento moderno.

## 2.1 Sistemas de Informação

Sistemas de Informação (SI) são conjuntos organizados de pessoas, processos,
dados e tecnologia que coletam, processam, armazenam e distribuem informações
para apoiar a tomada de decisão (LAUDON; LAUDON, 2014).

O SyncClass se enquadra como um SI operacional voltado à gestão de processos
educacionais e financeiros.

## 2.2 SaaS e Computação em Nuvem

A computação em nuvem é definida pelo NIST como um modelo que permite acesso
ubíquo, conveniente e sob demanda a um conjunto compartilhado de recursos
computacionais configuráveis (MELL; GRANCE, 2011).

Os três modelos de serviço são:

- **IaaS (_Infrastructure as a Service_):** Infraestrutura virtualizada sob
  demanda (ex: AWS EC2, Google Compute Engine).

- **PaaS (_Platform as a Service_):** Plataforma de desenvolvimento gerenciada
  (ex: Heroku, Railway).

- **SaaS (_Software as a Service_):** Software entregue via web, sem instalação
  local (ex: Google Workspace, Salesforce).

> 🖼️ **Figura:** Pirâmide IaaS/PaaS/SaaS com exemplos

Este projeto adota o modelo **SaaS** para o produto final e **PaaS** para o
backend (Supabase), combinando os benefícios de ambos.

## 2.3 Ciclo de Vida de Software

O desenvolvimento seguiu um modelo **iterativo e incremental**, com
características de metodologias ágeis.
Cada iteração entregou funcionalidades completas e testadas, sem fases
sequenciais rígidas (PRESSMAN; MAXIM, 2016).

## 2.4 Metodologias Ágeis

O **Kanban** foi adotado como sistema de gestão do fluxo de trabalho.
Diferente do Scrum, o Kanban não exige sprints fixas nem cerimônias formais,
sendo adequado para desenvolvimento solo (ANDERSON, 2010).

O fluxo foi gerenciado via branches git e commits semânticos.

## 2.5 Qualidade de Software — ISO/IEC 25010

A norma ISO/IEC 25010 define um modelo de qualidade de produto de software com
8 características principais:

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

> 🖼️ **Figura:** Diagrama ISO 25010 com as 8 características

## 2.6 Engenharia de Requisitos

Requisitos de software são descrições dos serviços que o sistema deve fornecer
e as restrições sob as quais deve operar (SOMMERVILLE, 2011).

Dividem-se em:

- **Requisitos Funcionais (RF):** O que o sistema deve fazer.
- **Requisitos Não Funcionais (RNF):** Restrições de qualidade, desempenho e
  segurança.

## 2.7 Arquitetura de Software

### 2.7.1 Monolito vs. Microsserviços

O projeto adota arquitetura **monolítica modular** no frontend, com separação
clara de responsabilidades por camadas (`Components → Hooks → Services →
Banco`).

Essa escolha é justificada pela escala do projeto e pelo time de um
desenvolvedor.

### 2.7.2 BaaS (_Backend as a Service_)

O Supabase é um BaaS open-source que provê PostgreSQL gerenciado, autenticação,
storage e funções serverless.

Elimina a necessidade de desenvolver e manter uma API REST tradicional,
reduzindo significativamente o tempo de desenvolvimento de backend.

## 2.8 Banco de Dados Relacional

O PostgreSQL foi escolhido por sua robustez, suporte a tipos avançados (UUID,
JSONB, TIMESTAMPTZ) e recursos de segurança como o **_Row Level Security_
(RLS)**.

O RLS é um mecanismo que restringe o acesso a linhas individuais com base na
identidade do usuário autenticado (POSTGRESQL DOCUMENTATION, 2024).

## 2.9 LGPD

A Lei nº 13.709/2018 — Lei Geral de Proteção de Dados — estabelece regras para
coleta, armazenamento e tratamento de dados pessoais no Brasil.

O projeto implementa:

- Anonimização de dados pessoais (`anonymized_at`).
- _Soft delete_ (preservação para auditoria sem exposição).
- Ausência de CPF obrigatório.
- Logs de auditoria para rastreabilidade.

## 2.10 DevOps e CI/CD

**CI/CD (_Continuous Integration / Continuous Delivery_)** é a prática de
automatizar build, testes e deploy a cada mudança de código (HUMBLE; FARLEY,
2010).

O projeto utiliza GitHub Actions para lint, type-check, testes e build
automáticos.

## 2.11 IA no Desenvolvimento de Software

O uso de _Large Language Models_ (LLMs) como assistentes de programação
representa uma mudança paradigmática no desenvolvimento de software.

Ferramentas como GitHub Copilot e Claude (Anthropic) são capazes de gerar
código, identificar bugs, sugerir refatorações e produzir documentação técnica
(CHEN et al., 2021).

Estudos preliminares indicam ganhos de produtividade de 55% em tarefas de
programação com assistência de IA (PENG et al., 2023).
Este projeto documenta empiricamente esse impacto no Capítulo 8.

---

## Assets Necessários

- [ ] 🖼️ Figura: Pirâmide IaaS/PaaS/SaaS
- [ ] 🖼️ Figura: Diagrama ISO 25010
- [ ] 🖼️ Figura: Pirâmide de testes (unitários → integração → E2E)
- [ ] 🖼️ Figura: Arquitetura conceitual da plataforma

---

## Referências

- LAUDON, K. C.; LAUDON, J. P. **Sistemas de Informação Gerenciais**. 11. ed.
  São Paulo: Pearson, 2014.
- MELL, P.; GRANCE, T. **The NIST Definition of Cloud Computing**. NIST Special
  Publication 800-145, 2011.
- PRESSMAN, R. S.; MAXIM, B. R. **Engenharia de Software**. 8. ed. Porto
  Alegre: AMGH, 2016.
- SOMMERVILLE, I. **Engenharia de Software**. 9. ed. São Paulo: Pearson, 2011.
- ANDERSON, D. J. **Kanban: Successful Evolutionary Change for Your Technology
  Business**. Blue Hole Press, 2010.
- HUMBLE, J.; FARLEY, D. **Continuous Delivery**. Addison-Wesley, 2010.
- CHEN, M. et al. Evaluating Large Language Models Trained on Code.
  arXiv:2107.03374, 2021.
- PENG, S. et al. The Impact of AI on Developer Productivity. arXiv:2302.06590, 2023.
- PostgreSQL Documentation. **Row Security Policies**. 2024. Disponível em:
  https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

## Referências cruzadas

- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para implementação prática dos conceitos de arquitetura monolítica modular
- **Backend:** Ver [docs/backend/overview.md](../backend/overview.md) para uso
  de BaaS (Supabase) e Edge Functions
- **Database:** Ver [docs/database/overview.md](../database/overview.md) para
  implementação de RLS e schema PostgreSQL
- **Security:** Ver [docs/security/overview.md](../security/overview.md) para
  conformidade LGPD e políticas de segurança
- **Qualidade:** Ver [Cap. 7 — Qualidade e Testes](./cap7-qualidade.md) para
  aplicação prática da ISO 25010
- **Gestão:** Ver [Cap. 8 — Gestão do Projeto](./cap8-gestao.md) para uso de
  Kanban e impacto da IA no desenvolvimento
