# ⚡ Frontend Quick Wins - Melhorias Rápidas

**Data:** 30/01/2026  
**Objetivo:** Melhorias de alto impacto com baixo esforço (1-2 dias cada)

---

## 🎯 Top 10 Quick Wins

### 1. ⚡ Adicionar `aria-label` em Botões de Ícone (2 horas)

**Impacto:** 🔴 Crítico — WCAG Nível A  
**Esforço:** 🟢 Baixo (15+ ocorrências)

**Arquivos:**
- `StudentsListView.tsx:573`
- `ClassesView.tsx:377, 490`
- `FinancialView.tsx:407`
- `AdminLayout.tsx:194`
- `TeacherLayout.tsx:189, 195`

**Mudança:**
```diff
- <Button variant="ghost" size="icon">
-   <MoreHorizontal className="h-4 w-4" />
- </Button>

+ <Button variant="ghost" size="icon" aria-label="Abrir menu de opções">
+   <MoreHorizontal className="h-4 w-4" />
+ </Button>
```

**Script automatizado:**
```bash
# Buscar todos os botões sem aria-label
git grep -n "<MoreHorizontal" | grep -v "aria-label"
```

---

### 2. ⚡ Remover `aria-describedby={undefined}` (1 hora)

**Impacto:** 🔴 Crítico — WCAG Nível A  
**Esforço:** 🟢 Baixo (5 ocorrências)

**Arquivos:**
- `FinancialFormDialog.tsx:164`
- `ClassLogFormDialog.tsx:239`
- `TeacherFormDialog.tsx:109`
- `StudentFormDialog.tsx:271`
- `Teachers.tsx:435`

**Mudança:**
```diff
- <DialogContent aria-describedby={undefined}>
+ <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
+     <DialogDescription className="sr-only">
+       Formulário de cadastro
+     </DialogDescription>
    </DialogHeader>
```

**Comando de busca:**
```bash
git grep -n "aria-describedby={undefined}"
```

---

### 3. ⚡ Extrair `formatCurrency` para Utilitário (1 hora)

**Impacto:** 🟡 Importante — DRY + Manutenibilidade  
**Esforço:** 🟢 Baixo (12 arquivos)

**Criar:** `src/lib/utils/formatters.ts`

```typescript
export const formatCurrency = (value: number | null | undefined): string => {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

export const formatCPF = (cpf: string): string => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};
```

**Buscar e substituir:**
```bash
# Encontrar duplicações
git grep -n "function formatCurrency"
git grep -n "const formatCurrency"

# Substituir em cada arquivo
# import { formatCurrency } from "@/lib/utils/formatters";
```

---

### 4. ⚡ Extrair `originLabels` para Constantes (30 min)

**Impacto:** 🟡 Importante — DRY  
**Esforço:** 🟢 Baixo

**Criar:** `src/lib/constants/labels.ts`

```typescript
export const ORIGIN_LABELS: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

export const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  trancado: "Trancado",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  true: "Presente",
  false: "Faltou",
};
```

---

### 5. ⚡ Adicionar Skip Links (1 hora)

**Impacto:** 🔴 Crítico — WCAG Nível A  
**Esforço:** 🟢 Baixo (3 layouts)

**Arquivos:**
- `AdminLayout.tsx`
- `TeacherLayout.tsx`
- `StudentLayout.tsx`

**Adicionar no início de cada layout:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
>
  Pular para conteúdo principal
</a>

{/* ... resto do layout */}

<main id="main-content">
  {children}
</main>
```

---

### 6. ⚡ Corrigir Toggle de Senha (15 min)

**Impacto:** 🔴 Crítico — WCAG Nível A  
**Esforço:** 🟢 Baixo (1 arquivo)

**Arquivo:** `Login.tsx:139-150`

```diff
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
+   aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
+   aria-pressed={showPassword}
    className="absolute right-3 top-1/2 -translate-y-1/2"
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
```

---

### 7. ⚡ Reduzir Breakpoints de Tabelas (2 horas)

**Impacto:** 🔴 Crítico — UX Mobile  
**Esforço:** 🟢 Baixo

**Mudança global:**
```diff
- <th className="hidden xl:table-cell">
+ <th className="hidden md:table-cell">

- <th className="hidden 2xl:table-cell">
+ <th className="hidden lg:table-cell">
```

**Arquivos:**
- `StudentsListView.tsx`
- `FinancialView.tsx`
- `ClassesView.tsx`

**Comando:**
```bash
# Buscar todos os breakpoints altos
git grep -n "hidden xl:table-cell"
git grep -n "hidden 2xl:table-cell"
```

---

### 8. ⚡ Substituir Cores Hardcoded em Badges (2 horas)

**Impacto:** 🔴 Crítico — Design System  
**Esforço:** 🟢 Baixo

**Criar variantes no StatusBadge:**
```typescript
// StatusBadge.tsx
const statusBadgeVariants = cva("...", {
  variants: {
    variant: {
      success: "bg-success/10 text-success border-success/20",
      warning: "bg-warning/10 text-warning border-warning/20",
      destructive: "bg-destructive/10 text-destructive border-destructive/20",
      // ... outros
    },
  },
});
```

**Substituir:**
```diff
- <Badge className="bg-emerald-500/10 text-emerald-600">
+ <Badge variant="success">

- <Badge className="bg-rose-500/10 text-rose-600">
+ <Badge variant="destructive">

- <Badge className="bg-amber-500/10 text-amber-600">
+ <Badge variant="warning">
```

---

### 9. ⚡ Padronizar Empty States (3 horas)

**Impacto:** 🟡 Importante — Consistência  
**Esforço:** 🟢 Baixo

**Substituir em todos os componentes:**

```diff
- <p className="py-10 text-center text-muted-foreground">
-   Nenhuma aula registrada
- </p>

+ <EmptyState
+   icon={BookOpen}
+   message="Nenhuma aula registrada ainda"
+ />
```

**Arquivos:**
- `StudentDetailSheet.tsx`
- `StudentStatementTab.tsx`
- `DashboardView.tsx`
- `UserLinks.tsx`

---

### 10. ⚡ Adicionar `aria-required` em Campos Obrigatórios (1 hora)

**Impacto:** 🔴 Crítico — WCAG Nível A  
**Esforço:** 🟢 Baixo

**Mudança no FormControl:**
```typescript
// src/components/ui/form.tsx
const FormControl = React.forwardRef<...>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  const { required } = useFormContext(); // ou passar via prop
  
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={...}
      aria-invalid={!!error}
      aria-required={required} // ⚡ Adicionar
      {...props}
    />
  );
});
```

**Ou adicionar manualmente:**
```diff
  <Input
    id="name"
    required
+   aria-required="true"
    {...register("name")}
  />
```

---

## 📊 Impacto Total dos Quick Wins

| Categoria | Melhorias | Tempo Total | Impacto |
|-----------|-----------|-------------|---------|
| Acessibilidade | 5 | 5 horas | 🔴 Crítico |
| Design System | 2 | 3 horas | 🔴 Crítico |
| Responsividade | 1 | 2 horas | 🔴 Crítico |
| Código Limpo | 2 | 1.5 horas | 🟡 Importante |

**Total:** 11.5 horas (1.5 dias) = **Score +1.5 pontos**

---

## 🚀 Script de Execução Rápida

### Passo 1: Buscar e Substituir Automatizado

```bash
# 1. Buscar cores hardcoded
echo "Buscando cores hardcoded..."
git grep -n "emerald-500\|emerald-600" src/
git grep -n "rose-500\|rose-600" src/
git grep -n "amber-500\|amber-600" src/

# 2. Buscar botões sem aria-label
echo "Buscando botões sem aria-label..."
git grep -n "<MoreHorizontal" src/ | grep -v "aria-label"

# 3. Buscar aria-describedby undefined
echo "Buscando aria-describedby={undefined}..."
git grep -n "aria-describedby={undefined}" src/

# 4. Buscar breakpoints altos
echo "Buscando breakpoints altos..."
git grep -n "hidden xl:table-cell\|hidden 2xl:table-cell" src/

# 5. Buscar formatCurrency duplicados
echo "Buscando formatCurrency duplicado..."
git grep -n "function formatCurrency\|const formatCurrency" src/
```

### Passo 2: Criar Utilitários

```bash
# Criar estrutura
mkdir -p src/lib/utils
mkdir -p src/lib/constants

# Criar arquivos
touch src/lib/utils/formatters.ts
touch src/lib/constants/labels.ts
```

### Passo 3: Executar Mudanças

```bash
# 1. Extrair formatters (executar script de refactor)
npm run refactor:formatters

# 2. Atualizar imports
npm run refactor:imports

# 3. Lint e type check
npm run lint:fix
npm run type-check
```

---

## ✅ Checklist de Execução

### Dia 1 - Manhã (4 horas)
- [ ] 1. Adicionar `aria-label` em botões (2h)
- [ ] 2. Remover `aria-describedby={undefined}` (1h)
- [ ] 6. Corrigir toggle de senha (15min)
- [ ] 5. Adicionar skip links (1h)

### Dia 1 - Tarde (4 horas)
- [ ] 3. Extrair `formatCurrency` (1h)
- [ ] 4. Extrair `originLabels` (30min)
- [ ] 7. Reduzir breakpoints (2h)
- [ ] 10. Adicionar `aria-required` (1h)

### Dia 2 - Manhã (3.5 horas)
- [ ] 8. Substituir cores hardcoded (2h)
- [ ] 9. Padronizar empty states (3h)

**Total:** 11.5 horas

---

## 📈 Resultado Esperado

### Antes
- Score Geral: **7.0/10**
- Acessibilidade: **6.5/10**
- Design System: **6.0/10**
- Responsividade: **6.0/10**

### Depois (Quick Wins)
- Score Geral: **8.0/10** (+1.0)
- Acessibilidade: **8.5/10** (+2.0)
- Design System: **7.5/10** (+1.5)
- Responsividade: **7.0/10** (+1.0)

---

## 🎯 Próximos Passos (Após Quick Wins)

1. **Componentização** — Quebrar componentes grandes
2. **Mobile Tables** — Converter para cards
3. **Serviços** — Criar camada de abstração
4. **Testes** — Adicionar coverage 50%+

---

**Prioridade:** 🔴 Alta  
**Retorno:** 🟢 Máximo  
**Esforço:** 🟢 Mínimo  
**Recomendação:** Executar ASAP (próximos 1-2 dias)
