# Sprint 2 — MVP: Auth, Roles & Profiles

> **Nomenclatura do arquivo:** `sprint-02-mvp-auth-roles-profiles.md`

**Período:** 26–29 janeiro 2026
**Status:** ✅ Concluída
**Tipo:** MVP
**Prioridade:** 🔴 Alta

## Problem Statement

Após Sprint 1, o sistema tinha CRUD básico mas sem controle de acesso:
- Qualquer usuário podia ver/editar dados de qualquer professor/aluno
- Sem autenticação (login/logout)
- Sem separação de roles (admin, teacher, student)
- Formulários de cadastro incompletos
- UI inconsistente (tabelas manuais HTML, sem design system)
- Criação manual de usuários no Supabase Dashboard (não escalável)
- Sem vinculação automática entre `auth.users` e `profiles`

**Impacto:** Sistema não utilizável em produção. Dados sensíveis expostos. UX ruim.

## Requirements

### Autenticação
- Login com email/senha via Supabase Auth
- Logout funcional
- Proteção de rotas (redirect se não autenticado)
- Criação de contas vinculadas (aluno/professor → usuário Supabase)

### Roles & Permissões
- 3 roles: `admin`, `teacher`, `student`
- Admin: acesso total
- Teacher: acessa apenas seus próprios alunos
- Student: acessa apenas seus próprios dados
- Role armazenado em `profiles.role` e sincronizado com `auth.users.raw_user_meta_data`

### Formulários Completos
- Cadastro de aluno com criação automática de conta de usuário
- Cadastro de professor com role correto
- Seleção de professor ao cadastrar aluno (dropdown)
- Máscaras de input para telefone e data
- Validação de campos únicos (email, telefone)

### UI Padronizada
- Migração de tabelas manuais para componentes shadcn/ui
- `PageContainer` e `EmptyState` padronizados
- Views compartilhadas entre admin e professor (DRY)

### Segurança
- Remover `.env` do repositório
- Adicionar `.env.example` com variáveis necessárias
- Documentar rotação de chaves

## Background

**Stack de autenticação:**
- Supabase Auth (PostgreSQL + JWT)
- Row Level Security (RLS) no banco
- Roles armazenados em `profiles.role`

**Estrutura de usuários:**
```
auth.users (Supabase Auth)
  ↓ user_id
profiles (role, full_name, phone)
  ↓ user_id
teachers / students (dados específicos)
```

**Componentes shadcn/ui a serem adicionados:**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Button`, `Input`, `Select`, `Dialog`, `Sheet`
- `Card`, `Badge`, `Skeleton`

## Proposed Solution

### Arquitetura de Autenticação

```
Login → Supabase Auth → JWT token → AuthContext
                                        ↓
                                   useAuth() hook
                                        ↓
                            ProtectedRoute component
                                        ↓
                              Role-based rendering
```

### Fluxo de Criação de Usuário

```
1. Admin preenche formulário de aluno/professor
2. Frontend chama Edge Function `invite-user`
3. Edge Function:
   - Cria usuário em auth.users
   - Cria profile com role correto
   - Envia email de convite
4. Usuário recebe email e define senha
5. Login funciona automaticamente
```

### Views Compartilhadas

Para evitar duplicação entre admin e teacher:

```tsx
// src/components/shared/FinancialView.tsx
export const FinancialView = ({ teacherId, isAdmin }) => {
  const query = isAdmin 
    ? supabase.from('financial_records').select('*')
    : supabase.from('financial_records').select('*').eq('teacher_id', teacherId);
  
  // Renderiza mesma UI para ambos
};
```

## Task Breakdown

### Task 1: Setup Supabase Auth

- **Objetivo:** Configurar autenticação com email/senha
- **Implementação:**
  - Habilitar Email Auth no Supabase Dashboard
  - Criar `AuthContext` com `useAuth()` hook
  - Implementar `login(email, password)` e `logout()`
  - Armazenar sessão no localStorage
  - Refresh automático de token
- **Arquivos criados:**
  - `src/contexts/AuthContext.tsx`
  - `src/hooks/useAuth.ts`
- **Teste:** Login com credenciais válidas retorna usuário
- **Demo:** `useAuth()` retorna `{ user, isLoading, login, logout }`

### Task 2: Proteção de rotas

- **Objetivo:** Redirecionar usuários não autenticados para login
- **Implementação:**
  - Componente `ProtectedRoute` que verifica `user` do `AuthContext`
  - Redirect para `/login` se não autenticado
  - Redirect para dashboard correto após login (baseado em role)
  - Componente `AuthRedirect` para redirecionar usuários já logados
- **Arquivos criados:**
  - `src/components/auth/ProtectedRoute.tsx`
  - `src/components/auth/AuthRedirect.tsx`
- **Teste:** Acessar rota protegida sem login → redirect para `/login`
- **Demo:** Rotas `/admin/*`, `/teacher/*`, `/student/*` protegidas

### Task 3: Sistema de roles

- **Objetivo:** Separar permissões por role (admin, teacher, student)
- **Implementação:**
  - Adicionar coluna `role` em `profiles` (ENUM: admin, teacher, student)
  - Trigger para sincronizar role com `auth.users.raw_user_meta_data`
  - Hook `useCurrentUserProfile(userId)` para buscar role
  - Renderização condicional baseada em role
- **Arquivos criados:**
  - `supabase/migrations/02_add_roles.sql`
  - `src/hooks/useCurrentUserProfile.ts`
- **Teste:** Criar usuário com role `teacher` → `raw_user_meta_data.role === 'teacher'`
- **Demo:** Admin vê todas as páginas, teacher vê apenas suas páginas

### Task 4: Formulário completo de aluno

- **Objetivo:** Cadastro de aluno com criação automática de conta de usuário
- **Implementação:**
  - Componente `StudentFormDialog` com todos os campos
  - Campos: nome, email, telefone, data de nascimento, CPF, endereço, dia de pagamento, taxa horária, professor
  - Dropdown de professores (busca de `teachers` table)
  - Máscaras de input: telefone `(XX) XXXXX-XXXX`, data `DD/MM/YYYY`
  - Validação de email único (query antes de inserir)
  - Ao salvar: cria registro em `students` + chama Edge Function para criar usuário
- **Arquivos criados:**
  - `src/components/students/StudentFormDialog.tsx`
  - `supabase/functions/invite-user/index.ts`
- **Teste:** Cadastrar aluno → cria registro em `students` + `auth.users` + `profiles`
- **Demo:** Aluno recebe email de convite e consegue fazer login

### Task 5: Formulário completo de professor

- **Objetivo:** Cadastro de professor com role correto
- **Implementação:**
  - Componente `TeacherFormDialog` com todos os campos
  - Campos: nome, email, telefone, taxa horária, chave PIX, endereço
  - Validação de email único
  - Ao salvar: cria registro em `teachers` + chama Edge Function com `role: 'teacher'`
- **Arquivos criados:**
  - `src/components/teachers/TeacherFormDialog.tsx`
- **Teste:** Cadastrar professor → cria registro em `teachers` + `auth.users` com role `teacher`
- **Demo:** Professor recebe email de convite e consegue fazer login

### Task 6: Migração para shadcn/ui

- **Objetivo:** Substituir tabelas manuais HTML por componentes shadcn/ui
- **Implementação:**
  - Instalar shadcn/ui: `npx shadcn-ui@latest init`
  - Adicionar componentes: `Table`, `Button`, `Input`, `Select`, `Dialog`, `Card`, `Badge`
  - Migrar `PaymentList` para usar `<Table>` do shadcn
  - Migrar `ClassList` para usar `<Table>` do shadcn
  - Migrar `Teachers` para usar `<Table>` do shadcn
  - Criar `PageContainer` para layout consistente
  - Criar `EmptyState` genérico para listas vazias
- **Arquivos criados:**
  - `src/components/ui/table.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/layout/PageContainer.tsx`
  - `src/components/layout/EmptyState.tsx`
- **Teste:** Tabelas renderizam com estilo shadcn/ui
- **Demo:** UI consistente em todas as páginas

### Task 7: Views compartilhadas

- **Objetivo:** Evitar duplicação de código entre admin e teacher
- **Implementação:**
  - Criar `FinancialView` que aceita `teacherId` e `isAdmin`
  - Criar `DashboardView` compartilhado
  - Criar `ClassesView` com suporte a tabela (admin) e cards (teacher)
  - Páginas admin e teacher importam mesma view
- **Arquivos criados:**
  - `src/components/shared/FinancialView.tsx`
  - `src/components/shared/DashboardView.tsx`
  - `src/components/shared/ClassesView.tsx`
- **Teste:** Admin e teacher veem mesma UI, mas dados filtrados por `teacher_id`
- **Demo:** Mudança em `FinancialView` reflete em ambas as páginas

### Task 8: Segurança de chaves

- **Objetivo:** Remover `.env` do repositório e documentar rotação de chaves
- **Implementação:**
  - Adicionar `.env` ao `.gitignore`
  - Criar `.env.example` com variáveis necessárias (sem valores reais)
  - Documentar em `docs/security.md` como rotacionar chaves Supabase
  - Regenerar `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`
- **Arquivos criados:**
  - `.env.example`
  - `docs/security.md`
- **Arquivos modificados:**
  - `.gitignore` — adicionar `.env`
- **Teste:** `git status` não mostra `.env`
- **Demo:** `.env.example` tem placeholders, não valores reais

## Implementation Details

### Migrations Aplicadas

| Migration | Descrição |
|-----------|-----------|
| `02_add_roles.sql` | Adiciona coluna `role` em `profiles`, trigger de sincronização |

### Edge Functions Criadas

| Function | Responsabilidade |
|----------|------------------|
| `invite-user` | Cria usuário em `auth.users` + `profiles` + envia email de convite |

### Componentes Criados

| Componente | Responsabilidade | Arquivo |
|------------|------------------|---------|
| `AuthContext` | Gerencia estado de autenticação | `src/contexts/AuthContext.tsx` |
| `ProtectedRoute` | Protege rotas privadas | `src/components/auth/ProtectedRoute.tsx` |
| `AuthRedirect` | Redireciona usuários logados | `src/components/auth/AuthRedirect.tsx` |
| `StudentFormDialog` | Formulário completo de aluno | `src/components/students/StudentFormDialog.tsx` |
| `TeacherFormDialog` | Formulário completo de professor | `src/components/teachers/TeacherFormDialog.tsx` |
| `FinancialView` | View compartilhada de financeiro | `src/components/shared/FinancialView.tsx` |
| `DashboardView` | View compartilhada de dashboard | `src/components/shared/DashboardView.tsx` |
| `ClassesView` | View compartilhada de aulas | `src/components/shared/ClassesView.tsx` |
| `PageContainer` | Layout padrão de páginas | `src/components/layout/PageContainer.tsx` |
| `EmptyState` | Estado vazio genérico | `src/components/layout/EmptyState.tsx` |

### Hooks Criados

| Hook | Responsabilidade | Arquivo |
|------|------------------|---------|
| `useAuth` | Acessa contexto de autenticação | `src/hooks/useAuth.ts` |
| `useCurrentUserProfile` | Busca profile do usuário logado | `src/hooks/useCurrentUserProfile.ts` |

## Files Created

```
supabase/
├── migrations/
│   └── 02_add_roles.sql             ← Sistema de roles
└── functions/
    └── invite-user/
        └── index.ts                 ← Criação de usuário

src/
├── contexts/
│   └── AuthContext.tsx              ← Contexto de autenticação
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx       ← Proteção de rotas
│   │   └── AuthRedirect.tsx         ← Redirect de usuários logados
│   ├── students/
│   │   └── StudentFormDialog.tsx    ← Formulário de aluno
│   ├── teachers/
│   │   └── TeacherFormDialog.tsx    ← Formulário de professor
│   ├── shared/
│   │   ├── FinancialView.tsx        ← View compartilhada
│   │   ├── DashboardView.tsx        ← View compartilhada
│   │   └── ClassesView.tsx          ← View compartilhada
│   ├── layout/
│   │   ├── PageContainer.tsx        ← Layout padrão
│   │   └── EmptyState.tsx           ← Estado vazio
│   └── ui/                          ← Componentes shadcn/ui
│       ├── table.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── dialog.tsx
├── hooks/
│   ├── useAuth.ts                   ← Hook de autenticação
│   └── useCurrentUserProfile.ts     ← Hook de profile
└── pages/
    └── Login.tsx                    ← Página de login

docs/
└── security.md                      ← Guia de segurança

.env.example                         ← Template de variáveis
```

## Files Modified

- `.gitignore` — Adicionar `.env`
- `src/pages/Teachers.tsx` — Migrar para shadcn/ui Table
- `src/components/financial/PaymentList.tsx` — Migrar para shadcn/ui Table
- `src/components/classes/ClassList.tsx` — Migrar para shadcn/ui Table
- `src/App.tsx` — Adicionar `AuthContext.Provider` e rotas protegidas
- `package.json` — Adicionar shadcn/ui dependencies

## Testing & Validation

- [x] Build sem erros (`npm run build`)
- [x] Teste manual: login com credenciais válidas → redirect para dashboard
- [x] Teste manual: acessar rota protegida sem login → redirect para `/login`
- [x] Teste manual: cadastrar aluno → cria usuário + envia email
- [x] Teste manual: cadastrar professor → cria usuário com role `teacher`
- [x] Teste manual: admin vê todos os alunos, teacher vê apenas seus alunos
- [x] Teste manual: logout → redirect para login
- [x] Validação: `.env` não está no repositório

## Results & Impact

### Métricas Quantitativas
- ✅ 1 migration aplicada (roles)
- ✅ 1 Edge Function criada (invite-user)
- ✅ 10 componentes novos criados
- ✅ 3 views compartilhadas (reduz duplicação)
- ✅ 8 componentes shadcn/ui adicionados
- ✅ 2 hooks de autenticação criados

### Melhorias Qualitativas
- ✅ Sistema seguro com autenticação e roles
- ✅ UI consistente com shadcn/ui
- ✅ Criação de usuários automatizada (não precisa mais do Dashboard)
- ✅ Código DRY com views compartilhadas
- ✅ Chaves de API seguras (fora do repositório)
- ✅ UX melhorada com máscaras de input

## Technical Debt

- [ ] Validação ainda usa regex — migrar para Zod na Sprint 3
- [ ] Sem RLS policies no banco — adicionar na Sprint 4
- [ ] Email de convite genérico — customizar template depois
- [ ] Sem recuperação de senha — adicionar na Sprint 4
- [ ] Formulários grandes (~300 linhas) — refatorar depois

## Lessons Learned

### O que funcionou bem
- ✅ **Supabase Auth:** Setup de autenticação em 1 dia vs ~1 semana com backend tradicional
- ✅ **shadcn/ui:** Componentes prontos aceleraram UI — tabelas profissionais sem CSS customizado
- ✅ **Views compartilhadas:** `FinancialView` reutilizada entre admin e teacher eliminou 200+ linhas duplicadas
- ✅ **Edge Functions:** `invite-user` centraliza criação de usuários — não precisa mais do Dashboard

### O que poderia melhorar
- ⚠️ **Formulários grandes:** `StudentFormDialog` com ~300 linhas — deveria ter quebrado em subcomponentes
- ⚠️ **Sem RLS:** Policies de segurança adiadas para Sprint 7 — risco de vazamento de dados
- ⚠️ **Email genérico:** Template de convite sem identidade visual — baixa taxa de ativação

### Aplicações futuras
- 💡 **Zod desde o início:** Próximas features devem usar Zod em vez de regex (Sprint 3)
- 💡 **RLS obrigatório:** Novas tabelas devem ter policies antes de merge (Sprint 7)
- 💡 **Componentes < 200 linhas:** Quebrar formulários grandes em steps ou subcomponentes

## Next Steps

1. Sprint 3: Adicionar CI/CD com GitHub Actions
2. Sprint 3: Implementar soft delete de alunos
3. Sprint 3: Adicionar design tokens centralizados
4. Sprint 4: Implementar recuperação de senha
5. Sprint 4: Adicionar RLS policies no banco

## References

- Commits: 26–29 janeiro 2026 (branch `syncclass/old-homolog`)
- Análise completa: `docs/archive/ANALISE_OLD_HOMOLOG.md`
- Validação: `docs/archive/VALIDACAO_SPRINTS_1_9.md`
