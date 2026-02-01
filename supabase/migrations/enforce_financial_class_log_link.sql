-- ============================================================
-- Cobrança obrigatória vinculada a aula - Bloqueio de avulsa
-- ============================================================
-- Impede criação de financial_records sem class_log_id.
-- Cobranças avulsas não são permitidas (nem para admin).
-- class_log_id já existe em financial_records (consolidated_schema).
-- ============================================================

-- Trigger: bloquear INSERT quando class_log_id é NULL
CREATE OR REPLACE FUNCTION public.check_financial_requires_class_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.class_log_id IS NULL THEN
    RAISE EXCEPTION 'Cobranças devem ser vinculadas a uma aula. Registre a aula na aba Aulas.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_financial_requires_class_log ON public.financial_records;
CREATE TRIGGER trg_check_financial_requires_class_log
  BEFORE INSERT ON public.financial_records
  FOR EACH ROW
  EXECUTE FUNCTION public.check_financial_requires_class_log();

COMMENT ON FUNCTION public.check_financial_requires_class_log() IS
  'Bloqueia INSERT de financial_records sem class_log_id. Cobranças avulsas não são permitidas.';
