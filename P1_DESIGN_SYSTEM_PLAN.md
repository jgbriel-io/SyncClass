# 🟡 P1 - Design System e Feedback

**Prioridade:** Alta  
**Objetivo:** Profissionalizar UI, facilitar manutenção, preparar para Dark Mode  
**Tempo estimado:** 3-4 horas

---

## 📋 Checklist de Implementação

### 1. Substituir Cores Hardcoded → Tokens de Design
**Problema:** 50+ cores hardcoded (ex: `text-emerald-500`, `bg-blue-100`)  
**Solução:** Usar tokens shadcn/ui (`text-primary`, `text-success`, `bg-card`)

**Tarefas:**
- [ ] Criar arquivo de cores semânticas (`lib/utils/colors.ts`)
- [ ] Mapear todas as cores hardcoded no projeto
- [ ] Substituir por tokens semânticos
- [ ] Atualizar componentes admin
- [ ] Atualizar componentes student
- [ ] Documentar tokens de design

**Impacto:** Dark Mode ready, manutenção fácil

---

### 2. Padronizar Feedback de Carregamento → Skeleton Screens
**Problema:** `<Loader2>` causa layout shift, UX ruim  
**Solução:** Skeleton screens que mantêm dimensões

**Tarefas:**
- [ ] Criar `TableSkeleton.tsx`
- [ ] Criar `CardSkeleton.tsx`
- [ ] Criar `DashboardSkeleton.tsx`
- [ ] Substituir todos os `<Loader2>` em tabelas
- [ ] Substituir todos os `<Loader2>` em dashboards
- [ ] Testar CLS (Cumulative Layout Shift)

**Impacto:** Zero layout shift, UX profissional

---

### 3. Unificar Utilitários Financeiros → Centralização
**Problema:** 12 duplicações de `formatCurrency`  
**Solução:** Arquivo único `lib/utils/formatters.ts`

**Tarefas:**
- [ ] Verificar arquivo `lib/utils/formatters.ts` existe
- [ ] Adicionar funções faltantes (currency, date, CPF, phone)
- [ ] Buscar todas as duplicações no código
- [ ] Substituir por imports centralizados
- [ ] Remover código duplicado
- [ ] Adicionar testes unitários

**Impacto:** DRY, manutenção fácil, consistência

---

### 4. Loading States em Botões → Evitar Duplicação
**Problema:** Botões sem feedback, cliques duplos geram duplicatas  
**Solução:** Spinners + disabled durante submit

**Tarefas:**
- [ ] Atualizar `Button` component com loading state
- [ ] Criar variant `loading` do Button
- [ ] Adicionar loading em formulários de aluno
- [ ] Adicionar loading em formulários de aula
- [ ] Adicionar loading em formulários financeiros
- [ ] Adicionar loading em formulários de usuário

**Impacto:** Zero duplicatas, feedback claro

---

## 🎯 Ordem de Implementação

### Fase 1: Fundação (30 min)
1. Criar componentes base (Skeleton, tokens)
2. Atualizar Button component

### Fase 2: Substituição Sistemática (2h)
3. Cores hardcoded → tokens
4. Loaders → Skeletons
5. formatCurrency → centralizado
6. Botões → loading states

### Fase 3: Testes e Documentação (30 min)
7. Testar todas as páginas
8. Documentar tokens e patterns
9. Commit e push

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Cores hardcoded | 50+ | 0 | ✅ 0 |
| Duplicações formatCurrency | 12 | 1 | ✅ 1 |
| Layout Shift (CLS) | Alto | Baixo | ✅ < 0.1 |
| Botões sem feedback | 15+ | 0 | ✅ 0 |

---

## 🏗️ Arquitetura

### Tokens de Design
```typescript
// lib/utils/colors.ts
export const semanticColors = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  // ...
}
```

### Skeleton Components
```typescript
// components/ui/table-skeleton.tsx
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
```

### Button Loading
```typescript
// components/ui/button.tsx
<Button loading={isSubmitting}>
  Salvar
</Button>
```

---

## 📁 Arquivos que Serão Modificados

### Novos (3)
- `src/lib/utils/colors.ts`
- `src/components/ui/table-skeleton.tsx`
- `src/components/ui/dashboard-skeleton.tsx`

### Modificados (20+)
- `src/components/ui/button.tsx`
- `src/lib/utils/formatters.ts`
- `src/components/students/*`
- `src/components/classes/*`
- `src/components/financial/*`
- `src/components/users/*`
- `src/components/admin/*`
- `src/pages/student/*`

---

## 🎨 Exemplo: Antes vs Depois

### Cores
```typescript
// ❌ Antes
<Badge className="bg-emerald-100 text-emerald-800">
  Ativo
</Badge>

// ✅ Depois
<Badge variant="success">
  Ativo
</Badge>
```

### Loading
```typescript
// ❌ Antes
{isLoading ? (
  <Loader2 className="animate-spin" />
) : (
  <Table>...</Table>
)}

// ✅ Depois
{isLoading ? (
  <TableSkeleton rows={5} />
) : (
  <Table>...</Table>
)}
```

### Formatters
```typescript
// ❌ Antes
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ✅ Depois
import { formatCurrency } from "@/lib/utils/formatters";
```

### Button
```typescript
// ❌ Antes
<Button onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting ? "Salvando..." : "Salvar"}
</Button>

// ✅ Depois
<Button onClick={handleSubmit} loading={isSubmitting}>
  Salvar
</Button>
```

---

## ⏭️ Próximos Passos

1. **Agora:** Implementar P1
2. **Depois:** P2 (Quick Wins de 1 dia)
3. **Futuro:** Dark Mode (já preparado!)

---

**Status:** 🟡 Pronto para começar  
**Tempo:** ~3-4 horas  
**ROI:** Alto (manutenção + UX)
