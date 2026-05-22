# 7. Qualidade e Testes

Este capítulo apresenta a estratégia de testes adotada no projeto,
os 26 arquivos de teste unitários implementados com Vitest,
a justificativa para ausência de testes E2E automatizados,
os testes manuais realizados em fluxos críticos
e a avaliação do sistema segundo o modelo de qualidade ISO 25010.

## 7.1 Estratégia de Testes

O projeto adota uma estratégia de testes em dois níveis:
testes automatizados unitários (base da pirâmide)
e testes manuais estruturados de fluxos críticos.
Testes E2E automatizados foram identificados como trabalho futuro
após a estabilização da arquitetura de componentes (Seção 10.4).

A pirâmide de testes do projeto possui base sólida em testes unitários,
camada intermediária de testes manuais estruturados
e ausência de testes E2E automatizados no escopo do MVP.

> 🖼️ **Figura:** Pirâmide de testes do projeto

## 7.2 Testes Unitários

A ferramenta utilizada para testes unitários foi Vitest,
integrada com Testing Library e jsdom para simulação de ambiente DOM.
Foram implementados 26 arquivos de teste cobrindo hooks,
componentes, utilitários e design tokens.

A Tabela 7.1 apresenta os 18 arquivos de teste principais,
organizados por categoria funcional.

**Tabela 7.1 — Arquivos de teste unitários principais**

| Arquivo de Teste                 | O que Testa                                  |
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
| `icon-sizes.test.ts`             | Design tokens de ícones                      |
| `spacing.test.ts`                | Design tokens de espaçamento                 |
| `typography.test.ts`             | Design tokens de tipografia                  |
| `modal-sizes.test.ts`            | Design tokens de modais                      |
| `table-columns.test.ts`          | Design tokens de colunas de tabela           |
| `button.test.tsx`                | Componente Button                            |

Após as sprints de refatoração de componentes (sprints 10 a 12),
foram adicionados 8 arquivos de teste para componentes extraídos,
conforme apresentado na Tabela 7.2.

**Tabela 7.2 — Arquivos de teste adicionados após refatoração**

| Arquivo de Teste                | O que Testa                                 |
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

Testes E2E automatizados com Playwright não foram implementados
no escopo do MVP. A decisão foi técnica e deliberada,
baseada em três fatores principais.

Primeiro, a prioridade do desenvolvimento foi a cobertura de lógica de negócio
via testes unitários, onde o custo de manutenção é menor
e o retorno imediato é maior.

Segundo, a arquitetura de componentes passou por refatorações
até as sprints 10 a 12, tornando a escrita de seletores E2E estáveis prematura.
Componentes grandes foram divididos em componentes menores,
hooks foram separados de services,
e a estrutura de pastas foi reorganizada.
Escrever testes E2E antes dessa estabilização
resultaria em retrabalho significativo.

Terceiro, o prazo de desenvolvimento (aproximadamente 3 meses, um desenvolvedor)
não comportava a infraestrutura de CI/CD adicional necessária
para testes E2E confiáveis.

Os fluxos críticos foram validados por testes manuais estruturados (Seção 7.4).
A implementação de E2E com Playwright está planejada como trabalho futuro
(Seção 10.4), após a estabilização dos componentes.

## 7.4 Testes Manuais

Além dos testes automatizados, foram realizadas sessões de teste manual
para validação de fluxos críticos que envolvem múltiplos módulos
e interações complexas com o backend.

Os fluxos testados manualmente incluem:

- Fluxo completo de onboarding: convite de usuário,
  primeiro acesso, troca obrigatória de senha.
- Pagamento via PIX: geração de QR Code,
  upload de comprovante, aprovação pelo professor.
- Entrega de atividade: aluno entrega arquivo,
  professor visualiza e corrige.
- Responsividade em dispositivos móveis reais:
  iPhone 12, Samsung Galaxy S21, iPad Air.

## 7.5 Avaliação ISO 25010

O sistema foi avaliado segundo o modelo de qualidade ISO 25010,
que define oito características de qualidade de software.
A Tabela 7.3 apresenta a avaliação de cada característica,
com evidências concretas do projeto.

**Tabela 7.3 — Avaliação do sistema segundo ISO 25010**

| Característica           | Avaliação | Evidência                                               |
| ------------------------ | --------- | ------------------------------------------------------- |
| Adequação funcional      | ✅ Alta   | 20 RF implementados                                     |
| Eficiência de desempenho | ✅ Alta   | Índices compostos, paginação, materialized views        |
| Compatibilidade          | ✅ Alta   | PWA, responsivo, cross-browser                          |
| Usabilidade              | ✅ Alta   | Mobile-first, design tokens, empty states, skeletons    |
| Confiabilidade           | ✅ Alta   | Idempotência, soft delete, audit logs                   |
| Segurança                | ✅ Alta   | RLS, JWT, rate limiting, sanitização, LGPD              |
| Manutenibilidade         | 🟡 Média  | Arquivos grandes (ver sprints 10 a 12)                  |
| Portabilidade            | ✅ Alta   | Variáveis de ambiente, sem dependência de SO específico |

A característica de manutenibilidade foi avaliada como média
devido à presença de arquivos grandes identificados nas sprints 8 a 9,
que foram posteriormente refatorados nas sprints 10 a 12.
As demais características atingiram avaliação alta,
com evidências concretas de implementação.

---

## Assets Necessários

- [ ] 🖼️ Figura: Output do Vitest (rodar `npm test` e capturar)
- [ ] 🖼️ Figura: Pirâmide de testes do projeto

---

## Referências cruzadas

- **Testes:** Ver [docs/architecture/troubleshooting.md](../architecture/troubleshooting.md)
  para erros comuns e soluções
- **Qualidade:** Ver [docs/architecture/technical-debt.md](../architecture/technical-debt.md)
  para débitos técnicos identificados
- **Requisitos:** Ver [Cap. 4 — Requisitos](./cap4-requisitos.md)
  para matriz de rastreabilidade (requisitos → testes)
- **Referencial:** Ver [Cap. 2 — Referencial Teórico](./cap2-referencial.md)
  para ISO 25010 (teoria)
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md)
  para evolução da cobertura de testes ao longo das sprints
