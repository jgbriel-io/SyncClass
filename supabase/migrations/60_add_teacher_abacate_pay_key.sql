-- ============================================================
-- Migration 60: Per-teacher AbacatePay credentials
-- Each teacher stores their own AbacatePay API key and a
-- unique webhook secret so they receive payments directly.
-- ============================================================

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS abacate_pay_api_key TEXT,
  ADD COLUMN IF NOT EXISTS abacate_pay_webhook_secret TEXT;

COMMENT ON COLUMN teachers.abacate_pay_api_key IS
  'AbacatePay API key for this teacher — used by Edge Function to create PIX charges on their behalf';
COMMENT ON COLUMN teachers.abacate_pay_webhook_secret IS
  'Per-teacher webhook secret — included in the webhook URL registered in AbacatePay dashboard';
