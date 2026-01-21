-- Add helper columns directly on user_roles so they show up in the
-- existing table in Supabase Table Editor

ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS email text;

-- Backfill helper columns from profiles/auth.users for existing rows
UPDATE public.user_roles ur
SET
  full_name = COALESCE(ur.full_name, p.full_name),
  email     = COALESCE(ur.email, p.email, u.email)
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.user_id = ur.user_id;

-- In case a view with this name was created previously, clean it up
DROP VIEW IF EXISTS public.user_roles_with_profile;
