# Git

Workflow, convenções de commit, branches e histórico.

**Para quem:** Devs que precisam entender workflow Git, criar commits, branches ou revisar histórico.

## Índice

- [Quando usar](#quando-usar)
- [Stack](#stack)
- [Documentação detalhada](#documentação-detalhada)
- [Histórico](#histórico)
- [Ver também](#ver-também)

## Quando usar

**Use quando:**

- Criar commits (sempre seguir Conventional Commits)
- Criar branches (sempre prefixo descritivo)
- Revisar histórico de commits
- Entender workflow de desenvolvimento

**Não use quando:**

- Procurar sprints implementadas → [Sprints](../sprints/README.md)
- Procurar decisões arquiteturais → [Architecture Decisions](../architecture/decisions.md)

## Stack

**Modelo:** Feature branch + squash merge

**Branches principais:**

- `main` — produção (sempre estável)
- `homolog` — homologação (deprecated, migrado para `main`)

**Proteções:**

- `main` protegida (não aceita push direto)
- Require PR approval (1 aprovação mínima)
- Require status checks (CI deve passar)

**Convenções:**

- Conventional Commits obrigatório
- Branches com prefixo de tipo (`feat/`, `fix/`, `refactor/`)
- Squash merge (1 commit por feature)

## Documentação detalhada

### [Workflow](./workflow.md)

Feature branch, code review e merge strategy.

**Conteúdo:**

- Feature branch (criar, desenvolver, push, PR, merge, cleanup)
- Code review (checklist de arquitetura, qualidade, segurança, performance, UI/UX, TypeScript)
- Merge strategy (squash merge vs merge commit vs rebase)
- Hotfix (bugs críticos em produção)

### [Convenções](./conventions.md)

Conventional Commits, nomenclatura de branches e boas práticas.

**Conteúdo:**

- Conventional Commits (types, scopes, subject, body, footer)
- Nomenclatura de branches (types, description)
- Boas práticas (commits pequenos, atômicos, descritivos)
- Anti-patterns (commits genéricos, gigantes, código comentado, console.log, TODO)

## Histórico

**Arquivos:**

- `commits-current.txt` — commits da branch `main` atual
- `commits-old-homolog.txt` — commits da branch `homolog` (deprecated)

**Gerar histórico:**

```bash
# Commits da main
git log --oneline --no-merges > docs/git/commits-current.txt

# Commits com data e autor
git log --pretty=format:"%h - %an, %ar : %s" --no-merges > docs/git/commits-current.txt

# Commits de um período
git log --since="2024-01-01" --until="2024-12-31" --oneline --no-merges > docs/git/commits-2024.txt
```

**Estatísticas:**

```bash
# Total de commits
git rev-list --count HEAD

# Commits por autor
git shortlog -sn --no-merges

# Arquivos mais modificados
git log --pretty=format: --name-only --no-merges | sort | uniq -c | sort -rg | head -20

# Linhas adicionadas/removidas
git log --shortstat --no-merges | grep "files changed" | awk '{files+=$1; inserted+=$4; deleted+=$6} END {print "Files changed:", files, "Lines inserted:", inserted, "Lines deleted:", deleted}'
```

## Ver também

- [Sprints](../sprints/README.md) — Histórico de sprints implementadas
- [Architecture Decisions](../architecture/decisions.md) — Decisões arquiteturais
- [Backend Bugs](../backend/bugs.md) — Bugs identificados e corrigidos
