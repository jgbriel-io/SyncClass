-- ============================================================
-- Fix: Professores podem atualizar alunos vinculados a eles
-- ============================================================
-- Sem isso, apenas admins podiam fazer UPDATE em students.
-- Professores precisam editar dados dos seus alunos.
-- ============================================================

CREATE POLICY "students_update_teacher"
  ON public.students FOR UPDATE
  USING (teacher_id = (SELECT public.get_my_teacher_id()))
  WITH CHECK (teacher_id = (SELECT public.get_my_teacher_id()));
