> **Status:** 🟠 Rascunho — adicionar resultados de cobertura
> **Última Atualização:** 21/04/2026

## 7.1 Estratégia de Testes

O projeto adota a pirâmide de testes com três níveis:

```
        /\
       /E2E\        ← 6 suites Playwright
      /──────\
     /Integr. \     ← (coberto via E2E)
    /────────────\
   / Unitários   \  ← 18 arquivos Vitest
  /────────────────\
```

> 🖼️ **Figura:** Pirâmide de testes do projeto

## 7.2 Testes Unitários

**Ferramenta:** Vitest + Testing Library + jsdom

|**Arquivo de Teste**|**O que Testa**|
|---|---|
|`useStudents.test.tsx`|CRUD de alunos, filtros, paginação|
|`useTeachers.test.tsx`|CRUD de professores|
|`useClassLogs.test.tsx`|Registro de aulas, validação de sobreposição|
|`useUserMutations.test.tsx`|Criação de usuários, convites|
|`useOptimisticMutation.test.tsx`|Atualizações otimistas com rollback|
|`useDebouncedValue.test.ts`|Debounce de inputs|
|`schemas.test.ts`|Validação Zod de formulários|
|`formatters.test.ts`|Formatação de datas, moeda, telefone|
|`sanitize.test.ts`|Sanitização de inputs do usuário|
|`errorMessages.test.ts`|Mapeamento de erros do Supabase|
|`rateLimit.test.ts`|Rate limiting frontend|
|`filterDefaults.test.ts`|Valores padrão de filtros|
|`icon-sizes.test.ts`|Design tokens — ícones|
|`spacing.test.ts`|Design tokens — espaçamento|
|`typography.test.ts`|Design tokens — tipografia|
|`modal-sizes.test.ts`|Design tokens — modais|
|`table-columns.test.ts`|Design tokens — colunas de tabela|
|`button.test.tsx`|Componente Button|

**Total:** 18 arquivos de teste

> 🖼️ **Figura:** Output do Vitest com resultados

## 7.3 Testes E2E

**Ferramenta:** Playwright

|**Suite**|**Cenários Cobertos**|
|---|---|
|`complete-students`|Criar, editar, arquivar e restaurar aluno; filtros; paginação|
|`complete-financial`|Criar cobrança, marcar como pago, upload comprovante, extorno|
|`complete-all-features`|Smoke test: login por role, navegação, CRUD básico|
|`complete-edge-cases`|Validações, campos obrigatórios, duplicatas, limites|
|`security-audit-sprint1`|RLS: professor não acessa dados de outro professor|
|`security-audit-sprint3-4`|Rate limiting, XSS, IDOR, permissões por role|

**Total:** 6 suites

> 🖼️ **Figura:** Relatório Playwright com resultados

## 7.4 Testes Manuais

Além dos testes automatizados, foram realizadas sessões de teste manual:

- Fluxo completo de onboarding (convite → primeiro acesso → troca de senha).
- Pagamento via PIX (QR Code → upload comprovante → aprovação).
- Entrega de atividade (aluno entrega → professor corrige).
- Responsividade em dispositivos móveis reais.

## 7.5 Avaliação ISO 25010

|**Característica**|**Avaliação**|**Evidência**|
|---|---|---|
|Adequação funcional|✅ Alta|20 RF implementados|
|Eficiência de desempenho|✅ Alta|Índices compostos, paginação, materialized views|
|Compatibilidade|✅ Alta|PWA, responsivo, cross-browser|
|Usabilidade|✅ Alta|Mobile-first, design tokens, empty states, skeletons|
|Confiabilidade|✅ Alta|Idempotência, soft delete, audit logs|
|Segurança|✅ Alta|RLS, JWT, rate limiting, sanitização, LGPD|
|Manutenibilidade|🟡 Média|Arquivos grandes (ver sprints 10–12)|
|Portabilidade|✅ Alta|Docker, variáveis de ambiente, sem dependência de SO|

> 🖼️ **Figura:** Tabela ISO 25010 formatada

---

## Assets Necessários

- [ ] 🖼️ Figura: Output do Vitest — rodar `npm test` e capturar
- [ ] 🖼️ Figura: Relatório Playwright — rodar `npm run test:e2e:report`
- [ ] 🖼️ Figura: Pirâmide de testes do projeto
- [ ] 🖼️ Figura: Tabela ISO 25010 formatada para impressão
