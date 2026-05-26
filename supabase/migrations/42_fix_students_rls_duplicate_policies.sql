-- Migration 42: Fix duplicate permissive policies on students table
-- Root cause: migration 35 created consolidated policies, migration 38 added teacher-specific ones.
-- Both coexist → multiple permissive policies warning + security gaps in consolidated INSERT/UPDATE.
--
-- Security gaps found in consolidated:
--   INSERT: WITH CHECK = is_admin() OR is_teacher() (missing teacher_id = get_teacher_id())
--   UPDATE: no WITH CHECK at all (teacher could move student to another teacher)
--
-- Fix: drop all 8 overlapping policies, recreate 6 clean non-overlapping ones.

DROP POLICY IF EXISTS "students_delete_consolidated" ON public.students;
DROP POLICY IF EXISTS "students_insert_consolidated" ON public.students;
DROP POLICY IF EXISTS "students_select_consolidated" ON public.students;
DROP POLICY IF EXISTS "students_update_consolidated" ON public.students;
DROP POLICY IF EXISTS "teachers_students_delete" ON public.students;
DROP POLICY IF EXISTS "teachers_students_insert" ON public.students;
DROP POLICY IF EXISTS "teachers_students_select" ON public.students;
DROP POLICY IF EXISTS "teachers_students_update" ON public.students;

-- Admin: full access
CREATE POLICY "students_admin_all" ON public.students
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- Teacher: own students only, with strict teacher_id enforcement
CREATE POLICY "students_teacher_select" ON public.students
  FOR SELECT TO authenticated
  USING (
    (SELECT is_teacher())
    AND teacher_id = (SELECT get_teacher_id())
  );

CREATE POLICY "students_teacher_insert" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT is_teacher())
    AND teacher_id = (SELECT get_teacher_id())
  );

CREATE POLICY "students_teacher_update" ON public.students
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_teacher())
    AND teacher_id = (SELECT get_teacher_id())
  )
  WITH CHECK (
    (SELECT is_teacher())
    AND teacher_id = (SELECT get_teacher_id())
  );

CREATE POLICY "students_teacher_delete" ON public.students
  FOR DELETE TO authenticated
  USING (
    (SELECT is_teacher())
    AND teacher_id = (SELECT get_teacher_id())
  );

-- Student: own row only
CREATE POLICY "students_student_select" ON public.students
  FOR SELECT TO authenticated
  USING (id = (SELECT get_student_id()));
