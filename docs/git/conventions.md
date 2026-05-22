# Convenções Git

Conventional Commits, nomenclatura de branches e boas práticas.

## Índice

- [Quando usar](#quando-usar)
- [Conventional Commits](#conventional-commits)
- [Nomenclatura de branches](#nomenclatura-de-branches)
- [Boas práticas](#boas-práticas)
- [Anti-patterns](#anti-patterns)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Criar commits (sempre seguir Conventional Commits)
- Criar branches (sempre prefixo descritivo)
- Escrever mensagens de PR/MR

**Não use quando:**

- Commits de merge (GitHub/GitLab gera automaticamente)
- Commits de revert (usar `git revert` que gera mensagem padrão)

## Conventional Commits

**Formato:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Quando usar                                | Exemplo                                                  |
| ---------- | ------------------------------------------ | -------------------------------------------------------- |
| `feat`     | Nova feature                               | `feat(students): add soft delete support`                |
| `fix`      | Correção de bug                            | `fix(auth): prevent infinite recursion in is_admin()`    |
| `refactor` | Refatoração (sem mudança de comportamento) | `refactor(hooks): split useStudents into multiple files` |
| `chore`    | Manutenção (deps, config)                  | `chore(deps): update supabase-js to 2.45.0`              |
| `docs`     | Documentação                               | `docs: refactor documentation structure`                 |
| `test`     | Testes                                     | `test(students): add unit tests for useStudents`         |
| `style`    | Formatação (sem mudança de lógica)         | `style: fix indentation in StudentCard`                  |
| `perf`     | Otimização de performance                  | `perf(students): add index on email column`              |
| `ci`       | CI/CD                                      | `ci: add GitHub Actions workflow`                        |

### Scopes

**Domínios:**

- `students` — alunos
- `financial` — financeiro
- `activities` — atividades
- `classes` — aulas
- `teachers` — professores
- `users` — usuários
- `auth` — autenticação
- `admin` — admin

**Técnicos:**

- `db` — banco de dados
- `ui` — interface
- `hooks` — hooks
- `components` — componentes
- `api` — API/backend

**Infraestrutura:**

- `deps` — dependências
- `config` — configuração
- `ci` — CI/CD
- `deploy` — deploy

### Subject

**Regras:**

- Imperativo ("add" não "added")
- Minúsculo
- Sem ponto final
- Máximo 72 caracteres

**Exemplos:**

```bash
# ✅ CORRETO
git commit -m "feat(students): add soft delete support"
git commit -m "fix(auth): prevent infinite recursion"
git commit -m "refactor(hooks): split large file"

# ❌ ERRADO
git commit -m "feat(students): Added soft delete support."  # Passado + ponto final
git commit -m "Fix bug"  # Sem scope, não descritivo
git commit -m "feat(students): Add soft delete support with deleted_at column and StudentDeleteDialog component"  # Muito longo
```

### Body

**Quando usar:**

- Explicar "por quê" e "o quê", não "como"
- Contexto adicional que não cabe no subject
- Breaking changes

**Formato:**

- Quebrar linhas em ~72 caracteres
- Separar do subject com linha em branco

**Exemplo:**

```bash
git commit -m "feat(students): add soft delete support

Soft delete permite manter histórico de alunos deletados para auditoria.
Alunos deletados não aparecem em queries padrão mas podem ser recuperados.

Implementação:
- Adicionada coluna deleted_at em students
- Criado StudentDeleteDialog com confirmação
- Atualizado useStudents para filtrar deletados por padrão
- Adicionado useDeletedStudents para admin visualizar deletados"
```

### Footer

**Breaking changes:**

```bash
git commit -m "feat(auth)!: change role structure

BREAKING CHANGE: profiles.role agora é enum ('admin', 'teacher', 'student').
Migração necessária para converter strings antigas."
```

**Issues:**

```bash
git commit -m "fix(auth): prevent infinite recursion

Closes #123
Fixes #456"
```

## Nomenclatura de branches

**Formato:** `<type>/<description>`

### Types

| Type          | Quando usar                |
| ------------- | -------------------------- |
| `feat/`       | Nova feature               |
| `fix/`        | Correção de bug            |
| `refactor/`   | Refatoração                |
| `chore/`      | Manutenção                 |
| `docs/`       | Documentação               |
| `test/`       | Testes                     |
| `experiment/` | Experimentos (não mergear) |

### Description

**Regras:**

- Kebab-case (minúsculo, hífens)
- Descritivo (não `feat/fix-bug`)
- Curto (máximo 50 caracteres)
- Sem prefixo de issue (`feat/123-add-feature` → `feat/add-feature`)

**Exemplos:**

```bash
# ✅ CORRETO
git checkout -b feat/student-soft-delete
git checkout -b fix/auth-infinite-recursion
git checkout -b refactor/split-large-files
git checkout -b docs/architecture-organization
git checkout -b chore/update-deps

# ❌ ERRADO
git checkout -b feat/Fix-Bug  # PascalCase
git checkout -b feat/add_feature  # snake_case
git checkout -b feat/123-add-feature  # Prefixo de issue
git checkout -b feat/add-soft-delete-support-for-students-with-deleted-at-column  # Muito longo
```

## Boas práticas

### Commits pequenos e frequentes

**✅ CORRETO:**

```bash
git commit -m "feat(students): add deleted_at column"
git commit -m "feat(students): add StudentDeleteDialog"
git commit -m "feat(students): update useStudents to filter deleted"
git commit -m "docs(students): document soft delete"
```

**❌ ERRADO:**

```bash
git commit -m "feat(students): add soft delete support"
# 1 commit com 500 linhas mudadas em 20 arquivos
```

### Commits atômicos

**Cada commit deve:**

- Fazer uma coisa só
- Deixar código em estado funcional
- Ser revertível sem quebrar outras features

**✅ CORRETO:**

```bash
git commit -m "feat(students): add deleted_at column"
# Apenas migration, código ainda funciona

git commit -m "feat(students): update useStudents to filter deleted"
# Apenas hook, código ainda funciona
```

**❌ ERRADO:**

```bash
git commit -m "feat(students): add deleted_at column"
# Migration + hook + componente + docs
# Se reverter, quebra tudo
```

### Mensagens descritivas

**✅ CORRETO:**

```bash
git commit -m "fix(auth): prevent infinite recursion in is_admin()

is_admin() sem SECURITY DEFINER causa recursão infinita ao consultar
profiles com RLS habilitado. Adicionado SECURITY DEFINER para bypassar RLS."
```

**❌ ERRADO:**

```bash
git commit -m "fix bug"
git commit -m "fix: fix"
git commit -m "wip"
```

### Não commitar código quebrado

**✅ CORRETO:**

```bash
# Cada commit deixa código funcional
git commit -m "feat(students): add deleted_at column"  # Funciona
git commit -m "feat(students): update useStudents"     # Funciona
git commit -m "feat(students): add DeleteDialog"       # Funciona
```

**❌ ERRADO:**

```bash
git commit -m "feat(students): add deleted_at column"  # Funciona
git commit -m "wip: updating hooks"                    # Quebrado
git commit -m "feat(students): finish soft delete"     # Funciona
```

### Não commitar arquivos temporários

**Adicionar ao `.gitignore`:**

```
# Logs
*.log

# Env
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
node_modules/
```

## Anti-patterns

### ❌ Commits genéricos

```bash
git commit -m "fix bug"
git commit -m "update code"
git commit -m "wip"
git commit -m "changes"
```

### ❌ Commits gigantes

```bash
git commit -m "feat: add everything"
# 50 arquivos, 5000 linhas
```

### ❌ Commits com código comentado

```tsx
// const oldFunction = () => { ... }  // ❌ Deletar, não comentar

export const newFunction = () => { ... }
```

### ❌ Commits com console.log

```tsx
console.log("DEBUG:", data); // ❌ Remover antes de commitar
```

### ❌ Commits com TODO

```tsx
// TODO: fix this later  // ❌ Fixar agora ou criar issue
```

### ❌ Branches sem prefixo

```bash
git checkout -b student-soft-delete  # ❌ Sem tipo
git checkout -b feat/student-soft-delete  # ✅ Com tipo
```

### ❌ Branches com nome genérico

```bash
git checkout -b feat/fix  # ❌ Não descritivo
git checkout -b feat/student-soft-delete  # ✅ Descritivo
```

## Ver também

- [Git Overview](./overview.md) — Visão geral do Git
- [Workflow](./workflow.md) — Feature branch e code review
- [Sprints](../sprints/README.md) — Histórico de sprints
