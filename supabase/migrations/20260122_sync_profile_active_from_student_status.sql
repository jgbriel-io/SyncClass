-- Sync profiles.active with students.status so that when a student
-- is deactivated, their associated user profile is also deactivated.

-- Function to update profiles.active based on the student's status.
CREATE OR REPLACE FUNCTION public.sync_profile_active_from_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- When a student's status changes, reflect that on any linked profile.
  UPDATE public.profiles
  SET active = (NEW.status = 'ativo')
  WHERE student_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger that fires after insert or status update on students.
DROP TRIGGER IF EXISTS on_student_status_change_sync_profile_active ON public.students;

CREATE TRIGGER on_student_status_change_sync_profile_active
AFTER INSERT OR UPDATE OF status ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_active_from_student();

-- Backfill: ensure profiles.active is correct for existing rows.
UPDATE public.profiles p
SET active = (
  SELECT (s.status = 'ativo')
  FROM public.students s
  WHERE s.id = p.student_id
)
WHERE p.student_id IS NOT NULL;
