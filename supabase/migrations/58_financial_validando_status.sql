-- Migration 58: Promote 'validando' to explicit stored status on financial_records.
-- Previously derived in code from payment_proof_status = 'pending'.
-- Now stored directly, making workflow state explicit and queryable.
-- Flow: pendente → validando (proof uploaded) → pago (approved) | pendente (rejected)

ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS check_valid_financial_logic;
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_status_check;

ALTER TABLE financial_records ADD CONSTRAINT financial_records_status_check CHECK (
  status = ANY (ARRAY['pendente','pago','cancelado','abonado','extornado','validando'])
);

ALTER TABLE financial_records ADD CONSTRAINT check_valid_financial_logic CHECK (
  (amount > 0 AND status = 'pago' AND amount <= 10000)
  OR
  (status IN ('pendente','cancelado','abonado','extornado','validando'))
);

CREATE OR REPLACE FUNCTION public.submit_payment_proof(
  p_financial_record_id UUID,
  p_proof_url TEXT,
  p_proof_filename TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student_id UUID;
  v_record_student_id UUID;
BEGIN
  IF NOT (SELECT public.is_student()) THEN
    RAISE EXCEPTION 'Apenas alunos podem enviar comprovantes';
  END IF;

  v_student_id := (SELECT public.get_student_id());

  SELECT student_id INTO v_record_student_id
  FROM financial_records WHERE id = p_financial_record_id;

  IF v_record_student_id IS NULL THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF v_record_student_id != v_student_id THEN
    RAISE EXCEPTION 'Esta cobrança não pertence a você';
  END IF;

  UPDATE financial_records
  SET
    payment_proof_url        = p_proof_url,
    payment_proof_filename   = p_proof_filename,
    payment_proof_uploaded_at = NOW(),
    payment_proof_status     = 'pending',
    status                   = 'validando'
  WHERE id = p_financial_record_id;

  INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
  VALUES (auth.uid(), 'UPDATE', 'submit_payment_proof', 'financial_records',
          p_financial_record_id, jsonb_build_object('filename', p_proof_filename));

  RETURN jsonb_build_object('success', true,
    'message', 'Comprovante enviado com sucesso! Aguarde a confirmação do professor.');
END;
$$;

-- Backfill existing records
UPDATE financial_records
SET status = 'validando'
WHERE payment_proof_status = 'pending' AND status = 'pendente';
