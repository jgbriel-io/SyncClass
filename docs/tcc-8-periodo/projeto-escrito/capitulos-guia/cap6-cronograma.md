# 6 CRONOGRAMA DE ATIVIDADES

Este capítulo apresenta o cronograma de atividades do desenvolvimento do SyncClass, organizado em fases e iterações semanais. Diferentemente de um cronograma planejado a priori, o cronograma aqui descrito é retrospectivo: foi reconstruído a partir do histórico de execução e descreve o que de fato ocorreu ao longo do projeto, não uma previsão elaborada no início. A reconstrução apoia-se em fontes primárias contemporâneas, os 152 commits com marcação temporal na branch principal e as 70 migrations SQL numeradas sequencialmente, complementadas por registros de iteração elaborados pelo próprio pesquisador. Essa segunda categoria de fonte está sujeita a viés de reconstrução, razão pela qual a precisão do cronograma a partir de março de 2026 é estimada, e não exata.

O desenvolvimento ativo compreendeu o período de janeiro a junho de 2026, totalizando 4,5 meses, distribuídos em 31 iterações semanais. O fluxo de trabalho seguiu modelo iterativo incremental com ciclos semanais (PRESSMAN; MAXIM, 2016), orientado por branches por funcionalidade ou fase, Pull Requests como pontos de revisão e commits semânticos como registro de progresso.

## 6.1 Fases do Desenvolvimento

As 31 iterações agruparam-se em cinco fases, definidas pela natureza predominante das entregas de cada período. A Tabela 6.1 apresenta as fases, as iterações que as compõem, o período correspondente e as entregas principais.

**Tabela 6.1 — Fases do desenvolvimento**

| Fase                  | Iterações | Período            | Entregas Principais                                                                                                                                         |
| --------------------- | --------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fundação              | 1–7       | 19 jan–18 fev 2026 | Schema inicial e CRUD, autenticação por perfil, design tokens, PWA, dashboard, atividades, pacotes de aulas, QR Code PIX, 161 testes                        |
| Consolidação          | 8–15      | 19 fev–20 mai 2026 | Auditorias de segurança e migrations de correção, separação de hooks, split de arquivos, query builders, correção de fuso horário, centralização de strings |
| Expansão              | 16–23     | mar–mai 2026       | Evolução dos módulos financeiro e de atividades, refinamentos de UX e funcionalidades incrementais                                                          |
| Qualidade e segurança | 24–28     | 21–26 mai 2026     | Auditoria de RLS, conformidade OWASP, Supabase advisors, QA manual estruturado (116 itens, 20 rotas, 5 perfis)                                              |
| Estabilização         | 29–31     | 31 mai–03 jun 2026 | Correção de bugs identificados no QA e integração de pagamentos PIX via AbacatePay                                                                          |

A fase de Fundação concentrou a construção do MVP: o schema inicial do banco, o CRUD das entidades centrais, a autenticação por perfil, a infraestrutura de qualidade (CI/CD, design tokens, PWA) e os primeiros incrementos relevantes, como o módulo de atividades, os pacotes de aulas e o pagamento por QR Code PIX, encerrando-se com uma suíte inicial de testes automatizados.

A fase de Consolidação reuniu as auditorias periódicas de segurança, com as respectivas migrations de correção, e o conjunto de refatorações arquiteturais: a separação entre a integração com o Supabase e os hooks da aplicação, a divisão de arquivos extensos em unidades menores, a introdução de query builders reutilizáveis, a correção das conversões de fuso horário e a centralização das strings de interface.

A fase de Expansão dedicou-se à evolução incremental dos módulos financeiro e de atividades e a refinamentos de experiência de usuário, ampliando o escopo funcional sobre a base consolidada.

A fase de Qualidade e segurança concentrou a auditoria sistemática das políticas RLS, a verificação de conformidade com práticas OWASP, a revisão dos advisors do Supabase e a homologação manual estruturada, com a execução de um roteiro de QA cobrindo as rotas e os perfis da aplicação.

A fase de Estabilização encerrou o ciclo com a correção dos defeitos identificados na homologação e a integração de pagamentos PIX por meio do provedor AbacatePay.

## 6.2 Diagrama de Gantt

A Figura 6.1 apresenta o diagrama de Gantt retroativo do desenvolvimento, que distribui as cinco fases ao longo dos 4,5 meses (janeiro a junho de 2026). As fases de Fundação e Consolidação concentram-se em janeiro e fevereiro; a Consolidação e a Expansão ocupam o período de março a maio; as fases de Qualidade e segurança e de Estabilização encerram o ciclo em maio e junho.

**Figura 6.1 — Diagrama de Gantt retroativo (pendente de geração, inserir no documento final)**

## 6.3 Cronograma por Iteração

A Tabela 6.2 resume o cronograma por iteração, associando cada iteração ao período e às entregas principais. Para preservar a legibilidade, as entregas estão agrupadas por blocos de iterações dentro de cada fase.

**Tabela 6.2 — Cronograma por iteração (resumido)**

| Iterações | Período            | Entregas Principais                                                                                                               |
| --------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1–3       | 19 jan–30 jan 2026 | Schema inicial, CRUD de pagamentos e professores, autenticação por perfil, CI/CD, design tokens, PWA                              |
| 4–7       | 31 jan–18 fev 2026 | Dashboard, histórico do aluno, módulo de atividades, pacotes de aulas, QR Code PIX, suporte a estrangeiros, 161 testes            |
| 8–11      | 19 fev–21 abr 2026 | Auditorias de segurança e migrations de correção, separação de hooks, split de arquivos, query builders, correção de fuso horário |
| 12–15     | 21 abr–20 mai 2026 | Estrutura e expansão da centralização de strings, substituição de strings hardcoded, auditoria final de conteúdo                  |
| 16–23     | mar–mai 2026       | Evolução incremental dos módulos financeiro e de atividades, refinamentos de UX                                                   |
| 24–28     | 21–26 mai 2026     | Auditoria de RLS, conformidade OWASP, Supabase advisors, QA manual estruturado                                                    |
| 29–31     | 31 mai–03 jun 2026 | Correção de bugs pós-QA e integração de pagamentos PIX via AbacatePay                                                             |
