-- Migration 51: fix get_teacher_id() and get_student_id() text cast
-- Root cause: migration 04 defined both functions with `WHERE user_id = auth.uid()` (uuid = uuid).
-- Migration 18 fixed is_admin() and is_teacher() with ::text cast, but skipped these two.
-- When profiles.user_id is varchar/text, the uuid comparison returns NULL → RLS always false.
-- Effect: teacher saw 0 students; student RLS also broken by same pattern.

CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT teacher_id FROM profiles WHERE user_id::text = (auth.uid())::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT student_id FROM profiles WHERE user_id::text = (auth.uid())::text LIMIT 1;
$$;
