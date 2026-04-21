# Análise de Segurança — RLS e Autenticação

## Arquitetura de Segurança

### Modelo de Isolamento Multitenant

O sistema usa 3 camadas de isolamento:

```
1. Supabase Auth (JWT)     → Identifica quem é o usuário
2. RLS Policies (Postgres) → Filtra o que o usuário pode ver/modificar
3. Frontend (React)        → UX apenas, não é barreira de segurança
```

### Funções Helper (SECURITY DEFINER)

Todas as funções de verificação de role têm `SECURITY DEFINER` para evitar recursão com RLS:

| Função | Retorna | Consulta |
|--------|---------|----------|
| `is_admin()` | BOOLEAN | `profiles WHERE user_id = auth.uid() AND role = 'admin'` |
| `is_teacher()` | BOOLEAN | `profiles WHERE user_id = auth.uid() AND role = 'teacher'` |
| `is_student()` | BOOLEAN | `profiles WHERE user_id = auth.uid() AND role = 'student'` |
| `get_teacher_id()` | UUID | `profiles.teacher_id WHERE user_id = auth.uid()` |
| `get_student_id()` | UUID | `profiles.student_id WHERE user_id = auth.uid()` |

### Isolamento por Tabela

| Tabela | Professor vê | Aluno vê | Admin vê |
|--------|-------------|----------|----------|
| `students` | Apenas seus alunos (`teacher_id = get_teacher_id()`) | Apenas a si mesmo | Todos |
| `class_logs` | Suas aulas (`teacher_id = get_teacher_id()`) | Suas aulas (`student_id = get_student_id()`) | Todos |
| `financial_records` | Cobranças de seus alunos (via JOIN em class_logs) | Suas cobranças | Todos |
| `activities` | Suas atividades (`teacher_id = get_teacher_id()`) | Suas atividades | Todos |
| `teachers` | Apenas a si mesmo | Apenas seu professor | Todos |
| `profiles` | Apenas o próprio | Apenas o próprio | Todos |

### Fluxo de Autenticação

```
Login → Supabase Auth JWT
     → AuthContext.fetchUserRole()
     → Busca em user_roles (cache) → fallback para profiles
     → Verifica active/deleted_at
     → Redireciona para /admin, /teacher ou /student
     → Verificação periódica a cada 30s (checkAccountStatus)
```

---

## Sprint de Correção — Vulnerabilidades Encontradas

### BUG-SEC-001
**SEVERIDADE:** CRÍTICA  
**VETOR DE ATAQUE:** BOLA (Broken Object Level Authorization) — Mass Assignment em `financial_records`

A policy `financial_records_insert_policy` verifica apenas `is_teacher()`, sem validar que o `student_id` inserido pertence ao professor autenticado:

```sql
-- Policy atual (VULNERÁVEL)
CREATE POLICY "financial_records_insert_policy"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));
```

**Ataque:** Professor A autentica, descobre o UUID de um aluno do Professor B (via enumeração ou vazamento), e insere uma cobrança com `student_id` do aluno do Professor B. A policy não bloqueia porque o atacante é um professor válido.

```bash
# Ataque via curl/Postman
POST /rest/v1/financial_records
Authorization: Bearer <token_professor_A>
{
  "student_id": "<uuid_aluno_professor_B>",  # ← IDOR
  "amount": 500,
  "status": "pendente"
}
# Resultado: cobrança criada para aluno de outro professor ✓ (deveria ser bloqueado)
```

**FIX:**
```sql
DROP POLICY IF EXISTS "financial_records_insert_policy" ON financial_records;
CREATE POLICY "financial_records_insert_policy"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );
```

---

### BUG-SEC-002
**SEVERIDADE:** CRÍTICA  
**VETOR DE ATAQUE:** BOLA — Mass Assignment em `activities`

Mesma falha do BUG-SEC-001, mas em `activities`. A policy de INSERT não valida que o `student_id` pertence ao professor:

```sql
-- Policy atual (VULNERÁVEL)
CREATE POLICY "activities_insert_policy"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));
```

**Ataque:** Professor A cria atividade com `student_id` de aluno do Professor B. O aluno do Professor B passa a ver a atividade (via `activities_select_policy` que filtra por `student_id`), criando confusão e possível vazamento de informação.

**FIX:**
```sql
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
CREATE POLICY "activities_insert_policy"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );
```

---

### BUG-SEC-003
**SEVERIDADE:** CRÍTICA  
**VETOR DE ATAQUE:** BOLA — Mass Assignment em `financial_records` UPDATE

A policy de UPDATE também não valida ownership do `student_id`:

```sql
-- Policy atual (VULNERÁVEL)
CREATE POLICY "financial_records_update_policy"
  ON financial_records FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.is_teacher()));
```

**Ataque:** Professor A faz UPDATE em uma cobrança do Professor B (se souber o UUID). A policy permite qualquer professor atualizar qualquer cobrança.

**FIX:**
```sql
DROP POLICY IF EXISTS "financial_records_update_policy" ON financial_records;
CREATE POLICY "financial_records_update_policy"
  ON financial_records FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );
```

---

### BUG-SEC-004
**SEVERIDADE:** ALTA  
**VETOR DE ATAQUE:** Privilege Escalation via `update_profile_by_id`

A função `update_profile_by_id` tem `SECURITY DEFINER` e `SET LOCAL row_security = off`, e é concedida a `authenticated`. Embora verifique `is_admin()` internamente, o parâmetro `p_role` aceita qualquer string — um admin pode promover qualquer usuário para `admin` sem restrição adicional. Mais grave: a função aceita `p_id` como TEXT (não UUID), abrindo espaço para SQL injection via cast malformado.

**Ataque:** Admin legítimo (ou conta comprometida) chama:
```bash
POST /rest/v1/rpc/update_profile_by_id
{
  "p_id": "<uuid_qualquer_usuario>",
  "p_role": "admin"
}
# Resultado: usuário promovido a admin ✓
```

**FIX:**
```sql
-- 1. Restringir p_role a valores válidos
CREATE OR REPLACE FUNCTION public.update_profile_by_id(...)
AS $$
BEGIN
  -- Validar role antes de qualquer operação
  IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Role inválido: %. Valores aceitos: admin, teacher, student', p_role;
  END IF;
  
  -- Impedir auto-promoção para admin (apenas outro admin pode promover)
  IF p_role = 'admin' THEN
    -- Log de auditoria obrigatório para promoção a admin
    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (auth.uid(), 'UPDATE', 'promote_to_admin', 'profiles', v_profile_id,
            jsonb_build_object('promoted_by', auth.uid(), 'new_role', 'admin'));
  END IF;
  -- ... resto da função
END;
$$;
```

---

### BUG-SEC-005
**SEVERIDADE:** ALTA  
**VETOR DE ATAQUE:** IDOR em `financial_records` SELECT via JOIN indireto

A policy de SELECT de `financial_records` para professores usa um JOIN em `class_logs`:

```sql
EXISTS (
  SELECT 1 FROM class_logs cl
  WHERE cl.student_id = financial_records.student_id
    AND cl.teacher_id = (SELECT public.get_teacher_id())
)
```

**Ataque:** Se um aluno tiver aulas com dois professores (Professor A e Professor B), o Professor A consegue ver as cobranças criadas pelo Professor B para esse aluno, porque o JOIN em `class_logs` retorna verdadeiro para qualquer professor que tenha uma aula com o aluno — independente de quem criou a cobrança.

**FIX:**
```sql
-- Adicionar coluna teacher_id em financial_records para ownership direto
ALTER TABLE financial_records ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_financial_records_teacher_id ON financial_records(teacher_id) WHERE teacher_id IS NOT NULL;

-- Atualizar policy para usar teacher_id direto
DROP POLICY IF EXISTS "financial_records_select_policy" ON financial_records;
CREATE POLICY "financial_records_select_policy"
  ON financial_records FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND teacher_id = (SELECT public.get_teacher_id())
    )
    OR student_id = (SELECT public.get_student_id())
  );
```

---

### BUG-SEC-006
**SEVERIDADE:** MÉDIA  
**VETOR DE ATAQUE:** IDOR em `class_logs` INSERT — professor pode criar aula para aluno de outro professor

A policy de INSERT em `class_logs` não valida que o `student_id` pertence ao professor:

```sql
-- Policy atual (VULNERÁVEL)
WITH CHECK (
  (SELECT public.is_admin())
  OR ((SELECT public.is_teacher()) AND teacher_id = (SELECT public.get_teacher_id()))
)
```

**Ataque:** Professor A insere `class_log` com `teacher_id` correto (o seu) mas `student_id` de aluno do Professor B.

**FIX:**
```sql
DROP POLICY IF EXISTS "class_logs_insert_policy" ON class_logs;
CREATE POLICY "class_logs_insert_policy"
  ON class_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND teacher_id = (SELECT public.get_teacher_id())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );
```

---

### BUG-SEC-007
**SEVERIDADE:** MÉDIA  
**VETOR DE ATAQUE:** Enumeração de UUIDs via `teachers` SELECT

A policy de SELECT em `teachers` permite que alunos vejam dados do seu professor (incluindo `pix_key`). Embora intencional para pagamentos, um aluno pode tentar enumerar outros professores se souber UUIDs:

```sql
-- Aluno pode ver seu professor (intencional)
OR (
  (SELECT public.is_student())
  AND id IN (
    SELECT teacher_id FROM students WHERE id = (SELECT public.get_student_id())
  )
)
```

**Ataque:** Aluno autentica e tenta `GET /rest/v1/teachers?id=eq.<uuid_outro_professor>`. A policy bloqueia corretamente. Porém, a `pix_key` fica exposta para o aluno ver o PIX do seu professor — o que pode ser intencional mas deve ser documentado como decisão consciente.

**FIX:** Usar a view `teachers_with_pix_restricted` para alunos em vez da tabela direta, ou criar uma policy separada que oculta `pix_key` para alunos:
```sql
-- Criar view sem pix_key para alunos
CREATE OR REPLACE VIEW teacher_public_info
WITH (security_invoker = true) AS
SELECT id, name, email, phone, country, status
FROM teachers;
-- Alunos usam teacher_public_info, não teachers diretamente
```

---

### BUG-SEC-008
**SEVERIDADE:** BAIXA  
**VETOR DE ATAQUE:** Race condition em `idempotency_keys` — TOCTOU

O padrão de verificação de idempotência nas RPCs tem uma janela de race condition:

```sql
-- 1. SELECT para verificar se existe
SELECT * INTO v_record FROM idempotency_keys WHERE idempotency_key = p_key;
-- ← JANELA: outro request pode inserir aqui
-- 2. INSERT se não existe
INSERT INTO idempotency_keys (...) VALUES (...);
```

**Ataque:** Dois requests simultâneos com a mesma chave podem passar pela verificação antes de qualquer um inserir, resultando em operação duplicada.

**FIX:**
```sql
-- Usar INSERT ... ON CONFLICT para atomicidade
INSERT INTO idempotency_keys (idempotency_key, operation, user_id, request_payload, status)
VALUES (p_key, 'operation', auth.uid(), payload, 'processing')
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING *;

-- Se não inseriu (conflito), buscar o existente
IF NOT FOUND THEN
  SELECT * INTO v_record FROM idempotency_keys WHERE idempotency_key = p_key;
  -- Tratar conforme status
END IF;
```

---

## Migration de Correção

Todas as correções críticas (BUG-SEC-001, 002, 003, 006) estão em:
`supabase/migrations/23_security_rls_fixes.sql`

## Resumo de Severidade

| Bug | Severidade | Status |
|-----|-----------|--------|
| BUG-SEC-001 | CRÍTICA | Requer migration |
| BUG-SEC-002 | CRÍTICA | Requer migration |
| BUG-SEC-003 | CRÍTICA | Requer migration |
| BUG-SEC-004 | ALTA | Requer migration |
| BUG-SEC-005 | ALTA | Requer schema change |
| BUG-SEC-006 | MÉDIA | Requer migration |
| BUG-SEC-007 | MÉDIA | Decisão de produto |
| BUG-SEC-008 | BAIXA | Requer refactor de RPCs |
