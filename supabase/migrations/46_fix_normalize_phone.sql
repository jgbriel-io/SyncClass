-- Migration 46: Create missing normalize_phone function
-- normalize_student_phone trigger called this but it was never defined.

CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_phone IS NULL OR p_phone = '' THEN
    RETURN p_phone;
  END IF;
  -- Keep only digits and leading +
  RETURN regexp_replace(
    CASE WHEN p_phone LIKE '+%'
      THEN '+' || regexp_replace(substring(p_phone FROM 2), '[^0-9]', '', 'g')
      ELSE regexp_replace(p_phone, '[^0-9]', '', 'g')
    END,
    '^$', '', 'g'
  );
END;
$$;
