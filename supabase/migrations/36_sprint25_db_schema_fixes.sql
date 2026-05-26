-- Sprint 25: Database Schema Fixes

-- DB-001: Allow amount = 0 in financial_records (dispensed charges, waivers)
ALTER TABLE public.financial_records
  DROP CONSTRAINT IF EXISTS financial_records_amount_check;
ALTER TABLE public.financial_records
  ADD CONSTRAINT financial_records_amount_check CHECK (amount >= 0);

-- DB-003: Reject zero/negative duration_minutes in class_logs
ALTER TABLE public.class_logs
  DROP CONSTRAINT IF EXISTS class_logs_duration_minutes_check;
ALTER TABLE public.class_logs
  ADD CONSTRAINT class_logs_duration_minutes_check
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);

-- DB-004: Reject negative billed_amount in class_logs
ALTER TABLE public.class_logs
  DROP CONSTRAINT IF EXISTS class_logs_billed_amount_check;
ALTER TABLE public.class_logs
  ADD CONSTRAINT class_logs_billed_amount_check
  CHECK (billed_amount IS NULL OR billed_amount >= 0);

-- DB-005: Reject negative hourly_rate in students and teachers
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_hourly_rate_check;
ALTER TABLE public.students
  ADD CONSTRAINT students_hourly_rate_check
  CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

ALTER TABLE public.teachers
  DROP CONSTRAINT IF EXISTS teachers_hourly_rate_check;
ALTER TABLE public.teachers
  ADD CONSTRAINT teachers_hourly_rate_check
  CHECK (hourly_rate IS NULL OR hourly_rate >= 0);

-- DB-008: Replace full index with partial index on class_logs.teacher_id
DROP INDEX IF EXISTS public.idx_class_logs_teacher_id;
CREATE INDEX idx_class_logs_teacher_id
  ON public.class_logs(teacher_id)
  WHERE teacher_id IS NOT NULL;

-- DB-009: Partial index for overdue financial_records queries
DROP INDEX IF EXISTS public.idx_financial_records_overdue;
CREATE INDEX idx_financial_records_overdue
  ON public.financial_records(due_date)
  WHERE status = 'pendente';
