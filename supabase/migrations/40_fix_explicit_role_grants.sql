-- Migration 40: Remove explicit anon/authenticated grants left from prior migrations
-- Migration 39 removed PUBLIC grant but explicit role grants survived.
-- Current state (from proacl):
--   - authenticated has EXECUTE on ALL 50 SECURITY DEFINER functions
--   - anon has EXECUTE on 13 functions not covered by migration 37

-- ---------------------------------------------------------------------------
-- PART A — REVOKE FROM anon (13 functions still anon-accessible)
-- Migration 37 missed these or they had grants added before.
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.confirm_payment_idempotent(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_rate_limit(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_class_logs_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_financial_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_summary(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_student_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_as_paid_idempotent(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_teacher(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.undo_payment_idempotent(uuid, text) FROM anon;

-- ---------------------------------------------------------------------------
-- PART B — REVOKE FROM authenticated for trigger + service_role-only functions
-- These should never be user-callable. All 50 functions have authenticated
-- grant from prior migrations; restrict the 28 that don't need it.
-- ---------------------------------------------------------------------------

-- Trigger functions (called by DB engine only)
REVOKE EXECUTE ON FUNCTION public.delete_empty_package_financial() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_package_classes_before_financial_delete() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.invalidate_user_sessions_before() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_student_hourly_rate_manipulation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_student_sensitive_field_updates() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_teacher_sensitive_field_updates() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_activity_text() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_class_log_text() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_financial_text() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_package_on_class_delete() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_activity_submission() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_activity_tenant_isolation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_class_log_data() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_financial_logic() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_student_data() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_teacher_data() FROM authenticated;

-- service_role-only (Edge Functions / cron / internal ops)
REVOKE EXECUTE ON FUNCTION public.anonymize_student(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.anonymize_teacher(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_logs() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_idempotency_keys() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive_data(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_rate_limit(text, integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_info(text, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_summary(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_delete_anonymized_records() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.invalidate_sessions_before_delete(uuid) FROM authenticated;
