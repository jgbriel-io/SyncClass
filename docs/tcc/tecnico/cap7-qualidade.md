> **Status:** 🟠 Rascunho — adicionar resultados de cobertura
> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo apresenta a estratégia de testes (pirâmide com base em unitários), 26 arquivos de teste Vitest, justificativa para ausência de E2E automatizados, testes manuais de fluxos críticos e avaliação do projeto segundo ISO 25010.

## 7.1 Estratégia de Testes

O projeto adota uma estratégia de testes em dois níveis: testes automatizados unitários (base da pirâmide) e testes manuais estruturados de fluxos críticos. Testes E2E automatizados foram identificados como trabalho futuro após a estabilização da arquitetura de componentes (ver Seção 10.4).

```
        /\
       /E2E \       ← não implementado (trabalho futuro)
      /──────\
     /Manual  \     ← 4 fluxos críticos validados
    /────────────\
   / Unitários   \  ← 26 arquivos Vitest
  /────────────────\
```

> 🖼️ **Figura:** Pirâmide de testes do projeto

## 7.2 Testes Unitários

**Ferramenta:** Vitest + Testing Library + jsdom

| **Arquivo de Teste**             | **O que Testa**                              |
| -------------------------------- | -------------------------------------------- |
| `useStudents.test.tsx`           | CRUD de alunos, filtros, paginação           |
| `useTeachers.test.tsx`           | CRUD de professores                          |
| `useClassLogs.test.tsx`          | Registro de aulas, validação de sobreposição |
| `useUserMutations.test.tsx`      | Criação de usuários, convites                |
| `useOptimisticMutation.test.tsx` | Atualizações otimistas com rollback          |
| `useDebouncedValue.test.ts`      | Debounce de inputs                           |
| `schemas.test.ts`                | Validação Zod de formulários                 |
| `formatters.test.ts`             | Formatação de datas, moeda, telefone         |
| `sanitize.test.ts`               | Sanitização de inputs do usuário             |
| `errorMessages.test.ts`          | Mapeamento de erros do Supabase              |
| `rateLimit.test.ts`              | Rate limiting frontend                       |
| `filterDefaults.test.ts`         | Valores padrão de filtros                    |
| `icon-sizes.test.ts`             | Design tokens — ícones                       |
| `spacing.test.ts`                | Design tokens — espaçamento                  |
| `typography.test.ts`             | Design tokens — tipografia                   |
| `modal-sizes.test.ts`            | Design tokens — modais                       |
| `table-columns.test.ts`          | Design tokens — colunas de tabela            |
| `button.test.tsx`                | Componente Button                            |

**Total:** 26 arquivos de teste

Os 8 arquivos adicionados após a sprint de refatoração de componentes (sprints 10–12):

| **Arquivo de Teste**            | **O que Testa**                             |
| ------------------------------- | ------------------------------------------- |
| `StudentsTableRow.test.tsx`     | Renderização e interações da linha de aluno |
| `NavLink.test.tsx`              | Navegação ativa/inativa por rota            |
| `TeachersTableRow.test.tsx`     | Renderização da linha de professor          |
| `ActivitiesTableRow.test.tsx`   | Renderização da linha de atividade          |
| `FinancialTableRow.test.tsx`    | Renderização da linha de cobrança           |
| `ClassesTableRow.test.tsx`      | Renderização da linha de aula               |
| `MetricCard.test.tsx`           | Componente de métricas do dashboard         |
| `ChangePasswordDialog.test.tsx` | Fluxo de troca obrigatória de senha         |

> 🖼️ **Figura:** Output do Vitest com resultados

## 7.3 Ausência de Testes E2E e Justificativa

Testes E2E automatizados com Playwright não foram implementados no escopo do MVP. A decisão foi técnica e deliberada:

- A prioridade do desenvolvimento foi a cobertura de lógica de negócio via testes unitários, onde o custo de manutenção é menor e o retorno imediato é maior.
- A arquitetura de componentes passou por refatorações até as sprints 10–12, tornando a escrita de seletores E2E estáveis prematura.
- O prazo de desenvolvimento (~3 meses, um desenvolvedor) não comportava a infraestrutura de CI/CD adicional necessária para testes E2E confiáveis.

Os fluxos críticos foram validados por testes manuais estruturados (Seção 7.4). A implementação de E2E com Playwright está planejada como trabalho futuro (Seção 10.4), após a estabilização dos componentes.

## 7.4 Testes Manuais

Além dos testes automatizados, foram realizadas sessões de teste manual:

- Fluxo completo de onboarding (convite → primeiro acesso → troca de senha).
- Pagamento via PIX (QR Code → upload comprovante → aprovação).
- Entrega de atividade (aluno entrega → professor corrige).
- Responsividade em dispositivos móveis reais.

## 7.5 Avaliação ISO 25010

| **Característica**       | **Avaliação** | **Evidência**                                           |
| ------------------------ | ------------- | ------------------------------------------------------- |
| Adequação funcional      | ✅ Alta       | 20 RF implementados                                     |
| Eficiência de desempenho | ✅ Alta       | Índices compostos, paginação, materialized views        |
| Compatibilidade          | ✅ Alta       | PWA, responsivo, cross-browser                          |
| Usabilidade              | ✅ Alta       | Mobile-first, design tokens, empty states, skeletons    |
| Confiabilidade           | ✅ Alta       | Idempotência, soft delete, audit logs                   |
| Segurança                | ✅ Alta       | RLS, JWT, rate limiting, sanitização, LGPD              |
| Manutenibilidade         | 🟡 Média      | Arquivos grandes (ver sprints 10–12)                    |
| Portabilidade            | ✅ Alta       | Variáveis de ambiente, sem dependência de SO específico |

> 🖼️ **Figura:** Tabela ISO 25010 formatada

---

## Assets Necessários

- [ ] 🖼️ Figura: Output do Vitest — rodar `npm test` e capturar
- [ ] 🖼️ Figura: Pirâmide de testes do projeto
- [ ] 🖼️ Figura: Tabela ISO 25010 formatada para impressão

---

## Referências cruzadas

- **Testes:** Ver [docs/architecture/troubleshooting.md](../architecture/troubleshooting.md) para erros comuns e soluções
- **Qualidade:** Ver [docs/architecture/technical-debt.md](../architecture/technical-debt.md) para débitos técnicos identificados
- **Requisitos:** Ver [Cap. 4 — Requisitos](./cap4-requisitos.md) para matriz de rastreabilidade (requisitos → testes)
- **Referencial:** Ver [Cap. 2 — Referencial Teórico](./cap2-referencial.md) para ISO 25010 (teoria)
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md) para evolução da cobertura de testes ao longo das sprints
