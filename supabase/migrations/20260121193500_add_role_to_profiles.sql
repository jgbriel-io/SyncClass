-- Add role column to profiles and backfill from user_roles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text;

-- Backfill role for existing profiles from user_roles
UPDATE public.profiles p
SET role = r.role
FROM public.user_roles r
WHERE p.user_id = r.user_id
  AND (p.role IS NULL OR p.role = '');

-- Update handle_new_user trigger function to also store role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'student');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    RETURN NEW;
END;
$$;
