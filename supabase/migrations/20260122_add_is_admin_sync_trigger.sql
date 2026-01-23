-- Migration to add a synchronized `is_admin` flag to the `profiles` table.
-- This flag is automatically kept in sync with the `user_roles` table.

-- Step 1: Add the `is_admin` column to the `profiles` table.
-- We default it to `false`.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create the trigger function that will handle the synchronization.
CREATE OR REPLACE FUNCTION public.sync_profile_is_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    is_now_admin BOOLEAN;
BEGIN
    -- Determine the user_id from the operation
    IF (TG_OP = 'DELETE') THEN
        v_user_id := OLD.user_id;
    ELSE
        v_user_id := NEW.user_id;
    END IF;

    -- Check if the user still has an 'admin' role after the change.
    -- This covers all cases: INSERT, UPDATE, DELETE.
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = v_user_id AND role = 'admin'
    ) INTO is_now_admin;

    -- Update the `is_admin` flag on the corresponding profile.
    UPDATE public.profiles
    SET is_admin = is_now_admin
    WHERE user_id = v_user_id;

    -- Return the appropriate record for the trigger operation
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Step 3: Create the trigger on the `user_roles` table.
-- This trigger will fire after any INSERT, UPDATE, or DELETE operation.
-- We drop it first to ensure we're not creating a duplicate.
DROP TRIGGER IF EXISTS on_user_roles_change_sync_is_admin ON public.user_roles;

CREATE TRIGGER on_user_roles_change_sync_is_admin
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_is_admin();

-- Step 4: Backfill the `is_admin` flag for all existing users.
-- This ensures historical data is correct.
UPDATE public.profiles p
SET is_admin = EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'admin'
);

-- Optional: You can verify the backfill with this query.
-- SELECT u.email, p.is_admin
-- FROM public.profiles p
-- JOIN auth.users u ON p.user_id = u.id;
