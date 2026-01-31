-- ============================================================
-- Views SECURITY INVOKER - Correção RLS
-- ============================================================
-- Views em Postgres usam SECURITY DEFINER por padrão, executando
-- com permissões do owner e IGNORANDO RLS. Com security_invoker = true,
-- a view executa com as permissões do usuário que consulta,
-- respeitando as políticas RLS das tabelas base.
--
-- Impacto: Professor passa a ver APENAS seus alunos nas views.
-- Mascaramento LGPD (CPF/telefone) continua funcionando normalmente.
--
-- DROP antes de CREATE evita erro de incompatibilidade de colunas
-- quando a view existente foi criada com schema diferente.
-- ============================================================

-- ============================================================
-- DROP VIEWS (ordem: dependentes primeiro)
-- ============================================================

DROP VIEW IF EXISTS public.student_complete_balance;
DROP VIEW IF EXISTS public.class_logs_with_billing;
DROP VIEW IF EXISTS public.students_active_masked;
DROP VIEW IF EXISTS public.students_active;
DROP VIEW IF EXISTS public.students_masked;
DROP VIEW IF EXISTS public.teachers_masked;
DROP VIEW IF EXISTS public.student_financial_balance;
DROP VIEW IF EXISTS public.student_class_stats;

-- ============================================================
-- 1. student_financial_balance
-- ============================================================

CREATE VIEW public.student_financial_balance
WITH (security_invoker = true) AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    COALESCE(SUM(CASE WHEN fr.status = 'pago' THEN fr.amount ELSE 0 END), 0) AS total_paid,
    COALESCE(SUM(
        CASE 
            WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE 
            THEN fr.amount 
            ELSE 0 
        END
    ), 0) AS total_pending,
    COALESCE(SUM(
        CASE 
            WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE 
            THEN fr.amount 
            ELSE 0 
        END
    ), 0) AS total_overdue,
    COALESCE(SUM(
        CASE 
            WHEN fr.status = 'pendente' 
            THEN fr.amount 
            ELSE 0 
        END
    ), 0) AS total_unpaid,
    COUNT(CASE WHEN fr.status = 'pago' THEN 1 END) AS count_paid,
    COUNT(CASE WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 1 END) AS count_pending,
    COUNT(CASE WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 1 END) AS count_overdue
FROM 
    public.students s
LEFT JOIN 
    public.financial_records fr ON fr.student_id = s.id
GROUP BY 
    s.id, s.name;

-- ============================================================
-- 2. student_class_stats
-- ============================================================

CREATE VIEW public.student_class_stats
WITH (security_invoker = true) AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    COUNT(cl.id) AS total_classes,
    COUNT(CASE WHEN cl.attendance = true THEN 1 END) AS present_classes,
    COUNT(CASE WHEN cl.attendance = false THEN 1 END) AS absent_classes,
    CASE 
        WHEN COUNT(cl.id) > 0 
        THEN ROUND((COUNT(CASE WHEN cl.attendance = true THEN 1 END)::NUMERIC / COUNT(cl.id)::NUMERIC) * 100, 1)
        ELSE 0 
    END AS attendance_rate,
    ROUND(AVG(CASE WHEN cl.grade IS NOT NULL THEN cl.grade ELSE NULL END), 1) AS average_grade,
    COUNT(CASE WHEN cl.grade IS NOT NULL THEN 1 END) AS graded_classes,
    MAX(cl.class_date) AS last_class_date,
    MIN(cl.class_date) AS first_class_date
FROM 
    public.students s
LEFT JOIN 
    public.class_logs cl ON cl.student_id = s.id
GROUP BY 
    s.id, s.name;

-- ============================================================
-- 3. student_complete_balance (depende de 1 e 2)
-- ============================================================

CREATE VIEW public.student_complete_balance
WITH (security_invoker = true) AS
SELECT 
    s.id,
    s.name,
    s.email,
    s.phone,
    s.cpf,
    s.status,
    s.origin,
    s.birth_date,
    s.city,
    s.state,
    s.hourly_rate,
    s.classes_per_week,
    s.pay_day,
    s.teacher_id,
    s.created_at,
    s.updated_at,
    COALESCE(fb.total_paid, 0) AS total_paid,
    COALESCE(fb.total_pending, 0) AS total_pending,
    COALESCE(fb.total_overdue, 0) AS total_overdue,
    COALESCE(fb.total_unpaid, 0) AS total_unpaid,
    COALESCE(fb.count_paid, 0) AS count_paid,
    COALESCE(fb.count_pending, 0) AS count_pending,
    COALESCE(fb.count_overdue, 0) AS count_overdue,
    COALESCE(cs.total_classes, 0) AS total_classes,
    COALESCE(cs.present_classes, 0) AS present_classes,
    COALESCE(cs.absent_classes, 0) AS absent_classes,
    COALESCE(cs.attendance_rate, 0) AS attendance_rate,
    COALESCE(cs.average_grade, 0) AS average_grade,
    COALESCE(cs.graded_classes, 0) AS graded_classes,
    cs.last_class_date,
    cs.first_class_date
FROM 
    public.students s
LEFT JOIN 
    public.student_financial_balance fb ON fb.student_id = s.id
LEFT JOIN 
    public.student_class_stats cs ON cs.student_id = s.id
WHERE 
    s.deleted_at IS NULL;

-- ============================================================
-- 4. students_active
-- ============================================================

CREATE VIEW public.students_active
WITH (security_invoker = true) AS
SELECT 
    id,
    name,
    cpf,
    phone,
    email,
    origin,
    status,
    birth_date,
    city,
    state,
    hourly_rate,
    classes_per_week,
    pay_day,
    teacher_id,
    created_at,
    updated_at
FROM public.students
WHERE deleted_at IS NULL;

-- ============================================================
-- 5. students_active_masked
-- ============================================================

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

-- ============================================================
-- 6. students_masked
-- ============================================================

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

-- ============================================================
-- 7. teachers_masked
-- ============================================================

CREATE VIEW public.teachers_masked
WITH (security_invoker = true) AS
SELECT 
    t.id,
    t.name,
    t.email,
    CASE 
        WHEN public.is_admin() THEN t.cpf
        ELSE public.mask_cpf(t.cpf)
    END AS cpf,
    CASE 
        WHEN public.is_admin() THEN t.phone
        ELSE public.mask_phone(t.phone)
    END AS phone,
    t.specialization,
    t.status,
    t.created_at,
    t.updated_at
FROM public.teachers t;

-- ============================================================
-- 8. class_logs_with_billing
-- ============================================================

CREATE VIEW public.class_logs_with_billing
WITH (security_invoker = true) AS
SELECT 
    cl.id AS class_log_id,
    cl.student_id,
    cl.teacher_id,
    cl.class_date,
    cl.attendance,
    cl.title,
    cl.grade,
    cl.feedback,
    cl.created_at,
    fr.id AS financial_record_id,
    fr.amount AS billed_amount,
    fr.status AS billing_status,
    fr.due_date AS billing_due_date,
    fr.paid_at AS billing_paid_at,
    CASE 
        WHEN fr.id IS NULL THEN 'not_billed'
        WHEN fr.status = 'pago' THEN 'paid'
        WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 'pending'
        WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'unknown'
    END AS billing_status_consolidated,
    s.name AS student_name,
    t.name AS teacher_name
FROM 
    public.class_logs cl
LEFT JOIN 
    public.financial_records fr ON fr.class_log_id = cl.id
LEFT JOIN
    public.students s ON s.id = cl.student_id
LEFT JOIN
    public.teachers t ON t.id = cl.teacher_id
ORDER BY 
    cl.class_date DESC;

-- ============================================================
-- COMENTÁRIOS (preservar documentação)
-- ============================================================

COMMENT ON VIEW public.student_financial_balance IS 
'Saldo financeiro por aluno. SECURITY INVOKER: respeita RLS.';

COMMENT ON VIEW public.student_class_stats IS 
'Estatísticas de aulas por aluno. SECURITY INVOKER: respeita RLS.';

COMMENT ON VIEW public.student_complete_balance IS 
'Dados completos do aluno + saldo + stats. SECURITY INVOKER: respeita RLS. Exclui deletados.';

COMMENT ON VIEW public.students_active IS 
'Alunos não deletados. SECURITY INVOKER: respeita RLS.';

COMMENT ON VIEW public.students_active_masked IS 
'Alunos ativos com CPF/telefone mascarados (LGPD). SECURITY INVOKER: respeita RLS.';

COMMENT ON VIEW public.students_masked IS 
'Students com CPF/telefone mascarados (LGPD). SECURITY INVOKER: respeita RLS.';

COMMENT ON VIEW public.teachers_masked IS 
'Teachers com CPF/telefone mascarados (LGPD). SECURITY INVOKER: respeita RLS.';

COMMENT ON VIEW public.class_logs_with_billing IS 
'Aulas com status de cobrança. SECURITY INVOKER: respeita RLS.';

-- ============================================================
-- GRANTS (restaurar permissões após DROP)
-- ============================================================

GRANT SELECT ON public.student_financial_balance TO authenticated;
GRANT SELECT ON public.student_class_stats TO authenticated;
GRANT SELECT ON public.student_complete_balance TO authenticated;
GRANT SELECT ON public.students_active TO authenticated;
GRANT SELECT ON public.students_active_masked TO authenticated;
GRANT SELECT ON public.students_masked TO authenticated;
GRANT SELECT ON public.teachers_masked TO authenticated;
GRANT SELECT ON public.class_logs_with_billing TO authenticated;
