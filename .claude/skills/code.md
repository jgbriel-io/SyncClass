# Skill: Code Development

Desenvolvimento do SyncClass — React + TypeScript + Supabase.

## Objetivo

Implementar, refatorar e manter código-fonte da plataforma seguindo arquitetura, convenções e práticas de qualidade.

## Stack Técnica

### Frontend
- **Framework:** React 18 + React Router v6
- **Linguagem:** TypeScript 5.8+
- **Build:** Vite 5.4+
- **Estilização:** Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- **Formulários:** React Hook Form + Zod
- **Data Fetching:** TanStack Query (React Query) v5
- **Icons:** Lucide React 0.462+
- **Notificações:** Sonner 1.7+
- **Monitoramento:** Sentry 10.38+

### Backend
- **BaaS:** Supabase (PostgreSQL + Auth + Storage)
- **Autenticação:** Supabase Auth (JWT)
- **Database:** PostgreSQL 15+ com Row Level Security (RLS)
- **Functions:** Edge Functions (Deno/TypeScript)

### Testes
- **Unitários:** Vitest + Testing Library + jsdom
- **E2E:** ❌ **Sem Playwright/E2E ainda** (planejado, não implementado)

## Estrutura de Pastas (real)

```
src/
├── components/              # UI por domínio
│   ├── ui/                  # shadcn/ui base + customizados
│   ├── admin/               # Admin-only views
│   ├── auth/                # ProtectedRoute, AuthRedirect, ChangePasswordDialog
│   ├── activities/          # Atividades
│   ├── classes/             # Aulas
│   ├── dashboard/           # Dashboard cards/widgets
│   ├── filters/             # Filtros por módulo
│   ├── financial/           # Financeiro/Pagamentos
│   ├── layout/              # Shells (AdminShell, TeacherShell, StudentShell)
│   ├── overview/            # Overview admin
│   ├── pwa/                 # InstallPWABanner, etc.
│   ├── student/             # Portal aluno
│   ├── students/            # CRUD alunos (lado professor)
│   ├── users/               # Gestão usuários (admin)
│   └── teachers/            # Gestão professores (admin)
├── hooks/                   # TanStack Query + services (mistura)
│   ├── use*.ts              # Custom hooks (useStudents, useClassLogs)
│   └── *Service.ts          # Services (classLogsService, financialRecordsService)
├── pages/                   # Rotas (admin/, teacher/, student/, public)
├── contexts/                # AuthContext
├── integrations/
│   └── supabase/            # client.ts, env.ts, signup-client.ts, types.ts
├── lib/
│   ├── design-tokens/       # typography(), stack(), iconSize(), modalSizes()
│   ├── validation/          # Zod schemas
│   ├── security/            # errorHandler, sanitize, rateLimit
│   ├── utils/               # formatters, patterns, errorMapper
│   ├── br-locations.ts      # Estados/cidades BR
│   ├── countries.ts         # Lista de países
│   ├── pwa.ts               # PWA helpers
│   ├── sentry.ts            # Sentry config
│   ├── pixConfig.ts         # PIX config
│   └── logger.ts            # Logger
└── content/                 # i18n por domínio (16 arquivos + index.ts)

supabase/
├── migrations/              # 25 SQL migrations
└── functions/               # 5 Edge Functions (Deno/TS):
                             # invite-user, reset-password,
                             # admin-delete-user, cleanup-storage,
                             # cleanup-old-records
```

**Nota:** Não existe `src/lib/services/`. Services estão em `src/hooks/*Service.ts`.

## Convenções de Código

### Strings de UI
- **REGRA:** Centralizar em `src/content/{dominio}.ts`. 16 arquivos por domínio (`ui.ts`, `students.ts`, `auth.ts`, `financial.ts`, etc.) reexportados em `src/content/index.ts`.
- **NUNCA:** Hardcode strings em componentes.
- **Padrão de import:** `import { ui, students, financial } from '@/content'`.
- Exemplo:
  ```typescript
  // ❌ Errado
  <button>Salvar</button>
  
  // ✅ Correto
  import { ui } from '@/content'
  <button>{ui.actions.save}</button>
  ```
- **Strings dinâmicas:** Funções em vez de templates literais:
  ```typescript
  description: (query: string) => `Não encontramos resultados para "${query}".`
  ```

### Componentes Grandes
- **Quebra:** Se > 200 linhas, dividir em subcomponentes.
- **Local:** `components/{domínio}/subcomponents/` ou inline no mesmo domínio.
- **Extraction:** Lógica reutilizável → `src/hooks/*Service.ts` (não `lib/services/`).

### Validação
- **Schemas:** Zod em `lib/validation/schemas.ts`.
- **Reutilizar:** Nunca duplicar schemas.
- Exemplo:
  ```typescript
  export const studentFormSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
  })
  ```

### Comentários
- **Regra:** Zero comentários óbvios.
- **Quando:** Apenas WHY não-óbvio.
- **Estilo:** Uma linha máximo.
  ```typescript
  // RLS filters to current teacher's students only
  const students = await fetchStudents()
  
  // ❌ Errado
  // Variável que armazena o nome do aluno
  const studentName = "João"
  ```

### Error Handling
- **Padrão:** `lib/security/errorHandler.ts` → mapeia erros Supabase.
- **User-Facing:** Mensagens claras sem expor detalhes técnicos.
- **Logging:** Sentry para erros em produção.

### Tipagem TypeScript
- **Strict Mode:** `strict: true` obrigatório.
- **Generics:** Usar para reutilizar tipos.
- **Avoid `any`:** Always typed.
- **Generated Types:** Usar types do Supabase.

## Data Fetching

### Padrão TanStack Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['students', filter],
  queryFn: () => fetchStudents(filter),
})
```

### Mutations
```typescript
const { mutate } = useMutation({
  mutationFn: (data) => createStudent(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['students'] })
  },
})
```

### Performance Rules
- **NUNCA** carregar todos os registros sem paginação.
- **NUNCA** filtrar/agregar no frontend — fazer no banco (RPC, SQL, materialized views).
- **Evitar N+1:** Usar JOINs e `.select('*,related(...)')` no Supabase.
- **Exemplo errado:**
  ```typescript
  // ❌ Busca 100k registros, filtra no frontend
  const { data } = await supabase.from('financial_records').select('*')
  const filtered = data.filter(r => r.teacher_id === teacherId)
  ```
- **Exemplo correto:**
  ```typescript
  // ✅ Filtra no banco
  const { data } = await supabase
    .from('financial_records')
    .select('*')
    .eq('teacher_id', teacherId)
  ```

## Segurança

### RLS (Row Level Security)
- **Regra:** Todo acesso ao Supabase deve respeitar RLS.
- **Verificar:** Policies estão aplicadas nas migrations?
- **Teste:** Security audit E2E suite.

### Autenticação
- **Supabase Auth:** JWT sessions.
- **ProtectedRoute:** Bloqueia acesso não-autenticado.
- **Roles:** admin, teacher, student.

### Validação
- **Input:** Zod schemas obrigatórios.
- **Sanitização:** `sanitize()` para HTML/XSS.
- **Output:** Nunca expor dados sensíveis em erro.

## Testes

### Unitários (Vitest) — único framework atualmente
- **Hooks com testes:** `useStudents`, `useTeachers`, `useClassLogs`, `useDebouncedValue`, `useOptimisticMutation`.
- **Locais:** Adjacente ao arquivo (`useStudents.test.tsx`).
- **Foco:** Hooks, utils, validação. Componentes apenas se lógica complexa.

### E2E
- **Status:** ❌ Não implementado. Planejado para sprints futuros.
- **Quando implementar:** Citar Playwright como ferramenta escolhida no Cap. 7 do TCC, com ressalva de "trabalhos futuros".

### Rodar
```bash
npm run test           # Vitest (run once)
npm run test:watch    # Vitest watch
npm run lint          # ESLint
npm run type-check    # TypeScript (atenção: hífen)
npm run check         # lint + type-check juntos
```

## Deploy

### Ambiente
- **Dev:** `localhost:5173` (Vite dev server)
- **Prod:** Lovable / Vercel / Netlify (TBD pelo TCC)

### CI/CD
- GitHub Actions: `npm run ci` (= `npm ci && npm run check && npm run build`).
- Não merge sem passing checks.

## Performance

### Targets
- **Listagens paginadas:** < 2s (RNF06)
- **First Contentful Paint:** < 1.5s
- **Core Web Vitals:** Green

### Otimizações
- Code splitting (React.lazy).
- Image optimization (next/image ou alternativa).
- TanStack Query cache strategy.
- Avoid unnecessary re-renders (useMemo, useCallback).

## Commits

Conventional Commits:
```
feat(students): add CRUD operations
fix(financial): RLS policy for payment records
refactor(components): extract StudentDialog subcomponents
docs(readme): update stack requirements
test(e2e): add security audit suite
```

## Quando Chamar Esta Skill

- Implementar novo componente/página.
- Refatorar código existente.
- Adicionar/atualizar validação.
- Integração com Supabase.
- Testes unitários ou E2E.
- Performance optimization.
