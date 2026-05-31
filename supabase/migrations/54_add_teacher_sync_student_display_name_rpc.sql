-- Migration 54: RPC for teacher (and admin) to sync student display name
-- Problem: profiles_select_policy only allows users to read their own profile.
-- syncStudentProfiles() in useUpdateStudent queries profiles by student_id — returns empty for teacher.
-- update_profile_by_id() explicitly blocks non-admins with RAISE EXCEPTION.
-- Result: when teacher edits student name, profiles.full_name and auth.users stay stale.
--
-- Fix: SECURITY DEFINER RPC that:
--   - Validates caller is teacher owning the student (or admin)
--   - Updates profiles.full_name bypassing RLS
--   - Updates auth.users.raw_user_meta_data.full_name (requires postgres access to auth schema)

CREATE OR REPLACE FUNCTION public.teacher_sync_student_display_name(
  p_student_id UUID,
  p_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_teacher_id UUID;
  v_student_teacher_id UUID;
  v_profile_user_id UUID;
BEGIN
  IF (SELECT is_admin()) THEN
    NULL;
  ELSE
    v_teacher_id := get_teacher_id();
    IF v_teacher_id IS NULL THEN
      RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT teacher_id INTO v_student_teacher_id
    FROM students WHERE id = p_student_id;

    IF v_student_teacher_id IS DISTINCT FROM v_teacher_id THEN
      RAISE EXCEPTION 'Access denied: student does not belong to this teacher';
    END IF;
  END IF;

  UPDATE profiles
  SET full_name = p_name, updated_at = NOW()
  WHERE student_id = p_student_id
  RETURNING user_id INTO v_profile_user_id;

  IF v_profile_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', p_name)
    WHERE id = v_profile_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.teacher_sync_student_display_name(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_sync_student_display_name(UUID, TEXT) TO authenticated;
