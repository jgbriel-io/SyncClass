-- Migration: Add country column to masked views
-- Description: Updates students_masked and teachers_masked views to include the country column
-- Note: Phone masking removed as international formatting provides sufficient privacy

-- Drop existing views with CASCADE to handle dependencies
DROP VIEW IF EXISTS students_active_masked CASCADE;
DROP VIEW IF EXISTS students_masked CASCADE;
DROP VIEW IF EXISTS teachers_masked CASCADE;

-- Recreate students_masked view with country column (phone NOT masked)
CREATE OR REPLACE VIEW students_masked AS
SELECT 
  id,
  name,
  country,
  state,
  city,
  cpf,
  phone,
  email,
  birth_date,
  origin,
  status,
  hourly_rate,
  pay_day,
  teacher_id,
  created_at,
  updated_at
FROM students;

-- Recreate students_active_masked view (depends on students_masked)
CREATE OR REPLACE VIEW students_active_masked AS
SELECT *
FROM students_masked
WHERE status = 'ativo';

-- Recreate teachers_masked view with country column (phone NOT masked)
CREATE OR REPLACE VIEW teachers_masked AS
SELECT 
  id,
  name,
  country,
  cpf,
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

-- Add RLS policies (views inherit from base tables, but explicit for clarity)
ALTER VIEW students_masked SET (security_invoker = true);
ALTER VIEW students_active_masked SET (security_invoker = true);
ALTER VIEW teachers_masked SET (security_invoker = true);
