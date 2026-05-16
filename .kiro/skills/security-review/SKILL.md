---
name: security-review
description: >
  Segurança e code review para o SyncClass — RLS, isolamento de tenant, validação de inputs,
  dados sensíveis, operações financeiras e checklist de code review. Ativar ao revisar código,
  implementar features de auth/pagamento ou criar tabelas. Trigger: "review", "segurança",
  "RLS", "auth", "pagamento", "revisar", "code review".
---

# Segurança — Boas Práticas

## Autenticação & Autorização

- RLS ativo em todas as tabelas — nunca desabilitar
- Nunca confiar em dados do cliente para decisões de segurança
- Role buscado do banco (`profiles`), nunca do localStorage
- `is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita e HTTP 500

```ts
// ✅ Role do banco, não do cliente
const { data: roleData } = await supabase
  .from('user_roles').select('role').eq('user_id', userId).single();
```

## Isolamento de Tenant

Professor só acessa seus próprios alunos. RLS garante no banco, mas frontend também deve filtrar:

```ts
// ✅ teacherId vem do profile, não do cliente
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('teacher_id', teacherId);
```

## Validação de Inputs

```ts
const schema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  pay_day: z.number().min(1).max(31),
  hourly_rate: z.number().positive(),
});
const result = schema.safeParse(formData);
if (!result.success) throw new Error('Dados inválidos');
```

## Dados Sensíveis

- Nunca logar dados pessoais (`console.log(user)`, `console.log(payment)`)
- Chaves de API apenas em `.env` — nunca no código
- `VITE_` prefix apenas para variáveis seguras para o frontend
- PIX keys: usar view `teachers_with_pix_restricted` (visível apenas para admin)

## Operações Financeiras

- Idempotência via `idempotency_keys` — RPCs financeiras já implementam isso
- Usar RPCs: `mark_as_paid_idempotent`, `confirm_payment_idempotent`, `undo_payment_idempotent`
- Nunca processar pagamento sem verificar ownership do registro

## Anti-patterns

- ❌ `user_id` vindo do `req.body` ou frontend sem validação
- ❌ Queries sem filtro de tenant (`teacher_id` ou `student_id`)
- ❌ Dados sensíveis em `console.log`
- ❌ Chaves de API hardcoded
- ❌ Validação apenas no frontend sem Zod
- ❌ `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`

---

# Code Review — Checklist

## Arquitetura

- [ ] Componente faz apenas UI? Lógica está em hook?
- [ ] Hook usa TanStack Query para dados do servidor?
- [ ] Supabase chamado apenas em hooks, não em componentes?
- [ ] Sem prop drilling?

## Qualidade

- [ ] Componente tem menos de ~150 linhas?
- [ ] Sem ternários aninhados? (usar early returns)
- [ ] Nomes descritivos? (`isLoading`, `hasError`, `teacherId`)
- [ ] Sem código morto ou comentado?
- [ ] Sem `console.log`?

## Segurança

- [ ] Inputs validados com Zod?
- [ ] Queries filtram por `teacher_id` ou `student_id` do usuário autenticado?
- [ ] Sem dados sensíveis em logs?
- [ ] Erros do Supabase tratados (`if (error) throw error`)?
- [ ] RLS habilitado em novas tabelas?

## Performance

- [ ] Sem barrel imports (`import { X } from '@/components/ui'`)?
- [ ] Sem objetos/arrays criados inline em props?
- [ ] `useEffect` não usado para data fetching?
- [ ] Subscriptions real-time limpas no cleanup?

## UI/UX

- [ ] Cores semânticas (`text-destructive` não `text-red-500`)?
- [ ] Spacing na escala de 4px (`gap-4`, `gap-6`, `gap-8`)?
- [ ] Estados de loading, error e empty tratados?
- [ ] Mensagens de erro em português?
- [ ] Design tokens usados: `typography()`, `stack()`, `iconSize()`?

## TypeScript

- [ ] Sem `any` explícito desnecessário?
- [ ] Props tipadas?
- [ ] Tipos do Supabase usados (`Database['public']['Tables']['students']['Row']`)?

## Padrões comuns de problema

```tsx
// ❌
const [data, setData] = useState();
useEffect(() => { supabase.from('students').select().then(setData) }, []);

// ✅
const { data } = useStudents(teacherId);
```

```tsx
// ❌
<p className="text-red-500">Erro</p>

// ✅
<p className="text-destructive">Erro</p>
```
