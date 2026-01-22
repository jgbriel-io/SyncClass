-- Consolidated script to fix handle_new_user and backfill user_roles
-- Run this entire script in your Supabase SQL Editor.

-- Step 1: Drop the existing function to ensure a clean replacement.
-- The CREATE OR REPLACE command can sometimes fail to update the function
-- signature or behavior if it has certain dependencies. Dropping it first
-- is a more robust way to ensure the new version is used.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Recreate the handle_new_user function with the correct logic.
-- This version explicitly inserts full_name and email into both profiles
-- and user_roles tables from the new user's metadata.
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Create a profile for the new user
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'student');
    
    -- Create a corresponding user_roles entry with helper columns for
    -- easy identification in the Supabase Table Editor.
    INSERT INTO public.user_roles (user_id, role, full_name, email)
    VALUES (NEW.id, 'student', NEW.raw_user_meta_data->>'full_name', NEW.email);
    
    RETURN NEW;
END;
$$;

-- Step 3: Re-attach the trigger to the auth.users table.
-- This ensures the function created above is executed every time a new user signs up.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Run the backfill script again to fix existing records.
-- This will update any user_roles rows where full_name or email are still NULL.
UPDATE public.user_roles ur
SET
  full_name = COALESCE(ur.full_name, p.full_name),
  email     = COALESCE(ur.email, p.email, u.email)
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.user_id = ur.user_id
  AND (ur.full_name IS NULL OR ur.email IS NULL);

-- Step 5 (Optional): Verify that no NULL values remain.
-- After running the script, you can run this query to confirm the fix.
-- It should return 0 rows.
-- SELECT user_id, full_name, email FROM public.user_roles WHERE full_name IS NULL OR email IS NULL;
