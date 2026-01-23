-- Add status to teachers and sync with profiles.active

-- 1) Enum for teacher status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'teacher_status'
  ) THEN
    CREATE TYPE public.teacher_status AS ENUM ('ativo', 'inativo');
  END IF;
END $$;

-- 2) Add status column to teachers
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS status public.teacher_status NOT NULL DEFAULT 'ativo';

-- 3) Backfill existing rows to 'ativo' where null (safety)
UPDATE public.teachers
SET status = 'ativo'
WHERE status IS NULL;

-- 4) Sync profiles.active from teachers.status
CREATE OR REPLACE FUNCTION public.sync_profile_active_from_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET active = (NEW.status = 'ativo')
  WHERE teacher_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_teacher_status_change_sync_profile_active ON public.teachers;

CREATE TRIGGER on_teacher_status_change_sync_profile_active
AFTER INSERT OR UPDATE OF status ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_active_from_teacher();

-- 5) Backfill profiles.active for existing teacher links
UPDATE public.profiles p
SET active = (t.status = 'ativo')
FROM public.teachers t
WHERE p.teacher_id = t.id;
