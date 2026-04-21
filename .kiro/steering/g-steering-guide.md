---
inclusion: manual
description: Como criar e manter steering files para este projeto — convenções, front matter e lista dos arquivos existentes
---

# Steering Files — Como Criar e Manter

Arquivos em `.kiro/steering/` que injetam contexto e regras automaticamente nas conversas com o Kiro.

## Convenção de Nomenclatura

```
g-*.md  →  regras genéricas (boas práticas técnicas, reutilizáveis)
p-*.md  →  regras do projeto (contexto e convenções específicas do JLAC)
```

## Front Matter Obrigatório

```yaml
---
inclusion: always          # sempre incluído em todo contexto
description: Descrição curta do que este arquivo cobre
---

---
inclusion: fileMatch       # incluído quando arquivo específico está aberto
fileMatchPattern: ['**/*.tsx', 'src/hooks/**']
description: ...
---

---
inclusion: manual          # só incluído quando referenciado explicitamente no chat
description: ...
---
```

## Quando Usar Cada Tipo

- `always` — contexto do projeto, comportamento, segurança, code review
- `fileMatch` — regras de tecnologia específica (frontend só quando editando `.tsx`, backend só quando editando hooks/supabase)
- `manual` — guias de referência longos, documentação opcional

## Arquivos Existentes

**Projeto (`p-`) — `always`:**
- `p-project-context.md` — stack, roles, estrutura de pastas, design tokens
- `p-architecture.md` — separação de responsabilidades, padrões de código
- `p-behavior.md` — como o assistente deve agir, mapeamento de intenções

**Projeto (`p-`) — `fileMatch`:**
- `p-ui-patterns.md` — design tokens, componentes shadcn, spacing, cores (`**/*.tsx`)

**Genéricos (`g-`) — `always`:**
- `g-senior-security.md` — RLS, isolamento de tenant, validação, dados sensíveis
- `g-code-reviewer.md` — checklist de code review

**Genéricos (`g-`) — `fileMatch`:**
- `g-senior-frontend.md` — boas práticas React/Tailwind (`**/*.tsx`, `**/*.ts`)
- `g-senior-backend.md` — padrões Supabase/hooks (`src/hooks/**`, `supabase/**`)
- `g-react-best-practices.md` — performance React (`**/*.tsx`, `**/*.ts`)
- `g-supabase-postgres-best-practices.md` — Postgres, índices, RLS (`src/integrations/**`, `supabase/**`)

**Projeto (`p-`) — `manual`:**
- `p-tcc-writing-style.md` — tom de voz e estilo de escrita acadêmica para o TCC


**Genéricos (`g-`) — `manual`:**
- `g-steering-guide.md` — este arquivo

## Como Adicionar Novo Steering

1. Identificar se é genérico (`g-`) ou específico do projeto (`p-`)
2. Escolher `inclusion` correto baseado no escopo
3. Adicionar `description` no front matter (obrigatório)
4. Escrever conteúdo denso com exemplos de código reais do projeto
5. Verificar se não duplica algo já existente
6. Atualizar este guia com o novo arquivo
