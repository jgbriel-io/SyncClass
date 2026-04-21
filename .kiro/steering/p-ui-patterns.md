---
inclusion: fileMatch
fileMatchPattern: ['**/*.tsx', '**/*.css']
description: Padrões visuais do projeto — design tokens, componentes shadcn/ui, spacing, tipografia e cores semânticas
---

# Padrões Visuais do Projeto

Antes de criar qualquer coisa nova: verificar se já existe algo similar, reutilizar.

## Design Tokens

```ts
import { typography } from '@/lib/design-tokens/typography'
import { stack } from '@/lib/design-tokens/spacing'
import { iconSize } from '@/lib/design-tokens/icon-sizes'
```

| Uso | Token |
|-----|-------|
| Títulos de página | `typography('H1')` |
| Títulos de seção | `typography('H2')`, `typography('H3')` |
| Texto padrão | `typography('BODY')` |
| Labels, hints | `typography('SMALL')` |
| Espaçamento denso | `stack('TIGHT')` |
| Espaçamento padrão | `stack('DEFAULT')` |
| Espaçamento relaxado | `stack('LOOSE')`, `stack('RELAXED')` |
| Ícones em botões | `iconSize('SM')` |
| Ícones em cards | `iconSize('MD')` |
| Ícones em headers | `iconSize('LG')` |

## Componentes — usar os existentes

Verificar antes de criar:
1. `src/components/ui/` — shadcn/ui
2. `src/components/students/`, `src/components/admin/` — componentes do domínio

- Buttons → `Button` do shadcn
- Inputs → `Input` do shadcn com `Label`
- Cards → `Card` do shadcn
- Tabelas → `Table`, `TableBody`, `TableRow` do shadcn
- Dialogs/Modals → `Dialog` do shadcn
- Toasts → `toast` do sonner

## Spacing

Escala consistente (múltiplos de 4): `gap-4 / gap-6 / gap-8 / gap-12`

❌ Evitar: `gap-3`, `gap-5`, `gap-7`

## Cores — apenas semânticas

| Situação | Classe |
|----------|--------|
| Erros | `text-destructive`, `bg-destructive/10`, `border-destructive/20` |
| Sucesso | `text-success`, `bg-success/10` |
| Avisos | `text-warning`, `bg-warning/10` |
| Neutro | `text-muted-foreground`, `bg-muted` |
| Primário | `text-primary`, `bg-primary` |

❌ `text-red-500`, `bg-green-50` (hardcoded)
✅ `text-destructive`, `bg-success/10` (semântico)

## Formulários

- Formulários são sempre Dialogs/Modals — não criar rotas separadas
- Inputs usam `id` para identificação (não `name`)
- Erros próximos ao input com `text-destructive`

## Loading States

```tsx
// Skeleton para listas
if (isLoading) return <StudentsTableSkeleton />

// Spinner para botões
<Button disabled={isPending}>
  {isPending && <Loader2 className={`mr-2 ${iconSize('SM')} animate-spin`} />}
  {isPending ? 'Salvando...' : 'Salvar'}
</Button>
```
