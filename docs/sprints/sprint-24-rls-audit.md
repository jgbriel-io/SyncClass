# Sprint 24 — RLS Full Audit

**Período:** 25/05/2026  
**Status:** ✅ Concluída — 6/6 itens implementados  
**Tipo:** Segurança

## Contexto

Auditoria exaustiva de todas as RLS policies em todas as migrations. Cobre cada
tabela × cada operação (SELECT/INSERT/UPDATE/DELETE) para os 3 roles (admin,
teacher, student). Sprint 23 identificou 2 gaps em INSERT (BE-001/002) — esta
auditoria revelou que migration `23_security_rls_fixes.sql` já os corrigiu, e
encontrou 3 novos gaps em UPDATE e validação de ownership.

---

## Correções já aplicadas (referência)

As policies identificadas em BE-001 e BE-002 (sprint-23) foram corrigidas pela
migration `23_security_rls_fixes.sql` antes desta auditoria. Documentadas aqui
para rastreabilidade.

---

## Itens

### RLS-001 — `financial_records` UPDATE sem check de ownership

**Severidade:** 🟠 Alta  
**Esforço:** 20min  
**Implementado:** ✅ Já corrigido em migration 23_security_rls_fixes.sql (financial_records_update_policy)  
**Arquivo:** `supabase/migrations/04_rls_and_permissions.sql:271`

**Problema:** Policy de UPDATE em `financial_records` checa apenas se o usuário
é teacher (`is_teacher()`), sem validar que o `student_id` do registro pertence
a esse professor. Teacher pode atualizar status/valor de cobranças de alunos de
outros professores.

**Fix:**

```sql
CREATE POLICY "financial_records_update" ON public.financial_records
  FOR UPDATE USING (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students WHERE teacher_id = auth.uid()
      )
    )
  );
```

**Critério de aceite:** Teacher A não consegue atualizar `financial_records` de
aluno do Teacher B. Verificar via `supabase.from('financial_records').update(...)`
com usuário teacher em teste.

---

### RLS-002 — `class_logs` INSERT checa `teacher_id` mas não ownership do aluno

**Severidade:** 🟠 Alta  
**Esforço:** 20min  
**Implementado:** ✅ Já corrigido em migration 23_security_rls_fixes.sql (class_logs_insert_policy)  
**Arquivo:** `supabase/migrations/04_rls_and_permissions.sql:220`

**Problema:** Policy de INSERT em `class_logs` verifica `teacher_id = get_teacher_id()`
(garantindo que o campo `teacher_id` da aula é o professor autenticado), mas não
valida que o `student_id` pertence a esse professor. Teacher pode criar aula com
`student_id` de aluno de outro professor, usando o próprio `teacher_id`.

**Fix:**

```sql
CREATE POLICY "class_logs_insert" ON public.class_logs
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
    OR (
      teacher_id = (SELECT public.get_teacher_id())
      AND student_id IN (
        SELECT id FROM students WHERE teacher_id = auth.uid()
      )
    )
  );
```

**Critério de aceite:** INSERT de `class_logs` com `student_id` de aluno alheio
retorna erro RLS, mesmo que `teacher_id` seja válido.

---

### RLS-003 — `financial_record_class_logs` INSERT sem validação de ownership

**Severidade:** 🟠 Alta  
**Esforço:** 25min  
**Implementado:** ✅ migration 35_sprint24_rls_audit_fixes.sql  
**Arquivo:** `supabase/migrations/04_rls_and_permissions.sql:311`

**Problema:** Tabela de junção `financial_record_class_logs` tem policy de INSERT
que permite teacher inserir qualquer par `(financial_record_id, class_log_id)` sem
verificar que ambos pertencem a alunos desse professor. Teacher pode associar
cobranças de outros professores a aulas próprias (e vice-versa).

**Fix:**

```sql
CREATE POLICY "financial_record_class_logs_insert" ON public.financial_record_class_logs
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND financial_record_id IN (
        SELECT fr.id FROM financial_records fr
        JOIN students s ON s.id = fr.student_id
        WHERE s.teacher_id = auth.uid()
      )
      AND class_log_id IN (
        SELECT cl.id FROM class_logs cl
        JOIN students s ON s.id = cl.student_id
        WHERE s.teacher_id = auth.uid()
      )
    )
  );
```

**Critério de aceite:** INSERT de junction com IDs de professores diferentes
retorna erro RLS. INSERT com IDs próprios funciona normalmente.

---

### RLS-004 — `rate_limit_tracker` usa `auth.uid()` sem cast explícito

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Implementado:** ✅ migration 35_sprint24_rls_audit_fixes.sql  
**Arquivo:** `supabase/migrations/07_add_rate_limiting.sql:30`

**Problema:** Policies de `rate_limits` usam `user_id = auth.uid()` sem cast
para `::uuid`. Migrations 17/18 corrigiram esse padrão em `profiles` e `user_roles`
via `17_fix_rls_policies_uuid_cast.sql`, mas `rate_limits` ficou inconsistente.
Não causa bug funcional (PostgreSQL faz coerção implícita), mas viola convenção do projeto.

**Fix:**

```sql
user_id = (auth.uid())::uuid
```

**Critério de aceite:** Todas as policies usam cast explícito para `::uuid`.
Grep por `auth.uid()` sem cast retorna 0 hits em policies de `rate_limits`.

---

### RLS-005 — Policy `FOR ALL` em students redundante com policies explícitas

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Implementado:** ✅ migration 38_sprint_remaining_fixes.sql — FOR ALL teacher policy substituída por 4 policies explícitas  
**Arquivo:** `supabase/migrations/04_rls_and_permissions.sql:144`

**Problema:** "Admins can manage all students" usa `FOR ALL` que cobre
SELECT/INSERT/UPDATE/DELETE. Policies explícitas de DELETE existem abaixo (linha 238+).
`FOR ALL` sobreposto a policies explícitas pode causar confusão sobre qual regra
prevalece — PostgreSQL aplica ambas via OR, mas a intenção fica obscura.

**Fix:** Substituir `FOR ALL` por policies explícitas (SELECT, INSERT, UPDATE, DELETE)
separadas, ou remover as duplicatas explícitas e deixar apenas o `FOR ALL`.

**Critério de aceite:** Cada tabela tem policies com comandos explícitos (não `FOR ALL`),
ou exclusivamente `FOR ALL` sem duplicatas.

---

### RLS-006 — `user_roles` UPDATE sem `WITH CHECK`

**Severidade:** 🔵 Info  
**Esforço:** 10min  
**Implementado:** ✅ migration 35_sprint24_rls_audit_fixes.sql — WITH CHECK adicionado  
**Arquivo:** `supabase/migrations/17_fix_rls_policies_uuid_cast.sql:62`

**Problema:** Policy de UPDATE em `user_roles` tem `USING` (restringe quais linhas
podem ser selecionadas para update) mas sem `WITH CHECK` (restringe os novos valores).
Admin pode tecnicamente mudar um role para valor arbitrário não previsto pelo schema.

**Fix:**

```sql
CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE
  USING ((SELECT public.is_admin()))
  WITH CHECK (
    (SELECT public.is_admin())
    AND role IN ('admin', 'teacher', 'student')
  );
```

**Critério de aceite:** UPDATE de `user_roles` com `role = 'superuser'` (valor
inválido) rejeitado pela policy mesmo sendo admin.

---

## Ordem de Implementação Recomendada

| #   | Item    | Esforço | Risco | Impacto                                       |
| --- | ------- | ------- | ----- | --------------------------------------------- |
| 1   | RLS-001 | 20min   | Alto  | 🟠 Teacher atualiza dados financeiros alheios |
| 2   | RLS-002 | 20min   | Alto  | 🟠 class_logs ownership incompleto            |
| 3   | RLS-003 | 25min   | Alto  | 🟠 Junction table sem validação de ownership  |
| 4   | RLS-004 | 10min   | Baixo | 🔵 Cast explícito em rate_limits              |
| 5   | RLS-005 | 10min   | Baixo | 🔵 FOR ALL redundante em students             |
| 6   | RLS-006 | 10min   | Baixo | 🔵 WITH CHECK faltante em user_roles UPDATE   |

**Total estimado:** ~1h35min

## Dependências

- RLS-001, RLS-002, RLS-003 requerem nova migration (ALTER POLICY ou DROP + CREATE)
- RLS-004, RLS-005, RLS-006 são ajustes em migrations existentes via `CREATE OR REPLACE POLICY`
- Após qualquer alteração de policy: testar com usuário teacher e verificar que queries retornam apenas dados próprios

## Referências

- [Sprint 23](./sprint-23-backend-quality-fixes.md) — BE-001/002: gaps de INSERT (já corrigidos por migration 23)
- `supabase/migrations/04_rls_and_permissions.sql` — policies principais
- `supabase/migrations/07_add_rate_limiting.sql` — RLS-004
- `supabase/migrations/17_fix_rls_policies_uuid_cast.sql` — RLS-006
- `supabase/migrations/23_security_rls_fixes.sql` — fixes anteriores de referência
