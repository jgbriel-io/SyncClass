# Design Tokens

Typography, spacing, icons, modal sizes, avatar sizes e table columns. Sistema de tokens testado com 283+ testes unitários (6 módulos).

## Índice

- [Quando usar](#quando-usar)
- [Typography](#typography)
- [Spacing](#spacing)
- [Icons](#icons)
- [Modal Sizes](#modal-sizes)
- [Módulos adicionais](#módulos-adicionais)
- [Testes](#testes)
- [Ver também](#ver-também)

## Quando usar

**Use design tokens quando:**

- Estilizar texto (títulos, body, small)
- Definir spacing (gap, padding, margin)
- Dimensionar ícones
- Dimensionar modals/dialogs

**Não use quando:**

- Cores (usar Tailwind semantic colors: `text-destructive`, `bg-primary`)
- Borders (usar Tailwind: `border`, `rounded-lg`)
- Shadows (usar Tailwind: `shadow-sm`, `shadow-md`)

## Typography

**Localização:** `src/lib/design-tokens/typography.ts`

**Variantes (18):**

| Token              | Tailwind classes                                                     | Uso                          |
| ------------------ | -------------------------------------------------------------------- | ---------------------------- |
| `DISPLAY`          | `text-4xl font-bold`                                                 | Hero, landing pages (36px)   |
| `H1`               | `text-2xl font-semibold`                                             | Títulos de página (24px)     |
| `H2`               | `text-xl font-semibold`                                              | Títulos de seção (20px)      |
| `H3`               | `text-lg font-medium`                                                | Subtítulos, cards (18px)     |
| `BODY`             | `text-sm`                                                            | Texto padrão (14px)          |
| `BODY_MEDIUM`      | `text-sm font-medium`                                                | Texto com ênfase (14px)      |
| `BODY_SEMIBOLD`    | `text-sm font-semibold`                                              | Texto destacado (14px)       |
| `CAPTION`          | `text-xs`                                                            | Labels, legendas (12px)      |
| `CAPTION_MEDIUM`   | `text-xs font-medium`                                                | Labels com ênfase (12px)     |
| `CAPTION_SEMIBOLD` | `text-xs font-semibold`                                              | Labels destacados (12px)     |
| `SMALL`            | `text-xs text-muted-foreground`                                      | Texto secundário (12px)      |
| `SMALL_MEDIUM`     | `text-xs font-medium text-muted-foreground`                          | Secundário com ênfase        |
| `MICRO`            | `text-[11px] leading-tight`                                          | Timestamps, metadados (11px) |
| `MICRO_MUTED`      | `text-[11px] leading-tight text-muted-foreground`                    | Micro secundário (11px)      |
| `TABLE_HEADER`     | `text-xs font-medium text-muted-foreground uppercase tracking-wider` | Headers de tabela            |
| `LABEL`            | `text-sm font-medium`                                                | Labels de formulário         |
| `HELPER`           | `text-xs text-muted-foreground`                                      | Texto de ajuda               |
| `ERROR`            | `text-sm text-destructive`                                           | Mensagens de erro            |

> **Atenção:** Não existem `H4` nem `Tiny` — use `H3` e `MICRO` respectivamente. Tokens usam UPPER_CASE.

**Uso:**

```tsx
import { typography } from '@/lib/design-tokens/typography';

<h1 className={typography('H1')}>Título Principal</h1>
<h2 className={typography('H2')}>Subtítulo</h2>
<p className={typography('BODY')}>Texto padrão</p>
<span className={typography('SMALL')}>Texto secundário</span>
<label className={typography('LABEL')}>Label</label>
```

**Output:**

```tsx
// typography('H1') retorna:
"text-2xl font-semibold";

// typography('BODY') retorna:
"text-sm";
```

**Responsive:**

```tsx
// Mobile: H3, Desktop: H1
<h1 className={`${typography("H3")} md:${typography("H1")}`}>
  Título Responsivo
</h1>
```

## Spacing

**Localização:** `src/lib/design-tokens/spacing.ts`

**STACK — espaçamento vertical (4 níveis):**

| Token     | Classe Tailwind | Uso                            |
| --------- | --------------- | ------------------------------ |
| `TIGHT`   | `space-y-2`     | Formulários, inputs (8px)      |
| `DEFAULT` | `space-y-4`     | Seções padrão (16px)           |
| `LOOSE`   | `space-y-6`     | Seções principais (24px)       |
| `RELAXED` | `space-y-8`     | Páginas, grandes blocos (32px) |

> **Atenção:** Não existem `Compact` nem `Spacious`. Tokens usam UPPER_CASE. O módulo também exporta `GAP` (flex/grid), `CONTAINER` (padding) e `PADDING_X/Y`.

**Uso:**

```tsx
import { stack } from '@/lib/design-tokens/spacing';

<div className={stack('DEFAULT')}>
  <Card />
  <Card />
</div>

<div className={stack('TIGHT')}>
  <Badge />
  <Badge />
</div>
```

**Output:**

```tsx
// stack('DEFAULT') retorna:
"space-y-4";

// stack('TIGHT') retorna:
"space-y-2";
```

**Horizontal:**

```tsx
// Horizontal stack
<div className="flex flex-row gap-4">
  <Button />
  <Button />
</div>
```

## Icons

**Localização:** `src/lib/design-tokens/icon-sizes.ts`

**Tamanhos (5):**

| Token | Size           | Uso                             |
| ----- | -------------- | ------------------------------- |
| `XS`  | 0.75rem (12px) | Ícones inline em texto tiny     |
| `SM`  | 1rem (16px)    | Ícones inline em texto body     |
| `MD`  | 1.5rem (24px)  | Ícones em botões, cards         |
| `LG`  | 2rem (32px)    | Ícones em headers, empty states |
| `XL`  | 3rem (48px)    | Ícones em hero sections         |

**Uso:**

```tsx
import { iconSize } from '@/lib/design-tokens/icon-sizes';
import { User, Mail, Calendar } from 'lucide-react';

<User className={iconSize('SM')} />
<Mail className={iconSize('MD')} />
<Calendar className={iconSize('LG')} />
```

**Output:**

```tsx
// iconSize('SM') retorna:
"w-4 h-4";

// iconSize('MD') retorna:
"w-6 h-6";
```

**Com cor:**

```tsx
<User className={`${iconSize('SM')} text-primary`} />
<Mail className={`${iconSize('MD')} text-destructive`} />
```

## Modal Sizes

**Localização:** `src/lib/design-tokens/modal-sizes.ts`

**DIALOG_SIZES — modais centrais (3 tamanhos):**

| Token | Classe Tailwind | Pixels | Uso                       |
| ----- | --------------- | ------ | ------------------------- |
| `SM`  | `sm:max-w-md`   | 448px  | Confirmações, alerts      |
| `MD`  | `sm:max-w-lg`   | 512px  | Forms simples (cadastros) |
| `LG`  | `sm:max-w-2xl`  | 672px  | Forms complexos           |

**SHEET_SIZES — modais laterais (4 tamanhos):**

| Token     | Classe Tailwind | Pixels | Uso                 |
| --------- | --------------- | ------ | ------------------- |
| `DEFAULT` | `sm:max-w-lg`   | 512px  | Visualização padrão |
| `LG`      | `sm:max-w-xl`   | 640px  | Mais informações    |
| `XL`      | `sm:max-w-2xl`  | 672px  | Múltiplas tabs      |
| `FULL`    | `sm:max-w-full` | 100%   | Largura total       |

> **Atenção:** `XL` não existe em `DIALOG_SIZES` — existe apenas em `SHEET_SIZES`. Funções: `getDialogSizeClass(size)` e `getSheetSizeClass(size)`.

**Uso:**

```tsx
import {
  getDialogSizeClass,
  getSheetSizeClass,
} from "@/lib/design-tokens/modal-sizes";
import { Dialog, DialogContent } from "@/components/ui/dialog";

<Dialog>
  <DialogContent className={getDialogSizeClass("MD")}>
    <form>...</form>
  </DialogContent>
</Dialog>;
```

**Output:**

```tsx
// getDialogSizeClass('MD') retorna:
"sm:max-w-lg";

// getDialogSizeClass('LG') retorna:
"sm:max-w-2xl";
```

## Módulos adicionais

Dois módulos não documentados nas seções acima:

- **`src/lib/design-tokens/avatar-sizes.ts`** — função `avatarSize(size)` para dimensionar avatares de usuário
- **`src/lib/design-tokens/table-columns.ts`** — função `getColumnStyle()` e utilitários de largura de colunas de tabela

## Testes

**Localização:** `src/lib/design-tokens/*.test.ts`

**Cobertura:** 283+ expects (Vitest), 6 módulos

**Categorias:**

- Typography: 84 expects (`src/lib/design-tokens/typography.test.ts`)
- Spacing: 83 expects (`src/lib/design-tokens/spacing.test.ts`)
- Icons: 63 expects (`src/lib/design-tokens/icon-sizes.test.ts`)
- Modal Sizes: 38 expects (`src/lib/design-tokens/modal-sizes.test.ts`)
- Table Columns: 15 expects (`src/lib/design-tokens/table-columns.test.ts`)
- Avatar Sizes: cobertura em `avatar-sizes.ts`

**Exemplo:**

```ts
// src/lib/design-tokens/typography.test.ts
import { describe, it, expect } from "vitest";
import { typography } from "./typography";

describe("typography", () => {
  it("H1 should have correct classes", () => {
    expect(typography("H1")).toBe("text-4xl leading-tight font-bold");
  });

  it("Body should have correct classes", () => {
    expect(typography("Body")).toBe("text-base leading-normal font-normal");
  });
});
```

**Rodar testes:**

```bash
npm run test -- design-tokens
```

## Ver também

- [Frontend Overview](./overview.md) — Visão geral do frontend
- [Components](./components.md) — Uso de tokens em componentes
- [Content](./content.md) — Centralização de strings
