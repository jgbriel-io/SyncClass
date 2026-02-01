-- ============================================================
-- Fix: RLS em user_roles ao sincronizar na edição de aluno
-- ============================================================
-- useUpdateStudent faz upsert em user_roles para alunos com conta.
-- Professores precisam poder atualizar user_roles dos seus alunos.
-- Admins já têm user_roles_admin_all; INSERT precisa de WITH CHECK explícito.
-- ============================================================

-- Garantir que admins podem INSERT/UPDATE qualquer row em user_roles
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all"
  ON public.user_roles FOR ALL
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Professores podem atualizar/inserir user_roles de usuários vinculados aos seus alunos
CREATE POLICY "user_roles_teacher_sync_student"
  ON public.user_roles FOR ALL
  USING (
    (SELECT public.get_my_teacher_id()) IS NOT NULL
    AND user_id IN (
      SELECT p.user_id FROM public.profiles p
      JOIN public.students s ON s.id = p.student_id
      WHERE s.teacher_id = (SELECT public.get_my_teacher_id())
        AND p.user_id IS NOT NULL
    )
  )
  WITH CHECK (
    (SELECT public.get_my_teacher_id()) IS NOT NULL
    AND user_id IN (
      SELECT p.user_id FROM public.profiles p
      JOIN public.students s ON s.id = p.student_id
      WHERE s.teacher_id = (SELECT public.get_my_teacher_id())
        AND p.user_id IS NOT NULL
    )
  );
