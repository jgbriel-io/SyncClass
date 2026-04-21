# Frontend Audit — Estado, APIs e Segurança

## Arquitetura de Componentes

### Hierarquia
```
App
├── QueryClientProvider (TanStack Query — server state global)
├── BrowserRouter
│   └── AuthProvider (AuthContext — auth state global)
│       └── AppContent
│           ├── Suspense (lazy loading de todas as páginas)
│           ├── Routes (por role: /admin, /teacher, /student)
│           └── ChangePasswordDialog (modal global)
```

### Shells por Role
Cada role tem um Shell persistente que evita re-mount ao navegar entre abas:
- `AdminShell` → layout admin com sidebar
- `TeacherShell` → layout professor
- `StudentShell` → layout aluno

### Error Boundaries
Dois níveis de isolamento:
- `ErrorBoundary` (global) — captura erros que quebram a app inteira, envia para Sentry
- `SectionErrorBoundary` — isola erros em seções específicas sem quebrar o resto

---

## Gerenciamento de Estado

### Server State — TanStack Query
Toda comunicação com Supabase passa por hooks com `useQuery`/`useMutation`. Configuração global:
```ts
staleTime: 2 * 60 * 1000  // 2 min — evita refetch desnecessário
refetchOnWindowFocus: false // evita "piscada" ao trocar de aba
refetchOnReconnect: true
```

### Client State — useState local
Apenas para UI state: modais abertos, toggles, inputs controlados, paginação.

### Auth State — AuthContext
Estado global de autenticação. Fluxo:
1. `onAuthStateChange` listener — reage a mudanças de sessão em tempo real
2. `fetchUserRole()` — busca role em `user_roles` → fallback `profiles`
3. `checkAccountStatus()` — verifica `active/deleted_at` a cada 30s
4. `handleInvalidRefreshToken()` — limpa localStorage e redireciona para login

### LocalStorage
Sessão Supabase armazenada em `localStorage` (chaves `sb-*`). Monitoramento automático de quota a cada 1 minuto — limpa cache TanStack Query se uso > 4MB.

---

## Autenticação no Frontend

### Fluxo de Login
```
1. Login → supabase.auth.signInWithPassword()
2. JWT armazenado em localStorage (sb-* keys)
3. AuthContext.fetchUserRole() → role do banco
4. AuthRedirect → redireciona para /admin, /teacher ou /student
5. ProtectedRoute → verifica user + role em cada rota protegida
```

### Proteção de Rotas
`AuthRedirect` — redireciona usuários autenticados para fora do login.
`ProtectedRoute` — bloqueia acesso sem autenticação e redireciona por role.

### Clientes Supabase Separados
- `supabase` (client.ts) — cliente principal com `localStorage`
- `supabaseSignupClient` (signup-client.ts) — cliente isolado com `memoryStorage` para criação de usuários sem afetar sessão principal

---

## Sprint de Correção

### BUG-FRONT-001
**SEVERIDADE:** ALTA  
**FALHA:** `sendDefaultPii: true` no Sentry envia IP e dados de sessão por padrão. Combinado com `setUser({ id, email, role })`, o Sentry recebe email do usuário em todos os eventos de erro. Para uma plataforma com dados de alunos, isso pode violar LGPD.

```ts
// sentry.ts
Sentry.init({
  sendDefaultPii: true, // ← envia IP + dados de sessão
  ...
});

// AuthContext.tsx
logger.setUser({
  id: session.user.id,
  email: session.user.email, // ← email enviado para Sentry
  role: userRole || undefined,
});
```

**FIX:**
```ts
// Desabilitar PII por padrão
sendDefaultPii: false,

// Enviar apenas ID (não email) para Sentry
logger.setUser({
  id: session.user.id,
  // email: removido — não enviar PII para serviço externo
  role: userRole || undefined,
});
```

---

### BUG-FRONT-002
**SEVERIDADE:** ALTA  
**FALHA:** `useNewStudentsByMonth` em `useDashboardStats.ts` carrega TODOS os registros de students, class_logs e teachers sem paginação para calcular gráficos no frontend. Com crescimento, isso pode carregar centenas de milhares de linhas:

```ts
const [studentsRes, classesRes, teachersRes] = await Promise.all([
  supabase.from("students_masked").select("created_at").order("created_at"),
  supabase.from("class_logs").select("class_date"),  // ← sem limite
  supabase.from("teachers").select("created_at"),
]);
// Filtra e agrupa no frontend
```

Além do problema de performance, isso expõe metadados de todos os registros ao cliente.

**FIX:** Mover agregação para RPC no banco:
```ts
const { data } = await supabase.rpc('get_dashboard_chart_data', {
  p_months_back: monthsBack
});
// RPC retorna dados já agregados por mês
```

---

### BUG-FRONT-003
**SEVERIDADE:** MÉDIA  
**FALHA:** `dangerouslySetInnerHTML` em `chart.tsx` injeta CSS gerado a partir de `ChartConfig` sem sanitização. Se um valor de cor vier de input do usuário (ex: `config[key].color`), pode injetar CSS arbitrário:

```tsx
// chart.tsx
<style
  dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES).map(([theme, prefix]) => `
      ${prefix} [data-chart=${id}] {
        --color-${key}: ${color}; // ← color pode ser qualquer string
      }
    `)
  }}
/>
```

Um valor como `red; } body { display: none; } /*` quebraria o layout.

**FIX:** Validar que `color` é um valor CSS válido antes de injetar:
```ts
function isValidCssColor(value: string): boolean {
  return /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+)/.test(value.trim());
}

const color = itemConfig.theme?.[theme] || itemConfig.color;
const safeColor = color && isValidCssColor(color) ? color : 'transparent';
return safeColor ? `  --color-${key}: ${safeColor};` : null;
```

---

### BUG-FRONT-004
**SEVERIDADE:** MÉDIA  
**FALHA:** `App.tsx` não tem `ErrorBoundary` global envolvendo toda a aplicação. Se um erro ocorrer fora dos `SectionErrorBoundary` (ex: no `AuthProvider`, no `QueryClientProvider` ou em um componente de rota), a aplicação quebra com tela branca sem feedback ao usuário:

```tsx
// App.tsx — sem ErrorBoundary global
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent /> {/* ← sem ErrorBoundary aqui */}
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

**FIX:**
```tsx
const App = () => (
  <ErrorBoundary> {/* ← adicionar aqui */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
```

---

### BUG-FRONT-005
**SEVERIDADE:** MÉDIA  
**FALHA:** `useDashboardStats` faz 3 queries separadas para calcular `overdueCount` — uma busca todos os registros financeiros não pagos e filtra por data no frontend. Isso é ineficiente e pode retornar dados desatualizados se o `staleTime` padrão (2 min) estiver ativo:

```ts
// Busca TODOS os registros não pagos (pode ser milhares)
const { data: overdueRecords } = await supabase
  .from("financial_records")
  .select("id")
  .neq("status", "pago")
  .lt("due_date", today);
```

Não há filtro de `teacher_id` — um professor vê contagem de cobranças atrasadas de TODOS os alunos da plataforma (RLS filtra no banco, mas a query retorna apenas IDs, então o dado é correto, porém ineficiente).

**FIX:** Usar `count` do PostgREST em vez de buscar todos os IDs:
```ts
const { count: overdueCount } = await supabase
  .from("financial_records")
  .select("id", { count: "exact", head: true }) // head: true = não retorna dados
  .neq("status", "pago")
  .lt("due_date", today);
```

---

### BUG-FRONT-006
**SEVERIDADE:** MÉDIA  
**FALHA:** `ProtectedRoute` tem uma janela de acesso não autorizado durante o carregamento. Quando `isLoading = true`, renderiza um spinner — mas se `user` for `null` e `isLoading` for `false` ao mesmo tempo (ex: token expirado), o redirect para `/login` acontece, mas há um flash de conteúdo protegido antes:

```tsx
// ProtectedRoute.tsx
if (isLoading) {
  return <Loader />; // ← correto
}

if (!user) {
  return <Navigate to="/login" ... />; // ← correto, mas pode haver flash
}
```

O problema real é que `AuthContext` tem dois caminhos de inicialização (`onAuthStateChange` + `getSession`) que podem causar `isLoading = false` antes do role ser carregado.

**FIX:** Adicionar verificação de role no ProtectedRoute:
```tsx
if (isLoading || (user && !role)) {
  return <Loader />; // aguardar role ser carregado também
}
```

---

### BUG-FRONT-007
**SEVERIDADE:** BAIXA  
**FALHA:** `queryClient` é criado fora do componente `App` como variável de módulo. Isso significa que o mesmo `queryClient` é compartilhado entre todos os renders (incluindo HMR em desenvolvimento), podendo causar cache stale entre sessões de usuários diferentes se o app for usado em modo SSR ou em testes:

```ts
// App.tsx — fora do componente
const queryClient = new QueryClient({ ... }); // ← singleton de módulo
```

Em produção (SPA pura) isso é aceitável, mas em testes pode causar vazamento de estado entre testes.

**FIX:** Para testes, criar `queryClient` dentro do componente ou usar `QueryClient` por teste:
```ts
// Para testes
const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});
```

---

### BUG-FRONT-008
**SEVERIDADE:** BAIXA  
**FALHA:** `checkStorageQuota` em `storage.ts` itera sobre `localStorage` usando `for...in`, que pode incluir propriedades herdadas do prototype se `localStorage` for mockado em testes:

```ts
for (const key in localStorage) {
  if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
    // ...
  }
}
```

O `hasOwnProperty` protege parcialmente, mas `Object.keys(localStorage)` seria mais idiomático e seguro.

**FIX:**
```ts
export function calculateStorageSize(): number {
  return Object.keys(localStorage).reduce((total, key) => {
    return total + key.length + (localStorage.getItem(key)?.length ?? 0);
  }, 0);
}
```

---

## Pontos Positivos

- `sanitizeHtml` com DOMPurify em todos os `dangerouslySetInnerHTML` de conteúdo do usuário
- `sanitizeErrorMessage` previne exposição de detalhes técnicos do banco
- `supabaseSignupClient` isolado com `memoryStorage` evita conflito de sessão
- `ErrorBoundary` com Sentry integrado em seções críticas
- Lazy loading de todas as páginas — bundle inicial pequeno
- `useOptimisticMutation` com rollback automático em caso de erro
- Rate limiting client-side como primeira linha de defesa
- `beforeSend` no Sentry remove headers `Authorization` e `Cookie`
- Monitoramento de quota do localStorage com limpeza automática
