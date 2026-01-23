-- Add optional state (UF) to students so we can have UF + city
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS state text;
