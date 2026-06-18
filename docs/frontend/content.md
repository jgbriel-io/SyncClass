# Centralização de Strings

900+ strings centralizadas em 18 arquivos. 100% de centralização (0% hardcoding).

## Índice

- [Quando usar](#quando-usar)
- [Estrutura](#estrutura)
- [Padrão de uso](#padrão-de-uso)
- [Convenções](#convenções)
- [Migração](#migração)
- [Ver também](#ver-também)

## Quando usar

**Use content quando:**

- Adicionar texto UI (labels, buttons, placeholders, toasts)
- Criar mensagens de erro/sucesso
- Adicionar tooltips, aria-labels
- Preparar para i18n (internacionalização)

**Não use quando:**

- Strings técnicas (nomes de variáveis, chaves de API)
- Logs de debug (console.log)
- Comentários de código

## Estrutura

**Localização:** `src/content/`

**Arquivos (18):**

| Arquivo             | Strings | Conteúdo                                                                  |
| ------------------- | ------- | ------------------------------------------------------------------------- |
| `index.ts`          | —       | Barrel export (re-exporta todos)                                          |
| `common.ts`         | 150+    | Strings genéricas (buttons, tooltips, messages)                           |
| `auth.ts`           | 40+     | Autenticação (login, logout, reset password)                              |
| `layout.ts`         | 30+     | Layout/shells (sidebar, header, footer)                                   |
| `dashboard.ts`      | 50+     | Dashboard (cards, metrics, charts)                                        |
| `activities.ts`     | 100+    | Atividades (form, list, detail, correction)                               |
| `classes.ts`        | 60+     | Aulas (form, list, detail, attendance)                                    |
| `financial.ts`      | 80+     | Financeiro (form, list, detail, refundDialog, pixPaymentDialog, checkout) |
| `students.ts`       | 60+     | Alunos (form, list, detail)                                               |
| `teachers.ts`       | 40+     | Professores (form, list, detail)                                          |
| `users.ts`          | 80+     | Usuários (form, list, detail, roles)                                      |
| `overview.ts`       | 40+     | Visões gerais (stats, summaries)                                          |
| `student-portal.ts` | 100+    | Portal do aluno (home, activities, financial)                             |
| `validation.ts`     | 30+     | Validação (Zod error messages)                                            |
| `ui.ts`             | 25+     | UI genérica (empty states, loading, errors)                               |
| `pwa.ts`            | 15+     | PWA (install prompt, offline)                                             |
| `filters.ts`        | 20+     | Filtros (search, sort, status)                                            |
| `policies.ts`       | 20+     | Textos da página de políticas de privacidade                              |

**Total:** 900+ strings centralizadas

## Padrão de uso

### Import

```tsx
// ✅ Import específico
import { students, common } from "@/content";

// ✅ Import múltiplo
import { students, financial, common } from "@/content";

// ❌ Import individual (não usar)
import students from "@/content/students";
```

### Uso

```tsx
// ✅ CORRETO - Centralizado
import { students, common } from "@/content";

export function StudentCard({ student }: StudentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{student.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          {students.labels.email}: {student.email}
        </p>
        <p>
          {students.labels.status}: {student.status}
        </p>
      </CardContent>
      <CardFooter>
        <Button title={common.tooltips.edit}>{common.buttons.edit}</Button>
        <Button variant="destructive" title={common.tooltips.delete}>
          {common.buttons.delete}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ❌ ERRADO - Hardcoded
export function StudentCard({ student }: StudentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{student.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Email: {student.email}</p>
        <p>Status: {student.status}</p>
      </CardContent>
      <CardFooter>
        <Button title="Editar">Editar</Button>
        <Button variant="destructive" title="Excluir">
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Estrutura de arquivo

```ts
// src/content/students.ts
export const students = {
  // Títulos
  title: "Alunos",
  titleSingular: "Aluno",

  // Labels
  labels: {
    name: "Nome",
    email: "Email",
    phone: "Telefone",
    status: "Status",
    payDay: "Dia de pagamento",
    hourlyRate: "Valor/hora",
  },

  // Placeholders
  placeholders: {
    searchStudent: "Buscar aluno...",
    name: "Digite o nome",
    email: "email@exemplo.com",
    phone: "(00) 00000-0000",
  },

  // Buttons
  buttons: {
    create: "Novo Aluno",
    edit: "Editar",
    delete: "Excluir",
    save: "Salvar",
    cancel: "Cancelar",
  },

  // Messages
  messages: {
    createSuccess: "Aluno criado com sucesso!",
    createError: "Erro ao criar aluno.",
    updateSuccess: "Aluno atualizado com sucesso!",
    updateError: "Erro ao atualizar aluno.",
    deleteSuccess: "Aluno excluído com sucesso!",
    deleteError: "Erro ao excluir aluno.",
  },

  // Tooltips
  tooltips: {
    edit: "Editar aluno",
    delete: "Excluir aluno",
    view: "Ver detalhes",
  },

  // Empty states
  emptyState: {
    title: "Nenhum aluno cadastrado",
    description: "Comece criando seu primeiro aluno.",
    action: "Criar primeiro aluno",
  },
} as const;
```

## Convenções

### Nomenclatura

**Padrão:** `content.category.subcategory_descriptor`

**Categorias comuns:**

- `title` / `titleSingular` — títulos de página
- `labels` — labels de campos
- `placeholders` — placeholders de inputs
- `buttons` — textos de botões
- `messages` — toasts de sucesso/erro
- `tooltips` — tooltips de botões/ícones
- `emptyState` — estados vazios
- `validation` — mensagens de validação
- `aria` — aria-labels para acessibilidade

**Exemplos:**

```ts
students.labels.name; // "Nome"
students.placeholders.name; // "Digite o nome"
students.buttons.create; // "Novo Aluno"
students.messages.createSuccess; // "Aluno criado com sucesso!"
students.tooltips.edit; // "Editar aluno"
students.emptyState.title; // "Nenhum aluno cadastrado"
```

### Type Safety

**Sempre usar `as const`:**

```ts
export const students = {
  title: "Alunos",
  labels: {
    name: "Nome",
  },
} as const;
```

**Benefícios:**

- Autocomplete no IDE
- Type checking (erro se chave não existir)
- Refactoring seguro (renomear chave atualiza todos os usos)

### Organização

**Generic vs Domain-specific:**

```ts
// ✅ Generic em common.ts
export const common = {
  buttons: {
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
  },
};

// ✅ Domain-specific em students.ts
export const students = {
  buttons: {
    create: 'Novo Aluno',        // Específico de alunos
    archive: 'Arquivar Aluno',   // Específico de alunos
  },
};

// Uso
<Button>{common.buttons.save}</Button>      // Generic
<Button>{students.buttons.create}</Button>  // Domain-specific
```

## Migração

### Sprint 12-15: Centralização completa

**Sprint 12:** Estrutura `src/content/` criada (13 arquivos, 860 linhas)

**Sprint 13:** Expansão (validation.ts, ui.ts, pwa.ts — 185 novas chaves)

**Sprint 14:** Migração (58 componentes, 190 strings substituídas)

**Sprint 15:** Auditoria final (100% centralização, 0% hardcoding)

### Processo de migração

**Passo 1:** Identificar strings hardcoded

```bash
# Buscar strings hardcoded
grep -r '"[A-Z]' src/components/ | grep -v 'import'
```

**Passo 2:** Adicionar em content

```ts
// src/content/students.ts
export const students = {
  labels: {
    name: "Nome", // ← Nova string
  },
} as const;
```

**Passo 3:** Substituir no componente

```tsx
// Antes
<label>Nome</label>;

// Depois
import { students } from "@/content";
<label>{students.labels.name}</label>;
```

**Passo 4:** Validar

```bash
npm run validate:strings  # Script customizado (se existir)
```

### Strings técnicas (não migrar)

**Não centralizar:**

- Nomes de variáveis: `const userId = '...'`
- Chaves de API: `VITE_SUPABASE_URL`
- Logs de debug: `console.log('Debug: ...')`
- Comentários: `// TODO: ...`
- Regex patterns: `/^[A-Z]/`
- SQL queries: `SELECT * FROM ...`
- Paths: `'/api/users'`

## Ver também

- [Frontend Overview](./overview.md) — Visão geral do frontend
- [Components](./components.md) — Uso de content em componentes
- [Sprint 12](../../sprints/sprint-12-refactor-content-structure-i18n-prep.md) — Criação da estrutura
- [Sprint 13](../../sprints/sprint-13-refactor-centralize-ui-strings.md) — Expansão
- [Sprint 14](../../sprints/sprint-14-refactor-remove-hardcoded-strings.md) — Migração
- [Sprint 15](../../sprints/sprint-15-refactor-final-string-audit.md) — Auditoria final
