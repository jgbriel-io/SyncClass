## Planejamento

### Estrutura do Capítulo

| Seção                         | Conteúdo                                                                  |
| ----------------------------- | ------------------------------------------------------------------------- |
| 7.1 Estratégia de Testes      | Pirâmide: unitários (base) + manual; E2E fora do escopo                   |
| 7.2 Testes Unitários          | 28 arquivos Vitest + Testing Library — hooks, schemas, formatters, tokens |
| 7.3 Testes E2E                | Não implementado — QA manual Sprint 28 (116 itens, 20 rotas)              |
| 7.4 Processos de Teste Manual | Onboarding completo, pagamento real, responsividade mobile                |
| 7.5 Avaliação ISO 25010       | Matriz de 8 características com avaliação e evidências                    |

### Citações Planejadas

- ISO/IEC 25010 (2011) — modelo de qualidade de software

### Pendências Abertas

- [ ] 🖼️ Figura: Output do Vitest (rodar `npm test` e capturar)
- [ ] 🖼️ Figura: Pirâmide de testes do projeto

---

> **Última Atualização:** 21/05/2026

# 7. Qualidade e Testes

Este capítulo apresenta a estratégia de testes adotada no projeto,
os 28 arquivos de teste unitários implementados com Vitest,
a justificativa para ausência de testes E2E automatizados,
os testes manuais realizados em fluxos críticos
e a avaliação do sistema segundo o modelo de qualidade ISO 25010.

## 7.1 Estratégia de Testes

O projeto adota uma estratégia de testes em dois níveis:
testes automatizados unitários (base da pirâmide)
e testes manuais estruturados de fluxos críticos.
Testes E2E automatizados foram identificados como trabalho futuro
após a estabilização da arquitetura de componentes (Seção 10.4).

```
        /\
       /E2E \       ← não implementado (trabalho futuro)
      /──────\
     /Manual  \     ← 4 fluxos críticos validados
    /────────────\
   / Unitários   \  ← 28 arquivos Vitest
  /────────────────\
```

> 🖼️ **Figura:** Pirâmide de testes do projeto

## 7.2 Testes Unitários

A ferramenta utilizada para testes unitários foi Vitest,
integrada com Testing Library e jsdom para simulação de ambiente DOM.
Foram implementados 28 arquivos de teste cobrindo hooks,
componentes, utilitários e design tokens.

A Tabela 7.1 apresenta os 20 arquivos de teste principais,
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
| `useTeachersPageStats.test.tsx`  | Stats paginadas de professores               |
| `periodFilter.test.ts`           | Filtro de período (mês/semestre/ano)         |

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

Testes E2E automatizados não foram implementados no escopo do MVP. A decisão foi técnica e deliberada,
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

Terceiro, o prazo de desenvolvimento (aproximadamente 4,5 meses, um desenvolvedor)
não comportava a infraestrutura de CI/CD adicional necessária
para testes E2E confiáveis.

Os fluxos críticos foram validados por testes manuais estruturados (Seção 7.4).

## 7.4 Testes Manuais

A Sprint 28 executou uma campanha de testes manuais estruturada,
cobrindo as 20 rotas da aplicação com 5 perfis de acesso:
1 administrador, 2 professores (para testar isolamento de dados)
e 2 alunos vinculados a professores distintos.

A campanha totalizou 104 itens verificados como aprovados.
Os itens com comportamento incorreto identificados durante a Sprint 28
foram corrigidos nas Sprints 29 a 31 (ver `docs/sprints/sprint-28-testes-manuais.md`).

Os fluxos validados incluem:

- Auth e proteção de rotas: login por role, redirecionamentos,
  acesso sem autenticação.
- Isolamento de dados: professor A não visualiza dados do professor B;
  aluno acessa apenas seus próprios dados.
- Fluxo financeiro completo: geração de cobrança, pagamento PIX via AbacatePay,
  upload de comprovante, aprovação e rejeição.
- Módulo de atividades: criação, entrega pelo aluno, correção pelo professor.
- Responsividade mobile: iPhone 12, Samsung Galaxy S21, iPad Air.

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
