-- ============================================================
-- Blindagem temporal: integridade de class_logs
-- ============================================================
-- 1. Bloqueio de presença futura: attendance=true só se class_date <= hoje
-- 2. Grade NULL em faltas: se attendance=false, grade deve ser NULL
-- ============================================================

-- Ajustar dados existentes que violariam as constraints
UPDATE public.class_logs SET attendance = false, grade = NULL
  WHERE class_date > CURRENT_DATE AND attendance = true;

UPDATE public.class_logs SET grade = NULL
  WHERE attendance = false AND grade IS NOT NULL;

-- 1. Presença futura: não permite attendance=true para datas futuras
ALTER TABLE public.class_logs
  DROP CONSTRAINT IF EXISTS chk_class_logs_no_future_attendance;

ALTER TABLE public.class_logs
  ADD CONSTRAINT chk_class_logs_no_future_attendance
  CHECK (
    (attendance = false) OR (class_date <= (CURRENT_DATE))
  );

COMMENT ON CONSTRAINT chk_class_logs_no_future_attendance ON public.class_logs IS
  'Presença (attendance=true) só é permitida para datas passadas ou hoje';

-- 2. Grade NULL em faltas: ausente não pode ter nota
ALTER TABLE public.class_logs
  DROP CONSTRAINT IF EXISTS chk_class_logs_grade_null_when_absent;

ALTER TABLE public.class_logs
  ADD CONSTRAINT chk_class_logs_grade_null_when_absent
  CHECK (
    (attendance = true) OR (grade IS NULL)
  );

COMMENT ON CONSTRAINT chk_class_logs_grade_null_when_absent ON public.class_logs IS
  'Quando attendance=false, grade deve ser NULL';
