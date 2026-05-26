-- Migration 39: Fix SECURITY DEFINER function grants
-- Root cause: PostgreSQL grants EXECUTE to PUBLIC by default on function creation.
-- Migration 37 did REVOKE FROM anon/authenticated which does NOT remove the PUBLIC grant.
-- Fix: REVOKE FROM PUBLIC (clears implicit anon+authenticated access), then selective GRANT.
--
-- Strategy:
--   Trigger functions  → REVOKE PUBLIC, no GRANT (invoked by DB engine, not users)
--   Internal only      → REVOKE PUBLIC, GRANT service_role
--   User-callable      → REVOKE PUBLIC, GRANT authenticated + service_role

-- ---------------------------------------------------------------------------
-- STEP 1 — REVOKE FROM PUBLIC (all 50 SECURITY DEFINER functions)
-- ---------------------------------------------------------------------------

-- Trigger functions
REVOKE EXECUTE ON FUNCTION public.delete_empty_package_financial() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_package_classes_before_financial_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invalidate_user_sessions_before() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_student_hourly_rate_manipulation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_student_sensitive_field_updates() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_teacher_sensitive_field_updates() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sanitize_activity_text() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sanitize_class_log_text() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sanitize_financial_text() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_package_on_class_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_activity_submission() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_activity_tenant_isolation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_class_log_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_financial_logic() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_student_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_teacher_data() FROM PUBLIC;

-- Internal / service_role only
REVOKE EXECUTE ON FUNCTION public.anonymize_student(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.anonymize_teacher(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_idempotency_keys() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive_data(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_info(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_summary(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.hard_delete_anonymized_records() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invalidate_sessions_before_delete(uuid) FROM PUBLIC;

-- User-callable (authenticated via RPC)
REVOKE EXECUTE ON FUNCTION public.check_phone_exists_platform(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_idempotent(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_class_package(class_log_input[], package_financial_input, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_class_logs_summary(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_financial_summary(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_student_balance(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_student_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_teacher_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_student() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_as_paid_idempotent(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_student(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_payment_proof(uuid, boolean, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.soft_delete_student(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.soft_delete_teacher(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.undo_payment_idempotent(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_profile_by_id(text, text, boolean, uuid, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_pix_key() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- STEP 2 — GRANT service_role for internal functions (Edge Functions / cron)
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.anonymize_student(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.anonymize_teacher(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_idempotency_keys() TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.encrypt_sensitive_data(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_info(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_summary(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.hard_delete_anonymized_records() TO service_role;
GRANT EXECUTE ON FUNCTION public.invalidate_sessions_before_delete(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- STEP 3 — GRANT authenticated + service_role for user-callable RPCs
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.check_phone_exists_platform(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_payment_idempotent(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_class_package(class_log_input[], package_financial_input, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_class_logs_summary(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_financial_summary(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_student_balance(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_student_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_teacher_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_student() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_as_paid_idempotent(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_student(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_payment_proof(uuid, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.soft_delete_student(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.soft_delete_teacher(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.undo_payment_idempotent(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_profile_by_id(text, text, boolean, uuid, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_pix_key() TO authenticated, service_role;
