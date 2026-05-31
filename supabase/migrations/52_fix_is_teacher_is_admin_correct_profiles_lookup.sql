-- Migration 52: fix is_teacher() and is_admin() broken function bodies
-- is_teacher() had: SELECT EXISTS(SELECT 1 FROM teachers WHERE id = auth.uid())
--   → compared teachers.id (domain UUID) with auth.uid() (auth UUID) — NEVER matches
--   → every teacher saw 0 students, 0 classes, 0 financial records (all RLS blocked)
-- is_admin() had: WHERE user_id = auth.uid() without ::text cast — type mismatch risk
-- is_student() was already correct (user_id::text = auth.uid()::text)

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
