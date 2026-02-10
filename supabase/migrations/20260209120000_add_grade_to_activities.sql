-- Nota de 0 a 10 na correção da atividade (opcional)
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS grade NUMERIC(3,1) NULL;

COMMENT ON COLUMN public.activities.grade IS 'Nota da correção (0 a 10), definida pelo professor ao corrigir';
