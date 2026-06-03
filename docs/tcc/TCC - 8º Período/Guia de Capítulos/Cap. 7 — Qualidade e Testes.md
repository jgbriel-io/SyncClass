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
        /E2E\         ← (não implementado — fora do escopo)
       /──────\
      /Integr. \      ← (coberto via unitários)
     /────────────\
    / Unitários   \   ← 28 arquivos Vitest
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

**Total:** 28 arquivos de testes automatizados.

🖼️ **Figura:** Output do Vitest com resultados

## 7.3 Testes E2E (Ponta-a-Ponta)

> [!WARNING] Fora do Escopo
> Testes E2E com Playwright **não foram implementados** — decisão de escopo para o TCC. A validação de fluxos de negócio foi realizada via QA manual (Sprint 28, 116 itens em 20 rotas).

## 7.4 Processos de Teste Manual

A validação de interface e usabilidade **é realizada** em sessões manuais:

- Fluxo de onboarding completo (do convite ao primeiro acesso).
- Testes de pagamento real com QR Code e anexos.
- Verificação de responsividade em dispositivos móveis físicos.

## 7.5 Avaliação ISO 25010

A qualidade do produto **é monitorada** com base nas seguintes métricas:

| **Característica**  | **Avaliação** | **Evidência**                                             |
| :------------------ | :------------ | :-------------------------------------------------------- |
| Adequação funcional | ✅ Alta       | 20 Requisitos Funcionais implementados                    |
| Eficiência          | ✅ Alta       | Paginação, índices compostos e materialized views         |
| Compatibilidade     | ✅ Alta       | PWA responsivo e cross-browser                            |
| Usabilidade         | ✅ Alta       | Mobile-first, design tokens e skeletons                   |
| Confiabilidade      | ✅ Alta       | Idempotência e registros de auditoria                     |
| Segurança           | ✅ Alta       | RLS, Auth JWT e sanitização de dados                      |
| Manutenibilidade    | 🟡 Média      | Refatoração de arquivos grandes em curso                  |
| Portabilidade       | ✅ Alta       | Deploy Cloudflare Pages via CI/CD e variáveis de ambiente |

🖼️ **Figura:** Tabela ISO 25010 formatada para impressão

---

## Assets Necessários

- [ ] 🖼️ **Figura:** Output do Vitest (Captura do terminal).
- [ ] 🖼️ **Figura:** Relatório Playwright (Captura da interface de teste).
- [ ] 🖼️ **Figura:** Pirâmide de testes do projeto.
- [ ] 🖼️ **Figura:** Tabela ISO 25010 formatada.
