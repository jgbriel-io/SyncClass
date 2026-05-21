# Sprint 1 — MVP: CRUD Básico & Financeiro

> **Nomenclatura do arquivo:** `sprint-01-mvp-crud-basico-financeiro.md`

**Período:** 19–23 janeiro 2026
**Status:** ✅ Concluída
**Tipo:** MVP
**Prioridade:** 🔴 Alta

## Problem Statement

Início do projeto a partir do zero. Necessidade de estabelecer:
- Schema inicial do banco de dados para suportar gestão de professores, alunos, aulas e cobranças
- CRUD básico de pagamentos e aulas
- Estrutura frontend inicial com React + TypeScript + Vite
- Integração com Supabase (PostgreSQL + Auth)
- Validações de entrada de dados (regex para valores monetários, datas, CPF)
- Integração com API externa para preenchimento automático de endereço

Sem essa base, nenhuma outra funcionalidade poderia ser desenvolvida.

## Requirements

- Schema do banco com tabelas: `profiles`, `students`, `teachers`, `class_logs`, `financial_records`
- CRUD completo de pagamentos: criar, editar, listar, deletar
- CRUD completo de aulas: registrar, editar, listar
- Vinculação entre aulas e cobranças financeiras
- Validação de inputs: valores monetários (R$), datas (DD/MM/YYYY), CPF
- Integração com API IBGE para busca de CEP e preenchimento automático de cidade/estado
- Calculadora de valor de aulas baseada em duração e taxa horária
- Página de professores (estrutura inicial)
- Página de detalhes do aluno (primeira versão)

## Background

**Stack escolhida:**
- Frontend: React 18 + TypeScript 5.8 + Vite 5.4
- Backend: Supabase (PostgreSQL 15 + Auth + Storage)
- UI: Tailwind CSS 3.4 (shadcn/ui será adicionado na Sprint 2)
- Validação: Regex patterns customizados (Zod será adicionado depois)

**Estrutura inicial:**
```
src/
├── pages/           # Páginas principais
├── components/      # Componentes React
├── integrations/
│   └── supabase/    # Cliente Supabase
└── lib/
    └── utils/       # Utilitários e helpers
```

**Convenções estabelecidas:**
- Código em inglês, comentários em português
- Componentes em PascalCase
- Arquivos `.tsx` para componentes React
- Path alias `@/*` → `./src/*`

## Proposed Solution

### Arquitetura do Banco

Schema relacional com 5 tabelas principais:

```sql
profiles (user_id, full_name, role, phone, created_at)
  ↓
teachers (id, user_id, hourly_rate, pix_key, ...)
  ↓
students (id, teacher_id, name, email, pay_day, ...)
  ↓
class_logs (id, student_id, class_date, duration, ...)
financial_records (id, student_id, amount, due_date, status, ...)
```

### Estrutura de Componentes

```
src/
├── pages/
│   ├── Teachers.tsx              # Lista de professores
│   └── StudentDetails.tsx        # Detalhes do aluno
├── components/
│   ├── financial/
│   │   ├── PaymentForm.tsx       # Formulário de pagamento
│   │   ├── PaymentList.tsx       # Lista de cobranças
│   │   └── PaymentCalculator.tsx # Calculadora de valores
│   └── classes/
│       ├── ClassForm.tsx         # Formulário de aula
│       └── ClassList.tsx         # Lista de aulas
└── lib/
    └── utils/
        ├── regex.ts              # Padrões de validação
        └── cep-api.ts            # Integração IBGE
```

### Padrões de Validação

```ts
// lib/utils/regex.ts
export const REGEX_PATTERNS = {
  currency: /^\d+([.,]\d{2})?$/,
  date: /^\d{2}\/\d{2}\/\d{4}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  phone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
};
```

## Task Breakdown

### Task 1: Setup inicial do projeto

- **Objetivo:** Criar estrutura base do projeto React + Vite + Supabase
- **Implementação:**
  - Inicializar projeto com Vite template React-TS
  - Instalar dependências: `@supabase/supabase-js`, `react-router-dom`, `tailwindcss`
  - Configurar Supabase client com variáveis de ambiente
  - Configurar Tailwind CSS
  - Criar estrutura de pastas padrão
- **Arquivos criados:**
  - `vite.config.ts`
  - `tailwind.config.js`
  - `src/integrations/supabase/client.ts`
  - `.env.example`
- **Teste:** `npm run dev` sobe servidor na porta 5173
- **Demo:** Página inicial renderiza sem erros

### Task 2: Schema do banco de dados

- **Objetivo:** Criar tabelas base para suportar gestão de professores, alunos, aulas e financeiro
- **Implementação:**
  - Migration `01_initial_schema.sql` com 5 tabelas principais
  - Tipos ENUM: `user_role`, `payment_status`, `payment_method`
  - Constraints: foreign keys, not null, unique
  - Índices: `idx_students_teacher_id`, `idx_class_logs_student_id`, `idx_financial_student_id`
- **Arquivos criados:**
  - `supabase/migrations/01_initial_schema.sql`
- **Teste:** Migration aplicada sem erros no Supabase Dashboard
- **Demo:** Tabelas visíveis no Supabase Table Editor

### Task 3: CRUD de pagamentos

- **Objetivo:** Implementar criação, edição e listagem de cobranças financeiras
- **Implementação:**
  - Componente `PaymentForm.tsx` com campos: valor, data de vencimento, descrição
  - Componente `PaymentList.tsx` com tabela de cobranças
  - Hook `usePayments()` para buscar dados do Supabase
  - Hook `useCreatePayment()` para inserir novo registro
  - Hook `useUpdatePayment()` para editar registro existente
  - Validação de valor monetário com regex
- **Arquivos criados:**
  - `src/components/financial/PaymentForm.tsx`
  - `src/components/financial/PaymentList.tsx`
  - `src/hooks/usePayments.ts`
- **Teste:** Criar, editar e listar pagamentos funciona sem erros
- **Demo:** Tabela de pagamentos renderiza dados do banco

### Task 4: CRUD de aulas

- **Objetivo:** Implementar registro e listagem de aulas ministradas
- **Implementação:**
  - Componente `ClassForm.tsx` com campos: data, duração, aluno, observações
  - Componente `ClassList.tsx` com tabela de aulas
  - Hook `useClasses()` para buscar aulas do banco
  - Hook `useCreateClass()` para registrar nova aula
  - Vinculação automática com `financial_records` ao criar aula
- **Arquivos criados:**
  - `src/components/classes/ClassForm.tsx`
  - `src/components/classes/ClassList.tsx`
  - `src/hooks/useClasses.ts`
- **Teste:** Registrar aula cria entrada em `class_logs` e `financial_records`
- **Demo:** Tabela de aulas mostra aulas registradas

### Task 5: Validação de inputs com regex

- **Objetivo:** Garantir formato correto de dados antes de enviar ao banco
- **Implementação:**
  - Arquivo `lib/utils/regex.ts` com padrões de validação
  - Validação de valores monetários: `R$ 150,00`
  - Validação de datas: `DD/MM/YYYY`
  - Validação de CPF: `XXX.XXX.XXX-XX`
  - Validação de telefone: `(XX) XXXXX-XXXX`
  - Feedback visual de erro nos inputs
- **Arquivos criados:**
  - `src/lib/utils/regex.ts`
- **Teste:** Inputs rejeitam formatos inválidos
- **Demo:** Mensagens de erro aparecem em tempo real

### Task 6: Integração com API IBGE (CEP)

- **Objetivo:** Preenchimento automático de endereço ao digitar CEP
- **Implementação:**
  - Função `fetchAddressByCEP(cep: string)` que consulta API IBGE
  - Preenchimento automático de: cidade, estado, bairro
  - Debounce de 500ms para evitar requisições excessivas
  - Tratamento de erro para CEP inválido
- **Arquivos criados:**
  - `src/lib/utils/cep-api.ts`
- **Teste:** Digitar CEP válido preenche campos automaticamente
- **Demo:** Input de CEP busca e preenche endereço

### Task 7: Calculadora de valor de aulas

- **Objetivo:** Calcular automaticamente valor a cobrar baseado em duração e taxa horária
- **Implementação:**
  - Componente `PaymentCalculator.tsx`
  - Fórmula: `valor = (duração_em_minutos / 60) * taxa_horária`
  - Atualização em tempo real ao mudar duração ou taxa
  - Formatação de valor em R$
- **Arquivos criados:**
  - `src/components/financial/PaymentCalculator.tsx`
- **Teste:** Mudar duração ou taxa atualiza valor calculado
- **Demo:** Calculadora mostra valor correto formatado

### Task 8: Página de professores

- **Objetivo:** Listar professores cadastrados no sistema
- **Implementação:**
  - Página `Teachers.tsx` com tabela de professores
  - Colunas: nome, email, telefone, taxa horária, ações
  - Hook `useTeachers()` para buscar dados
  - Botão "Adicionar Professor" (formulário será implementado na Sprint 2)
- **Arquivos criados:**
  - `src/pages/Teachers.tsx`
  - `src/hooks/useTeachers.ts`
- **Teste:** Página renderiza lista de professores
- **Demo:** Tabela mostra professores cadastrados

### Task 9: Página de detalhes do aluno

- **Objetivo:** Visualizar informações completas de um aluno
- **Implementação:**
  - Página `StudentDetails.tsx` com seções: dados pessoais, aulas, financeiro
  - Exibição de histórico de aulas
  - Exibição de cobranças pendentes e pagas
  - Cálculo de total devido e total pago
- **Arquivos criados:**
  - `src/pages/StudentDetails.tsx`
- **Teste:** Página carrega dados do aluno corretamente
- **Demo:** Detalhes do aluno renderizam com histórico completo

## Implementation Details

### Migrations Aplicadas

| Migration | Descrição |
|-----------|-----------|
| `01_initial_schema.sql` | Tabelas base: profiles, teachers, students, class_logs, financial_records |

### Componentes Criados

| Componente | Responsabilidade | Arquivo |
|------------|------------------|---------|
| `PaymentForm` | Formulário de criação/edição de pagamento | `src/components/financial/PaymentForm.tsx` |
| `PaymentList` | Tabela de cobranças | `src/components/financial/PaymentList.tsx` |
| `PaymentCalculator` | Calculadora de valor de aulas | `src/components/financial/PaymentCalculator.tsx` |
| `ClassForm` | Formulário de registro de aula | `src/components/classes/ClassForm.tsx` |
| `ClassList` | Tabela de aulas | `src/components/classes/ClassList.tsx` |
| `Teachers` | Página de professores | `src/pages/Teachers.tsx` |
| `StudentDetails` | Página de detalhes do aluno | `src/pages/StudentDetails.tsx` |

### Hooks Criados

| Hook | Responsabilidade | Arquivo |
|------|------------------|---------|
| `usePayments` | Buscar cobranças do banco | `src/hooks/usePayments.ts` |
| `useCreatePayment` | Criar nova cobrança | `src/hooks/usePayments.ts` |
| `useUpdatePayment` | Editar cobrança existente | `src/hooks/usePayments.ts` |
| `useClasses` | Buscar aulas do banco | `src/hooks/useClasses.ts` |
| `useCreateClass` | Registrar nova aula | `src/hooks/useClasses.ts` |
| `useTeachers` | Buscar professores do banco | `src/hooks/useTeachers.ts` |

## Files Created

```
supabase/
└── migrations/
    └── 01_initial_schema.sql        ← Schema inicial do banco

src/
├── components/
│   ├── financial/
│   │   ├── PaymentForm.tsx          ← Formulário de pagamento
│   │   ├── PaymentList.tsx          ← Lista de cobranças
│   │   └── PaymentCalculator.tsx    ← Calculadora de valores
│   └── classes/
│       ├── ClassForm.tsx            ← Formulário de aula
│       └── ClassList.tsx            ← Lista de aulas
├── pages/
│   ├── Teachers.tsx                 ← Página de professores
│   └── StudentDetails.tsx           ← Detalhes do aluno
├── hooks/
│   ├── usePayments.ts               ← Hooks de pagamentos
│   ├── useClasses.ts                ← Hooks de aulas
│   └── useTeachers.ts               ← Hooks de professores
├── lib/
│   └── utils/
│       ├── regex.ts                 ← Padrões de validação
│       └── cep-api.ts               ← Integração IBGE
└── integrations/
    └── supabase/
        └── client.ts                ← Cliente Supabase
```

## Files Modified

- `vite.config.ts` — Configuração do Vite com path alias `@/*`
- `tailwind.config.js` — Configuração do Tailwind CSS
- `.env.example` — Variáveis de ambiente necessárias
- `package.json` — Dependências adicionadas: `@supabase/supabase-js`, `react-router-dom`

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Dev server sobe na porta 5173 (`npm run dev`)
- [x] Migration aplicada com sucesso no Supabase
- [x] Teste manual: criar pagamento → registro aparece no banco
- [x] Teste manual: registrar aula → cria entrada em `class_logs` e `financial_records`
- [x] Teste manual: digitar CEP → preenche cidade/estado automaticamente
- [x] Teste manual: calculadora → valor atualiza ao mudar duração/taxa

## Results & Impact

### Métricas Quantitativas
- ✅ 5 tabelas criadas no banco de dados
- ✅ 7 componentes React criados
- ✅ 3 hooks customizados implementados
- ✅ 4 padrões de validação regex definidos
- ✅ 1 integração externa (API IBGE)

### Melhorias Qualitativas
- ✅ Base sólida para desenvolvimento das próximas sprints
- ✅ Arquitetura limpa: separação entre componentes, hooks e utilitários
- ✅ Validação de dados na entrada (evita dados inválidos no banco)
- ✅ UX melhorada com preenchimento automático de endereço
- ✅ Cálculo automático de valores (reduz erros manuais)

## Technical Debt

- [ ] Validação com regex é frágil — migrar para Zod na Sprint 3
- [ ] Sem tratamento de erro robusto — adicionar error boundaries depois
- [ ] Sem testes unitários — adicionar Vitest na Sprint 3
- [ ] Sem CI/CD — adicionar GitHub Actions na Sprint 3
- [ ] Componentes grandes (~200 linhas) — refatorar depois

## Lessons Learned

### O que funcionou bem
- ✅ **Supabase como BaaS:** Schema inicial + RLS em 5 dias vs ~2 semanas para backend tradicional
- ✅ **Vite + TypeScript:** Setup rápido, hot reload instantâneo, erros de tipo em tempo de desenvolvimento
- ✅ **Estrutura de pastas por domínio:** `components/financial/`, `components/classes/` facilitou navegação desde o início
- ✅ **API IBGE para CEP:** Integração simples, sem autenticação, melhorou UX significativamente

### O que poderia melhorar
- ⚠️ **Validação com regex:** Frágil e difícil de manter — Zod seria melhor desde o início
- ⚠️ **Sem testes:** Bugs só descobertos em teste manual — testes unitários desde Sprint 1 teriam economizado tempo
- ⚠️ **Componentes grandes:** `PaymentForm` com ~200 linhas — deveria ter quebrado em subcomponentes menores
- ⚠️ **Sem error boundaries:** Erros do Supabase crasham a aplicação inteira

### Aplicações futuras
- 💡 **Zod para validação:** Migrar regex para schemas Zod (Sprint 3)
- 💡 **Testes desde o início:** Próximas features devem ter testes unitários antes de merge
- 💡 **Componentes < 150 linhas:** Quebrar componentes grandes em subcomponentes reutilizáveis
- 💡 **Error boundaries:** Adicionar em cada página principal para isolar falhas

## Next Steps

1. Sprint 2: Implementar autenticação com roles (admin, teacher, student)
2. Sprint 2: Criar formulários completos de cadastro de aluno e professor
3. Sprint 2: Migrar para componentes shadcn/ui (substituir tabelas manuais)
4. Sprint 3: Adicionar CI/CD com GitHub Actions
5. Sprint 3: Implementar soft delete de alunos

## References

- Commits: 19–23 janeiro 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
- Validação: `docs/archive/VALIDACAO_SPRINTS_1_9.md`
