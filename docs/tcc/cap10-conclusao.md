> **Status:** 🟡 Rascunho inicial — revisar após defesa
> **Última Atualização:** 20/05/2026

## 10.1 Retomada dos Objetivos

Este trabalho teve como objetivo desenvolver uma SyncClass, uma plataforma SaaS web para gestão de professores de inglês, cobrindo os módulos de alunos, aulas, financeiro e atividades, com suporte a múltiplos _roles_ de usuário.

|**Objetivo Específico**|**Status**|**Evidência**|
|---|---|---|
|Modelar e implementar banco com RLS|✅ Atingido|25 migrations, 40+ policies RLS|
|Interface responsiva para 3 perfis|✅ Atingido|AdminShell, TeacherShell, StudentShell|
|Módulo financeiro com comprovantes|✅ Atingido|RF06–RF10 implementados|
|Módulo de atividades com arquivos|✅ Atingido|RF11–RF13 implementados|
|Conformidade com LGPD|✅ Atingido|Anonimização, soft delete, sem CPF|
|Documentar impacto da IA|✅ Atingido|Cap. 8 — métricas e análise|

## 10.2 Confirmação das Hipóteses

**H1:** É possível desenvolver o SyncClass — uma plataforma SaaS funcional e segura com um único desenvolvedor em ~4 meses utilizando ferramentas modernas e IA.

→ **Confirmada.** O projeto foi desenvolvido por um único desenvolvedor em aproximadamente 4 meses (janeiro–maio 2026), com ~276 commits, 391 arquivos e ~46.400 linhas de código. O período inclui:
- **Jan-Fev (Sprints 1-7):** MVP completo + hardening de segurança
- **Mar-Abr (Sprints 8-11):** Refatorações arquiteturais (separação hooks, split arquivos, query builders, timezone fix)
- **Mai (Sprints 12-15):** Centralização de strings UI (preparação i18n)

---

**H2:** O uso de BaaS (Supabase) reduz significativamente o tempo de desenvolvimento de backend.

→ **Confirmada.** O Supabase eliminou a necessidade de desenvolver autenticação, API REST, storage e infraestrutura de banco. Estima-se uma redução de 60–70% no esforço de backend em comparação com uma API Node.js/NestJS tradicional.

---

**H3:** A assistência de IA aumenta a produtividade em pelo menos 3x em tarefas de _scaffolding_, migrations e auditorias.

→ **Confirmada.** Em tarefas específicas (migrations SQL complexas, auditorias de segurança, geração de documentação, refatorações em larga escala), o ganho foi superior a 10x. Exemplos concretos:
- Sprint 9: Split de 6 hooks grandes em 24 arquivos — tarefa manual ~2 dias, com IA ~4 horas (12x mais rápido)
- Sprint 10: Identificação de 15 queries duplicadas — análise manual ~1 dia, com IA ~2 horas (4x mais rápido)
- Sprint 14: Substituição de 190 strings em 58 componentes — tarefa manual ~3 dias, com IA ~6 horas (12x mais rápido)

Em tarefas de produto e UX, a IA não substituiu o julgamento humano. O ganho médio estimado foi de 3–5x.

## 10.3 Limitações

- **Histórico git incompleto:** Parte do histórico foi perdida durante reestruturação de repositório, dificultando a rastreabilidade completa.
- **Ausência de testes E2E:** Testes de ponta a ponta automatizados não foram implementados no MVP. Os fluxos críticos foram validados manualmente (ver Cap. 7).
- **Testes de carga:** Não foram realizados testes de performance com volume real de dados.
- **Acessibilidade:** Implementação básica (WCAG A) — não foi auditada formalmente.
- **Deploy automatizado:** O deploy final para VPS ainda é manual.

## 10.4 Trabalhos Futuros

|**Melhoria**|**Justificativa**|
|---|---|
|Testes E2E com Playwright|Cobertura de fluxos críticos não cobertos por unitários|
|Deploy automatizado (CD)|Reduzir fricção de releases|
|Testes de carga|Validar RNF06 (< 2s) com dados reais|
|Auditoria WCAG AA|Acessibilidade completa|
|App mobile nativo|Melhor experiência para alunos|
|Integração com Google Calendar|Sincronização de agenda (Sprint 18 planejada)|
|Relatórios exportáveis (PDF)|Necessidade identificada por professores (Sprint 17 planejada)|
|Sistema de notificações|Email, push, in-app (Sprint 16 planejada)|
|Gateway de pagamento real|Stripe/Mercado Pago (Sprint 19 planejada)|
|Multi-tenancy com planos (Freemium/Pro)|Viabilidade comercial do SaaS|

## 10.5 Considerações Finais

O desenvolvimento do SyncClass demonstrou que é possível, com as ferramentas certas e o uso estratégico de IA, que um único desenvolvedor entregue um produto SaaS completo, seguro e funcional em um prazo reduzido.

O maior aprendizado não foi técnico — foi sobre o papel do desenvolvedor na era da IA: menos executor de código, mais arquiteto de soluções e tomador de decisões. A IA acelera a execução; o julgamento humano ainda define o que vale a pena executar.

---

## Assets Necessários

- [ ] Nenhum — capítulo textual
- [ ] Revisar após defesa para incorporar feedback da banca

