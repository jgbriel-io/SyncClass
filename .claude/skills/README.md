# Skills — SyncClass

Skills de steering por domínio para Claude Code. Cada skill tem frontmatter `name:` + `description:` para auto-invocação.

## Skills do Projeto

| Arquivo | Name | Quando usar |
|---------|------|-------------|
| `tcc-writing.md` | `syncclass-tcc` | Escrever/revisar capítulos TCC (normas ABNT/FEPI, voz impessoal, tradução código→texto) |
| `code.md` | `syncclass-code` | Implementar componentes, hooks, páginas, integrações Supabase |
| `database.md` | `syncclass-database` | Migrations, schema, RLS policies, geração de tipos TypeScript |
| `architecture.md` | `syncclass-architecture` | Arquitetura de features, refatoração de camadas, otimização de queries |

## Skills Globais Relacionadas

Em `~/.claude/skills/tcc/` — processo iterativo de drafting:
- `tcc-fragmentos` — captura matéria-prima bruta antes de escrever
- `tcc-rascunho` — molda fragmentos em seção ABNT, parágrafo a parágrafo
- `tcc-revisao-impessoal` — varredura final: 1ª pessoa, clichês, informalidade

## Segurança

Coberta pelo `CLAUDE.md` global (`~/.claude/CLAUDE.md`). Não duplicada aqui.

## Manutenção

Skills versionadas junto ao projeto. Atualizar quando stack ou normas mudarem.
