> **Status:** 🟡 Versão Acadêmica
>
> **Última Atualização:** 21/05/2026

**Resumo:** Este capítulo detalha a stack tecnológica, estrutura de pastas (391
arquivos), padrões de código (separação de responsabilidades, design tokens,
centralização de strings), os 6 módulos implementados e métricas do projeto
(~46.400 linhas, 126 componentes, 25 migrations).

## 6.1 Stack Tecnológica

A stack foi escolhida priorizando:

- **Produtividade:** Supabase elimina backend tradicional; shadcn/ui elimina
  design system do zero.
- **Tipagem:** TypeScript _end-to-end_ (tipos gerados do banco via `supabase gen
types`).
- **Qualidade:** TanStack Query para cache e estado de servidor; Zod para
  validação.

## 6.2 Estrutura de Pastas

A estrutura do projeto foi organizada em 391 arquivos, distribuídos em:

- **`src/components/`:** 126 componentes React organizados por domínio (ui,
  students, classes, financial, activities, admin, layout, filters, auth).
- **`src/hooks/`:** Hooks organizados por domínio (Sprint 8-9).
- **`src/content/`:** Centralização de strings UI (Sprint 12-15).
- **`src/lib/`:** Design tokens, query builders, utils, validation, security.
- **`supabase/`:** 25 migrations SQL + 5 Edge Functions (Deno/TypeScript).

> 🖼️ **Figura:** Estrutura de pastas formatada

**Evolução da Estrutura:**

- **Sprint 8:** Separação de hooks por domínio.
- **Sprint 9:** Split de arquivos grandes (250 linhas → 50 linhas).
- **Sprint 10:** Criação de query builders para eliminar duplicação.
- **Sprint 12-15:** Centralização de strings UI (preparação para i18n).

## 6.3 Padrões de Código

### 6.3.1 Separação de Responsabilidades

```
Components → Hooks → Supabase SDK → PostgreSQL
```

- **Components:** Apenas UI, sem lógica de negócio.
- **Hooks:** TanStack Query para dados, mutations para escrita.
- **Supabase SDK:** Chamadas ao banco, nunca em componentes.

### 6.3.2 Design Tokens

Sistema de tokens para consistência visual:

```ts
<h1 className={typography('H1')}>Título</h1>
<div className={stack('DEFAULT')}>...</div>
<Icon className={iconSize('SM')} />
```

### 6.3.3 Centralização de Strings (Sprint 12-15)

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

- 13 arquivos por domínio
- 860 linhas de strings centralizadas
- ~470 strings hardcoded removidas
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

> 🖼️ **Print:** Portal do aluno (mobile)

### 6.4.6 Dashboard

- Métricas: total de alunos, aulas do mês, receita, pendências.
- Gráfico de crescimento de alunos (filtro 3/6/12 meses).
- Próximos pagamentos e aniversariantes do mês.
- Aulas do dia.

> 🖼️ **Print:** Dashboard do professor

## 6.5 Números do Projeto

| **Métrica**                  | **Valor**                           |
| ---------------------------- | ----------------------------------- |
| Total de arquivos            | 391                                 |
| Linhas de código             | ~46.400                             |
| Componentes React            | 126                                 |
| Hooks customizados           | 24 arquivos organizados por domínio |
| Query builders               | 22 funções reutilizáveis            |
| Arquivos de content          | 13 (860 linhas)                     |
| Migrations SQL               | 25                                  |
| Edge Functions               | 5                                   |
| Commits (histórico completo) | ~276                                |
| Tempo de desenvolvimento     | ~4 meses (jan–mai 2026)             |

**Evolução do Projeto:**

- **Jan-Fev (Sprints 1-7):** MVP completo + hardening de segurança
- **Mar-Abr (Sprints 8-11):** Refatorações arquiteturais
- **Mai (Sprints 12-15):** Centralização de strings UI

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
- **Patterns:** Ver [docs/architecture/patterns.md](../architecture/patterns.md)
  para design patterns aplicados
- **Frontend:** Ver [docs/frontend/overview.md](../frontend/overview.md) para
  estrutura completa de componentes e hooks
- **Design Tokens:** Ver [docs/frontend/design-tokens.md](../frontend/design-tokens.md)
  para sistema de tokens (129 testes)
- **Content:** Ver [docs/frontend/content.md](../frontend/content.md) para
  centralização de strings (900+ strings)
- **Backend:** Ver [docs/backend/overview.md](../backend/overview.md) para Edge
  Functions e RPCs
- **Database:** Ver [docs/database/migrations.md](../database/migrations.md) para
  histórico de 25 migrations
- **Sprints:** Ver [docs/sprints/README.md](../sprints/README.md) para evolução
  do projeto (16 sprints)
