-- ============================================================
-- Student Balance View - Cálculo de Saldo no Banco
-- ============================================================
-- Esta migration cria uma View que calcula o saldo de cada aluno
-- diretamente no banco de dados, eliminando a necessidade de
-- cálculos no frontend (mais rápido e consistente).
-- ============================================================

-- ============================================================
-- 1. VIEW: student_financial_balance
-- ============================================================
-- Calcula o saldo financeiro consolidado por aluno
-- Retorna: total pago, total pendente, total atrasado

CREATE OR REPLACE VIEW public.student_financial_balance AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    -- Total pago
    COALESCE(SUM(CASE WHEN fr.status = 'pago' THEN fr.amount ELSE 0 END), 0) AS total_paid,
    -- Total pendente (status pendente e não atrasado)
    COALESCE(SUM(
        CASE 
            WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE 
            THEN fr.amount 
            ELSE 0 
        END
    ), 0) AS total_pending,
    -- Total atrasado (status pendente e vencido)
    COALESCE(SUM(
        CASE 
            WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE 
            THEN fr.amount 
            ELSE 0 
        END
    ), 0) AS total_overdue,
    -- Total geral a receber (pendente + atrasado)
    COALESCE(SUM(
        CASE 
            WHEN fr.status = 'pendente' 
            THEN fr.amount 
            ELSE 0 
        END
    ), 0) AS total_unpaid,
    -- Contadores
    COUNT(CASE WHEN fr.status = 'pago' THEN 1 END) AS count_paid,
    COUNT(CASE WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 1 END) AS count_pending,
    COUNT(CASE WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 1 END) AS count_overdue
FROM 
    public.students s
LEFT JOIN 
    public.financial_records fr ON fr.student_id = s.id
GROUP BY 
    s.id, s.name;

COMMENT ON VIEW public.student_financial_balance IS 
'View que calcula o saldo financeiro consolidado de cada aluno. Elimina necessidade de cálculos no frontend.';

-- ============================================================
-- 2. VIEW: student_class_stats
-- ============================================================
-- Calcula estatísticas de aulas por aluno
-- Retorna: total de aulas, presenças, faltas, média de notas

CREATE OR REPLACE VIEW public.student_class_stats AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    -- Total de aulas
    COUNT(cl.id) AS total_classes,
    -- Total de presenças
    COUNT(CASE WHEN cl.attendance = true THEN 1 END) AS present_classes,
    -- Total de faltas
    COUNT(CASE WHEN cl.attendance = false THEN 1 END) AS absent_classes,
    -- Taxa de presença (%)
    CASE 
        WHEN COUNT(cl.id) > 0 
        THEN ROUND((COUNT(CASE WHEN cl.attendance = true THEN 1 END)::NUMERIC / COUNT(cl.id)::NUMERIC) * 100, 1)
        ELSE 0 
    END AS attendance_rate,
    -- Média de notas (apenas aulas com nota)
    ROUND(AVG(CASE WHEN cl.grade IS NOT NULL THEN cl.grade ELSE NULL END), 1) AS average_grade,
    -- Total de aulas avaliadas (com nota)
    COUNT(CASE WHEN cl.grade IS NOT NULL THEN 1 END) AS graded_classes,
    -- Data da última aula
    MAX(cl.class_date) AS last_class_date,
    -- Data da primeira aula
    MIN(cl.class_date) AS first_class_date
FROM 
    public.students s
LEFT JOIN 
    public.class_logs cl ON cl.student_id = s.id
GROUP BY 
    s.id, s.name;

COMMENT ON VIEW public.student_class_stats IS 
'View que calcula estatísticas de aulas de cada aluno. Elimina necessidade de cálculos no frontend.';

-- ============================================================
-- 3. VIEW: student_complete_balance
-- ============================================================
-- Combina saldo financeiro + estatísticas de aulas
-- Esta é a view principal que o frontend deve usar

CREATE OR REPLACE VIEW public.student_complete_balance AS
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
    -- Dados financeiros (da view student_financial_balance)
    COALESCE(fb.total_paid, 0) AS total_paid,
    COALESCE(fb.total_pending, 0) AS total_pending,
    COALESCE(fb.total_overdue, 0) AS total_overdue,
    COALESCE(fb.total_unpaid, 0) AS total_unpaid,
    COALESCE(fb.count_paid, 0) AS count_paid,
    COALESCE(fb.count_pending, 0) AS count_pending,
    COALESCE(fb.count_overdue, 0) AS count_overdue,
    -- Dados de aulas (da view student_class_stats)
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
    public.student_class_stats cs ON cs.student_id = s.id;

COMMENT ON VIEW public.student_complete_balance IS 
'View consolidada com todos os dados do aluno + saldo financeiro + estatísticas de aulas. Use esta view para dashboards e listagens.';

-- ============================================================
-- 4. GRANTS - Permissões
-- ============================================================

-- Conceder SELECT nas views para usuários autenticados
GRANT SELECT ON public.student_financial_balance TO authenticated;
GRANT SELECT ON public.student_class_stats TO authenticated;
GRANT SELECT ON public.student_complete_balance TO authenticated;

-- ============================================================
-- 5. FUNÇÃO HELPER: Obter saldo de um aluno específico
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_balance(p_student_id UUID)
RETURNS TABLE (
    total_paid NUMERIC,
    total_pending NUMERIC,
    total_overdue NUMERIC,
    total_unpaid NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        total_paid,
        total_pending,
        total_overdue,
        total_unpaid
    FROM public.student_financial_balance
    WHERE student_id = p_student_id;
$$;

COMMENT ON FUNCTION public.get_student_balance(UUID) IS 
'Retorna o saldo financeiro de um aluno específico. Uso: SELECT * FROM get_student_balance(''uuid'');';

-- ============================================================
-- 6. ÍNDICES para Performance
-- ============================================================

-- Índice para acelerar JOINs na view
CREATE INDEX IF NOT EXISTS idx_financial_records_student_status 
ON public.financial_records(student_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_class_logs_student_attendance 
ON public.class_logs(student_id, attendance);

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================

-- 1. Para obter saldo de todos os alunos:
--    SELECT * FROM public.student_financial_balance;
--
-- 2. Para obter estatísticas de aulas de todos os alunos:
--    SELECT * FROM public.student_class_stats;
--
-- 3. Para obter dados completos (recomendado):
--    SELECT * FROM public.student_complete_balance WHERE status = 'ativo';
--
-- 4. Para obter saldo de um aluno específico:
--    SELECT * FROM public.get_student_balance('uuid-do-aluno');
--
-- 5. No frontend, substitua:
--    ❌ const balance = calculateBalance(records) // cálculo no React
--    ✅ const { data } = await supabase.from('student_complete_balance').select()
--
-- ============================================================
-- BENEFÍCIOS
-- ============================================================
--
-- ✅ Performance: Cálculo feito no banco (mais rápido)
-- ✅ Consistência: Uma única fonte de verdade
-- ✅ Simplicidade: Frontend só consome dados prontos
-- ✅ Escalabilidade: Funciona com milhares de alunos
-- ✅ Manutenção: Regra de negócio centralizada no banco
--
-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
