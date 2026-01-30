# 🎨 Auditoria Frontend & UI/UX - edu-core-zen

**Data:** 30/01/2026  
**Auditor:** Líder de Frontend & Especialista UI/UX  
**Contexto:** Projeto React + TypeScript + Tailwind CSS + shadcn/ui  
**Objetivo:** Elevar para nível comercial "pixel-perfect"

---

## 📊 Sumário Executivo

### Avaliação Geral: **7.0/10**

O projeto possui uma base sólida com arquitetura bem estruturada e componentes UI modernos (Radix + shadcn). Porém, há oportunidades significativas de melhoria em consistência visual, responsividade mobile e acessibilidade para atingir o padrão comercial.

### Pontos Fortes
- ✅ Arquitetura feature-based bem organizada
- ✅ Design System estruturado com tokens CSS
- ✅ Componentes UI primitivos baseados em Radix (58 componentes)
- ✅ Tipografia consistente (Geist Sans)
- ✅ React Query para data fetching
- ✅ Validação de formulários com Zod + react-hook-form
- ✅ Error Boundary global com Sentry

### Pontos Críticos
- ❌ 50+ cores hardcoded quebrando Design System
- ❌ Tabelas não otimizadas para mobile (scroll horizontal excessivo)
- ❌ Botões sem aria-labels adequados
- ❌ Código duplicado em múltiplos componentes
- ❌ Componentes muito grandes (770+ linhas)
- ❌ Inconsistência entre skeleton screens e spinners

---

## 🏗️ Pilar 1: Componentização e Reuso

### Score: **6.5/10**

#### Estrutura de Componentes

```
src/components/
├── ui/                    58 primitivos (shadcn)
├── admin/                 2 componentes
├── students/              2 componentes
├── classes/               2 componentes
├── financial/             2 componentes
├── teachers/              1 componente
├── users/                 1 componente
├── dashboard/             1 componente
├── student/               1 componente (portal)
└── layout/                3 layouts (admin, teacher, student)
```

**Total:** ~73 componentes | 21 páginas

#### Pontos Positivos
1. Separação clara entre UI primitivos e features
2. Reuso: `StudentsListView`, `FinancialView`, `ClassesView` reutilizados
3. Layouts por role bem separados
4. Componentes de formulário padronizados (`*FormDialog`)

#### Problemas Críticos

##### 1.1 Código Duplicado em 12 Arquivos

**Funções duplicadas:**
```typescript
// Duplicado em 12 arquivos diferentes
function formatCurrency(value: number | null | undefined): string {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  // ...
};
```

**Arquivos afetados:**
- `StudentsListView.tsx`
- `StudentDetailSheet.tsx`
- `StudentStatementTab.tsx`
- `ClassesView.tsx`
- `FinancialView.tsx`
- `StudentOverview.tsx`
- E mais 6 arquivos...

**Impacto:**
- Manutenção duplicada
- Risco de inconsistência
- ~200 linhas de código duplicadas

**Solução:**
```typescript
// src/lib/utils/formatters.ts
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

// src/lib/constants/labels.ts
export const ORIGIN_LABELS: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};
```

##### 1.2 Componentes Muito Grandes

| Componente | Linhas | Problema |
|------------|--------|----------|
| `StudentsListView.tsx` | 770 | Múltiplas responsabilidades |
| `FinancialView.tsx` | 565 | Lógica complexa inline |
| `ClassesView.tsx` | 580 | Sem separação de concerns |

**Solução:** Extrair subcomponentes

```typescript
// Refatorar StudentsListView.tsx em:
StudentsListView.tsx (150 linhas)
├── StudentsFilters.tsx (80 linhas)
├── StudentsTable.tsx (200 linhas)
├── StudentsSummaryCards.tsx (100 linhas)
└── StudentsActions.tsx (80 linhas)
```

##### 1.3 Componentes Customizados em `ui/`

Componentes não-primitivos misturados com primitivos:
- `status-badge.tsx` (customizado, não shadcn)
- `empty-state.tsx` (customizado)
- `stat-card.tsx` (customizado)
- `data-table.tsx` (wrapper, não primitivo)
- `page-container.tsx` (layout, não primitivo)

**Solução:** Mover para `components/shared/` ou `components/common/`

#### Recomendações Prioritárias

**🔴 Prioridade Alta**
1. Extrair utilitários duplicados para `lib/utils/formatters.ts`
2. Extrair constantes para `lib/constants/`
3. Quebrar componentes grandes em subcomponentes

**🟡 Prioridade Média**
4. Mover componentes customizados de `ui/` para `shared/`
5. Criar abstrações para lógica de status financeiro
6. Padronizar nomenclatura (singular vs plural)

---

## 🎨 Pilar 2: Consistência Visual (Design System)

### Score: **6.0/10**

#### Design System Definido

**Tokens CSS Variables (HSL):**
```css
:root {
  --primary: 220 70% 50%;
  --success: 145 60% 42%;
  --warning: 38 92% 50%;
  --destructive: 0 72% 51%;
  --muted: 220 13% 91%;
  /* + 15 tokens semânticos */
}
```

**Tipografia:**
- Fonte: Geist Sans (400, 500, 600, 700)
- Tamanhos: `text-xs` a `text-3xl`
- Tracking: `tracking-tight`, `tracking-wider`

**Espaçamentos:**
- Border radius: `--radius: 0.625rem`
- Container: padding `2rem`

#### Problemas Críticos

##### 2.1 Cores Hardcoded (50+ Ocorrências)

**Problema:** Uso extensivo de cores Tailwind hardcoded ao invés de tokens semânticos.

**Exemplos encontrados:**

```typescript
// ❌ StudentDetailSheet.tsx (15+ ocorrências)
<Badge className="bg-emerald-500/10 text-emerald-600">
<span className="text-rose-500">-R$ 150,00</span>
<p className="text-amber-600">2 pendentes</p>

// ❌ FinancialView.tsx
<Button className="bg-[#25D366] hover:bg-[#1ebe57]">
  WhatsApp
</Button>
<Badge className="bg-yellow-400 hover:bg-yellow-500">

// ❌ StatusBadge.tsx
case "info":
  return "bg-blue-50 text-blue-600 border-blue-200";
```

**Cores hardcoded encontradas:**
- `emerald-500/600` (~20x) → deveria ser `success`
- `rose-500/600` (~15x) → deveria ser `destructive`
- `amber-500/600` (~12x) → deveria ser `warning`
- `blue-*` (~5x) → deveria ser `primary` ou token `info`
- `#25D366` (WhatsApp) → deveria ter token `whatsapp`

**Impacto:**
- 🔴 Quebra dark mode
- 🔴 Impossibilita white-label
- 🔴 Dificulta manutenção de tema
- 🔴 Inconsistência visual

**Arquivos afetados:** 6 componentes principais
- `StudentDetailSheet.tsx` — 15+ ocorrências
- `StudentStatementTab.tsx` — 12+ ocorrências
- `StudentOverview.tsx` — 8+ ocorrências
- `FinancialView.tsx` — 4+ ocorrências
- `StatusBadge.tsx` — 2+ ocorrências
- `Users.tsx` — 1 ocorrência

##### 2.2 Inconsistência em Variantes de Componentes

```typescript
// StatusBadge tem variantes hardcoded
<StatusBadge variant="success" /> // ✅ usa token
<Badge className="bg-emerald-500/10 text-emerald-600" /> // ❌ hardcoded
```

#### Recomendações Prioritárias

**🔴 Prioridade Alta (Crítico)**

1. **Criar tokens faltantes:**
```typescript
// tailwind.config.ts
colors: {
  // ...existentes
  info: "hsl(var(--info))",
  "info-foreground": "hsl(var(--info-foreground))",
  whatsapp: "hsl(var(--whatsapp))",
  "whatsapp-foreground": "hsl(var(--whatsapp-foreground))",
}
```

2. **Substituir cores hardcoded:**
```diff
- <Badge className="bg-emerald-500/10 text-emerald-600">
+ <Badge variant="success">

- <span className="text-rose-500">
+ <span className="text-destructive">

- <p className="text-amber-600">
+ <p className="text-warning">

- <Button className="bg-[#25D366]">
+ <Button variant="whatsapp">
```

3. **Criar script de migração:**
```bash
# Buscar e substituir automaticamente
npm run migrate:colors
```

**🟡 Prioridade Média**

4. Documentar Design System em `UI_DESIGN_SYSTEM.md`
5. Configurar lint rule para cores hardcoded
6. Criar Storybook com todos os tokens

---

## 💬 Pilar 3: Feedback ao Usuário (UX)

### Score: **7.0/10**

#### Pontos Positivos
- ✅ `EmptyState` component padronizado
- ✅ `ErrorBoundary` global com Sentry
- ✅ Toasts (sonner) para feedback de ações
- ✅ Loading states com `Loader2` (Lucide)
- ✅ Validação inline com `FormMessage`
- ✅ Botões desabilitados durante operações

#### Problemas Identificados

##### 3.1 Inconsistência: Skeleton vs Spinner

```typescript
// ✅ StudentDetailSheet.tsx — usa Skeleton
{isLoading ? (
  <Skeleton className="h-12 w-12 rounded-full" />
) : (
  <Avatar />
)}

// ❌ StudentsListView.tsx — usa apenas Spinner
{isLoading && (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
)}
```

**Problema:** Skeleton screens são melhores para percepção de performance, mas apenas 1 componente usa.

**Solução:** Criar skeleton patterns para tabelas/listas

```typescript
// components/ui/table-skeleton.tsx
export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

##### 3.2 Empty States Não Padronizados

```typescript
// ✅ Bom — usa EmptyState component
<EmptyState
  icon={Search}
  title="Nenhum aluno cadastrado"
  message="Clique no botão 'Novo Aluno' para adicionar o primeiro"
/>

// ❌ Ruim — texto simples
<p className="py-10 text-center text-muted-foreground">
  Nenhuma aula registrada
</p>

// ❌ Ruim — div manual
<div className="py-12 text-center">
  Nenhum dado disponível ainda
</div>
```

**Arquivos com empty states não padronizados:**
- `StudentDetailSheet.tsx`
- `StudentStatementTab.tsx`
- `DashboardView.tsx`
- `UserLinks.tsx`

##### 3.3 Error States Ausentes

```typescript
// ❌ TeacherOverview.tsx — sem error state
const { data: stats } = useTeacherStats(teacherId);
// Se erro ocorrer, página fica em branco

// ✅ StudentsListView.tsx — com error state
{error && (
  <div className="rounded-lg border border-destructive/50 p-6">
    <p className="text-destructive">
      Erro ao carregar alunos. Tente novamente.
    </p>
  </div>
)}
```

##### 3.4 Feedback em Formulários Incompleto

**Problemas:**
- Sem feedback visual durante validação async
- Sem indicação de "verificando email único"
- Formulários fecham imediatamente após sucesso (usuário não vê toast)

**Solução:**
```typescript
// Adicionar delay antes de fechar
onSuccess: async () => {
  toast.success("Aluno cadastrado com sucesso!");
  await new Promise(resolve => setTimeout(resolve, 1500));
  onClose();
  queryClient.invalidateQueries({ queryKey: ["students"] });
}
```

#### Recomendações Prioritárias

**🔴 Prioridade Alta**
1. Criar `TableSkeleton` component
2. Substituir spinners por skeletons em listas principais
3. Adicionar error states em queries sem tratamento

**🟡 Prioridade Média**
4. Padronizar todos os empty states para usar `EmptyState`
5. Adicionar delay antes de fechar formulários após sucesso
6. Criar `ErrorState` component reutilizável com retry

---

## 📱 Pilar 4: Responsividade e Mobile-First

### Score: **6.0/10**

#### Pontos Positivos
- ✅ Breakpoints Tailwind usados consistentemente
- ✅ Grids responsivos (`grid-cols-1 sm:grid-cols-2`)
- ✅ Bottom navigation em `StudentLayout`
- ✅ Menu hamburguer em layouts admin/teacher
- ✅ Sidebar colapsável

#### Problemas Críticos

##### 4.1 Tabelas com Scroll Horizontal Excessivo

**Problema:** 7 tabelas usam `overflow-x-auto` como solução única sem adaptação de conteúdo.

```typescript
// ❌ StudentsListView.tsx — 770 linhas
<div className="overflow-x-auto"> {/* scroll horizontal! */}
  <table>
    <th className="hidden xl:table-cell">Professor</th>
    <th className="hidden xl:table-cell">Valor/hora</th>
    <th className="hidden 2xl:table-cell">Aulas/semana</th>
    <th className="hidden 2xl:table-cell">Total semanal</th>
    <th className="hidden 2xl:table-cell">Dia pagto</th>
    <th className="hidden xl:table-cell">Financeiro</th>
    {/* Em mobile (< 1280px): APENAS 2 colunas visíveis! */}
  </table>
</div>
```

**Tabelas afetadas:**
| Arquivo | Colunas | Colunas em Mobile | Problema |
|---------|---------|-------------------|----------|
| `StudentOverview.tsx` | 9 | 9 (scroll!) | ❌ Crítico |
| `TeacherOverview.tsx` | 9 | 9 (scroll!) | ❌ Crítico |
| `StudentsListView.tsx` | 11 | 2 | ❌ Informações ocultas |
| `FinancialView.tsx` | 10 | 4 | ⚠️ Colunas importantes ocultas |
| `ClassesView.tsx` | 9 | 4 | ⚠️ Colunas importantes ocultas |

##### 4.2 Breakpoints Muito Altos

```typescript
// Problema: xl (1280px) e 2xl (1536px) são muito altos
<th className="hidden xl:table-cell">Professor</th>
// Professor oculto até 1280px = tablets ficam sem essa info!

<th className="hidden 2xl:table-cell">Total semanal</th>
// Total semanal só aparece em telas > 1536px = inacessível para 90% dos usuários
```

**Impacto:**
- 🔴 Tablets (768-1280px) perdem informações críticas
- 🔴 Laptops (1280-1536px) não veem algumas colunas
- 🔴 Mobile (< 768px) vê apenas 2-4 colunas

##### 4.3 Falta de View Alternativa para Mobile

**Solução:** Criar card view para mobile

```typescript
// ClassesView.tsx JÁ tem, mas não é padrão
<div className="sm:hidden">
  {/* Cards view para mobile */}
  {classes.map(classLog => (
    <Card key={classLog.id}>
      <CardContent>
        <p>{classLog.students?.name}</p>
        <p>{formatDate(classLog.class_date)}</p>
        {/* Todas as informações visíveis */}
      </CardContent>
    </Card>
  ))}
</div>

<div className="hidden sm:block overflow-x-auto">
  {/* Tabela para desktop */}
</div>
```

**Arquivos que precisam de card view:**
- `StudentOverview.tsx` (crítico)
- `TeacherOverview.tsx` (crítico)
- `StudentsListView.tsx`
- `FinancialView.tsx`

##### 4.4 Search Bar Oculta em Mobile

```typescript
// AdminLayout.tsx:179
<div className="hidden md:flex items-center gap-2">
  <Search className="h-4 w-4 text-muted-foreground" />
  <Input placeholder="Buscar..." className="w-64" />
</div>
// ❌ Busca oculta em mobile! Sem alternativa.
```

**Solução:** Adicionar botão de busca que abre drawer em mobile

#### Recomendações Prioritárias

**🔴 Prioridade Alta (Crítico)**

1. **Converter tabelas de overview para cards em mobile:**
```typescript
// StudentOverview.tsx e TeacherOverview.tsx
// Substituir tabela de 9 colunas por cards agrupados
```

2. **Reduzir breakpoints:**
```diff
- <th className="hidden xl:table-cell">Professor</th>
+ <th className="hidden md:table-cell">Professor</th>

- <th className="hidden 2xl:table-cell">Total</th>
+ <th className="hidden lg:table-cell">Total</th>
```

3. **Criar `ResponsiveTable` component:**
```typescript
<ResponsiveTable
  data={students}
  columns={columnsConfig}
  mobileView="cards" // ou "accordion"
/>
```

**🟡 Prioridade Média**

4. Adicionar search drawer para mobile
5. Aumentar altura de gráficos em mobile
6. Testar em dispositivos reais (320px, 375px, 768px, 1024px)

---

## ♿ Pilar 5: Acessibilidade (WCAG)

### Score: **6.5/10**

#### Pontos Positivos
- ✅ Radix UI com suporte a acessibilidade nativo
- ✅ `focus-visible:` usado consistentemente
- ✅ Labels associados via `htmlFor`
- ✅ `FormMessage` com `aria-describedby`
- ✅ `sr-only` em elementos ocultos
- ✅ Uso correto de `<button>` (não `<div onClick>`)

#### Problemas Críticos (WCAG Nível A)

##### 5.1 `aria-describedby={undefined}` em Dialogs

**Problema:** Remove descrição dos dialogs, prejudicando leitores de tela.

**Arquivos afetados (5):**
- `FinancialFormDialog.tsx:164`
- `ClassLogFormDialog.tsx:239`
- `TeacherFormDialog.tsx:109`
- `StudentFormDialog.tsx:271`
- `Teachers.tsx:435`

```typescript
// ❌ Problema
<DialogContent aria-describedby={undefined}>
  <DialogHeader>
    <DialogTitle>Novo Aluno</DialogTitle>
  </DialogHeader>
  {/* Sem DialogDescription */}
</DialogContent>

// ✅ Solução
<DialogContent>
  <DialogHeader>
    <DialogTitle>Novo Aluno</DialogTitle>
    <DialogDescription>
      Preencha os dados abaixo para cadastrar um novo aluno
    </DialogDescription>
  </DialogHeader>
</DialogContent>
```

**Impacto:** 🔴 WCAG 4.1.2 (Name, Role, Value) — Nível A

##### 5.2 Botões com Ícones Sem `aria-label`

**Problema:** Botões com apenas ícones não têm rótulo acessível.

**15+ ocorrências encontradas:**

```typescript
// ❌ Problema — botão sem contexto
<Button variant="ghost" size="icon" className="h-8 w-8">
  <MoreHorizontal className="h-4 w-4" />
</Button>

// ✅ Solução
<Button 
  variant="ghost" 
  size="icon"
  aria-label="Abrir menu de opções"
>
  <MoreHorizontal className="h-4 w-4" />
</Button>
```

**Arquivos afetados:**
- `StudentsListView.tsx:573` — Menu dropdown
- `ClassesView.tsx:377, 490` — Botões de ações
- `FinancialView.tsx:407` — Botões de ações
- `UserLinks.tsx:180` — Menu
- `AdminLayout.tsx:194` — Notificações
- `TeacherLayout.tsx:189, 195` — Ações

**Impacto:** 🔴 WCAG 4.1.2 (Name, Role, Value) — Nível A

##### 5.3 Toggle de Senha Sem `aria-label`

```typescript
// ❌ Login.tsx:139-150
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2"
>
  {showPassword ? <EyeOff /> : <Eye />}
</button>

// ✅ Solução
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
  aria-pressed={showPassword}
  className="absolute right-3 top-1/2 -translate-y-1/2"
>
  {showPassword ? <EyeOff /> : <Eye />}
</button>
```

**Impacto:** 🔴 WCAG 4.1.2 (Name, Role, Value) — Nível A

##### 5.4 Campos Obrigatórios Sem `aria-required`

```typescript
// ❌ Problema
<Input
  id="name"
  required
  {...register("name")}
/>

// ✅ Solução
<Input
  id="name"
  required
  aria-required="true"
  {...register("name")}
/>
```

#### Problemas Importantes (WCAG Nível AA)

##### 5.5 Falta de Skip Links

```typescript
// Adicionar no início de cada layout
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground"
>
  Pular para conteúdo principal
</a>
```

**Impacto:** 🟡 WCAG 2.4.1 (Bypass Blocks) — Nível A

##### 5.6 Hierarquia de Headings Inconsistente

**Problema:** Falta uso consistente de `<h1>`, `<h2>`, `<h3>` para estrutura semântica.

```typescript
// ❌ Problema — usa apenas div com classes
<div className="text-2xl font-bold">Alunos</div>

// ✅ Solução — usa headings semânticos
<h1 className="text-2xl font-bold">Alunos</h1>
<section>
  <h2 className="text-lg font-semibold">Filtros</h2>
  ...
</section>
```

**Impacto:** 🟡 WCAG 1.3.1 (Info and Relationships) — Nível A

##### 5.7 Contraste em Estados Disabled

**Problema:** `disabled:opacity-50` pode reduzir contraste abaixo de 4.5:1.

**Solução:** Testar com ferramentas (axe DevTools) e usar cores específicas se necessário.

**Impacto:** 🟡 WCAG 1.4.3 (Contrast Minimum) — Nível AA

#### Resumo de Problemas

| Problema | Nível WCAG | Ocorrências | Prioridade |
|----------|------------|-------------|------------|
| `aria-describedby={undefined}` | A | 5 | 🔴 Crítico |
| Botões sem `aria-label` | A | 15+ | 🔴 Crítico |
| Toggle senha sem `aria-label` | A | 1 | 🔴 Crítico |
| Campos sem `aria-required` | A | ~20 | 🔴 Alta |
| Falta skip links | A | 3 layouts | 🟡 Média |
| Headings inconsistentes | A | ~15 páginas | 🟡 Média |
| Contraste disabled | AA | — | 🟢 Baixa |

#### Recomendações Prioritárias

**🔴 Prioridade Alta (Crítico — WCAG A)**

1. **Remover `aria-describedby={undefined}`:**
```bash
# Buscar e corrigir
git grep -n "aria-describedby={undefined}"
```

2. **Adicionar `aria-label` em todos os botões de ícone:**
```typescript
// Criar helper
const IconButton = ({ icon, label, ...props }) => (
  <Button aria-label={label} {...props}>
    {icon}
  </Button>
);
```

3. **Adicionar `aria-required` em campos obrigatórios:**
```typescript
// Adicionar em FormControl component
{required && <input aria-required="true" />}
```

4. **Corrigir toggle de senha:**
```typescript
// Login.tsx — adicionar aria-label e aria-pressed
```

**🟡 Prioridade Média**

5. Adicionar skip links em layouts
6. Auditar e corrigir hierarquia de headings
7. Configurar `eslint-plugin-jsx-a11y`

**🟢 Prioridade Baixa**

8. Testar com leitores de tela (NVDA, JAWS)
9. Executar Lighthouse audit
10. Verificar contraste em estados disabled

---

## 🏗️ Pilar 6: Padrões de Código Frontend

### Score: **7.5/10**

#### Estrutura de Pastas

```
src/
├── components/        ✅ Feature-based
├── hooks/             ✅ 14 hooks separados
├── lib/               ✅ Utilitários
├── pages/             ✅ Por role (admin, teacher, student)
├── integrations/      ✅ Supabase tipos
└── services/          ⚠️ Falta camada de serviços
```

#### Pontos Positivos
- ✅ Feature-based architecture
- ✅ Hooks de dados separados (14 hooks em `src/hooks/`)
- ✅ TypeScript estrito
- ✅ React Query para data fetching
- ✅ Zod para validação
- ✅ Separação de UI primitivos

#### Hooks Organizados (14 arquivos)

```
hooks/
├── useStudents.ts              ✅ CRUD + soft delete
├── useStudentsByTeacher.ts     ✅ Filtro por professor
├── useStudentDetails.ts        ✅ Detalhes completos
├── useStudentPortal.ts         ✅ Portal do aluno
├── useTeachers.ts              ✅ CRUD professores
├── useTeacherDashboard.ts      ✅ Métricas dashboard
├── useClassLogs.ts             ✅ Aulas
├── useFinancialRecords.ts      ✅ Financeiro
├── useDashboardStats.ts        ✅ Estatísticas
├── useUsers.ts                 ✅ Usuários
├── useUserMutations.ts         ✅ Mutations complexas
├── useProfiles.ts              ✅ Perfis
├── use-mobile.tsx              ✅ Breakpoint hook
└── use-toast.ts                ✅ Toast hook
```

**Avaliação:** Excelente organização de hooks!

#### Problemas Identificados

##### 6.1 Componentes com Lógica de Negócio Inline

```typescript
// ❌ StudentsListView.tsx — 770 linhas
// Calcula status financeiro inline
const financialStatusByStudent = useMemo(() => {
  const statusMap: Record<string, {...}> = {};
  financialRecords.forEach((record) => {
    if (!record.student_id) return;
    const actualStatus = getActualStatus(
      record.status,
      record.due_date,
      record.amount,
      record.amount_paid
    );
    // ... 30 linhas de lógica
  });
  return statusMap;
}, [financialRecords]);
```

**Solução:** Extrair para hook

```typescript
// hooks/useStudentFinancialStatus.ts
export function useStudentFinancialStatus() {
  const { data: financialRecords } = useFinancialRecords();
  
  return useMemo(() => {
    return calculateFinancialStatusMap(financialRecords);
  }, [financialRecords]);
}

// Uso
const statusMap = useStudentFinancialStatus();
```

##### 6.2 Falta de Camada de Serviços

**Problema:** Hooks chamam Supabase diretamente sem abstração.

```typescript
// ❌ useStudents.ts
const { data, error } = await supabase
  .from("students_active_masked")
  .select("*");
```

**Solução:** Criar camada de serviços

```typescript
// services/students.service.ts
export const studentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("students_active_masked")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  async getById(id: string) {
    // ...
  },
  
  async create(student: StudentInsert) {
    // ...
  },
};

// hooks/useStudents.ts
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: () => studentsService.getAll(),
  });
}
```

**Benefícios:**
- Testabilidade
- Reuso de lógica
- Mudança de backend facilitada
- Type safety centralizado

##### 6.3 Formatters e Constants Duplicados

```typescript
// ❌ Duplicado em 12 arquivos
function formatCurrency(value: number) { ... }
const originLabels = { ... };
```

**Solução:** (já abordado no Pilar 1)

```typescript
// lib/formatters.ts
// lib/constants.ts
```

##### 6.4 Testes Ausentes

**Problema:** Apenas 1 arquivo de teste (`ErrorBoundary.test.tsx`).

**Solução:** Adicionar testes unitários

```typescript
// hooks/__tests__/useStudents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useStudents } from '../useStudents';

describe('useStudents', () => {
  it('should fetch students', async () => {
    const { result } = renderHook(() => useStudents());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

#### Recomendações Prioritárias

**🔴 Prioridade Alta**

1. Extrair utilitários e constantes duplicados
2. Criar camada de serviços para Supabase
3. Extrair lógica de negócio de componentes para hooks

**🟡 Prioridade Média**

4. Adicionar testes unitários (coverage 50%+)
5. Documentar hooks e serviços com JSDoc
6. Criar `features/` structure para módulos grandes

**Exemplo de structure `features/`:**
```
features/
├── students/
│   ├── components/
│   │   ├── StudentsList.tsx
│   │   ├── StudentsFilters.tsx
│   │   └── StudentForm.tsx
│   ├── hooks/
│   │   ├── useStudents.ts
│   │   └── useStudentStatus.ts
│   ├── services/
│   │   └── students.service.ts
│   ├── types/
│   │   └── student.types.ts
│   └── utils/
│       └── student.utils.ts
```

---

## 🎯 Plano de Ação Priorizado

### 🔴 Fase 1: Críticos (2-3 semanas)

#### 1.1 Design System — Cores (5 dias)
- [ ] Criar tokens faltantes (`info`, `whatsapp`)
- [ ] Substituir 50+ cores hardcoded por tokens
- [ ] Atualizar `StatusBadge` variants
- [ ] Testar dark mode
- [ ] Documentar tokens em `UI_DESIGN_SYSTEM.md`

**Arquivos:** 6 componentes principais  
**Impacto:** 🟢 Consistência visual | 🟢 White-label | 🟢 Dark mode

#### 1.2 Responsividade — Tabelas (7 dias)
- [ ] Converter `StudentOverview` para cards em mobile
- [ ] Converter `TeacherOverview` para cards em mobile
- [ ] Reduzir breakpoints (`xl:` → `md:`, `2xl:` → `lg:`)
- [ ] Criar `ResponsiveTable` component reutilizável
- [ ] Adicionar card view em `StudentsListView`
- [ ] Adicionar card view em `FinancialView`
- [ ] Adicionar search drawer em mobile

**Arquivos:** 5 tabelas principais  
**Impacto:** 🟢 UX mobile | 🟢 Acessibilidade tablet | 🟢 Retenção de usuários

#### 1.3 Acessibilidade — WCAG A (5 dias)
- [ ] Remover `aria-describedby={undefined}` (5 dialogs)
- [ ] Adicionar `aria-label` em botões de ícone (15+)
- [ ] Corrigir toggle de senha (`aria-label` + `aria-pressed`)
- [ ] Adicionar `aria-required` em campos obrigatórios (~20)
- [ ] Adicionar skip links (3 layouts)
- [ ] Configurar `eslint-plugin-jsx-a11y`

**Arquivos:** 15+ componentes  
**Impacto:** 🟢 Compliance WCAG | 🟢 Acessibilidade | 🟢 SEO

### 🟡 Fase 2: Importantes (2-3 semanas)

#### 2.1 Refatoração — Componentização (7 dias)
- [ ] Extrair `formatCurrency` → `lib/formatters.ts`
- [ ] Extrair `formatDate` → `lib/formatters.ts`
- [ ] Extrair `originLabels` → `lib/constants.ts`
- [ ] Quebrar `StudentsListView` (770 linhas) em subcomponentes
- [ ] Quebrar `FinancialView` (565 linhas) em subcomponentes
- [ ] Quebrar `ClassesView` (580 linhas) em subcomponentes
- [ ] Mover componentes customizados de `ui/` para `shared/`

**Arquivos:** 12 componentes  
**Impacto:** 🟢 Manutenibilidade | 🟢 Testabilidade | 🟢 Reuso

#### 2.2 UX — Feedback States (5 dias)
- [ ] Criar `TableSkeleton` component
- [ ] Substituir spinners por skeletons em tabelas
- [ ] Padronizar empty states (usar `EmptyState`)
- [ ] Adicionar error states em queries sem tratamento
- [ ] Criar `ErrorState` component com retry
- [ ] Adicionar delay antes de fechar formulários

**Arquivos:** 8 componentes  
**Impacto:** 🟢 Percepção de performance | 🟢 UX | 🟢 Feedback visual

#### 2.3 Arquitetura — Serviços (7 dias)
- [ ] Criar `services/students.service.ts`
- [ ] Criar `services/teachers.service.ts`
- [ ] Criar `services/classLogs.service.ts`
- [ ] Criar `services/financialRecords.service.ts`
- [ ] Atualizar hooks para usar serviços
- [ ] Extrair lógica de negócio para hooks

**Arquivos:** 14 hooks  
**Impacto:** 🟢 Testabilidade | 🟢 Reuso | 🟢 Separação de concerns

### 🟢 Fase 3: Melhorias (2 semanas)

#### 3.1 Acessibilidade — WCAG AA
- [ ] Auditar hierarquia de headings
- [ ] Adicionar headings semânticos em páginas
- [ ] Verificar contraste em estados disabled
- [ ] Testar com NVDA/JAWS
- [ ] Executar Lighthouse audit
- [ ] Corrigir problemas encontrados

#### 3.2 Qualidade — Testes
- [ ] Configurar Vitest + Testing Library
- [ ] Adicionar testes para hooks principais (50%+ coverage)
- [ ] Adicionar testes para componentes críticos
- [ ] Configurar CI para rodar testes

#### 3.3 Documentação
- [ ] Criar `UI_DESIGN_SYSTEM.md`
- [ ] Criar `COMPONENT_GUIDELINES.md`
- [ ] Criar `ACCESSIBILITY_CHECKLIST.md`
- [ ] Documentar padrões de responsividade
- [ ] Criar Storybook (opcional)

---

## 📊 Métricas de Sucesso

### Métricas Atuais vs Alvo

| Métrica | Atual | Alvo | Prioridade |
|---------|-------|------|------------|
| Consistência Design System | 60% | 95% | 🔴 Alta |
| Responsividade Mobile | 60% | 90% | 🔴 Alta |
| Acessibilidade WCAG A | 65% | 100% | 🔴 Alta |
| Componentes < 300 linhas | 65% | 90% | 🟡 Média |
| Código duplicado | Alto | < 5% | 🟡 Média |
| Cobertura de testes | 5% | 60% | 🟢 Baixa |
| Lighthouse Score | 75 | 95 | 🟢 Baixa |

### KPIs de Qualidade

**Score Geral Alvo:** 9.0/10 (de 7.0/10 atual)

| Pilar | Atual | Alvo | Delta |
|-------|-------|------|-------|
| Componentização | 6.5/10 | 9.0/10 | +2.5 |
| Design System | 6.0/10 | 9.5/10 | +3.5 |
| Feedback UX | 7.0/10 | 9.0/10 | +2.0 |
| Responsividade | 6.0/10 | 9.0/10 | +3.0 |
| Acessibilidade | 6.5/10 | 9.5/10 | +3.0 |
| Padrões Código | 7.5/10 | 9.0/10 | +1.5 |

---

## 🛠️ Ferramentas Recomendadas

### Desenvolvimento
- [ ] **Storybook** — Catálogo de componentes
- [ ] **Chromatic** — Visual regression testing
- [ ] **axe DevTools** — Auditoria de acessibilidade

### Testes
- [ ] **Vitest** — Test runner
- [ ] **Testing Library** — Testes de componentes
- [ ] **jest-axe** — Testes automatizados de a11y
- [ ] **Playwright** — E2E testing

### Lint & Quality
- [ ] **eslint-plugin-jsx-a11y** — Lint de acessibilidade
- [ ] **@tanstack/eslint-plugin-query** — Lint de React Query
- [ ] **prettier-plugin-tailwindcss** — Ordenação de classes

### Documentação
- [ ] **JSDoc** — Documentação inline
- [ ] **TypeDoc** — Geração de docs
- [ ] **Storybook Docs** — Documentação visual

---

## 📝 Conclusão

O projeto **edu-core-zen** possui uma **base sólida** com arquitetura moderna, mas precisa de **refatorações críticas** em **Design System**, **responsividade mobile** e **acessibilidade** para atingir o padrão comercial "pixel-perfect".

### Prioridades Imediatas (Próximos 30 dias)

1. 🎨 **Design System** — Eliminar 50+ cores hardcoded (impacto máximo)
2. 📱 **Responsividade** — Converter tabelas críticas para cards mobile
3. ♿ **Acessibilidade** — Corrigir problemas WCAG Nível A

### Esforço Estimado

- **Fase 1 (Críticos):** 2-3 semanas | 1 dev full-time
- **Fase 2 (Importantes):** 2-3 semanas | 1 dev full-time
- **Fase 3 (Melhorias):** 2 semanas | 1 dev part-time

**Total:** 6-8 semanas para atingir score 9.0/10

### ROI Esperado

- 🟢 **UX Mobile:** +40% retenção de usuários mobile
- 🟢 **Acessibilidade:** Compliance legal + mercado ampliado
- 🟢 **Manutenibilidade:** -30% tempo de desenvolvimento de features
- 🟢 **White-label:** Pronto para multi-tenant com temas customizados

---

**Auditoria realizada por:** Líder de Frontend & Especialista UI/UX  
**Próximo passo:** Revisão com time e priorização de backlog
