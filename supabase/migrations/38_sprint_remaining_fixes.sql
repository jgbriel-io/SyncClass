-- Migration 38: Sprint remaining fixes
-- DB-002: students.teacher_id NOT NULL (with safety check for existing NULLs)
-- DB-007: Update class_logs date consistency CHECK to require both start_at and end_at when class_date defined
-- RLS-005: Replace FOR ALL on students with explicit policies to remove ambiguity

-- ---------------------------------------------------------------------------
-- DB-002 — students.teacher_id SET NOT NULL (only if no existing NULLs)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.students WHERE teacher_id IS NULL LIMIT 1) THEN
    RAISE NOTICE 'DB-002: students with NULL teacher_id found — NOT NULL constraint skipped. Clean data first.';
  ELSE
    ALTER TABLE public.students ALTER COLUMN teacher_id SET NOT NULL;
    RAISE NOTICE 'DB-002: students.teacher_id SET NOT NULL applied.';
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- DB-007 — class_logs date consistency CHECK
-- Require that if class_date is set, both start_at and end_at must also be set
-- (or all three must be null)
-- ---------------------------------------------------------------------------

ALTER TABLE public.class_logs DROP CONSTRAINT IF EXISTS check_class_date_consistency;

ALTER TABLE public.class_logs ADD CONSTRAINT check_class_date_consistency
  CHECK (
    (start_at IS NULL AND end_at IS NULL)
    OR (start_at IS NOT NULL AND end_at IS NOT NULL AND start_at::date = class_date)
  );

-- ---------------------------------------------------------------------------
-- RLS-005 — Replace FOR ALL with explicit policies on students
-- Admin "FOR ALL" + teacher "FOR ALL" coexist with explicit teacher SELECT policy
-- Replace teacher FOR ALL with explicit SELECT/INSERT/UPDATE/DELETE
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Teachers can manage their own students" ON public.students;

CREATE POLICY "teachers_students_select" ON public.students
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_teacher())
    AND teacher_id = (SELECT public.get_teacher_id())
  );

CREATE POLICY "teachers_students_insert" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_teacher())
    AND teacher_id = (SELECT public.get_teacher_id())
  );

CREATE POLICY "teachers_students_update" ON public.students
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_teacher())
    AND teacher_id = (SELECT public.get_teacher_id())
  )
  WITH CHECK (
    (SELECT public.is_teacher())
    AND teacher_id = (SELECT public.get_teacher_id())
  );

CREATE POLICY "teachers_students_delete" ON public.students
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_teacher())
    AND teacher_id = (SELECT public.get_teacher_id())
  );
