-- Remove a restrição que impede financial_records com class_log_id NULL
-- Isso é necessário para permitir cobranças de pacotes de aulas, que são
-- vinculadas a múltiplas aulas via financial_record_class_logs

-- Drop o trigger existente
DROP TRIGGER IF EXISTS trg_check_financial_requires_class_log ON public.financial_records;

-- Drop a função que fazia a validação
DROP FUNCTION IF EXISTS public.check_financial_requires_class_log();
