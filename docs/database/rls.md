# Row Level Security (RLS)

Políticas de acesso por tabela, funções helper e troubleshooting.

## Índice

- [Quando usar](#quando-usar)
- [Funções helper](#funções-helper)
- [Políticas por tabela](#políticas-por-tabela)
- [Troubleshooting](#troubleshooting)
- [Ver também](#ver-também)

## Quando usar

**RLS está ativo em todas as tabelas.** Acesso negado por padrão para usuários não autenticados.

**Use RLS quando:**

- Criar nova tabela (sempre habilitar RLS)
- Criar nova policy (sempre testar com usuários de cada role)
- Debugar "permission denied" (verificar policies)

**Não use quando:**

- Operações de admin via Edge Functions (usar service role key)
- Migrations (rodam com permissões de superuser)

## Funções helper

Todas com `SECURITY DEFINER` para bypassar o RLS das próprias tabelas que consultam. Sem isso, ocorre recursão infinita e HTTP 500.

### is_admin()

**Responsabilidade:** Verifica se usuário autenticado é admin.

> ⚠️ Corrigido na migration 52: body anterior usava `WHERE user_id = auth.uid()` (sem cast) causando type mismatch silent. Cast `::text` é obrigatório pois `profiles.user_id` é `varchar`.

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id::text = (auth.uid())::text
    AND role = 'admin'
  );
$$;
```

**Uso:**

```sql
CREATE POLICY "admin_select_students" ON students
  FOR SELECT USING (is_admin());
```

### is_teacher()

**Responsabilidade:** Verifica se usuário autenticado é professor.

> ⚠️ Corrigido na migration 52: body anterior fazia `SELECT 1 FROM teachers WHERE id = auth.uid()` — comparava `teachers.id` (UUID de domínio) com `auth.uid()` (UUID do auth user). Nunca coincidem. Resultado: todo professor via 0 alunos e 0 dados via RLS.

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id::text = (auth.uid())::text
    AND role = 'teacher'
  );
$$;
```

**Uso:**

```sql
CREATE POLICY "students_teacher_select" ON students
  FOR SELECT USING (
    (SELECT is_teacher()) AND teacher_id = (SELECT get_teacher_id())
  );
```

### is_student()

**Responsabilidade:** Verifica se usuário autenticado é aluno.

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id::text = (auth.uid())::text
    AND role = 'student'
  );
$$;
```

### get_teacher_id()

**Responsabilidade:** Retorna o `teachers.id` vinculado ao usuário autenticado.

> ⚠️ Corrigido na migration 51: body anterior usava `WHERE user_id = auth.uid()` sem cast → retornava NULL → RLS `teacher_id = get_teacher_id()` sempre falso.

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT teacher_id FROM profiles WHERE user_id::text = (auth.uid())::text LIMIT 1;
$$;
```

### get_student_id()

**Responsabilidade:** Retorna o `students.id` vinculado ao usuário autenticado.

> ⚠️ Corrigido na migration 51 (mesmo problema de cast) e migration 47 (body anterior comparava `students.id = auth.uid()` em vez de usar profiles).

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT student_id FROM profiles WHERE user_id::text = (auth.uid())::text LIMIT 1;
$$;
```

## Políticas por tabela

### profiles

**SELECT:**

- Próprio registro (`user_id = auth.uid()`)
- OU `is_admin()`

**INSERT:**

- Qualquer autenticado

**UPDATE:**

- Próprio registro (`user_id = auth.uid()`)
- OU `is_admin()`

**DELETE:**

- `is_admin()`

### teachers

**SELECT:**

- `is_admin()`
- OU `is_teacher()` (professor pode ver outros professores)

**INSERT/UPDATE/DELETE:**

- `is_admin()`

### students

**SELECT:**

- Professor dono (`profiles.teacher_id = students.teacher_id`)
- OU aluno dono (`profiles.student_id = students.id`)
- OU `is_admin()`

**INSERT/UPDATE/DELETE:**

- Professor dono
- OU `is_admin()`

### financial_records

**SELECT:**

- Professor do aluno (`students.teacher_id = profiles.teacher_id`)
- OU aluno dono (`financial_records.student_id = profiles.student_id`)
- OU `is_admin()`

**INSERT/UPDATE:**

- Professor do aluno
- OU `is_admin()`

**DELETE:**

- `is_admin()`

### activities

**SELECT:**

- Professor do aluno
- OU aluno dono
- OU `is_admin()`

**INSERT/UPDATE:**

- Professor do aluno
- OU `is_admin()`

**DELETE:**

- Professor do aluno
- OU `is_admin()`

### class_logs

**SELECT/INSERT/UPDATE/DELETE:**

- Professor do aluno
- OU `is_admin()`

## Troubleshooting

### "permission denied for table X"

**Causa:** RLS bloqueou acesso.

**Debug:**

1. Verificar se usuário está autenticado (`auth.uid()` não é null)
2. Verificar role do usuário (`SELECT role FROM profiles WHERE user_id = auth.uid()`)
3. Verificar policies da tabela (`SELECT * FROM pg_policies WHERE tablename = 'X'`)
4. Testar policy manualmente:
   ```sql
   -- Exemplo: testar policy de students
   SELECT * FROM students WHERE teacher_id IN (
     SELECT teacher_id FROM profiles WHERE user_id = auth.uid()
   );
   ```

### "infinite recursion detected"

**Causa:** Função helper sem `SECURITY DEFINER`.

**Fix:** Adicionar `SECURITY DEFINER` na função:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Adicionar isso
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;
```

### "invalid input syntax for type uuid"

**Causa:** Cast UUID faltando em policy.

**Fix:** Adicionar `::uuid` explícito:

```sql
-- ❌ ERRADO
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- ✅ CORRETO
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT USING (user_id::uuid = auth.uid());
```

### "function does not exist"

**Causa:** Função helper não foi criada ou migration não foi aplicada.

**Fix:** Aplicar migration que cria a função:

```bash
npx supabase db push
```

## Ver também

- [Database Overview](./overview.md) — Visão geral do banco
- [Schema](./schema.md) — Tabelas e relacionamentos
- [Migrations](./migrations.md) — Histórico de migrations
- [Security Overview](../security/overview.md) — Visão geral de segurança
