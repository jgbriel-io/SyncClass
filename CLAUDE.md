# SyncClass — Claude Code

Plataforma SaaS para gestão de professores autônomos de inglês. TCC — Engenharia de Software, FEPI, 8º período.

## Projeto

- **Hipóteses:** H1 (SaaS solo em ~3 meses com IA) | H2 (Supabase ≥60% menos esforço backend) | H3 (unificação reduz tarefas manuais)
- **Stack:** React 18 + TypeScript 5.8 + Vite 5.4 + Tailwind + shadcn/ui + Supabase + TanStack Query v5
- **Roles:** `admin` (visão global) | `teacher` (próprios alunos/aulas/cobranças) | `student` (próprias infos)

## Regras de Edição

- Mudanças mínimas e precisas — não reescrever código que funciona
- Reutilizar hooks/componentes existentes antes de criar novos
- Seguir padrões existentes no projeto
- Nunca criar arquivos `.md` sem solicitação explícita
- Não introduzir novas bibliotecas sem justificativa

## Convenções Críticas

- Strings UI **nunca hardcoded** — sempre em `src/content/{dominio}.ts`
- Services em `src/hooks/*Service.ts` (não `src/lib/services/`)
- Formulários são Dialogs/Modals — não criar rotas separadas
- `is_admin()` DEVE ter `SECURITY DEFINER`
- Subscriptions real-time: limpar no cleanup (`supabase.removeChannel(channel)`)
- TypeScript `strict: true` — sem `any` explícito

## Skills do Projeto

| Skill | Quando usar |
|-------|-------------|
| `syncclass-architecture` | Arquitetura de features, refatora camadas, otimiza queries |
| `syncclass-code` | Implementar componentes, hooks, páginas, integrações Supabase |
| `syncclass-database` | Migrations, schema, RLS policies, geração de tipos |
| `syncclass-tcc` | Escrever/revisar capítulos TCC (normas ABNT/FEPI, voz impessoal) |

## Skills Globais Relacionadas

Em `~/.claude/skills/tcc/`:
- `tcc-fragmentos` — captura matéria-prima antes de escrever
- `tcc-rascunho` — molda fragmentos em seção ABNT parágrafo a parágrafo
- `tcc-revisao-impessoal` — varredura final: 1ª pessoa, clichês, informalidade
- `tcc-orientador` (agent) — feedback acadêmico severo, argumento e evidência
