# Workflow Git

Feature branch, code review e merge strategy.

> **Nota:** Este projeto usa commits diretos em `main` (desenvolvimento solo). O fluxo de feature branch abaixo documenta boas práticas para contexto de equipe.

## Índice

- [Quando usar](#quando-usar)
- [Feature branch](#feature-branch)
- [Code review](#code-review)
- [Merge strategy](#merge-strategy)
- [Hotfix](#hotfix)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Desenvolver nova feature
- Corrigir bug
- Fazer refatoração
- Atualizar documentação

**Não use quando:**

- Mudanças triviais (typo em README) — commit direto em `main` se permitido
- Experimentos — criar branch `experiment/` e não mergear

## Feature branch

**Fluxo completo:**

### 1. Criar branch

```bash
# Atualizar main
git checkout main
git pull origin main

# Criar branch
git checkout -b feat/student-soft-delete
```

### 2. Desenvolver

```bash
# Fazer mudanças
# Commits pequenos e frequentes

git add src/hooks/useStudents.ts
git commit -m "feat(students): add soft delete support"

git add src/components/students/StudentDeleteDialog.tsx
git commit -m "feat(students): add delete confirmation dialog"

git add supabase/migrations/22_add_soft_delete.sql
git commit -m "feat(db): add deleted_at column to students"
```

### 3. Push

```bash
# Primeira vez
git push -u origin feat/student-soft-delete

# Próximas vezes
git push
```

### 4. Abrir PR

**Título:** Conventional Commits

```
feat(students): add soft delete support
```

**Descrição:**

```markdown
## O que mudou

- Adicionada coluna `deleted_at` em `students`
- Criado `StudentDeleteDialog` com confirmação
- Atualizado `useStudents` para filtrar deletados

## Como testar

1. Ir para `/admin/students`
2. Clicar em "Excluir" em um aluno
3. Confirmar exclusão
4. Verificar que aluno não aparece mais na lista
5. Verificar no banco que `deleted_at` foi preenchido

## Checklist

- [x] Código testado localmente
- [x] Migrations aplicadas
- [x] Documentação atualizada
- [x] Sem console.log
```

### 5. Code review

**Revisor verifica:**

- Código segue padrões do projeto
- Testes passam
- Sem bugs óbvios
- Documentação atualizada

**Ações:**

- Aprovar → merge
- Solicitar mudanças → dev corrige e push

### 6. Merge

**Squash merge:**

```bash
# GitHub/GitLab faz automaticamente
# Resultado: 1 commit em main com todos os commits da branch
```

**Mensagem de merge:**

```
feat(students): add soft delete support (#123)

- Added deleted_at column to students
- Created StudentDeleteDialog with confirmation
- Updated useStudents to filter deleted records
```

### 7. Cleanup

```bash
# Deletar branch local
git checkout main
git pull origin main
git branch -d feat/student-soft-delete

# Deletar branch remote (GitHub/GitLab faz automaticamente)
git push origin --delete feat/student-soft-delete
```

## Code review

**O que revisar:**

### Arquitetura

- [ ] Componente faz apenas UI? Lógica está em hook?
- [ ] Hook usa TanStack Query para dados do servidor?
- [ ] Supabase chamado apenas em hooks/services?
- [ ] Sem prop drilling?

### Qualidade

- [ ] Componente tem menos de ~150 linhas?
- [ ] Sem ternários aninhados?
- [ ] Nomes descritivos?
- [ ] Sem código morto ou comentado?
- [ ] Sem `console.log`?

### Segurança

- [ ] Inputs validados com Zod?
- [ ] Queries filtram por `teacher_id` ou `student_id`?
- [ ] Sem dados sensíveis em logs?
- [ ] Erros do Supabase tratados?
- [ ] RLS habilitado em novas tabelas?

### Performance

- [ ] Sem barrel imports?
- [ ] Sem objetos/arrays criados inline em props?
- [ ] `useEffect` não usado para data fetching?
- [ ] Subscriptions real-time limpas no cleanup?
- [ ] Paginação em listas grandes?

### UI/UX

- [ ] Cores semânticas (`text-destructive` não `text-red-500`)?
- [ ] Spacing na escala de 4px?
- [ ] Estados de loading, error e empty tratados?
- [ ] Mensagens de erro em português?
- [ ] Design tokens usados?
- [ ] Strings UI centralizadas?

### TypeScript

- [ ] Sem `any` explícito desnecessário?
- [ ] Props tipadas?
- [ ] Tipos do Supabase usados?

**Como revisar:**

```bash
# Checkout da branch
git fetch origin
git checkout feat/student-soft-delete

# Rodar localmente
npm install
npm run dev

# Testar feature
# Verificar código
# Deixar comentários no PR
```

## Merge strategy

**Squash merge (padrão):**

- Todos os commits da branch viram 1 commit em `main`
- Histórico limpo (1 commit por feature)
- Fácil de reverter (revert 1 commit)

**Quando usar:**

- Features completas
- Refatorações
- Fixes

**Merge commit (não usar):**

- Preserva todos os commits da branch
- Histórico poluído
- Difícil de reverter

**Rebase (não usar):**

- Reescreve histórico
- Perigoso em branches compartilhadas

## Hotfix

**Quando:** Bug crítico em produção que não pode esperar próximo release.

**Fluxo:**

```bash
# Criar branch de hotfix
git checkout main
git pull origin main
git checkout -b fix/critical-auth-bug

# Corrigir bug
git add src/hooks/useAuth.ts
git commit -m "fix(auth): prevent infinite recursion in is_admin()"

# Push e abrir PR
git push -u origin fix/critical-auth-bug

# Merge imediato (sem esperar review se crítico)
# Deploy para produção
```

**Diferença de feature branch:**

- Prioridade máxima
- Review acelerado (ou skip se crítico)
- Deploy imediato após merge

## Ver também

- [Git Overview](./overview.md) — Visão geral do Git
- [Conventions](./conventions.md) — Convenções de commit e branch
- [Sprints](../sprints/README.md) — Histórico de sprints
