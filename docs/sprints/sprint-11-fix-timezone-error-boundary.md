# Sprint 11 — Fix: Timezone & Error Boundary

> **Nomenclatura do arquivo:** `sprint-11-fix-timezone-error-boundary.md`

**Período:** 21 abril 2026
**Status:** ✅ Concluída
**Tipo:** Fix
**Prioridade:** 🔴 Alta

## Problem Statement

Após Sprint 10, o código estava limpo mas com 2 bugs críticos identificados em produção:

**Bug 1: Timezone Incorreto**

- Datas salvas em UTC mas exibidas em horário local sem conversão
- Exemplo: aula às 14h BRT salva como 17h UTC, exibida como 17h (errado)
- Impacto: confusão de horários, aulas marcadas no horário errado
- Severidade: 🔴 Crítica (afeta funcionalidade principal)

**Bug 2: Sem Error Boundary**

- Erros não capturados quebram aplicação inteira (tela branca)
- Usuário não sabe o que aconteceu
- Sem logging de erros
- Impacto: UX ruim, dificulta debug
- Severidade: 🔴 Crítica (aplicação quebra completamente)

**Contexto:**

- Supabase armazena datas em UTC (padrão)
- Frontend precisa converter UTC → horário local para exibição
- Frontend precisa converter horário local → UTC para salvar
- Sem conversão = horários incorretos

## Requirements

### Fix de Timezone

- Converter UTC → BRT ao exibir datas
- Converter BRT → UTC ao salvar datas
- Usar biblioteca `date-fns-tz` para conversões
- Aplicar em: aulas, cobranças, atividades, histórico

### Error Boundary

- Capturar erros não tratados
- Exibir UI amigável em vez de tela branca
- Botão "Recarregar" para tentar novamente
- Logging de erros (console em dev)
- Não quebrar aplicação inteira

### Critérios de Conclusão

- ✅ Datas exibidas corretamente em BRT
- ✅ Datas salvas corretamente em UTC
- ✅ Error boundary captura erros
- ✅ UI amigável em caso de erro

## Background

**Timezone no Supabase:**

```sql
-- Supabase armazena em UTC
CREATE TABLE class_logs (
  id UUID PRIMARY KEY,
  class_date TIMESTAMPTZ, -- UTC
  created_at TIMESTAMPTZ DEFAULT NOW() -- UTC
);
```

**Conversão correta:**

```ts
import { format, parseISO } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

// Exibir (UTC → BRT)
const utcDate = parseISO("2026-04-21T17:00:00Z"); // UTC
const brtDate = utcToZonedTime(utcDate, "America/Sao_Paulo"); // BRT
const formatted = format(brtDate, "dd/MM/yyyy HH:mm"); // "21/04/2026 14:00"

// Salvar (BRT → UTC)
const localDate = new Date("2026-04-21T14:00:00"); // BRT
const utcDate = zonedTimeToUtc(localDate, "America/Sao_Paulo"); // UTC
```

**Error Boundary:**

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

## Proposed Solution

### Utilitários de Timezone

```ts
// src/lib/utils/timezone.ts
export const TIMEZONE = "America/Sao_Paulo";

export const formatDateBRT = (utcDate: string | Date) => {
  const date = typeof utcDate === "string" ? parseISO(utcDate) : utcDate;
  const brtDate = utcToZonedTime(date, TIMEZONE);
  return format(brtDate, "dd/MM/yyyy HH:mm");
};

export const convertToBRT = (utcDate: string | Date) => {
  const date = typeof utcDate === "string" ? parseISO(utcDate) : utcDate;
  return utcToZonedTime(date, TIMEZONE);
};

export const convertToUTC = (localDate: Date) => {
  return zonedTimeToUtc(localDate, TIMEZONE);
};
```

### Error Boundary Component

```tsx
// src/components/ErrorBoundary.tsx
export const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      console.error("Error caught:", error);
      setHasError(true);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return <ErrorFallback onReset={() => window.location.reload()} />;
  }

  return children;
};
```

## Task Breakdown

### Task 1: Instalar date-fns-tz

- **Objetivo:** Adicionar biblioteca de timezone
- **Implementação:**
  - Executar `npm install date-fns-tz`
  - Verificar compatibilidade com `date-fns` existente
  - Atualizar `package.json`
- **Arquivos modificados:**
  - `package.json`
  - `package-lock.json`
- **Teste:** Build sem erros
- **Demo:** Biblioteca instalada

### Task 2: Criar utilitários de timezone

- **Objetivo:** Funções reutilizáveis para conversão de timezone
- **Implementação:**
  - Criar `src/lib/utils/timezone.ts`
  - `formatDateBRT(utcDate)` — formatar data em BRT
  - `convertToBRT(utcDate)` — converter UTC → BRT
  - `convertToUTC(localDate)` — converter BRT → UTC
  - `TIMEZONE` constante com `'America/Sao_Paulo'`
  - Adicionar testes unitários
- **Arquivos criados:**
  - `src/lib/utils/timezone.ts`
  - `src/lib/utils/__tests__/timezone.test.ts`
- **Teste:** Conversões corretas
- **Demo:** `formatDateBRT('2026-04-21T17:00:00Z')` retorna `'21/04/2026 14:00'`

### Task 3: Aplicar conversão em aulas

- **Objetivo:** Exibir e salvar horários de aulas corretamente
- **Implementação:**
  - Atualizar `ClassesTableRow` para usar `formatDateBRT`
  - Atualizar `ClassDetailSheet` para usar `formatDateBRT`
  - Atualizar `ClassLogFormDialog` para converter BRT → UTC ao salvar
  - Atualizar `ClassHistoryList` para usar `formatDateBRT`
  - Testar: criar aula às 14h BRT → salva como 17h UTC → exibe como 14h BRT
- **Arquivos modificados:**
  - `src/components/classes/ClassesTableRow.tsx`
  - `src/components/classes/ClassDetailSheet.tsx`
  - `src/components/classes/ClassLogFormDialog.tsx`
  - `src/components/classes/ClassHistoryList.tsx`
- **Teste:** Horários corretos em todas as telas
- **Demo:** Aula às 14h BRT exibida corretamente

### Task 4: Aplicar conversão em cobranças

- **Objetivo:** Exibir e salvar datas de vencimento corretamente
- **Implementação:**
  - Atualizar `FinancialTableRow` para usar `formatDateBRT`
  - Atualizar `FinancialFormDialog` para converter BRT → UTC ao salvar
  - Atualizar `PaymentHistoryDialog` para usar `formatDateBRT`
  - Testar: cobrança com vencimento 25/04 → salva corretamente → exibe corretamente
- **Arquivos modificados:**
  - `src/components/financial/FinancialTableRow.tsx`
  - `src/components/financial/FinancialFormDialog.tsx`
  - `src/components/financial/PaymentHistoryDialog.tsx`
- **Teste:** Datas de vencimento corretas
- **Demo:** Cobrança com vencimento correto

### Task 5: Aplicar conversão em atividades

- **Objetivo:** Exibir e salvar prazos de atividades corretamente
- **Implementação:**
  - Atualizar `ActivitiesTableRow` para usar `formatDateBRT`
  - Atualizar `SendActivityDialog` para converter BRT → UTC ao salvar
  - Atualizar `ActivityDetailSheet` para usar `formatDateBRT`
  - Testar: atividade com prazo 30/04 às 23:59 → salva e exibe corretamente
- **Arquivos modificados:**
  - `src/components/activities/ActivitiesTableRow.tsx`
  - `src/components/activities/SendActivityDialog.tsx`
  - `src/components/activities/ActivityDetailSheet.tsx`
- **Teste:** Prazos corretos
- **Demo:** Atividade com prazo correto

### Task 6: Aplicar conversão em histórico

- **Objetivo:** Exibir datas de histórico corretamente
- **Implementação:**
  - Atualizar `StudentHistory` para usar `formatDateBRT`
  - Atualizar `TimelineItem` para usar `formatDateBRT`
  - Testar: histórico exibe datas corretas
- **Arquivos modificados:**
  - `src/pages/student/StudentHistory.tsx`
  - `src/components/student/TimelineItem.tsx`
- **Teste:** Histórico com datas corretas
- **Demo:** Timeline com horários corretos

### Task 7: Criar ErrorBoundary component

- **Objetivo:** Capturar erros não tratados
- **Implementação:**
  - Criar `src/components/ErrorBoundary.tsx`
  - Usar `React.Component` com `componentDidCatch`
  - Estado `hasError` para controlar exibição
  - Logging de erros no console (dev)
  - Exibir `ErrorFallback` quando erro ocorre
- **Arquivos criados:**
  - `src/components/ErrorBoundary.tsx`
- **Teste:** Erro capturado, UI amigável exibida
- **Demo:** Aplicação não quebra completamente

### Task 8: Criar ErrorFallback component

- **Objetivo:** UI amigável para erros
- **Implementação:**
  - Criar `src/components/ErrorFallback.tsx`
  - Exibir mensagem: "Algo deu errado"
  - Exibir descrição: "Ocorreu um erro inesperado. Tente recarregar a página."
  - Botão "Recarregar" que executa `window.location.reload()`
  - Botão "Voltar ao Início" que navega para `/`
  - Design consistente com shadcn/ui
- **Arquivos criados:**
  - `src/components/ErrorFallback.tsx`
- **Teste:** UI amigável e funcional
- **Demo:** Botões funcionam

### Task 9: Aplicar ErrorBoundary em App

- **Objetivo:** Envolver aplicação com ErrorBoundary
- **Implementação:**
  - Atualizar `src/App.tsx`
  - Envolver `<RouterProvider>` com `<ErrorBoundary>`
  - Testar: forçar erro → ErrorFallback aparece
- **Arquivos modificados:**
  - `src/App.tsx`
- **Teste:** Erro capturado em qualquer página
- **Demo:** Aplicação não quebra

### Task 10: Adicionar ErrorBoundary em rotas críticas

- **Objetivo:** ErrorBoundary granular em rotas críticas
- **Implementação:**
  - Adicionar ErrorBoundary em `AdminLayout`
  - Adicionar ErrorBoundary em `TeacherLayout`
  - Adicionar ErrorBoundary em `StudentLayout`
  - Erro em uma rota não quebra outras
- **Arquivos modificados:**
  - `src/components/layout/AdminLayout.tsx`
  - `src/components/layout/TeacherLayout.tsx`
  - `src/components/layout/StudentLayout.tsx`
- **Teste:** Erro em uma rota não afeta outras
- **Demo:** Isolamento de erros

### Task 11: Testes de regressão

- **Objetivo:** Garantir que fixes não quebraram nada
- **Implementação:**
  - Testar criação de aula → horário correto
  - Testar criação de cobrança → data correta
  - Testar criação de atividade → prazo correto
  - Testar histórico → datas corretas
  - Forçar erro → ErrorBoundary captura
  - Executar suite de testes completa
- **Teste:** Todos os testes passando
- **Demo:** Aplicação funcional e estável

## Implementation Details

### Utilitários Criados

| Utilitário    | Responsabilidade       | Arquivo                     |
| ------------- | ---------------------- | --------------------------- |
| `timezone.ts` | Conversões de timezone | `src/lib/utils/timezone.ts` |

### Componentes Criados

| Componente      | Responsabilidade            | Arquivo                            |
| --------------- | --------------------------- | ---------------------------------- |
| `ErrorBoundary` | Capturar erros não tratados | `src/components/ErrorBoundary.tsx` |
| `ErrorFallback` | UI amigável para erros      | `src/components/ErrorFallback.tsx` |

## Files Created

```
src/
├── lib/
│   └── utils/
│       ├── timezone.ts              ← Utilitários de timezone
│       └── __tests__/
│           └── timezone.test.ts     ← Testes de timezone
└── components/
    ├── ErrorBoundary.tsx            ← Error boundary
    └── ErrorFallback.tsx            ← UI de erro
```

## Files Modified

- `package.json` — adicionar `date-fns-tz`
- `src/App.tsx` — envolver com ErrorBoundary
- `src/components/layout/AdminLayout.tsx` — adicionar ErrorBoundary
- `src/components/layout/TeacherLayout.tsx` — adicionar ErrorBoundary
- `src/components/layout/StudentLayout.tsx` — adicionar ErrorBoundary
- `src/components/classes/ClassesTableRow.tsx` — usar `formatDateBRT`
- `src/components/classes/ClassDetailSheet.tsx` — usar `formatDateBRT`
- `src/components/classes/ClassLogFormDialog.tsx` — converter BRT → UTC
- `src/components/classes/ClassHistoryList.tsx` — usar `formatDateBRT`
- `src/components/financial/FinancialTableRow.tsx` — usar `formatDateBRT`
- `src/components/financial/FinancialFormDialog.tsx` — converter BRT → UTC
- `src/components/financial/PaymentHistoryDialog.tsx` — usar `formatDateBRT`
- `src/components/activities/ActivitiesTableRow.tsx` — usar `formatDateBRT`
- `src/components/activities/SendActivityDialog.tsx` — converter BRT → UTC
- `src/components/activities/ActivityDetailSheet.tsx` — usar `formatDateBRT`
- `src/pages/student/StudentHistory.tsx` — usar `formatDateBRT`
- `src/components/student/TimelineItem.tsx` — usar `formatDateBRT`

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Type-check sem erros (`npm run type-check`)
- [x] Testes passando (`npm run test`)
- [x] Teste manual: criar aula às 14h BRT → salva como 17h UTC → exibe como 14h BRT ✅
- [x] Teste manual: criar cobrança com vencimento 25/04 → salva e exibe corretamente ✅
- [x] Teste manual: criar atividade com prazo 30/04 → salva e exibe corretamente ✅
- [x] Teste manual: forçar erro → ErrorBoundary captura, UI amigável exibida ✅
- [x] Teste manual: recarregar após erro → aplicação funciona ✅

## Results & Impact

### Métricas Quantitativas

- ✅ 1 biblioteca adicionada (`date-fns-tz`)
- ✅ 3 utilitários de timezone criados
- ✅ 2 componentes de error boundary criados
- ✅ 17 arquivos modificados (conversão de timezone)
- ✅ 5 testes unitários adicionados
- ✅ 2 bugs críticos corrigidos

### Melhorias Qualitativas

- ✅ Horários corretos (bug crítico resolvido)
- ✅ Aplicação não quebra completamente (UX melhorada)
- ✅ UI amigável em caso de erro
- ✅ Logging de erros (facilita debug)
- ✅ Isolamento de erros (erro em uma rota não afeta outras)

## Lessons Learned

### O que funcionou bem ✅

- **date-fns-tz para timezone:** Biblioteca leve e precisa para conversões UTC ↔ BRT. Alternativa seria `moment-timezone` (mais pesada, 200KB vs 20KB).
- **Utilitários centralizados:** Funções `formatDateBRT`, `convertToBRT`, `convertToUTC` em arquivo único evitaram duplicação. Mudança de timezone (ex: suportar múltiplos fusos) afeta apenas 1 arquivo.
- **ErrorBoundary granular:** ErrorBoundary em cada layout (Admin, Teacher, Student) isolou erros. Erro em rota admin não quebra rotas teacher/student.
- **ErrorFallback com ações:** Botões "Recarregar" e "Voltar ao Início" deram controle ao usuário. Alternativa seria apenas mensagem (UX pior).

### O que poderia melhorar ⚠️

- **Timezone hardcoded:** `TIMEZONE = 'America/Sao_Paulo'` hardcoded. Ideal seria detectar timezone do navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`) ou configuração por usuário.
- **Logging apenas no console:** `console.error` funciona em dev, mas produção não rastreia erros automaticamente. Serviço de logging externo não está no escopo do projeto.
- **Sem retry automático:** ErrorBoundary exige clique manual em "Recarregar". Retry automático com backoff exponencial seria melhor para erros transitórios (rede instável).

### Aplicações futuras 💡

- **Timezone por usuário:** Adicionar campo `timezone` em `profiles`, usar `user.timezone` em vez de constante. Permite professores em fusos diferentes.
- **Logging estruturado:** Integrar serviço de logging (LogRocket, Datadog ou similar) para rastrear erros em produção. Incluir contexto: userId, route, browser, timestamp.
- **Retry automático:** ErrorBoundary com retry automático (3 tentativas com backoff 1s, 2s, 4s). Apenas erros persistentes mostram ErrorFallback.

## Technical Debt

- [ ] Logging de erros apenas no console — serviço de logging externo planejado para trabalho futuro
- [ ] Timezone hardcoded (`America/Sao_Paulo`) — adicionar configuração por usuário depois
