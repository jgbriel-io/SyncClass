# 🎯 PLANO DE AÇÃO UI/UX - ETAPAS DETALHADAS

**Objetivo**: Corrigir todas as inconsistências identificadas na auditoria  
**Score Atual**: 8.5/10  
**Score Alvo**: 9.5/10  
**Duração Total**: 8 dias úteis

---

## 📅 ETAPA 1: DESIGN TOKENS E VARIÁVEIS CSS (Dia 1)

### 🎨 1.1 - Criar Tokens de GAP (30min)

**Arquivo**: `src/lib/design-tokens/spacing.ts`

```typescript
// Adicionar ao final do arquivo
export const GAP = {
  TIGHT: 'gap-2',    // 8px - Para elementos muito próximos
  DEFAULT: 'gap-4',  // 16px - Espaçamento padrão
  LOOSE: 'gap-6',    // 24px - Para separação maior
} as const;

export type GapSize = keyof typeof GAP;
```

**Teste**: Importar em um componente e verificar se compila

---

### 🎨 1.2 - Criar Token MICRO para Texto Pequeno (15min)

**Arquivo**: `src/lib/design-tokens/typography.ts`

```typescript
// Adicionar ao objeto TYPOGRAPHY
export const TYPOGRAPHY = {
  // ... existentes
  MICRO: 'text-[11px] leading-tight', // Para textos secundários muito pequenos
} as const;
```

---

### 🎨 1.3 - Criar Variável CSS Success Action (30min)

**Arquivo**: `src/index.css` ou `src/App.css`

```css
/* Adicionar nas variáveis CSS */
:root {
  /* ... variáveis existentes */
  
  /* Success Action - WhatsApp Green */
  --success-action: 37 211 102; /* #25D366 */
}

.dark {
  /* ... variáveis dark mode */
  --success-action: 37 211 102; /* Mesmo valor no dark mode */
}
```

**Arquivo**: `tailwind.config.js`

```javascript
// Adicionar em theme.extend.colors
colors: {
  // ... cores existentes
  'success-action': 'rgb(var(--success-action) / <alpha-value>)',
}
```

**Teste**: Usar `bg-success-action` em um componente e verificar a cor

---

### 🎨 1.4 - Padronizar Tamanho de Avatar (15min)

**Arquivo**: `src/lib/design-tokens/avatar-sizes.ts` (NOVO)

```typescript
/**
 * Tamanhos padronizados para avatares circulares
 */
export const AVATAR_SIZES = {
  SM: 'h-8 w-8 text-xs',      // 32px - Pequeno
  DEFAULT: 'h-9 w-9 text-xs',  // 36px - Padrão (usar em tabelas)
  LG: 'h-10 w-10 text-sm',     // 40px - Grande
  XL: 'h-12 w-12 text-base',   // 48px - Extra grande
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;
```

---

**✅ Checklist Etapa 1**:
- [ ] Tokens de GAP criados e exportados
- [ ] Token MICRO criado
- [ ] Variável CSS --success-action criada
- [ ] Tailwind config atualizado
- [ ] Tokens de AVATAR_SIZES criados
- [ ] Testes de compilação passando

---

## 📅 ETAPA 2: COMPONENTES AUXILIARES (Dia 2)

### 🧩 2.1 - Criar Componente AvatarCircle (1h)

**Arquivo**: `src/components/ui/avatar-circle.tsx` (NOVO)

```typescript
import { cn } from "@/lib/utils";
import { AVATAR_SIZES, type AvatarSize } from "@/lib/design-tokens/avatar-sizes";

interface AvatarCircleProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function AvatarCircle({ 
  name, 
  size = 'DEFAULT',
  className 
}: AvatarCircleProps) {
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <div 
      className={cn(
        "rounded-full bg-accent flex items-center justify-center flex-shrink-0",
        AVATAR_SIZES[size],
        className
      )}
    >
      <span className="font-medium text-accent-foreground">
        {initial}
      </span>
    </div>
  );
}
```

**Teste**: Criar story no Storybook ou usar em um componente

---

### 🧩 2.2 - Criar Componente NumericCell (1h)

**Arquivo**: `src/components/ui/numeric-cell.tsx` (NOVO)

```typescript
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";

interface NumericCellProps {
  value: number | null | undefined;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
  emptyText?: string;
}

export function NumericCell({ 
  value, 
  format = 'number',
  className,
  emptyText = '—'
}: NumericCellProps) {
  if (value == null) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {emptyText}
      </span>
    );
  }
  
  let formatted: string;
  switch (format) {
    case 'currency':
      formatted = formatCurrency(value);
      break;
    case 'percentage':
      formatted = `${value.toFixed(1)}%`;
      break;
    default:
      formatted = String(value);
  }
  
  return (
    <span 
      className={cn("text-xs font-medium tabular-nums", className)}
      title={formatted}
    >
      {formatted}
    </span>
  );
}
```

---

### 🧩 2.3 - Exportar Novos Componentes (15min)

**Arquivo**: `src/components/ui/index.ts` (se existir, ou criar)

```typescript
export { AvatarCircle } from './avatar-circle';
export { NumericCell } from './numeric-cell';
```

---

**✅ Checklist Etapa 2**:
- [ ] AvatarCircle criado e testado
- [ ] NumericCell criado e testado
- [ ] Componentes exportados
- [ ] TypeScript sem erros

---

## 📅 ETAPA 3: CORREÇÕES P1 - TABELAS (Dia 3)

### 🔴 3.1 - Adicionar tabular-nums em Colunas Numéricas (2h)

**Arquivos a corrigir**:

1. **StudentsTableRow.tsx**
```typescript
// LINHA ~67 - Coluna Valor/Hora
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.VALOR_HORA }}>
  <span className="text-muted-foreground truncate block" title={...}>
    {hourlyRate != null ? formatCurrency(hourlyRate) : "—"}
  </span>
</td>

// LINHA ~72 - Coluna Aulas/Semana
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.AULAS_SEMANA }}>

// LINHA ~77 - Coluna Total Mensal
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.TOTAL_MENSAL }}>

// LINHA ~82 - Coluna Dia Pagamento
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.DIA_PAGTO }}>
```

2. **FinancialTableRow.tsx**
```typescript
// LINHA ~89 - Coluna Valor
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.VALOR }}>

// LINHA ~95 - Coluna Vencimento
<td className={`${CELL_BASE} hidden md:table-cell tabular-nums`} style={{ width: COL.VENCIMENTO }}>
```

3. **ClassesTableRow.tsx**
```typescript
// LINHA ~145 - Coluna Data
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.DATA }}>

// LINHA ~155 - Coluna Duração
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.DURACAO }}>

// LINHA ~162 - Coluna Nota
<td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.NOTA }}>
```

4. **ActivitiesTableRow.tsx**
```typescript
// LINHA ~78 - Coluna Prazo
<td className={cn(CELL_BASE, "hidden sm:table-cell tabular-nums")} style={{ width: COL.PRAZO }}>

// LINHA ~89 - Coluna Entregue em
<td className={cn(CELL_BASE, "hidden sm:table-cell tabular-nums")} style={{ width: COL.ENTREGUE_EM }}>
```

5. **ClassLogRow.tsx**
```typescript
// LINHA ~145 - Coluna Data
<td className={`${CELL} tabular-nums`} style={{ minWidth: COL.DATA }}>

// LINHA ~155 - Coluna Nota
<td className={`${CELL} tabular-nums`} style={{ minWidth: COL.NOTA }}>

// LINHA ~170 - Coluna Valor
<td className={`${CELL} tabular-nums`} style={{ minWidth: COL.VALOR }}>
```

---

### 🔴 3.2 - Substituir Cores Hardcoded (1h)

**Buscar e substituir em todos os arquivos**:

```bash
# Buscar
bg-[#25D366]

# Substituir por
bg-success-action
```

**Arquivos afetados** (8 componentes):
- FinancialTableRow.tsx
- ClassesTableRow.tsx
- ActivitiesTableRow.tsx
- ClassLogRow.tsx
- StudentDetailSheet.tsx
- ActivityDetailSheet.tsx
- DeliverActivityDialog.tsx
- AddCorrectionDialog.tsx

**Também substituir hover**:
```bash
# Buscar
hover:bg-[#1ebe57]

# Substituir por
hover:bg-success-action/90
```

---

**✅ Checklist Etapa 3**:
- [ ] tabular-nums adicionado em StudentsTableRow
- [ ] tabular-nums adicionado em FinancialTableRow
- [ ] tabular-nums adicionado em ClassesTableRow
- [ ] tabular-nums adicionado em ActivitiesTableRow
- [ ] tabular-nums adicionado em ClassLogRow
- [ ] Cores hardcoded substituídas (8 arquivos)
- [ ] Testes visuais em todas as tabelas

---

## 📅 ETAPA 4: CORREÇÕES P1 - ESPAÇAMENTO (Dia 4)

### 🔴 4.1 - Aplicar Tokens de GAP (3h)

**Estratégia**: Buscar e substituir padrões comuns

**Padrão 1: gap-2 (manter como TIGHT)**
```typescript
// Buscar: gap-2
// Avaliar contexto e manter ou trocar por GAP.TIGHT
```

**Padrão 2: gap-3 → gap-4 (DEFAULT)**
```typescript
// Buscar: gap-3
// Substituir por: gap-4 ou {GAP.DEFAULT}
```

**Padrão 3: gap-6 (LOOSE)**
```typescript
// Buscar: gap-6
// Manter ou usar {GAP.LOOSE}
```

**Arquivos prioritários** (15+ componentes):
1. StudentsTableRow.tsx - linha 45: `gap-3` → `gap-4`
2. FinancialTableRow.tsx - linha 67: `gap-2` → manter
3. ActivitiesTableRow.tsx - linha 89: `gap-2` → manter
4. ClassesTableRow.tsx - linha 123: `gap-3` → `gap-4`
5. StudentFormDialog.tsx - múltiplas ocorrências
6. TeacherFormDialog.tsx - múltiplas ocorrências
7. FinancialFormDialog.tsx - múltiplas ocorrências
8. ClassLogFormDialog.tsx - múltiplas ocorrências
9. SendActivityDialog.tsx - múltiplas ocorrências
10. DeliverActivityDialog.tsx - múltiplas ocorrências

**Regra de decisão**:
- `gap-2` (8px) → Manter para elementos muito próximos (ícone + texto)
- `gap-3` (12px) → Substituir por `gap-4` (16px) para consistência
- `gap-4` (16px) → Padrão, manter
- `gap-6` (24px) → Manter para separações maiores

---

**✅ Checklist Etapa 4**:
- [ ] Auditoria de todos os `gap-*` concluída
- [ ] Substituições aplicadas (15+ arquivos)
- [ ] Testes visuais de espaçamento
- [ ] Nenhum `gap-3` restante no código

---

## 📅 ETAPA 5: CORREÇÕES P2 - ÍCONES E AVATARES (Dia 5)

### 🟡 5.1 - Padronizar Tamanhos de Ícones (2h)

**Regra**: Usar `h-4 w-4` (16px) como padrão

**Exceções permitidas**:
- `h-3 w-3` ou `h-3.5 w-3.5` → Dentro de badges pequenos
- `h-5 w-5` → Ícones de destaque (headers, empty states)

**Buscar e substituir**:
```bash
# Buscar padrões inconsistentes
h-3.5 w-3.5

# Avaliar contexto:
# - Se em badge: manter h-3 w-3
# - Se em botão/input: trocar por h-4 w-4
```

**Arquivos prioritários** (20+ componentes):
- Todos os TableRow.tsx
- Todos os FormDialog.tsx
- Todos os DetailSheet.tsx

---

### 🟡 5.2 - Padronizar Avatares para h-9 w-9 (1h)

**Substituir em TableRows**:

```typescript
// ANTES
<div className="h-10 w-10 rounded-full bg-accent">

// DEPOIS
<div className="h-9 w-9 rounded-full bg-accent">
```

**Arquivos**:
1. StudentsTableRow.tsx - linha 45
2. FinancialTableRow.tsx - linha 67
3. ActivitiesTableRow.tsx - linha 56
4. ClassesTableRow.tsx - linha 123
5. ClassLogRow.tsx - linha 145

**OU usar novo componente**:
```typescript
// ANTES
<div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
  <span className="text-xs font-medium text-accent-foreground">
    {student.name.charAt(0)}
  </span>
</div>

// DEPOIS
<AvatarCircle name={student.name} size="DEFAULT" />
```

---

**✅ Checklist Etapa 5**:
- [ ] Ícones padronizados para h-4 w-4 (20+ arquivos)
- [ ] Avatares padronizados para h-9 w-9 (5 arquivos)
- [ ] Testes visuais de proporção
- [ ] Considerar migração para AvatarCircle

---

## 📅 ETAPA 6: CORREÇÕES P2 - TRUNCAMENTO (Dia 6 - Manhã)

### 🟡 6.1 - Adicionar title em Truncates (2h)

**Padrão a seguir**:
```typescript
// ANTES
<span className="text-xs truncate">{activity.file_name}</span>

// DEPOIS
<span className="text-xs truncate" title={activity.file_name}>
  {activity.file_name}
</span>
```

**Buscar no código**:
```bash
# Buscar linhas com truncate sem title
grep -r "truncate" --include="*.tsx" | grep -v "title="
```

**Arquivos prioritários** (10+ componentes):
1. ActivitiesTableRow.tsx - linha 78
2. ClassesTableRow.tsx - linha 145
3. FinancialTableRow.tsx - linha 89
4. StudentsTableRow.tsx - linha 56
5. Todos os FormDialog.tsx com selects

**Casos especiais**:
- Se o texto já tem `title` no elemento pai, não duplicar
- Se usa `line-clamp-2`, adicionar `title` com texto completo

---

**✅ Checklist Etapa 6**:
- [ ] Auditoria de truncates concluída
- [ ] title adicionado em 10+ componentes
- [ ] Testes de tooltip ao passar mouse
- [ ] Nenhum truncate sem title restante

---

## 📅 ETAPA 7: CORREÇÕES P3 - REFINAMENTOS (Dia 6 - Tarde)

### 🟢 7.1 - Substituir text-[11px] por Token (1h)

**Buscar e substituir**:
```bash
# Buscar
text-[11px]

# Substituir por
text-xs
# OU se realmente precisa ser menor
{TYPOGRAPHY.MICRO}
```

**Arquivos** (8 componentes):
- StudentsTableRow.tsx
- FinancialTableRow.tsx
- ActivitiesTableRow.tsx
- ClassesTableRow.tsx
- ClassLogRow.tsx

---

### 🟢 7.2 - Padronizar Ordem de Botões (30min)

**Regra**: Sempre "Cancelar" (esquerda) + "Salvar" (direita)

**Arquivos** (3 modais):
1. PostClassDialog.tsx - linha 189
2. Verificar todos os DialogFooter

**Padrão correto**:
```typescript
<DialogFooter className="gap-2 sm:gap-0">
  <Button type="button" variant="outline" onClick={onCancel}>
    Cancelar
  </Button>
  <Button type="submit">
    Salvar
  </Button>
</DialogFooter>
```

---

### 🟢 7.3 - Adicionar aria-hidden em Ícones (1h)

**Regra**: Ícones decorativos (que não transmitem informação única) devem ter `aria-hidden="true"`

**Padrão**:
```typescript
// ANTES
<Eye className="h-4 w-4" />

// DEPOIS
<Eye className="h-4 w-4" aria-hidden="true" />
```

**Exceções** (NÃO adicionar aria-hidden):
- Ícones em botões sem texto (usar aria-label no botão)
- Ícones que são o único indicador visual

**Buscar**:
```bash
# Buscar ícones sem aria-hidden
grep -r "lucide-react" --include="*.tsx" | grep -v "aria-hidden"
```

---

**✅ Checklist Etapa 7**:
- [ ] text-[11px] substituído (8 arquivos)
- [ ] Ordem de botões padronizada (3 modais)
- [ ] aria-hidden adicionado (30+ ícones)
- [ ] Testes de acessibilidade com leitor de tela

---

## 📅 ETAPA 8: TESTES E DOCUMENTAÇÃO (Dia 7-8)

### 🧪 8.1 - Testes Visuais (Dia 7 - 4h)

**Checklist de Testes**:

1. **Tabelas**
   - [ ] Alinhamento de números correto em todas as colunas
   - [ ] Sticky columns com shadow visível no scroll
   - [ ] Truncamento com tooltip funcionando
   - [ ] Avatares com tamanho consistente
   - [ ] Espaçamento uniforme entre elementos

2. **Modais**
   - [ ] Botões com cores corretas (success-action)
   - [ ] Espaçamento consistente entre campos
   - [ ] Ordem de botões padronizada
   - [ ] ScrollArea sem double scrollbar

3. **Responsividade**
   - [ ] Mobile: textos legíveis, botões clicáveis
   - [ ] Tablet: layout adaptado corretamente
   - [ ] Desktop: uso eficiente do espaço

4. **Acessibilidade**
   - [ ] Navegação via teclado (Tab) funcional
   - [ ] Estados de foco visíveis
   - [ ] Contraste de cores adequado (WCAG AA)
   - [ ] Leitor de tela não anuncia ícones decorativos

---

### 📚 8.2 - Documentação (Dia 8 - 4h)

**8.2.1 - Atualizar Guia de Estilo**

**Arquivo**: `GUIA_ESTILO_UIUX.md` (NOVO)

```markdown
# Guia de Estilo UI/UX

## Design Tokens

### Espaçamento (GAP)
- `GAP.TIGHT` (8px): Ícone + texto, elementos muito próximos
- `GAP.DEFAULT` (16px): Espaçamento padrão entre elementos
- `GAP.LOOSE` (24px): Separação maior entre seções

### Avatares
- `AVATAR_SIZES.DEFAULT` (36px): Usar em tabelas
- `AVATAR_SIZES.LG` (40px): Usar em headers

### Ícones
- Padrão: `h-4 w-4` (16px)
- Em badges: `h-3 w-3` (12px)
- Destaque: `h-5 w-5` (20px)

### Cores de Ação
- Success Action: `bg-success-action` (#25D366)
- Usar para botões de confirmação/sucesso

## Padrões de Componentes

### Tabelas
- Colunas numéricas: sempre usar `tabular-nums`
- Textos truncados: sempre adicionar `title` attribute
- Avatares: usar `AvatarCircle` component

### Modais
- Ordem de botões: Cancelar (esquerda) + Salvar (direita)
- Espaçamento: `DialogFooter className="gap-2 sm:gap-0"`
- ScrollArea: usar `noScroll={true}` no BaseDialog

### Acessibilidade
- Ícones decorativos: adicionar `aria-hidden="true"`
- Botões sem texto: adicionar `aria-label`
- Contraste mínimo: 4.5:1 (WCAG AA)
```

---

**8.2.2 - Criar Changelog**

**Arquivo**: `CHANGELOG_UIUX.md` (NOVO)

```markdown
# Changelog UI/UX

## [2.0.0] - 2026-02-20

### Added
- Design tokens: GAP, AVATAR_SIZES, TYPOGRAPHY.MICRO
- Variável CSS: --success-action
- Componentes: AvatarCircle, NumericCell
- Guia de estilo completo

### Changed
- Padronizado alinhamento de números (tabular-nums)
- Substituído cores hardcoded por variáveis CSS
- Padronizado espaçamento (gap-3 → gap-4)
- Padronizado tamanhos de ícones (h-4 w-4)
- Padronizado avatares (h-9 w-9)

### Fixed
- Truncamento sem tooltip (10+ componentes)
- Ordem de botões inconsistente (3 modais)
- Contraste de cores (WCAG AA)
- Ícones sem aria-hidden (30+ componentes)

### Score
- Antes: 8.5/10
- Depois: 9.5/10
```

---

**✅ Checklist Etapa 8**:
- [ ] Testes visuais em todas as páginas
- [ ] Testes de responsividade (mobile/tablet/desktop)
- [ ] Testes de acessibilidade (teclado + leitor de tela)
- [ ] Guia de estilo criado
- [ ] Changelog criado
- [ ] Screenshots de antes/depois

---

## 📊 RESUMO DAS ETAPAS

| Etapa | Duração | Prioridade | Arquivos | Impacto |
|-------|---------|------------|----------|---------|
| 1. Design Tokens | 2h | P1 | 4 | Alto |
| 2. Componentes Auxiliares | 2h | P2 | 2 | Médio |
| 3. Tabelas (tabular-nums + cores) | 3h | P1 | 13 | Alto |
| 4. Espaçamento (GAP) | 3h | P1 | 15+ | Alto |
| 5. Ícones e Avatares | 3h | P2 | 25+ | Médio |
| 6. Truncamento | 2h | P2 | 10+ | Médio |
| 7. Refinamentos | 2.5h | P3 | 40+ | Baixo |
| 8. Testes e Docs | 8h | - | - | Manutenção |
| **TOTAL** | **25.5h** | - | **100+** | - |

---

## 🚀 COMO EXECUTAR

### Opção 1: Sequencial (Recomendado)
```bash
# Dia 1
git checkout -b fix/uiux-etapa-1-tokens
# Executar Etapa 1
git commit -m "feat(ui): adiciona design tokens (GAP, MICRO, success-action, AVATAR_SIZES)"
git push

# Dia 2
git checkout -b fix/uiux-etapa-2-components
# Executar Etapa 2
git commit -m "feat(ui): adiciona componentes AvatarCircle e NumericCell"
git push

# ... e assim por diante
```

### Opção 2: Por Prioridade
```bash
# Primeiro todas as P1 (Etapas 1, 3, 4)
# Depois todas as P2 (Etapas 2, 5, 6)
# Por último P3 (Etapa 7)
# Finalizar com testes (Etapa 8)
```

### Opção 3: Por Tipo de Mudança
```bash
# Branch 1: Tokens e variáveis (Etapa 1)
# Branch 2: Componentes (Etapa 2)
# Branch 3: Correções em tabelas (Etapas 3, 4, 5, 6)
# Branch 4: Refinamentos (Etapa 7)
# Branch 5: Documentação (Etapa 8)
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### Para cada Etapa:
- [ ] Código compila sem erros TypeScript
- [ ] Testes visuais passam
- [ ] Nenhuma regressão visual
- [ ] Commit com mensagem descritiva

### Para o Projeto Completo:
- [ ] Score UI/UX: 9.5/10
- [ ] 100% das tabelas com tabular-nums
- [ ] 0 cores hardcoded
- [ ] 0 gap-3 no código
- [ ] 100% dos truncates com title
- [ ] 100% dos ícones decorativos com aria-hidden
- [ ] Contraste WCAG AA: 100%
- [ ] Documentação completa

---

**Próximo Passo**: Começar pela Etapa 1 (Design Tokens) 🎨
