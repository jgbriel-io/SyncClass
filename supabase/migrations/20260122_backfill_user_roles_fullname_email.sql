-- Backfill user_roles.full_name and user_roles.email where NULL
-- Run this migration in Supabase SQL editor or via the supabase CLI.

UPDATE public.user_roles ur
SET
  full_name = COALESCE(ur.full_name, p.full_name),
  email     = COALESCE(ur.email, p.email, u.email)
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.user_id = ur.user_id
  AND (ur.full_name IS NULL OR ur.email IS NULL);

-- Optional: verify rows that remain null after running
-- SELECT * FROM public.user_roles WHERE full_name IS NULL OR email IS NULL;
