-- Sprint 27: Supabase Advisors Security + Performance Fixes

-- ============================================
-- ADV-001: Revoke anon access to sensitive SECURITY DEFINER functions
-- ============================================
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_financial_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_class_logs_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_profile_by_id(text, text, boolean, uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_teacher(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_student() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_student_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.anonymize_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.anonymize_teacher(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.hard_delete_anonymized_records() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_performance(text, integer, jsonb) FROM anon;

-- ============================================
-- ADV-002: Restrict privileged functions to service_role only
-- ============================================
REVOKE EXECUTE ON FUNCTION public.anonymize_student(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_student(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.anonymize_teacher(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_teacher(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.hard_delete_anonymized_records() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.hard_delete_anonymized_records() TO service_role;

REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) TO service_role;

-- ============================================
-- ADV-005: Add missing index on activities.deleted_by FK
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activities_deleted_by
  ON public.activities(deleted_by)
  WHERE deleted_by IS NOT NULL;

-- ============================================
-- ADV-006: Drop confirmed-unused indexes
-- (keeping performance-sensitive ones that may grow with data)
-- ============================================
DROP INDEX IF EXISTS public.idx_activities_active;
DROP INDEX IF EXISTS public.idx_activities_status_active;
DROP INDEX IF EXISTS public.idx_activities_student_active;
DROP INDEX IF EXISTS public.idx_activities_teacher_active;
DROP INDEX IF EXISTS public.idx_activities_teacher_status;
DROP INDEX IF EXISTS public.idx_activities_due_date_open;
DROP INDEX IF EXISTS public.idx_activities_dashboard_created;
DROP INDEX IF EXISTS public.idx_activities_dashboard_student;
DROP INDEX IF EXISTS public.idx_activities_dashboard_teacher;
DROP INDEX IF EXISTS public.idx_activities_dashboard_status;
DROP INDEX IF EXISTS public.idx_activities_dashboard_due_date;
DROP INDEX IF EXISTS public.idx_teachers_pix_configured;
DROP INDEX IF EXISTS public.idx_teachers_email;
DROP INDEX IF EXISTS public.idx_profiles_must_change_password;
DROP INDEX IF EXISTS public.idx_financial_dashboard_student;
DROP INDEX IF EXISTS public.idx_financial_dashboard_teacher;
DROP INDEX IF EXISTS public.idx_financial_dashboard_status;
DROP INDEX IF EXISTS public.idx_financial_dashboard_due_date;
DROP INDEX IF EXISTS public.idx_financial_dashboard_created;
DROP INDEX IF EXISTS public.idx_audit_logs_table_name;
DROP INDEX IF EXISTS public.idx_idempotency_keys_created_at;
