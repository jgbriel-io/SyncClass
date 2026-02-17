# Breakpoints de responsividade

O projeto usa 4 breakpoints no Tailwind:

| Nome     | Largura        | Uso no Tailwind | Comportamento típico |
|----------|----------------|-----------------|----------------------|
| **mobile**  | até 425px   | `mobile:...` (max-width) | 1 coluna, menu hamburger, padding menor |
| **tablet**  | 768px e acima | `tablet:...` (min-width) | Busca visível, padding médio |
| **laptop**  | 1024px e acima | `laptop:...` (min-width) | Sidebar fixa, cards em 4 colunas (1 linha) |
| **desktop** | 1440px e acima | `desktop:...` (min-width) | Padding maior |

## Exemplos

```html
<!-- Grid de cards: 1 col no mobile/tablet, 4 col em 1 linha a partir do laptop (1024px+) -->
<div class="grid grid-cols-1 laptop:grid-cols-4">

<!-- Esconder no mobile -->
<div class="mobile:hidden">

<!-- Só no mobile (max 425px) -->
<div class="mobile:block tablet:hidden">
```

Os breakpoints estão definidos em `tailwind.config.ts` em `theme.extend.screens`.
