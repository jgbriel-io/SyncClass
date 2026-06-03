> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo detalha a stack tecnológica, estrutura de pastas,
padrões de código (separação de responsabilidades, design tokens,
centralização de strings e query keys), os 6 módulos implementados e métricas
do projeto (~50.467 linhas, ~184 componentes, 70 migrations).

## 6.1 Stack Tecnológica

A stack foi escolhida priorizando:

- **Produtividade:** Supabase elimina backend tradicional; shadcn/ui elimina
  design system do zero.
- **Tipagem:** TypeScript _end-to-end_ (tipos gerados do banco via `supabase gen
types`).
- **Qualidade:** TanStack Query para cache e estado de servidor; Zod para
  validação.

## 6.2 Estrutura de Pastas

```
src/
├── components/        # ~184 componentes React
│   ├── ui/            # shadcn/ui + componentes base customizados
│   ├── students/      # Domínio: alunos
│   ├── classes/       # Domínio: aulas
│   ├── financial/     # Domínio: financeiro
│   ├── activities/    # Domínio: atividades
│   ├── admin/         # Componentes exclusivos do admin
│   ├── layout/        # Shells por role (AdminShell, TeacherShell, StudentShell)
│   ├── filters/       # Filtros por módulo
│   ├── dashboard/     # Cards e gráficos do dashboard
│   └── auth/          # AuthRedirect, ProtectedRoute, ChangePasswordDialog
├── hooks/             # 38 hooks customizados + 7 arquivos de teste (planos, sem subpastas)
├── pages/             # Páginas por role (admin/, teacher/, student/)
├── contexts/          # AuthContext
├── content/           # 18 arquivos de strings UI centralizadas (Sprint 12-15)
│   ├── common.ts      # Textos compartilhados (actions, errors, status)
│   ├── students.ts    # Módulo de alunos
│   ├── financial.ts   # Módulo financeiro
│   ├── classes.ts     # Módulo de aulas
│   ├── activities.ts  # Módulo de atividades
│   └── index.ts       # Barrel export
├── integrations/
│   └── supabase/      # client.ts, types gerados, env.ts
└── lib/
    ├── design-tokens/ # typography(), stack(), iconSize()
    ├── utils/         # formatters, patterns, errorMapper, sanitize, timezone
    ├── validation/    # schemas Zod
    └── security/      # errorHandler
supabase/
├── migrations/        # 70 migrations SQL
└── functions/         # 9 Edge Functions (Deno/TypeScript)
```

> 🖼️ **Figura:** Estrutura de pastas formatada

**Evolução da Estrutura:**

- **Sprint 8:** Separação de responsabilidades — nenhum componente chama
  Supabase diretamente; toda integração via hooks.
- **Sprint 9:** Split de arquivos grandes — hooks de 250+ linhas divididos
  em arquivos menores e mais focados.
- **Sprint 10:** Centralização de query keys em `src/hooks/queryKeys.ts`
  (`QK.*`) — elimina strings literais duplicadas em `queryKey` e
  `invalidateQueries`.
- **Sprint 12-15:** Centralização de strings UI em `src/content/`
  (preparação para i18n).

## 6.3 Padrões de Código

### 6.3.1 Separação de Responsabilidades

```
Components → Hooks → Supabase SDK → PostgreSQL
```

- **Components:** Apenas UI, sem lógica de negócio.
- **Hooks:** TanStack Query para dados, mutations para escrita.
- **Supabase SDK:** Chamadas ao banco, nunca em componentes.

### 6.3.2 Exemplo — Hook de Dados

```ts
// src/hooks/useStudents.ts
export const useStudents = () => {
  return useQuery({
    queryKey: [QK.STUDENTS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, email, status, pay_day, hourly_rate")
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};
```

```ts
// src/hooks/queryKeys.ts — fonte única de query keys (Sprint 10)
export const QK = {
  STUDENTS: "students",
  STUDENTS_PAGINATED: "students_paginated",
  TEACHERS: "teachers",
  CLASS_LOGS: "class_logs",
  FINANCIAL_RECORDS: "financial_records",
  // ...
};
```

### 6.3.3 Design Tokens

Sistema de tokens para consistência visual:

```ts
<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

### 6.3.4 Centralização de Strings (Sprint 12-15)

Todos os textos de UI foram centralizados em `src/content/` para facilitar
manutenção e preparar i18n:

```tsx
// Antes (Sprint 1-11)
<Button>Salvar</Button>;
toast.success("Aluno criado com sucesso!");

// Depois (Sprint 12-15)
import { common, students } from "@/content";
<Button>{common.actions.save}</Button>;
toast.success(students.formDialog.toasts.success);
```

**Estrutura de Content:**

- 17 arquivos por domínio (`common.ts`, `students.ts`, `financial.ts`, etc.)
- 100% dos textos de UI centralizados
- Estrutura pronta para adicionar inglês/espanhol

## 6.4 Módulos Implementados

### 6.4.1 Módulo de Alunos

- CRUD completo com _soft delete_ e restauração.
- Filtros por status, professor e aniversariantes.
- Paginação _server-side_.
- Suporte a alunos estrangeiros (país, telefone internacional).

> 🖼️ **Print:** Tela de listagem de alunos

### 6.4.2 Módulo de Aulas

- Registro individual e em pacote.
- Controle de presença (presente/faltou/pendente).
- Avaliação pós-aula (nota, feedback, observações).
- Validação de sobreposição de horários.

> 🖼️ **Print:** Tela de registro de aula / pacote de aulas

### 6.4.3 Módulo Financeiro

- Cobranças individuais e por pacote.
- Status: pendente → pago / cancelado / abonado / extornado.
- Upload e aprovação de comprovante.
- QR Code PIX para pagamento pelo aluno.
- Idempotência via `idempotency_keys`.

> 🖼️ **Print:** Tela financeira com status de cobranças

### 6.4.4 Módulo de Atividades

- Criação com prazo, arquivo e descrição.
- Entrega pelo aluno com arquivo de resposta.
- Correção com nota, feedback e arquivo de correção.
- Status: pendente → enviada → entregue → corrigida / atrasada.

> 🖼️ **Print:** Tela de atividades

### 6.4.5 Portal do Aluno

- Histórico de aulas com cards.
- Extrato financeiro unificado.
- Entrega de atividades.
- Pagamento via PIX com QR Code.
- Exportação de dados pessoais (LGPD).

> 🖼️ **Print:** Portal do aluno (mobile)

### 6.4.6 Dashboard

- Métricas: total de alunos, aulas do mês, receita, pendências.
- Gráfico de crescimento de alunos (filtro 3/6/12 meses).
- Próximos pagamentos e aniversariantes do mês.
- Aulas do dia.

> 🖼️ **Print:** Dashboard do professor

## 6.5 Números do Projeto

| **Métrica**              | **Valor**                     |
| ------------------------ | ----------------------------- |
| Total de arquivos (src)  | ~358                          |
| Linhas de código (src)   | ~50.467                       |
| Componentes React        | ~184                          |
| Hooks customizados       | 45 arquivos em `src/hooks/`   |
| Arquivos de content      | 18 (strings UI centralizadas) |
| Migrations SQL           | 70                            |
| Edge Functions           | 9                             |
| Commits (repo atual)     | 60+                           |
| Tempo de desenvolvimento | ~4 meses (jan–mai 2026)       |

**Evolução do Projeto:**

- **Jan-Fev (Sprints 1-7):** MVP completo + hardening de segurança
- **Mar-Abr (Sprints 8-11):** Separação de responsabilidades, split de arquivos,
  centralização de query keys, fix de timezone
- **Mai (Sprints 12-27):** Centralização de strings UI, segurança, qualidade
  e auditoria final

---

## Assets Necessários

- [ ] 🖼️ Print: Tela de listagem de alunos
- [ ] 🖼️ Print: Tela de registro de aula
- [ ] 🖼️ Print: Tela financeira
- [ ] 🖼️ Print: Tela de atividades
- [ ] 🖼️ Print: Portal do aluno (mobile)
- [ ] 🖼️ Print: Dashboard do professor
- [ ] 🖼️ Print: Tela admin — visão geral
- [ ] 🖼️ Figura: Estrutura de pastas formatada

---

## Referências cruzadas

- **Arquitetura:** Ver [docs/architecture/overview.md](../architecture/overview.md)
  para detalhes da separação de responsabilidades
- **Frontend:** Ver [docs/frontend/overview.md](../frontend/overview.md) para
  estrutura completa de componentes e hooks
- **Design Tokens:** Ver [docs/frontend/design-tokens.md](../frontend/design-tokens.md)
  para sistema de tokens
- **Backend:** Ver [docs/backend/overview.md](../backend/overview.md) para Edge
  Functions e RPCs
- **Database:** Ver [docs/database/migrations.md](../database/migrations.md) para
  histórico de 70 migrations
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md) para evolução
  do projeto (31 sprints)
