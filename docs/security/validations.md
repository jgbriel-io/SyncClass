# Validações

Validações no banco, frontend e rate limiting.

## Índice

- [Quando usar](#quando-usar)
- [Validações no banco](#validações-no-banco)
- [Validações no frontend](#validações-no-frontend)
- [Rate limiting](#rate-limiting)
- [Idempotência](#idempotência)
- [Ver também](#ver-também)

## Quando usar

**Use validações quando:**

- Criar/editar registros (sempre validar com Zod no frontend)
- Criar triggers de validação no banco (lógica de negócio crítica)
- Proteger RPCs contra abuse (rate limiting)

**Não use quando:**

- Validações triviais (deixar para o banco via constraints)
- Validações que podem ser feitas no frontend (não sobrecarregar banco)

## Validações no banco

### financial_records

**Trigger:** `trigger_validate_financial_logic` (BEFORE INSERT/UPDATE)

**Regras:**

- `amount > 0` obrigatório para todos os status
- `pago`: amount ≤ 10.000, description obrigatória, paid_at preenchido automaticamente
- `extornado`: amount ≤ 1.000, description obrigatória
- `abonado` / `cancelado`: description obrigatória
- `pendente`: apenas validação de valor positivo

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION validate_financial_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- amount > 0 para todos os status
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'amount deve ser maior que zero';
  END IF;

  -- Validações por status
  CASE NEW.status
    WHEN 'pago' THEN
      IF NEW.amount > 10000 THEN
        RAISE EXCEPTION 'Pagamentos acima de R$ 10.000 requerem aprovação manual';
      END IF;
      IF NEW.description IS NULL OR NEW.description = '' THEN
        RAISE EXCEPTION 'description obrigatória para status pago';
      END IF;
      NEW.paid_at := COALESCE(NEW.paid_at, NOW());

    WHEN 'extornado' THEN
      IF NEW.amount > 1000 THEN
        RAISE EXCEPTION 'Estornos acima de R$ 1.000 requerem aprovação manual';
      END IF;
      IF NEW.description IS NULL OR NEW.description = '' THEN
        RAISE EXCEPTION 'description obrigatória para status extornado';
      END IF;

    WHEN 'abonado', 'cancelado' THEN
      IF NEW.description IS NULL OR NEW.description = '' THEN
        RAISE EXCEPTION 'description obrigatória para status ' || NEW.status;
      END IF;

    ELSE
      -- pendente: apenas validação de valor positivo
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;
```

### teachers

**Validação:** `pix_key` via função `is_valid_pix_key()`

**Regras:**

- CPF: 11 dígitos
- Email: formato válido
- Telefone: 10-11 dígitos
- UUID: formato válido
- Chave aleatória: 32 caracteres

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION is_valid_pix_key(key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- CPF: 11 dígitos
  IF key ~ '^\d{11}$' THEN
    RETURN TRUE;
  END IF;

  -- Email
  IF key ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RETURN TRUE;
  END IF;

  -- Telefone: 10-11 dígitos
  IF key ~ '^\d{10,11}$' THEN
    RETURN TRUE;
  END IF;

  -- UUID
  IF key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN TRUE;
  END IF;

  -- Chave aleatória: 32 caracteres
  IF LENGTH(key) = 32 THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Constraint
ALTER TABLE teachers ADD CONSTRAINT check_pix_key_format
  CHECK (pix_key IS NULL OR is_valid_pix_key(pix_key));
```

### students / teachers

**Constraints:**

- `pay_day` CHECK (1-31)

```sql
ALTER TABLE students ADD CONSTRAINT check_pay_day
  CHECK (pay_day >= 1 AND pay_day <= 31);

ALTER TABLE teachers ADD CONSTRAINT check_pay_day
  CHECK (pay_day >= 1 AND pay_day <= 31);
```

### class_logs / activities

**Constraints:**

- `grade` CHECK (0-100)

```sql
ALTER TABLE class_logs ADD CONSTRAINT check_grade
  CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100));

ALTER TABLE activities ADD CONSTRAINT check_grade
  CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100));
```

## Validações no frontend

**Biblioteca:** Zod + React Hook Form

**Padrão:**

```tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  pay_day: z.number().min(1).max(31, "Dia deve estar entre 1 e 31"),
  hourly_rate: z.number().positive("Valor deve ser positivo"),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormData) => {
  // data já validado pelo Zod
  await createStudent(data);
};
```

**Schemas centralizados:** `src/lib/validation/*.ts`

**Mensagens de erro:**

- Sempre em português
- Próximas ao input
- Usando `text-destructive`

## Rate limiting

**Tabela:** `rate_limit_tracker`

**Função:** `check_rate_limit(user_id UUID, operation TEXT, max_requests INT, window_seconds INT)`

**Limite padrão:** 10 req/min

**Aplicado em:**

- `create_class_package`
- `mark_as_paid_idempotent`
- `confirm_payment_idempotent`
- `undo_payment_idempotent`

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_operation TEXT,
  p_max_requests INT DEFAULT 10,
  p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Conta requisições no período
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_tracker
  WHERE user_id = p_user_id
    AND operation = p_operation
    AND created_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Bloqueia se exceder limite
  IF v_count >= p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded: % requests in % seconds', v_count, p_window_seconds;
  END IF;

  -- Registra requisição
  INSERT INTO rate_limit_tracker (user_id, operation)
  VALUES (p_user_id, p_operation);

  RETURN TRUE;
END;
$$;
```

**Uso em RPC:**

```sql
CREATE OR REPLACE FUNCTION mark_as_paid_idempotent(...)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Rate limiting
  PERFORM check_rate_limit(auth.uid(), 'mark_as_paid', 10, 60);

  -- Lógica da RPC
  ...
END;
$$;
```

## Idempotência

**Tabela:** `idempotency_keys`

**Conceito:** Previne operações duplicadas (double-click, retry).

**Aplicado em:**

- `mark_as_paid_idempotent`
- `confirm_payment_idempotent`
- `undo_payment_idempotent`

**Implementação:**

```sql
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  operation TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);
```

**Uso em RPC:**

```sql
CREATE OR REPLACE FUNCTION mark_as_paid_idempotent(
  p_record_id UUID,
  p_idempotency_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verifica se operação já foi executada
  IF EXISTS (
    SELECT 1 FROM idempotency_keys
    WHERE key = p_idempotency_key
  ) THEN
    RETURN; -- Operação já executada, retorna sem erro
  END IF;

  -- Registra chave
  INSERT INTO idempotency_keys (key, operation, user_id)
  VALUES (p_idempotency_key, 'mark_as_paid', auth.uid());

  -- Lógica da RPC
  UPDATE financial_records
  SET status = 'pago', paid_at = NOW()
  WHERE id = p_record_id;
END;
$$;
```

**Frontend:**

```tsx
import { v4 as uuidv4 } from "uuid";

const handlePayment = async () => {
  const idempotencyKey = uuidv4();

  await supabase.rpc("mark_as_paid_idempotent", {
    p_record_id: recordId,
    p_idempotency_key: idempotencyKey,
  });
};
```

## Ver também

- [Security Overview](./overview.md) — Visão geral de segurança
- [Auth & RLS](./auth-rls.md) — Autenticação e autorização
- [Backend RPCs](../backend/rpcs.md) — RPCs com validações
