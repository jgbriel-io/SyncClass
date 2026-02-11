-- Cobrança única por pacote: um financial_record (class_log_id = null) pode estar vinculado
-- a várias aulas via esta tabela. Na listagem financeira aparece uma linha "Pacote mensal - N aulas";
-- em cada aula aparece "Vinculado ao pacote mensal".
CREATE TABLE IF NOT EXISTS public.financial_record_class_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_record_id UUID NOT NULL REFERENCES public.financial_records(id) ON DELETE CASCADE,
  class_log_id UUID NOT NULL REFERENCES public.class_logs(id) ON DELETE CASCADE,
  UNIQUE (class_log_id)
);

CREATE INDEX IF NOT EXISTS idx_frcl_financial_record_id ON public.financial_record_class_logs(financial_record_id);
CREATE INDEX IF NOT EXISTS idx_frcl_class_log_id ON public.financial_record_class_logs(class_log_id);

COMMENT ON TABLE public.financial_record_class_logs IS 'Vincula uma cobrança de pacote (financial_record com class_log_id null) a várias aulas.';
