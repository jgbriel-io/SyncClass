-- Migration 43: Merge admin branch into each action-specific policy
-- FOR ALL admin policy creates 4 internal entries (SELECT/INSERT/UPDATE/DELETE)
-- that conflict with the 4 teacher+student policies → still 2+ permissive per action.
-- Fix: drop FOR ALL admin + role-specific policies, merge all into 4 single action policies.

DROP POLICY IF EXISTS "students_admin_all" ON public.students;
DROP POLICY IF EXISTS "students_teacher_select" ON public.students;
DROP POLICY IF EXISTS "students_teacher_insert" ON public.students;
DROP POLICY IF EXISTS "students_teacher_update" ON public.students;
DROP POLICY IF EXISTS "students_teacher_delete" ON public.students;
DROP POLICY IF EXISTS "students_student_select" ON public.students;

CREATE POLICY "students_select" ON public.students
  FOR SELECT TO authenticated
  USING (
    (SELECT is_admin())
    OR ((SELECT is_teacher()) AND teacher_id = (SELECT get_teacher_id()))
    OR (id = (SELECT get_student_id()))
  );

CREATE POLICY "students_insert" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT is_admin())
    OR ((SELECT is_teacher()) AND teacher_id = (SELECT get_teacher_id()))
  );

CREATE POLICY "students_update" ON public.students
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_admin())
    OR ((SELECT is_teacher()) AND teacher_id = (SELECT get_teacher_id()))
  )
  WITH CHECK (
    (SELECT is_admin())
    OR ((SELECT is_teacher()) AND teacher_id = (SELECT get_teacher_id()))
  );

CREATE POLICY "students_delete" ON public.students
  FOR DELETE TO authenticated
  USING (
    (SELECT is_admin())
    OR ((SELECT is_teacher()) AND teacher_id = (SELECT get_teacher_id()))
  );
