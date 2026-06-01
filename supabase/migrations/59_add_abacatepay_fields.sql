-- ============================================================
-- Migration 59: AbacatePay integration fields
-- Adds PIX payment tracking columns to financial_records
-- and creates webhook idempotency log table.
-- ============================================================

ALTER TABLE financial_records
  ADD COLUMN IF NOT EXISTS payment_provider TEXT
    CHECK (payment_provider IN ('abacate_pay', 'manual')),
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS pix_code TEXT,
  ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_financial_external_payment
  ON financial_records(external_payment_id)
  WHERE external_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS webhook_processing_log (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     TEXT        NOT NULL,
  gateway      TEXT        NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, gateway)
);

ALTER TABLE webhook_processing_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE webhook_processing_log IS
  'Idempotency log for incoming webhook events from payment gateways';
