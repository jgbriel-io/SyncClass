CREATE OR REPLACE FUNCTION public.get_teacher_avatar_url(p_teacher_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT avatar_url FROM public.profiles WHERE teacher_id = p_teacher_id LIMIT 1;
$$;

DROP VIEW IF EXISTS teachers_masked CASCADE;

CREATE VIEW teachers_masked
WITH (security_invoker = true) AS
SELECT
  id,
  CASE
    WHEN anonymized_at IS NOT NULL THEN name
    ELSE name
  END AS name,
  country,
  phone,
  email,
  address,
  hourly_rate,
  pix_key,
  is_deleted,
  status,
  created_at,
  updated_at,
  anonymized_at,
  public.get_teacher_avatar_url(id) AS avatar_url
FROM teachers;

COMMENT ON VIEW teachers_masked IS 'Professores com nome anonimizado se aplicável (LGPD)';

GRANT SELECT ON teachers_masked TO authenticated;
