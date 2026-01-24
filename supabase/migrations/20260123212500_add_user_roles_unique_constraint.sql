-- Remove duplicate user_roles entries, keeping only the most recent one per user
DELETE FROM public.user_roles a
WHERE a.ctid NOT IN (
  SELECT MAX(b.ctid)
  FROM public.user_roles b
  WHERE b.user_id = a.user_id
  GROUP BY b.user_id
);

-- Add unique constraint to prevent duplicate user_id entries
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT user_roles_user_id_key ON public.user_roles 
IS 'Ensures each user can have only one role entry';
