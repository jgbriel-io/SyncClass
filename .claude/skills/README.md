# Skills — SyncClass

Conjunto de guias de steering adaptados para Claude Code. Cada skill encapsula boas práticas, normas e convenções de um domínio específico.

## Skills Disponíveis

### 1. `tcc-writing.md`
Escrita acadêmica para TCC — normas FEPI/ABNT 2026.

**Use quando:**
- Rascunhar, revisar ou finalizar capítulos (1–10).
- Estruturar seções, citações ou referências.
- Validar tom acadêmico (impessoalidade obrigatória).
- Formatar figuras, tabelas ou glossário técnico.

**Contém:**
- Normas de voz (impessoalidade obrigatória).
- Regras de formatação (margens, fontes, espaçamento).
- Citações, referências, figuras e tabelas.
- Estrutura dos 10 capítulos.
- Checklist pré-entrega.
- **Processo iterativo de drafting** (fragmentos → forma → revisão).

**Complementa-se com skills globais em `~/.claude/skills/tcc/`:**
- `tcc-fragmentos` — captura matéria-prima bruta antes de escrever.
- `tcc-rascunho` — molda fragmentos em seção ABNT, parágrafo a parágrafo.
- `tcc-revisao-impessoal` — varredura final: 1ª pessoa, clichês, informalidade.

---

### 2. `code.md`
Desenvolvimento SyncClass — React + TypeScript + Supabase.

**Use quando:**
- Implementar novo componente, hook ou página.
- Refatorar código existente.
- Adicionar testes (Vitest, Playwright).
- Integrar com Supabase.
- Otimizar performance.

**Contém:**
- Stack técnica (versões).
- Estrutura de pastas.
- Convenções: strings, componentes, validação, comentários.
- Data fetching (TanStack Query).
- Segurança (RLS, auth, validação).
- Testes unitários e E2E.
- Deploy CI/CD.

---

### 3. `database.md`
Schema management — Supabase, migrations, type generation.

**Use quando:**
- Criar ou modificar tabela/coluna.
- Criar índice, constraint ou RLS policy.
- Gerar tipos TypeScript.
- Resolver conflitos de schema.
- Data não aparecendo na UI.

**Contém:**
- Workflow: inspecionar → criar migration → push → gerar tipos → sincronizar.
- Schema atual (11 tabelas principais).
- RLS patterns.
- Type generation troubleshooting.

---

### 4. `architecture.md`
Arquitetura SyncClass — camadas, padrões, design decisions.

**Use quando:**
- Decidir arquitetura de nova feature.
- Refatorar componente que viola camadas.
- Otimizar query com N+1.
- Implementar novo padrão de design.

**Contém:**
- Tipo de arquitetura (Layered com BFF implícito via Supabase).
- 6 camadas do frontend (Pages → Hooks → Services → Lib).
- Design patterns implementados (Singleton, Strategy, Repository, etc.).
- Performance rules (N+1, agregação, filtro no banco).
- Convenções de nomes.
- Decisões arquiteturais justificadas.

---

### 5. `security.md`
Steering de segurança — operações destrutivas, sistema, credenciais.

**Use quando:**
- Antes de executar comandos destrutivos (rm, del, etc.).
- Modificar sistema ou variáveis de ambiente.
- Lidar com credenciais ou .env.
- Fazer operações em massa.

**Contém:**
- Checklist de confirmação.
- Operações que SEMPRE precisam confirmação.
- Regras de credenciais (nunca expor).
- Padrão de pergunta antes de agir.

---

## Como Usar

### Dentro de Claude Code

Ao trabalhar, **cite a skill** no seu prompt:

```
Vou escrever o Cap. 3 (Metodologia). Usar skill: tcc-writing.
```

ou

```
Refatorar StudentDialog em subcomponentes. Usar skill: code.
```

### Referência Rápida

- **Escrita TCC?** → `tcc-writing.md`
- **Coding?** → `code.md`
- **Segurança/destrutivo?** → `security.md`

---

## Estrutura de Skill

Cada arquivo contém:

1. **Objetivo** — por que existe.
2. **Normas/Convenções** — regras obrigatórias.
3. **Estrutura** — arquivos, pastas, padrões.
4. **Checklist** — validação antes de finalizar.
5. **Quando Usar** — contextos de aplicação.

---

## Manutenção

- Skills são **versionadas junto ao projeto** (em `.claude/skills/`).
- Atualizar quando normas ou stack mudam.
- Diferente de `CLAUDE.md` (que é estático) — skills são guias dinâmicos.

---

## Próximos Steps

1. Usar `tcc-writing` para finalizar Cap. 2 e começar Cap. 3.
2. Usar `code` para refatoração de componentes grandes.
3. Usar `security` para qualquer operação destrutiva.
