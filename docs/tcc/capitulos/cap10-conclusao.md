# 10. Conclusão

Este capítulo retoma os objetivos do trabalho,
confirma as três hipóteses formuladas na introdução,
apresenta as limitações identificadas durante o desenvolvimento
e propõe trabalhos futuros para evolução da plataforma.

## 10.1 Retomada dos Objetivos

Este trabalho teve como objetivo desenvolver o SyncClass,
uma plataforma SaaS web para gestão de professores de inglês,
cobrindo os módulos de alunos, aulas, financeiro e atividades,
com suporte a múltiplos roles de usuário.

A Tabela 10.1 apresenta os objetivos específicos,
status de atingimento e evidências.

**Tabela 10.1 — Objetivos específicos e status de atingimento**

| Objetivo Específico                 | Status      | Evidência                              |
| ----------------------------------- | ----------- | -------------------------------------- |
| Modelar e implementar banco com RLS | ✅ Atingido | 70 migrations, 40+ policies RLS        |
| Interface responsiva para 3 perfis  | ✅ Atingido | AdminShell, TeacherShell, StudentShell |
| Módulo financeiro com comprovantes  | ✅ Atingido | RF06–RF10 implementados                |
| Módulo de atividades com arquivos   | ✅ Atingido | RF11–RF13 implementados                |
| Conformidade com LGPD               | ✅ Atingido | Anonimização, soft delete, sem CPF     |
| Documentar impacto da IA            | ✅ Atingido | Cap. 8 — métricas e análise            |

Todos os objetivos específicos foram atingidos.

## 10.2 Confirmação das Hipóteses

**H1:** É possível desenvolver o SyncClass,
uma plataforma SaaS funcional e segura,
com um único desenvolvedor em aproximadamente 4,5 meses
utilizando ferramentas modernas e IA.

A hipótese H1 foi confirmada.
O projeto foi desenvolvido por um único desenvolvedor
em aproximadamente 4,5 meses (janeiro a junho de 2026),
com 147 commits, 359 arquivos TypeScript e ~55.000 linhas de código.
O período inclui:

- Janeiro a fevereiro (Sprints 1 a 7):
  MVP completo + hardening de segurança
- Março a abril (Sprints 8 a 11):
  Refatorações arquiteturais (separação hooks, split arquivos,
  query builders, timezone fix)
- Maio–Junho (Sprints 12 a 31):
  Centralização de strings, segurança, qualidade e auditoria final

**H2:** O uso de BaaS (Supabase) reduz significativamente
o tempo de desenvolvimento de backend.

A hipótese H2 foi confirmada.
O Supabase eliminou a necessidade de desenvolver autenticação,
API REST, storage e infraestrutura de banco.
Estima-se uma redução de 60 a 70% no esforço de backend
em comparação com uma API Node.js/NestJS tradicional.

**H3:** A assistência de IA aumenta a produtividade
em pelo menos 3x em tarefas de scaffolding, migrations e auditorias.

A hipótese H3 foi confirmada.
Em tarefas específicas (migrations SQL complexas,
auditorias de segurança, geração de documentação,
refatorações em larga escala),
o ganho foi superior a 10x.
Exemplos concretos:

- Sprint 9: Split de 6 hooks grandes em 24 arquivos.
  Tarefa manual aproximadamente 2 dias,
  com IA aproximadamente 4 horas (12x mais rápido).
- Sprint 10: Identificação de 15 queries duplicadas.
  Análise manual aproximadamente 1 dia,
  com IA aproximadamente 2 horas (4x mais rápido).
- Sprint 14: Substituição de 190 strings em 58 componentes.
  Tarefa manual aproximadamente 3 dias,
  com IA aproximadamente 6 horas (12x mais rápido).

Em tarefas de produto e UX, a IA não substituiu o julgamento humano.
O ganho médio estimado foi de 3 a 5x.

## 10.3 Limitações

As seguintes limitações foram identificadas:

- **Histórico git incompleto:**
  Parte do histórico foi perdida durante reestruturação de repositório,
  dificultando a rastreabilidade completa.
- **Ausência de testes E2E:**
  Testes de ponta a ponta automatizados não foram implementados no MVP.
  Os fluxos críticos foram validados manualmente (ver Cap. 7).
- **Testes de carga:**
  Não foram realizados testes de performance com volume real de dados.
- **Acessibilidade:**
  Implementação básica (WCAG A) não foi auditada formalmente.
- **Testes de integração:**
  Não foram implementados testes de integração automatizados que cubram o ciclo completo frontend → RPC → banco. A validação de integração foi realizada via QA manual (Sprint 28).

## 10.4 Trabalhos Futuros

A Tabela 10.2 apresenta melhorias planejadas para evolução da plataforma.

**Tabela 10.2 — Trabalhos futuros**

| Melhoria                                | Justificativa                            |
| --------------------------------------- | ---------------------------------------- |
| Testes de integração automatizados      | Cobrir ciclo frontend → RPC → banco      |
| Testes de carga                         | Validar RNF06 (< 2s) com dados reais     |
| Auditoria WCAG AA                       | Acessibilidade completa                  |
| App mobile nativo                       | Melhor experiência para alunos           |
| Integração com Google Calendar          | Sincronização de agenda                  |
| Relatórios exportáveis (PDF)            | Necessidade identificada por professores |
| Sistema de notificações                 | Email, push, in-app                      |
| Multi-tenancy com planos (Freemium/Pro) | Viabilidade comercial do SaaS            |

## 10.5 Considerações Finais

O desenvolvimento do SyncClass demonstrou que é possível,
com as ferramentas certas e o uso estratégico de IA,
que um único desenvolvedor entregue um produto SaaS completo,
seguro e funcional em um prazo reduzido.

O maior aprendizado não foi técnico,
mas sobre o papel do desenvolvedor na era da IA:
menos executor de código, mais arquiteto de soluções
e tomador de decisões.
A IA acelera a execução;
o julgamento humano ainda define o que vale a pena executar.

---

## Assets Necessários

- [ ] Nenhum — capítulo textual
- [ ] Revisar após defesa para incorporar feedback da banca

---

## Referências cruzadas

- **Objetivos:** Ver [Cap. 1 — Introdução](./cap1-introducao.md)
  para objetivos gerais e específicos
- **Hipóteses:** Ver [Cap. 1 — Introdução](./cap1-introducao.md)
  para H1, H2, H3
- **Gestão:** Ver [Cap. 8 — Gestão do Projeto](./cap8-gestao.md)
  para métricas de produtividade com IA
- **Qualidade:** Ver [Cap. 7 — Qualidade e Testes](./cap7-qualidade.md)
  para justificativa de ausência de E2E
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md)
  para histórico completo de 31 sprints documentadas
- **Trabalhos Futuros:** Ver sprints não implementadas em [docs/sprints/](../sprints/)
  (notificações, PDF, calendar, pagamento, gamificação)
