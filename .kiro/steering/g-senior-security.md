---
inclusion: manual
description: Segurança — RLS, isolamento de tenant, validação de inputs, dados sensíveis e operações financeiras
---

# Segurança — Boas Práticas

## Autenticação & Autorização

- RLS ativo em todas as tabelas — nunca desabilitar
- Nunca confiar em dados do cliente para decisões de segurança
- Role buscado do banco (`user_roles` → `profiles`), nunca do localStorage
- `is_admin()` DEVE ter `SECURITY DEFINER` — sem isso causa recursão infinita e HTTP 500

```ts
// ✅ Role do banco, não do cliente
const { data: roleData } = await supabase
  .from('user_roles').select('role').eq('user_id', userId).single();
```

## Isolamento de Tenant

Professor só acessa seus próprios alunos. RLS garante isso no banco, mas o frontend também deve filtrar:

```ts
// ✅ Sempre filtrar por teacher_id do usuário autenticado
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('teacher_id', teacherId); // teacherId vem do profile, não do cliente
```

## Validação de Inputs

Sempre validar com Zod antes de enviar ao Supabase:

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
