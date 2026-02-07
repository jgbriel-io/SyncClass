-- Hard delete student/teacher records (used by admin-delete-user Edge Function).
-- SECURITY DEFINER so RLS does not block the delete.

CREATE OR REPLACE FUNCTION public.hard_delete_student_record(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.students WHERE id = p_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hard_delete_teacher_record(p_teacher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.teachers WHERE id = p_teacher_id;
END;
$$;

-- Allow service_role (Edge Function) to call these
GRANT EXECUTE ON FUNCTION public.hard_delete_student_record(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.hard_delete_teacher_record(UUID) TO service_role;
