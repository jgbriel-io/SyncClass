# 📐 Guia de Padrões de UI - EduCore

> Documento oficial de referência para manter consistência visual em toda a plataforma

---

## 🎨 1. ESPAÇAMENTOS PADRONIZADOS

### 1.1 Container Principal (Pages)

**✅ USAR:**
```tsx
<PageContainer>
  {/* conteúdo da página */}
</PageContainer>

// Ou manualmente:
<main className="p-4 lg:p-6 animate-fade-in">
  {/* conteúdo */}
</main>
```

**❌ NÃO USAR:**
```tsx
// Inconsistente - não responde em desktop
<main className="px-4 py-6">

// Inconsistente - valores arbitrários
<main className="p-5 lg:p-8">
```

**Regra:** `p-4 lg:p-6` é o padrão universal para containers principais

---

### 1.2 Cards

**✅ USAR:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* conteúdo - CardContent já tem p-6 pt-0 */}
  </CardContent>
</Card>
```

**Valores:**
- `CardHeader`: `p-6` com `space-y-1.5`
- `CardContent`: `p-6 pt-0` (sem padding-top para evitar excesso)
- `CardFooter`: `p-6 pt-0`

**⚠️ Atenção:** Quando Card está dentro de Page com `p-4 lg:p-6`, não há conflito pois Card tem `border` e `rounded-lg` criando separação visual.

---

### 1.3 Tabelas

**✅ USAR componentes do shadcn:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      {/* TableHead já tem h-12 px-4 */}
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>João</TableCell>
      {/* TableCell já tem p-4 */}
    </TableRow>
  </TableBody>
</Table>
```

**❌ NÃO USAR `<th>` e `<td>` manuais:**
```tsx
// Inconsistente!
<th className="px-4 py-2">Nome</th>
<th className="px-4 py-3">Email</th>
```

**Valores Padrão:**
- `TableHead`: `h-12 px-4`
- `TableCell`: `p-4`

**Motivo:** Garante altura e padding vertical consistente entre tabelas

---

### 1.4 Empty States

**✅ USAR:**
```tsx
<EmptyState
  icon={Users}
  title="Nenhum aluno cadastrado"
  message="Clique no botão acima para adicionar"
  size="default" // ou "sm" | "lg"
/>

// Ou manualmente:
<div className="py-10 text-center text-muted-foreground">
  Nenhum resultado encontrado
</div>
```

**❌ NÃO USAR valores arbitrários:**
```tsx
// Inconsistente!
<div className="py-6">...</div>  // página A
<div className="py-12">...</div> // página B
```

**Valores Padrão:**
- `py-10` é o padrão universal para empty states
- `py-6` para versão compacta (dentro de cards pequenos)
- `py-16` para versão destacada (página inteira vazia)

---

## 🔘 2. BOTÕES & INPUTS

### 2.1 Botões

**✅ USAR variants do Button:**
```tsx
<Button size="default">Salvar</Button>
<Button size="sm">Editar</Button>
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

**Valores:**
- `size="default"`: `h-10 px-4 py-2`
- `size="sm"`: `h-9 px-3`
- `size="lg"`: `h-11 px-8`
- `size="icon"`: `h-10 w-10`
- Tipografia: `text-sm` (consistente)

**❌ NÃO sobrescrever com classes manuais:**
```tsx
// Inconsistente!
<Button className="h-8 px-2">Ação</Button>
<Button className="gap-2 px-2">Menu</Button>
```

**Exceção Permitida:** `gap-*` para espaçamento de ícones é ok

---

### 2.2 Inputs

**✅ PADRÃO:**
```tsx
<Input placeholder="Nome" />
```

**Valores:**
- Altura: `h-10` (alinhado com Button)
- Padding: `px-3 py-2`
- Tipografia: `text-sm` (UNIFORME com Button)

**⚠️ Mudança Recente:**
Removido `text-base md:text-sm` para manter `text-sm` consistente em todos os tamanhos de tela.

**Motivo:** Inputs e Buttons side-by-side devem ter tipografia idêntica

---

## 📦 3. LAYOUTS

### 3.1 Layouts por Role

**Admin & Teacher:**
```tsx
<div className="lg:pl-64"> {/* ou lg:pl-[72px] se collapsed */}
  <header className="h-16 px-4 lg:px-6">...</header>
  <main className="p-4 lg:p-6">...</main>
</div>
```

**Student:**
```tsx
<div className="min-h-screen pb-20"> {/* pb-20 para bottom nav */}
  <header className="h-14 px-4">...</header>
  <main className="p-4 lg:p-6">...</main> {/* CORRIGIDO */}
  <nav className="fixed bottom-0">...</nav>
</div>
```

**Diferenças:**
- Admin/Teacher: sidebar + header h-16
- Student: bottom nav + header h-14 + pb-20

---

### 3.2 Dialogs & Sheets

**Valores:**
- `DialogContent` e `SheetContent`: `p-6`
- Formulários internos: usar `space-y-4` entre campos
- `FormItem`: `space-y-2` (label → input)

**✅ EXEMPLO:**
```tsx
<Dialog>
  <DialogContent> {/* já tem p-6 */}
    <DialogHeader>
      <DialogTitle>Novo Aluno</DialogTitle>
    </DialogHeader>
    
    <form className="space-y-4"> {/* espaço entre campos */}
      <FormField>
        <FormItem> {/* space-y-2 automático */}
          <FormLabel>Nome</FormLabel>
          <FormControl>
            <Input />
          </FormControl>
        </FormItem>
      </FormField>
    </form>
  </DialogContent>
</Dialog>
```

---

## 📊 4. HIERARQUIA VISUAL

### 4.1 Tipografia de Títulos

```tsx
// Página principal
<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
<p className="text-muted-foreground mt-1">Bem-vindo de volta</p>

// Seção dentro da página
<h2 className="text-lg font-semibold">Resumo Financeiro</h2>

// Card
<CardTitle>Alunos Ativos</CardTitle> {/* text-2xl font-semibold */}
<CardDescription>125 alunos matriculados</CardDescription> {/* text-sm text-muted-foreground */}
```

### 4.2 Espaçamentos Verticais

**Entre seções da mesma página:**
```tsx
<div className="space-y-6">
  <section>...</section>
  <section>...</section>
</div>
```

**Entre cards lado a lado:**
```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

**Entre elementos de formulário:**
```tsx
<form className="space-y-4">
  <FormField>...</FormField>
  <FormField>...</FormField>
</form>
```

---

## ✅ 5. CHECKLIST DE CONSISTÊNCIA

Antes de fazer commit, verificar:

- [ ] Container principal usa `p-4 lg:p-6`
- [ ] Tabelas usam `<TableHead>` e `<TableCell>` (não `<th>` / `<td>` manuais)
- [ ] Empty states usam `py-10`
- [ ] Botões usam `size` variants (não classes manuais `h-*`)
- [ ] Inputs têm `text-sm` (não `text-base`)
- [ ] Cards dentro de páginas não têm padding duplicado
- [ ] Dialogs/Sheets mantêm `p-6` consistente
- [ ] Formulários usam `space-y-4` entre campos

---

## 🚀 6. COMPONENTES UTILITÁRIOS

### PageContainer
```tsx
import { PageContainer } from "@/components/ui/page-container"

<PageContainer>
  {/* conteúdo da página */}
</PageContainer>

// Com largura máxima
<PageContainer constrained maxWidth="6xl">
  {/* conteúdo limitado */}
</PageContainer>
```

### EmptyState
```tsx
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"

<EmptyState
  icon={Users}
  title="Nenhum aluno encontrado"
  message="Tente ajustar os filtros ou adicionar um novo aluno"
  size="default"
/>
```

---

## 📝 7. MIGRATION GUIDE

### Como migrar páginas antigas

**ANTES:**
```tsx
<main className="px-4 py-6">
  <div className="text-center py-12 text-muted-foreground">
    Nenhum resultado
  </div>
</main>
```

**DEPOIS:**
```tsx
<PageContainer>
  <EmptyState
    title="Nenhum resultado"
    size="default"
  />
</PageContainer>
```

---

## 🎯 PRIORIDADE DE REFATORAÇÃO

### 🔴 Crítico (Fazer Agora)
1. ✅ Corrigir `StudentLayout` para usar `p-4 lg:p-6`
2. ✅ Padronizar `Input` para `text-sm` (remover `text-base`)

### 🟡 Importante (Próxima Sprint)
3. Migrar `<th>` / `<td>` manuais para `TableHead` / `TableCell`
4. Substituir empty states por `<EmptyState>`

### 🟢 Desejável (Backlog)
5. Adicionar ESLint rule para detectar `className="h-*"` em `<Button>`
6. Criar codemod para migrar tabelas automaticamente

---

**Última Atualização:** 28 de Janeiro de 2026  
**Mantido por:** Equipe de Desenvolvimento
