-- Prazo com data e hora: alterar due_date de DATE para TIMESTAMPTZ
-- Existentes: data atual vira fim do dia 23:59:59 em São Paulo
ALTER TABLE public.activities
  ALTER COLUMN due_date TYPE TIMESTAMPTZ
  USING (
    (due_date::date + time '23:59:59')
    AT TIME ZONE 'America/Sao_Paulo'
  );

COMMENT ON COLUMN public.activities.due_date IS 'Prazo (data e hora) para o aluno entregar; após esse momento fica "Vencida" ou "Entregue com atraso"';
