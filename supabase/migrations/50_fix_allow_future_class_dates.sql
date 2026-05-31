-- Remove validação que bloqueava class_date > CURRENT_DATE.
-- Sistema suporta aulas agendadas (status "Agendada") — datas futuras são válidas.
-- Mantém validação de start_at/end_at e cálculo de duration_minutes.
CREATE OR REPLACE FUNCTION public.validate_class_log_data()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
    IF NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL THEN
        IF NEW.end_at <= NEW.start_at THEN
            RAISE EXCEPTION 'Horário de término deve ser após horário de início';
        END IF;
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_at - NEW.start_at)) / 60;
    END IF;
    RETURN NEW;
END;
$$;
