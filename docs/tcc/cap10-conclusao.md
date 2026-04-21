> **Status:** 🟡 Rascunho inicial — revisar após defesa
> **Última Atualização:** 21/04/2026

## 10.1 Retomada dos Objetivos

Este trabalho teve como objetivo desenvolver uma SyncClass, uma plataforma SaaS web para gestão de professores de inglês, cobrindo os módulos de alunos, aulas, financeiro e atividades, com suporte a múltiplos _roles_ de usuário.

|**Objetivo Específico**|**Status**|**Evidência**|
|---|---|---|
|Modelar e implementar banco com RLS|✅ Atingido|23 migrations, 40+ policies RLS|
|Interface responsiva para 3 perfis|✅ Atingido|AdminShell, TeacherShell, StudentShell|
|Módulo financeiro com comprovantes|✅ Atingido|RF06–RF10 implementados|
|Módulo de atividades com arquivos|✅ Atingido|RF11–RF13 implementados|
|Conformidade com LGPD|✅ Atingido|Anonimização, soft delete, sem CPF|
|Documentar impacto da IA|✅ Atingido|Cap. 8 — métricas e análise|

## 10.2 Confirmação das Hipóteses

**H1:** É possível desenvolver o SyncClass — uma plataforma SaaS funcional e segura com um único desenvolvedor em ~3 meses utilizando ferramentas modernas e IA.

→ **Confirmada.** O projeto foi desenvolvido por um único desenvolvedor em aproximadamente 3 meses (janeiro–abril 2026), com ~218 commits, 391 arquivos e ~46.400 linhas de código.

---

**H2:** O uso de BaaS (Supabase) reduz significativamente o tempo de desenvolvimento de backend.

→ **Confirmada.** O Supabase eliminou a necessidade de desenvolver autenticação, API REST, storage e infraestrutura de banco. Estima-se uma redução de 60–70% no esforço de backend em comparação com uma API Node.js/NestJS tradicional.

---

**H3:** A assistência de IA aumenta a produtividade em pelo menos 3x em tarefas de _scaffolding_, migrations e auditorias.

→ **Parcialmente confirmada.** Em tarefas específicas (migrations SQL complexas, auditorias de segurança, geração de documentação), o ganho foi superior a 10x. Em tarefas de produto e UX, a IA não substituiu o julgamento humano. O ganho médio estimado foi de 3–5x.

## 10.3 Limitações

- **Histórico git incompleto:** Parte do histórico foi perdida durante reestruturação de repositório, dificultando a rastreabilidade completa.
- **Testes de carga:** Não foram realizados testes de performance com volume real de dados.
- **Acessibilidade:** Implementação básica (WCAG A) — não foi auditada formalmente.
- **Deploy automatizado:** O deploy final para VPS ainda é manual.
- **Arquivos grandes:** Alguns componentes e hooks ultrapassam o limite recomendado de linhas (ver sprints 10–12).

## 10.4 Trabalhos Futuros

|**Melhoria**|**Justificativa**|
|---|---|
|Refatoração dos arquivos grandes|Manutenibilidade a longo prazo|
|Deploy automatizado (CD)|Reduzir fricção de releases|
|Testes de carga|Validar RNF06 (< 2s) com dados reais|
|Auditoria WCAG AA|Acessibilidade completa|
|App mobile nativo|Melhor experiência para alunos|
|Integração com Google Calendar|Sincronização de agenda|
|Relatórios exportáveis (PDF)|Necessidade identificada por professores|
|Multi-tenancy com planos (Freemium/Pro)|Viabilidade comercial do SaaS|

## 10.5 Considerações Finais

O desenvolvimento do SyncClass demonstrou que é possível, com as ferramentas certas e o uso estratégico de IA, que um único desenvolvedor entregue um produto SaaS completo, seguro e funcional em um prazo reduzido.

O maior aprendizado não foi técnico — foi sobre o papel do desenvolvedor na era da IA: menos executor de código, mais arquiteto de soluções e tomador de decisões. A IA acelera a execução; o julgamento humano ainda define o que vale a pena executar.

---

## Assets Necessários

- [ ] Nenhum — capítulo textual
- [ ] Revisar após defesa para incorporar feedback da banca

