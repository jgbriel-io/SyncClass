-- Link profiles to teachers (optional per user)
ALTER TABLE public.profiles
ADD COLUMN teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_teacher_id ON public.profiles(teacher_id);

-- Helper: get current user's teacher_id
CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Helper: check if current user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'teacher');
$$;
