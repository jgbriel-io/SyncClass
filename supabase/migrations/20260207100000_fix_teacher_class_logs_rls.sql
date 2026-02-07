-- Corrige a política de RLS para a tabela class_logs, permitindo que professores
-- vejam aulas que eles ministraram diretamente (via class_logs.teacher_id)
-- ou aulas de alunos que são atualmente seus (via students.teacher_id).
-- Isso resolve o problema de um professor não conseguir ver suas próprias aulas
-- se o aluno for transferido para outro professor.

-- 1. Garante que o estado esteja limpo, removendo políticas antigas e as novas (se existirem).
DROP POLICY IF EXISTS "class_logs_select" ON "public"."class_logs";
DROP POLICY IF EXISTS "class_logs_admin_teacher_all" ON "public"."class_logs";
DROP POLICY IF EXISTS "teacher_can_read_own_class_logs" ON "public"."class_logs";
DROP POLICY IF EXISTS "teacher_can_manage_own_class_logs" ON "public"."class_logs";

-- 2. Cria a nova política de seleção (SELECT) corrigida.
-- Um usuário pode LER um registro de aula se:
--   a) For um administrador.
--   b) For o professor associado à aula (verificado via profiles.user_id).
--   c) For o professor principal do aluno (verificado via profiles.user_id).
--   d) For o próprio aluno (verificado via profiles.user_id).
CREATE POLICY "teacher_can_read_own_class_logs" ON "public"."class_logs"
FOR SELECT
TO authenticated
USING (
  (is_admin()) OR
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND profiles.teacher_id = class_logs.teacher_id)) OR
  (EXISTS (SELECT 1 FROM students s JOIN profiles p ON s.teacher_id = p.teacher_id WHERE s.id = class_logs.student_id AND p.user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND profiles.student_id = class_logs.student_id))
);

-- 3. Cria a nova política "tudo" (INSERT, UPDATE, DELETE) corrigida.
-- Um usuário pode ESCREVER em um registro de aula se:
--   a) For um administrador.
--   b) For o professor associado à aula.
--   c) For o professor principal do aluno.
CREATE POLICY "teacher_can_manage_own_class_logs" ON "public"."class_logs"
FOR ALL
TO authenticated
USING (
  (is_admin()) OR
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND profiles.teacher_id = class_logs.teacher_id)) OR
  (EXISTS (SELECT 1 FROM students s JOIN profiles p ON s.teacher_id = p.teacher_id WHERE s.id = class_logs.student_id AND p.user_id = auth.uid()))
)
WITH CHECK (
  (is_admin()) OR
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND profiles.teacher_id = class_logs.teacher_id)) OR
  (EXISTS (SELECT 1 FROM students s JOIN profiles p ON s.teacher_id = p.teacher_id WHERE s.id = class_logs.student_id AND p.user_id = auth.uid()))
);
