-- Ensure helper columns on user_roles are always populated for new users
-- and backfill any rows that might still be null.

-- Backfill again for safety (in case some users were created after the
-- previous backfill migration and before this one)
UPDATE public.user_roles ur
SET
  full_name = COALESCE(ur.full_name, p.full_name),
  email     = COALESCE(ur.email, p.email, u.email)
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.user_id = ur.user_id;

-- Update handle_new_user trigger function to also store full_name/email
-- in user_roles helper columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Create profile with full metadata
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'student');
    
    -- Create role row including helper columns so it is easy to identify
    -- in Supabase Table Editor
    INSERT INTO public.user_roles (user_id, role, full_name, email)
    VALUES (NEW.id, 'student', NEW.raw_user_meta_data->>'full_name', NEW.email);
    
    RETURN NEW;
END;
$$;