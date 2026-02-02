-- Professor vê telefone sem máscara dos seus alunos (CPF continua mascarado).
-- Recreates students_active_masked e students_masked com phone desmascarado
-- quando o usuário é o professor responsável pelo aluno.

DROP VIEW IF EXISTS public.students_active_masked;
DROP VIEW IF EXISTS public.students_masked;

CREATE VIEW public.students_active_masked
WITH (security_invoker = true) AS
SELECT 
    s.id,
    s.name,
    CASE 
        WHEN public.is_admin() THEN s.cpf
        ELSE public.mask_cpf(s.cpf)
    END AS cpf,
    CASE 
        WHEN public.is_admin() THEN s.phone
        WHEN (public.get_my_teacher_id() IS NOT NULL AND s.teacher_id = public.get_my_teacher_id()) THEN s.phone
        ELSE public.mask_phone(s.phone)
    END AS phone,
    s.email,
    s.origin,
    s.status,
    s.birth_date,
    s.city,
    s.state,
    s.hourly_rate,
    s.classes_per_week,
    s.pay_day,
    s.teacher_id,
    s.created_at,
    s.updated_at
FROM public.students s
WHERE s.deleted_at IS NULL;

CREATE VIEW public.students_masked
WITH (security_invoker = true) AS
SELECT 
    s.id,
    s.name,
    CASE 
        WHEN public.is_admin() THEN s.cpf
        ELSE public.mask_cpf(s.cpf)
    END AS cpf,
    CASE 
        WHEN public.is_admin() THEN s.phone
        WHEN (public.get_my_teacher_id() IS NOT NULL AND s.teacher_id = public.get_my_teacher_id()) THEN s.phone
        ELSE public.mask_phone(s.phone)
    END AS phone,
    s.email,
    s.origin,
    s.status,
    s.birth_date,
    s.city,
    s.state,
    s.hourly_rate,
    s.classes_per_week,
    s.pay_day,
    s.teacher_id,
    s.created_at,
    s.updated_at
FROM public.students s;

COMMENT ON VIEW public.students_active_masked IS 
'Alunos ativos com CPF/telefone mascarados (LGPD). Professor vê telefone sem máscara dos seus alunos. SECURITY INVOKER.';
COMMENT ON VIEW public.students_masked IS 
'Students com CPF/telefone mascarados (LGPD). Professor vê telefone sem máscara dos seus alunos. SECURITY INVOKER.';

GRANT SELECT ON public.students_active_masked TO authenticated;
GRANT SELECT ON public.students_masked TO authenticated;
