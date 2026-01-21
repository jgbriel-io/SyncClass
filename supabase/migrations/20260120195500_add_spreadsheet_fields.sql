DO $$
BEGIN
  -- Add city column to students if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'city'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN city TEXT;
  END IF;

  -- Add hourly_rate column to students if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN hourly_rate NUMERIC(10,2);
  END IF;

  -- Add classes_per_week column to students if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'classes_per_week'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN classes_per_week INTEGER;
  END IF;

  -- Add pay_day column (day of month) to students if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'pay_day'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN pay_day INTEGER CHECK (pay_day BETWEEN 1 AND 31);
  END IF;

  -- Add payment_method column to financial_records if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'financial_records'
      AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.financial_records
      ADD COLUMN payment_method TEXT;
  END IF;
END $$;
