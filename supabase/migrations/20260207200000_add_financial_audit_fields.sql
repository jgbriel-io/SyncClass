-- Migration: add audit fields to financial_records
-- Adiciona campos de auditoria para registro de confirmação de pagamento

ALTER TABLE public.financial_records
ADD COLUMN IF NOT EXISTS confirmed_by_user_id UUID,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Adiciona constraint de FK com nome explícito
ALTER TABLE public.financial_records
DROP CONSTRAINT IF EXISTS fk_financial_records_confirmed_by_user;

ALTER TABLE public.financial_records
ADD CONSTRAINT fk_financial_records_confirmed_by_user
FOREIGN KEY (confirmed_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.financial_records.confirmed_by_user_id IS 'ID do usuário que confirmou o pagamento';
COMMENT ON COLUMN public.financial_records.confirmed_at IS 'Data e hora da confirmação do pagamento';
