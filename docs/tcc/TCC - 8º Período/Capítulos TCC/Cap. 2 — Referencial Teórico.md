---
capitulo: 2
titulo: Referencial Teórico
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - tcc/escrita
  - status/rascunho
---
> [!INFO] Resumo do Capítulo
> Fundamentação teórica sobre Sistemas de Informação, Cloud Computing (SaaS/BaaS), a abordagem MVP, qualidade de software (ISO 25010), LGPD, IA no desenvolvimento e o alinhamento com as metas globais de sustentabilidade da ONU.

---

## 2.1 Sistemas de Informação e o Ensino Autônomo
Sistemas de Informação (SI) são conjuntos organizados de pessoas, processos, dados e tecnologia que coletam, processam, armazenam e distribuem informações para apoiar a tomada de decisão (LAUDON; LAUDON, 2014). O **SyncClass** enquadra-se como um SI operacional e estratégico, projetado para mitigar a fragmentação de dados no ensino de idiomas.

## 2.2 SaaS e Computação em Nuvem
A computação em nuvem é definida pelo NIST como um modelo que permite acesso ubíquo, conveniente e sob demanda a um conjunto compartilhado de recursos computacionais configuráveis (MELL; GRANCE, 2011).

O projeto adota o modelo **SaaS (Software as a Service)** para a entrega ao usuário final e **BaaS (Backend as a Service)** via Supabase para a infraestrutura, otimizando o ciclo de desenvolvimento.


🖼️ **Figura:** Pirâmide de modelos de serviço em nuvem (IaaS, PaaS, SaaS).

## 2.3 Produto Mínimo Viável (MVP) e Ciclo de Vida
A pesquisa fundamenta-se na abordagem de Eric Ries (2012), utilizando o ciclo "construir, medir, aprender". O desenvolvimento do SyncClass seguiu um modelo iterativo e incremental, onde cada incremento buscou validar funcionalidades essenciais (MVP) para resolver dores urgentes do professor autônomo (PRESSMAN; MAXIM, 2016).

## 2.4 Alinhamento com a Agenda 2030 (ONU)
O desenvolvimento tecnológico do SyncClass está estrategicamente alinhado aos **Objetivos de Desenvolvimento Sustentável (ODS)** da ONU:
* **ODS 4 (Educação de Qualidade):** Fortalecimento do acompanhamento pedagógico individualizado.
* **ODS 8 (Trabalho Decente):** Fomento à profissionalização e sustentabilidade da carreira docente autônoma.
* **ODS 9 (Indústria, Inovação e Infraestrutura):** Transformação digital de um setor tradicionalmente pouco tecnologizado.

## 2.5 Qualidade de Software — ISO/IEC 25010
A norma ISO/IEC 25010 define o modelo de qualidade com 8 características principais, utilizadas como métricas de validação para o SyncClass:

| Característica | Descrição |
| :--- | :--- |
| **Adequação Funcional** | O software cumpre os requisitos de gestão e pedagogia. |
| **Eficiência** | Desempenho adequado em tempo de resposta e recursos. |
| **Usabilidade** | Facilidade de aprendizado e uso pelos três perfis de usuário. |
| **Segurança** | Proteção via RLS e conformidade com a LGPD. |
| **Manutenibilidade** | Facilidade de modificação através de código modular. |


🖼️ **Figura:** Diagrama das características de qualidade ISO/IEC 25010.

## 2.6 Arquitetura de Software e BaaS
O projeto utiliza uma **Arquitetura Monolítica Modular** no frontend. Para o backend, a adoção do **Supabase (BaaS)** permite o uso de um PostgreSQL gerenciado com **Row Level Security (RLS)**, garantindo que cada professor acesse estritamente seus próprios dados em nível de linha no banco (POSTGRESQL, 2024).

## 2.7 LGPD (Lei Geral de Proteção de Dados)
Em conformidade com a Lei nº 13.709/2018, o SyncClass implementa:
* **Anonimização:** Através do campo `anonymized_at`.
* **Minimização:** Ausência de obrigatoriedade de dados sensíveis como CPF.
* **Privacidade por Design:** Isolamento de dados entre inquilinos (*Multi-tenancy* via RLS).

## 2.8 IA no Desenvolvimento de Software
O uso de Large Language Models (LLMs) como assistentes (GitHub Copilot, Claude) representa uma mudança no paradigma da Engenharia de Software. Estudos indicam ganhos de produtividade de até 55% em tarefas complexas (PENG et al., 2023). No SyncClass, a IA atuou na geração de *scaffolding*, auditoria de segurança e automação de documentação técnica.

## 2.9 DevOps e CI/CD
A prática de CI/CD (Continuous Integration / Continuous Delivery) automatiza a garantia de qualidade (HUMBLE; FARLEY, 2010). O uso de GitHub Actions garante que cada mudança de código no SyncClass passe por uma esteira de lint, type-check e testes antes do deploy.

---

## Referências Bibliográficas (Base)
ANDERSON, D. J. **Kanban: Successful Evolutionary Change**. Blue Hole Press, 2010.
HUMBLE, J.; FARLEY, D. **Continuous Delivery**. Addison-Wesley, 2010.
LAUDON, K. C.; LAUDON, J. P. **Sistemas de Informação Gerenciais**. 11. ed. Pearson, 2014.
MELL, P.; GRANCE, T. **The NIST Definition of Cloud Computing**. NIST, 2011.
NAÇÕES UNIDAS BRASIL. **Objetivos de Desenvolvimento Sustentável**. 2025.
PENG, S. et al. **The Impact of AI on Developer Productivity**. arXiv, 2023.
PRESSMAN, R. S.; MAXIM, B. R. **Engenharia de Software**. 8. ed. AMGH, 2016.
RIES, Eric. **A startup enxuta**. Lua de Papel, 2012.
SOMMERVILLE, I. **Engenharia de Software**. 9. ed. Pearson, 2011.