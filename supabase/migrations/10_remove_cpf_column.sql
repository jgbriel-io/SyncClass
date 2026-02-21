-- Migration: Remove CPF column from students and teachers
-- Description: CPF is no longer collected or used in the platform

-- Drop ALL views that reference students/teachers tables (will be recreated)
DROP VIEW IF EXISTS students_active_masked CASCADE;
DROP VIEW IF EXISTS students_masked CASCADE;
DROP VIEW IF EXISTS students_active CASCADE;
DROP VIEW IF EXISTS students_with_stats CASCADE;
DROP VIEW IF EXISTS teachers_masked CASCADE;

-- Drop unique indexes for CPF
DROP INDEX IF EXISTS idx_students_cpf_unique;
DROP INDEX IF EXISTS idx_teachers_cpf_unique;
DROP INDEX IF EXISTS students_cpf_unique_when_not_null;

-- Drop RPC function that checks CPF existence
DROP FUNCTION IF EXISTS check_cpf_exists_platform(TEXT);

-- Remove CPF column from students table
ALTER TABLE students DROP COLUMN IF EXISTS cpf;

-- Remove CPF column from teachers table
ALTER TABLE teachers DROP COLUMN IF EXISTS cpf;

-- Recreate students_with_stats view WITHOUT cpf column
CREATE OR REPLACE VIEW students_with_stats
WITH (security_invoker = true) AS
SELECT 
  s.id,
  s.name,
  s.country,
  s.phone,
  s.email,
  s.pay_day,
  s.hourly_rate,
  s.is_deleted,
  s.status,
  s.teacher_id,
  s.birth_date,
  s.city,
  s.state,
  s.origin,
  s.created_at,
  s.updated_at,
  s.anonymized_at,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance = true) as total_classes_attended,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance = false) as total_classes_missed,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance IS NULL) as total_classes_pending,
  COALESCE(SUM(fr.amount) FILTER (WHERE fr.status = 'pendente'), 0) as total_pending_amount,
  COALESCE(SUM(fr.amount) FILTER (WHERE fr.status = 'pago'), 0) as total_paid_amount,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'pendente') as total_activities_pending,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'entregue') as total_activities_delivered,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'corrigida') as total_activities_corrected
FROM students s
LEFT JOIN class_logs cl ON cl.student_id = s.id
LEFT JOIN financial_records fr ON fr.student_id = s.id
LEFT JOIN activities a ON a.student_id = s.id
GROUP BY s.id;

-- Recreate students_active view WITHOUT cpf column
CREATE OR REPLACE VIEW students_active AS
SELECT * FROM students WHERE is_deleted = false OR status = 'ativo';

-- Recreate students_masked view WITHOUT cpf column
CREATE OR REPLACE VIEW students_masked AS
SELECT 
  id,
  name,
  country,
  state,
  city,
  phone,
  email,
  birth_date,
  origin,
  status,
  hourly_rate,
  pay_day,
  teacher_id,
  created_at,
  updated_at,
  is_deleted,
  anonymized_at
FROM students;

-- Recreate students_active_masked view
CREATE OR REPLACE VIEW students_active_masked AS
SELECT *
FROM students_masked
WHERE status = 'ativo' AND (anonymized_at IS NULL OR anonymized_at > NOW() - INTERVAL '5 years');

-- Recreate teachers_masked view WITHOUT cpf column
CREATE OR REPLACE VIEW teachers_masked AS
SELECT 
  id,
  name,
  country,
  phone,
  email,
  status,
  created_at,
  updated_at
FROM teachers;

-- Grant permissions
GRANT SELECT ON students_masked TO authenticated;
GRANT SELECT ON students_active_masked TO authenticated;
GRANT SELECT ON teachers_masked TO authenticated;

-- Add RLS policies
ALTER VIEW students_masked SET (security_invoker = true);
ALTER VIEW students_active_masked SET (security_invoker = true);
ALTER VIEW teachers_masked SET (security_invoker = true);

-- Add comments
COMMENT ON VIEW students_masked IS 'Students view without CPF (removed from platform)';
COMMENT ON VIEW students_active_masked IS 'Active students view without CPF';
COMMENT ON VIEW teachers_masked IS 'Teachers view without CPF (removed from platform)';

-- Grant permissions on all views
GRANT SELECT ON students_with_stats TO authenticated;
GRANT SELECT ON students_active TO authenticated;
GRANT SELECT ON students_masked TO authenticated;
GRANT SELECT ON students_active_masked TO authenticated;
GRANT SELECT ON teachers_masked TO authenticated;

-- Set security invoker for all views
ALTER VIEW students_with_stats SET (security_invoker = true);
ALTER VIEW students_active SET (security_invoker = true);
ALTER VIEW students_masked SET (security_invoker = true);
ALTER VIEW students_active_masked SET (security_invoker = true);
ALTER VIEW teachers_masked SET (security_invoker = true);

-- Add comments
COMMENT ON VIEW students_with_stats IS 'Students with aggregated statistics (CPF removed)';
COMMENT ON VIEW students_active IS 'Active students only (CPF removed)';
COMMENT ON VIEW students_masked IS 'Students view without CPF (removed from platform)';
COMMENT ON VIEW students_active_masked IS 'Active students view without CPF';
COMMENT ON VIEW teachers_masked IS 'Teachers view without CPF (removed from platform)';
