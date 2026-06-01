---
capitulo: 10
titulo: Conclusão
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---

> [!INFO] Resumo do Capítulo
> Avaliação final do projeto frente aos objetivos propostos, validação das hipóteses levantadas e mapeamento de limitações e evoluções futuras.

---

## 10.1 Retomada dos Objetivos

O projeto **alcança** o propósito de desenvolver uma plataforma SaaS web funcional para a gestão de professores autônomos. A avaliação do cumprimento dos objetivos **apresenta-se** conforme o quadro abaixo:

| **Objetivo Específico**             | **Status** | **Evidência de Entrega**                                     |
| :---------------------------------- | :--------: | :----------------------------------------------------------- |
| Modelar e implementar banco com RLS |     ✅     | 23 migrations ativas e 40+ políticas de segurança.           |
| Interface responsiva para 3 perfis  |     ✅     | Implementação de AdminShell, TeacherShell e StudentShell.    |
| Módulo financeiro com comprovantes  |     ✅     | RF06 a RF10 implementados e validados.                       |
| Módulo de atividades com arquivos   |     ✅     | RF11 a RF13 operacionais.                                    |
| Conformidade com LGPD               |     ✅     | Anonimização, _soft delete_ e cadastro sem exigência de CPF. |
| Documentar impacto da IA            |     ✅     | Análise métrica detalhada no Capítulo 8.                     |

## 10.2 Confirmação das Hipóteses

As hipóteses levantadas no início do trabalho **foram testadas** ao longo do desenvolvimento:

- **H1: Viabilidade Solo-Dev com IA:** É possível desenvolver um SaaS funcional e seguro sozinho em ~3 meses.
  - **Resultado:** **Confirmada.** O projeto **está operacional** após 3 meses de desenvolvimento ativo, contando com aproximadamente 46.400 linhas de código e 391 arquivos.
- **H2: Eficiência do BaaS (Supabase):** O uso de BaaS reduz significativamente o tempo de backend.
  - **Resultado:** **Confirmada.** A plataforma **delega** autenticação, API e infraestrutura ao Supabase, resultando em uma economia estimada de 60% a 70% no esforço de backend.
- **H3: Aumento de Produtividade via IA:** A IA aumenta a produtividade em pelo menos 3x.
  - **Resultado:** **Parcialmente confirmada.** Em tarefas técnicas (SQL, auditoria, scaffolding), o ganho **supera** 10x. Em UX e decisões de produto, a IA não substitui o julgamento humano. O ganho médio **estabiliza-se** entre 3x e 5x.

## 10.3 Limitações Identificadas

Durante o processo de construção, **observam-se** as seguintes restrições:

- **Rastreabilidade:** Perda parcial do histórico Git durante a reestruturação do repositório.
- **Performance:** Ausência de testes de carga com volume massivo de dados (stress test).
- **Acessibilidade:** Implementação baseada em WCAG A, carecendo de uma auditoria formal.
- **Automação:** O fluxo de deploy final para a VPS ainda **permanece** manual.
- **Código:** Identificação de componentes e hooks com alta complexidade ciclomática (arquivos extensos).

## 10.4 Trabalhos Futuros

Para a continuidade da plataforma, os seguintes incrementos **estão mapeados**:

| **Melhoria**             | **Justificativa**                                     |
| :----------------------- | :---------------------------------------------------- |
| Refatoração de Código    | Melhorar a manutenibilidade a longo prazo.            |
| Deploy Automatizado (CD) | Eliminar a intervenção manual no processo de release. |
| Testes de Carga          | Validar o tempo de resposta (RNF06) sob estresse.     |
| Auditoria WCAG AA        | Garantir acessibilidade plena a todos os usuários.    |
| Sincronização de Agenda  | Integração nativa com Google Calendar.                |
| Modelo Freemium/Pro      | Viabilizar a plataforma como um negócio comercial.    |

## 10.5 Considerações Finais

O desenvolvimento desta plataforma **demonstra** que, com o uso estratégico de Inteligência Artificial e ferramentas modernas, o papel do desenvolvedor solo **está evoluindo**. A transição de um mero "escritor de código" para um "arquiteto de soluções" é nítida.

A IA **atua** como um acelerador de execução, mas o julgamento humano **continua sendo** o fator decisivo para definir o que deve ser construído e como garantir que o software seja ético, seguro e útil para o usuário final.

---

## Assets Necessários

- [ ] 📝 **Revisão:** Incorporar feedbacks da banca examinadora após a defesa.
- [ ] 📝 **Revisão:** Validar se todas as limitações foram devidamente endereçadas no texto.
