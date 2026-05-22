# Design Tokens

Typography, spacing, icons e modalSizes. Sistema de tokens testado com 129 testes unitários.

## Índice

- [Quando usar](#quando-usar)
- [Typography](#typography)
- [Spacing](#spacing)
- [Icons](#icons)
- [Modal Sizes](#modal-sizes)
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

**Níveis (7):**

| Token   | Font Size       | Line Height | Font Weight    | Uso                |
| ------- | --------------- | ----------- | -------------- | ------------------ |
| `H1`    | 2.25rem (36px)  | 2.5rem      | 700 (bold)     | Títulos principais |
| `H2`    | 1.875rem (30px) | 2.25rem     | 600 (semibold) | Subtítulos         |
| `H3`    | 1.5rem (24px)   | 2rem        | 600 (semibold) | Seções             |
| `H4`    | 1.25rem (20px)  | 1.75rem     | 600 (semibold) | Subseções          |
| `Body`  | 1rem (16px)     | 1.5rem      | 400 (normal)   | Texto padrão       |
| `Small` | 0.875rem (14px) | 1.25rem     | 400 (normal)   | Texto secundário   |
| `Tiny`  | 0.75rem (12px)  | 1rem        | 400 (normal)   | Labels, captions   |

**Uso:**

```tsx
import { typography } from '@/lib/design-tokens/typography';

<h1 className={typography('H1')}>Título Principal</h1>
<h2 className={typography('H2')}>Subtítulo</h2>
<p className={typography('Body')}>Texto padrão</p>
<span className={typography('Small')}>Texto secundário</span>
<label className={typography('Tiny')}>Label</label>
```

**Output:**

```tsx
// typography('H1') retorna:
"text-4xl leading-tight font-bold";

// typography('Body') retorna:
"text-base leading-normal font-normal";
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

**Níveis (6):**

| Token      | Gap            | Uso                                      |
| ---------- | -------------- | ---------------------------------------- |
| `Tight`    | 0.5rem (8px)   | Elementos muito próximos (badges, chips) |
| `Compact`  | 0.75rem (12px) | Elementos próximos (form fields)         |
| `Default`  | 1rem (16px)    | Spacing padrão (cards, sections)         |
| `Relaxed`  | 1.5rem (24px)  | Elementos espaçados (page sections)      |
| `Loose`    | 2rem (32px)    | Elementos muito espaçados (page layout)  |
| `Spacious` | 3rem (48px)    | Máximo espaçamento (hero sections)       |

**Uso:**

```tsx
import { stack } from '@/lib/design-tokens/spacing';

<div className={stack('Default')}>
  <Card />
  <Card />
  <Card />
</div>

<div className={stack('Tight')}>
  <Badge />
  <Badge />
</div>
```

**Output:**

```tsx
// stack('Default') retorna:
"flex flex-col gap-4";

// stack('Tight') retorna:
"flex flex-col gap-2";
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

**Tamanhos (4):**

| Token | Max Width      | Uso                          |
| ----- | -------------- | ---------------------------- |
| `SM`  | 24rem (384px)  | Confirmações, alertas        |
| `MD`  | 32rem (512px)  | Forms simples (3-5 campos)   |
| `LG`  | 48rem (768px)  | Forms complexos (10+ campos) |
| `XL`  | 64rem (1024px) | Wizards, multi-step forms    |

**Uso:**

```tsx
import { modalSizes } from "@/lib/design-tokens/modal-sizes";
import { Dialog, DialogContent } from "@/components/ui/dialog";

<Dialog>
  <DialogContent className={modalSizes("MD")}>
    <form>...</form>
  </DialogContent>
</Dialog>;
```

**Output:**

```tsx
// modalSizes('MD') retorna:
"max-w-md";

// modalSizes('LG') retorna:
"max-w-3xl";
```

## Testes

**Localização:** `src/lib/design-tokens/*.test.ts`

**Cobertura:** 129 testes unitários (Vitest)

**Categorias:**

- Typography: 35 testes (7 tokens × 5 propriedades)
- Spacing: 30 testes (6 tokens × 5 propriedades)
- Icons: 25 testes (5 tokens × 5 propriedades)
- Modal Sizes: 20 testes (4 tokens × 5 propriedades)
- Integration: 19 testes (combinações)

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
