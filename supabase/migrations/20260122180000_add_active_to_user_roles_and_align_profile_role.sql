-- Add `active` flag to user_roles and keep it aligned with profiles.active

-- 1) Add column to user_roles
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2) Backfill active in user_roles from profiles.active when possible
UPDATE public.user_roles ur
SET active = COALESCE(p.active, true)
FROM public.profiles p
WHERE p.user_id = ur.user_id;

-- 3) Keep user_roles.active in sync when profiles.active changes
CREATE OR REPLACE FUNCTION public.sync_user_roles_active_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Avoid unnecessary work if value didn't change
  IF TG_OP = 'UPDATE' AND NEW.active IS NOT DISTINCT FROM OLD.active THEN
    RETURN NEW;
  END IF;

  -- Reflect profile active flag into all roles for that user
  UPDATE public.user_roles
  SET active = NEW.active
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_active_change_sync_user_roles ON public.profiles;

CREATE TRIGGER on_profile_active_change_sync_user_roles
AFTER INSERT OR UPDATE OF active ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_active_from_profile();

-- 4) Keep profiles.active in sync when user_roles.active changes (reverse sync)
CREATE OR REPLACE FUNCTION public.sync_profile_active_from_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Avoid unnecessary work if value didn't change
  IF TG_OP = 'UPDATE' AND NEW.active IS NOT DISTINCT FROM OLD.active THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET active = NEW.active
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_roles_active_change_sync_profile ON public.user_roles;

CREATE TRIGGER on_user_roles_active_change_sync_profile
AFTER INSERT OR UPDATE OF active ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_active_from_user_roles();

-- 5) Align profiles.role type with user_roles.role (app_role enum)
--    This assumes existing values are valid app_role literals ('admin','student','teacher').
ALTER TABLE public.profiles
ALTER COLUMN role TYPE app_role
USING role::app_role;
