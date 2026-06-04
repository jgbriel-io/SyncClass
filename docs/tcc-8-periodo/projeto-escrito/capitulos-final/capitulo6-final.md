# 6 CRONOGRAMA DE ATIVIDADES

Este capítulo apresenta o cronograma de atividades do desenvolvimento do SyncClass, organizado em fases e iterações. O cronograma deriva das fontes primárias contemporâneas descritas na seção 3.8, o histórico de versionamento do projeto: os 152 _commits_ com marcação temporal na _branch_ principal e as 70 _migrations_ SQL numeradas. O desenvolvimento ativo concentrou-se no período de março a junho de 2026, totalizando aproximadamente três meses.

A numeração das 31 iterações é temática, e não estritamente cronológica: cada iteração agrupa um conjunto coeso de entregas por afinidade de tema ou de módulo, de modo que iterações distintas podem ter ocorrido em paralelo ou em sobreposição parcial no calendário. Por essa razão, os períodos associados às fases e aos blocos de iteração são indicados em granularidade de mês, e não em datas exatas de início e término. Cada fase identifica o tema predominante de um conjunto de iterações, e não uma janela exclusiva de atividade no repositório; o registro de _commits_ concentrou-se nos meses finais do período, à medida que os incrementos de cada tema eram consolidados e publicados na _branch_ principal. O fluxo de trabalho seguiu o modelo iterativo incremental (PRESSMAN; MAXIM, 2016), orientado por _branches_ por funcionalidade ou fase, _Pull Requests_ como pontos de revisão e _commits_ semânticos como registro de progresso.

## 6.1 Fases do Desenvolvimento

As 31 iterações agruparam-se em cinco fases, definidas pela natureza predominante das entregas de cada período. A Tabela 6.1 apresenta as fases, as iterações que as compõem, o período correspondente e as entregas principais.

**Tabela 6.1 — Fases do desenvolvimento**

| Fase                  | Iterações | Período             | Entregas principais                                                                                                                                                                     |
| :-------------------- | :-------- | :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fundação              | 1–7       | março de 2026       | Esquema inicial e CRUD, autenticação por perfil, _design tokens_, PWA, painel, atividades, pacotes de aulas, QR Code PIX, 161 testes                                                    |
| Consolidação          | 8–15      | março–abril de 2026 | Auditorias de segurança e _migrations_ de correção, separação de _hooks_, divisão de arquivos, construtores de consulta, correção de fuso horário, centralização de textos de interface |
| Expansão              | 16–23     | abril–maio de 2026  | Evolução dos módulos financeiro e de atividades, refinamentos de experiência de usuário e funcionalidades incrementais                                                                  |
| Qualidade e segurança | 24–28     | maio de 2026        | Auditoria de RLS, conformidade com práticas OWASP, revisão dos _advisors_ do Supabase, campanha de QA manual estruturada (roteiro de 187 itens, 20 rotas, 5 perfis)                     |
| Estabilização         | 29–31     | maio–junho de 2026  | Correção de defeitos identificados na verificação manual e integração de pagamentos PIX via AbacatePay                                                                                  |

Fonte: O autor (2026).

A fase de Fundação concentrou a construção do produto mínimo viável: o esquema inicial do banco, o CRUD das entidades centrais, a autenticação por perfil, a infraestrutura de qualidade (integração e entrega contínuas, _design tokens_ e PWA) e os primeiros incrementos relevantes, como o módulo de atividades, os pacotes de aulas e o pagamento por QR Code PIX, encerrando-se com uma suíte inicial de 161 testes automatizados, que evoluiu para os 304 testes registrados ao fim do projeto (Tabela 4.1).

A fase de Consolidação reuniu as auditorias periódicas de segurança, com as respectivas _migrations_ de correção, e o conjunto de refatorações arquiteturais: a separação entre a integração com o Supabase e os _hooks_ da aplicação, a divisão de arquivos extensos em unidades menores, a introdução de construtores de consulta reutilizáveis, a correção das conversões de fuso horário e a centralização dos textos de interface.

A fase de Expansão dedicou-se à evolução incremental dos módulos financeiro e de atividades e a refinamentos de experiência de usuário, ampliando o escopo funcional sobre a base consolidada.

A fase de Qualidade e segurança concentrou a auditoria sistemática das políticas RLS, a verificação de conformidade com práticas OWASP, a revisão dos _advisors_ do Supabase e a homologação manual estruturada, com a execução de um roteiro de QA que cobre as rotas e os perfis da aplicação. Essa campanha, iniciada na iteração 28, prosseguiu nas iterações seguintes.

A fase de Estabilização encerrou o ciclo de desenvolvimento ativo com a correção dos defeitos identificados na verificação manual e a integração de pagamentos PIX por meio do provedor AbacatePay. Essa integração substituiu o pagamento por QR Code estático adotado na fase de Fundação, transferindo a geração e a confirmação de cobranças para o gateway externo.

## 6.2 Diagrama de Gantt

A Figura 6.1 apresenta o diagrama de Gantt do desenvolvimento, que distribui as cinco fases ao longo dos aproximadamente três meses (março a junho de 2026). As fases de Fundação e Consolidação concentram-se em março e abril; a Expansão ocupa o período de abril a maio; as fases de Qualidade e segurança e de Estabilização encerram o ciclo em maio e junho.

**Figura 6.1 – Diagrama de Gantt do desenvolvimento**

[Figura pendente de geração e inserção no documento final]

Fonte: O autor (2026).
