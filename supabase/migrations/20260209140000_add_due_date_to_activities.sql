-- Prazo de entrega para atividades: professor define ao criar; aluno entrega no prazo ou fica "atrasado"
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS due_date DATE;

-- Backfill: atividades existentes recebem data de criação como prazo (evita "vencida")
UPDATE public.activities
  SET due_date = (created_at::timestamptz)::date
  WHERE due_date IS NULL;

ALTER TABLE public.activities
  ALTER COLUMN due_date SET NOT NULL;

COMMENT ON COLUMN public.activities.due_date IS 'Prazo para o aluno entregar; após essa data fica "Vencida" ou "Entregue com atraso"';
