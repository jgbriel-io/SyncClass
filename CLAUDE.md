# SyncClass — Claude Code

SaaS para gestão de professores autônomos de inglês.
TCC — Engenharia de Software, FEPI, 8º período.

## Contexto do Projeto

- **H1:** SaaS funcional desenvolvido solo em ~3 meses com IA como aceleradora
- **H2:** Supabase reduz ≥60% do esforço backend vs stack tradicional
- **H3:** IA generativa acelera ≥3× tarefas delimitadas (scaffolding, migrations SQL, auditoria de segurança)
- **Roles:** `admin` (visão global) | `teacher` (próprios alunos/aulas/cobranças) | `student` (próprias infos)

## Stack

| Camada    | Tecnologia                                                  |
| --------- | ----------------------------------------------------------- |
| UI        | React 18.3 + TypeScript 5.8 + Vite 5.4                      |
| Estilo    | Tailwind 3.4 + shadcn/ui (Radix UI)                         |
| Estado    | TanStack Query v5 (server state) + React Context (UI state) |
| Forms     | React Hook Form 7 + Zod 3                                   |
| Tabelas   | TanStack Table 8                                            |
| Backend   | Supabase 2.90 (auth, db, realtime, storage)                 |
| Animações | Framer Motion 12                                            |
| Charts    | Recharts 2                                                  |

## Comandos

```bash
npm run dev          # dev server (Vite)
npm run build        # build produção
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run check        # lint + type-check (pré-commit)
npm run test         # vitest run (once)
npm run test:watch   # vitest (watch)
```

## Estrutura de Pastas

```
src/
├── pages/
│   ├── admin/       # Rotas admin
│   ├── teacher/     # Rotas teacher
│   └── student/     # Rotas student
├── components/
│   ├── activities/  # Atividades e correções
│   ├── admin/       # Sheets e views do admin
│   ├── auth/        # Guards, dialogs de senha
│   ├── classes/     # Aulas e pacotes
│   ├── dashboard/   # Dashboard do professor
│   ├── filters/     # Filtros de query (Activities, Classes, Financial)
│   ├── financial/   # UI de pagamentos
│   ├── layout/      # Wrappers de layout de página
│   ├── overview/    # Cards de resumo
│   ├── student/     # Views do aluno
│   ├── students/    # Listagem/tabela de alunos
│   ├── teachers/    # Listagem/tabela de professores
│   ├── users/       # Gestão de usuários
│   └── ui/          # Primitivos shadcn/ui (não editar)
├── hooks/           # Custom hooks + *Service.ts
├── contexts/        # React contexts (auth, UI state)
├── content/         # Strings de UI por domínio
├── integrations/
│   └── supabase/    # Client Supabase + tipos gerados
├── lib/
│   ├── design-tokens/  # Cores, tamanhos
│   ├── security/       # Utilitários de auth
│   ├── utils/          # Helpers (date, format, cn())
│   └── validation/     # Schemas Zod
├── styles/          # CSS global
└── test/            # Utilitários de teste
supabase/            # Migrations e RLS policies
```

## Padrões de Código

### Service Hooks (`src/hooks/*Service.ts`)

Toda integração com Supabase vive em `src/hooks/*Service.ts`. Nunca em `src/lib/services/`.

```ts
// Padrão: useQueryData + useMutation com TanStack Query
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    },
  });
}
```

### Strings de UI (`src/content/{dominio}.ts`)

**Nunca** hardcode strings de UI. Sempre em `src/content/`:

```ts
// src/content/students.ts
export const studentsContent = {
  title: "Alunos",
  emptyState: "Nenhum aluno cadastrado.",
};
```

### Formulários

Formulários são **Dialogs/Sheets** — não criar rotas separadas para forms.
Usar `react-hook-form` + Zod. Validação Zod no `src/lib/validation/`.

### Componentes

- Reutilizar primitivos de `src/components/ui/` (shadcn/ui)
- Props explícitas com tipos TypeScript — sem `any`
- `cn()` do `src/lib/utils/` para classes condicionais

### Real-time Supabase

Sempre limpar subscriptions no cleanup:

```ts
useEffect(() => {
  const channel = supabase.channel('room').on(...).subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

## Convenções Críticas

- TypeScript `strict: true` — **sem `any` explícito**
- `is_admin()` RLS function **deve** ter `SECURITY DEFINER`
- Strings UI **sempre** em `src/content/{dominio}.ts`
- Services **sempre** em `src/hooks/*Service.ts`
- Formulários são Dialogs/Modals — **não criar rotas separadas**
- Subscriptions real-time: **sempre** limpar no cleanup

## Supabase / Database

- Migrations em `supabase/migrations/` — uma migration por mudança
- RLS policies obrigatórias em todas as tabelas com dados de usuário
- Após mudança de schema: rodar `supabase gen types typescript` e commitar os tipos atualizados em `src/integrations/supabase/types.ts`
- Nunca consultar dados sem RLS habilitado em produção

## Regras de Edição

- Mudanças mínimas e precisas — não reescrever código que funciona
- Reutilizar hooks/componentes existentes antes de criar novos
- Seguir padrões existentes no projeto
- Não introduzir novas bibliotecas sem justificativa explícita
- Nunca criar arquivos `.md` sem solicitação explícita
- Sem comentários que só repetem o código — comentar só o "porquê" não óbvio

## Skills

### Projeto (`.claude/skills/`)

| Skill          | Quando usar                                                        |
| -------------- | ------------------------------------------------------------------ |
| `architecture` | Arquitetura de features, decisão de camadas, otimização de queries |
| `code`         | Implementar componentes, hooks, páginas, integrações Supabase      |
| `database`     | Migrations, schema, RLS policies, geração de tipos                 |
| `tcc-writing`  | Escrever/revisar capítulos TCC (normas ABNT/FEPI, voz impessoal)   |

### Globais (`~/.claude/skills/tcc/`)

| Skill                    | Quando usar                                           |
| ------------------------ | ----------------------------------------------------- |
| `tcc-fragmentos`         | Capturar matéria-prima antes de escrever              |
| `tcc-rascunho`           | Moldar fragmentos em seção ABNT parágrafo a parágrafo |
| `tcc-revisao-impessoal`  | Varredura final: 1ª pessoa, clichês, informalidade    |
| `tcc-orientador` (agent) | Feedback acadêmico severo — argumento e evidência     |
