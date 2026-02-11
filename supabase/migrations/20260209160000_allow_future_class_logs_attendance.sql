-- Permite cadastrar aulas com data futura (attendance NULL = agendada).
-- A coluna attendance tinha DEFAULT true: ao inserir sem valor, virava true e quebrava a constraint em datas futuras.
-- 1) Troca o default de attendance para NULL (aula agendada até ser avaliada).
-- 2) Ajusta a constraint: só proíbe attendance = true em data futura.
ALTER TABLE public.class_logs
  ALTER COLUMN attendance SET DEFAULT NULL;

ALTER TABLE public.class_logs
  DROP CONSTRAINT IF EXISTS chk_class_logs_no_future_attendance;

ALTER TABLE public.class_logs
  ADD CONSTRAINT chk_class_logs_no_future_attendance
  CHECK (
    (attendance IS DISTINCT FROM true) OR (class_date <= (CURRENT_DATE))
  );

COMMENT ON CONSTRAINT chk_class_logs_no_future_attendance ON public.class_logs IS
  'Só é permitido marcar presença (attendance = true) em aulas com data no passado ou hoje; aulas futuras e agendadas ficam com attendance NULL.';
