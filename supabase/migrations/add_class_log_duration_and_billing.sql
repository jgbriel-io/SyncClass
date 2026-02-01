-- ============================================================
-- Adiciona duração e cálculo de cobrança por aula em class_logs
-- ============================================================
-- Não remove dados existentes; mantém compatibilidade.
-- billed_amount tem prioridade como override manual; se nulo,
-- valor = hourly_rate * (duration_minutes / 60) no momento da criação.
-- ============================================================

-- 1. Novas colunas em class_logs
ALTER TABLE public.class_logs
  ADD COLUMN IF NOT EXISTS start_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS end_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NULL,
  ADD COLUMN IF NOT EXISTS billed_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS observations text NULL;

COMMENT ON COLUMN public.class_logs.start_at IS
  'Horário de início da aula. Usado com end_at para calcular duration_minutes automaticamente.';

COMMENT ON COLUMN public.class_logs.end_at IS
  'Horário de fim da aula. Usado com start_at para calcular duration_minutes automaticamente.';

COMMENT ON COLUMN public.class_logs.duration_minutes IS
  'Duração da aula em minutos. Pode ser preenchido manualmente ou calculado por trigger quando start_at e end_at são fornecidos. Usado para cobrança: amount = hourly_rate * (duration_minutes / 60) quando billed_amount é nulo.';

COMMENT ON COLUMN public.class_logs.billed_amount IS
  'Override manual do valor da cobrança. Tem prioridade sobre o cálculo automático. Se nulo, financial_records.amount = hourly_rate * (duration_minutes / 60).';

COMMENT ON COLUMN public.class_logs.observations IS
  'Observações pré-aula (notas do professor antes da aula). Feedback pós-aula fica em feedback.';

-- 2. Trigger para popular duration_minutes quando start_at e end_at são fornecidos
CREATE OR REPLACE FUNCTION public.compute_class_log_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL AND NEW.start_at < NEW.end_at THEN
    NEW.duration_minutes := (EXTRACT(EPOCH FROM (NEW.end_at - NEW.start_at)) / 60)::integer;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_class_log_duration ON public.class_logs;
CREATE TRIGGER trg_compute_class_log_duration
  BEFORE INSERT OR UPDATE OF start_at, end_at
  ON public.class_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_class_log_duration();
