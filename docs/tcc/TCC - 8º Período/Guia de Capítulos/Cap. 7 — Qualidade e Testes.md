---
capitulo: 7
titulo: Qualidade e Testes
status: 🟠 Rascunho
ultima_atualizacao: 21/04/2026
tags:
  - status/rascunho
  - tcc/escrita
---

> [!INFO] Resumo do Capítulo
> Descrição da estratégia de testes automatizados e manuais, e a avaliação do software baseada na norma ISO/IEC 25010.

---

## 7.1 Estratégia de Testes

O controle de qualidade **está estruturado** em uma pirâmide de testes:

```text
         /\
        /E2E\         ← 6 suites Playwright
       /──────\
      /Integr. \      ← (coberto via E2E)
     /────────────\
    / Unitários   \   ← 18 arquivos Vitest
   /────────────────\
```

🖼️ **Figura:** Pirâmide de testes do projeto

## 7.2 Testes Unitários

A validação de lógica isolada **ocorre** via Vitest + Testing Library:

| **Arquivo de Teste**             | **O que Testa**                               |
| :------------------------------- | :-------------------------------------------- |
| `useStudents.test.tsx`           | CRUD de alunos, filtros e paginação           |
| `useTeachers.test.tsx`           | CRUD de professores                           |
| `useClassLogs.test.tsx`          | Registro de aulas e validação de conflitos    |
| `useUserMutations.test.tsx`      | Criação de usuários e fluxo de convites       |
| `useOptimisticMutation.test.tsx` | Atualizações otimistas com lógica de rollback |
| `useDebouncedValue.test.ts`      | Debounce de inputs de busca                   |
| `schemas.test.ts`                | Validação de formulários via Zod              |
| `formatters.test.ts`             | Formatação de moeda, datas e telefones        |
| `sanitize.test.ts`               | Sanitização de inputs para segurança          |
| `errorMessages.test.ts`          | Mapeamento de erros vindos do Supabase        |
| `rateLimit.test.ts`              | Controle de limites de requisição no frontend |
| `filterDefaults.test.ts`         | Valores padrão dos estados de filtro          |
| `icon-sizes.test.ts`             | Design tokens de ícones                       |
| `spacing.test.ts`                | Design tokens de espaçamento                  |
| `typography.test.ts`             | Design tokens de tipografia                   |
| `modal-sizes.test.ts`            | Design tokens de modais                       |
| `table-columns.test.ts`          | Design tokens de colunas                      |
| `button.test.tsx`                | Componente base Button                        |

**Total:** 18 arquivos de testes automatizados.

🖼️ **Figura:** Output do Vitest com resultados

## 7.3 Testes E2E (Ponta-a-Ponta)

Para validar os fluxos críticos de negócio, **estão em execução** as seguintes suites Playwright:

| **Suite**                  | **Cenários Cobertos**                          |
| :------------------------- | :--------------------------------------------- |
| `complete-students`        | Ciclo completo de vida do aluno e filtros      |
| `complete-financial`       | Geração de cobrança, upload e aprovação        |
| `complete-all-features`    | Smoke test de login, navegação e CRUDs base    |
| `complete-edge-cases`      | Validações de campos, duplicatas e limites     |
| `security-audit-sprint1`   | Validação de RLS (isolamento de dados)         |
| `security-audit-sprint3-4` | Proteção contra XSS, IDOR e permissões de role |

## 7.4 Processos de Teste Manual

A validação de interface e usabilidade **é realizada** em sessões manuais:

- Fluxo de onboarding completo (do convite ao primeiro acesso).
- Testes de pagamento real com QR Code e anexos.
- Verificação de responsividade em dispositivos móveis físicos.

## 7.5 Avaliação ISO 25010

A qualidade do produto **é monitorada** com base nas seguintes métricas:

| **Característica**  | **Avaliação** | **Evidência**                                     |
| :------------------ | :------------ | :------------------------------------------------ |
| Adequação funcional | ✅ Alta       | 20 Requisitos Funcionais implementados            |
| Eficiência          | ✅ Alta       | Paginação, índices compostos e materialized views |
| Compatibilidade     | ✅ Alta       | PWA responsivo e cross-browser                    |
| Usabilidade         | ✅ Alta       | Mobile-first, design tokens e skeletons           |
| Confiabilidade      | ✅ Alta       | Idempotência e registros de auditoria             |
| Segurança           | ✅ Alta       | RLS, Auth JWT e sanitização de dados              |
| Manutenibilidade    | 🟡 Média      | Refatoração de arquivos grandes em curso          |
| Portabilidade       | ✅ Alta       | Uso de Docker e variáveis de ambiente             |

🖼️ **Figura:** Tabela ISO 25010 formatada para impressão

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Output do Vitest (Captura do terminal).
- [ ] 🖼️ **Figura:** Relatório Playwright (Captura da interface de teste).
- [ ] 🖼️ **Figura:** Pirâmide de testes do projeto.
- [ ] 🖼️ **Figura:** Tabela ISO 25010 formatada.
