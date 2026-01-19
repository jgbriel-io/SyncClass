-- Adicionar coluna class_log_id na tabela financial_records
ALTER TABLE public.financial_records 
ADD COLUMN class_log_id uuid REFERENCES public.class_logs(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_financial_records_class_log_id ON public.financial_records(class_log_id);

-- Adicionar constraint unique para garantir relação 1:1 (uma cobrança por aula)
ALTER TABLE public.financial_records 
ADD CONSTRAINT unique_class_log_id UNIQUE (class_log_id);