-- attendance tinha DEFAULT true: ao inserir sem valor (ex.: pacote de aulas), a linha vinha com
-- attendance = true e a constraint chk_class_logs_no_future_attendance bloqueava datas futuras.
-- Novo default NULL = aula agendada até o professor marcar presença/falta.
ALTER TABLE public.class_logs
  ALTER COLUMN attendance SET DEFAULT NULL;
