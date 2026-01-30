-- ============================================================
-- Performance e Soft Delete - Melhorias Críticas
-- ============================================================
-- Esta migration implementa:
-- 1. Índices compostos para performance de queries
-- 2. Soft delete em students para preservar dados históricos
-- ============================================================

-- ============================================================
-- PARTE 1: ÍNDICES COMPOSTOS PARA PERFORMANCE
-- ============================================================

-- Índice composto: student_id + class_date
-- Usado em: Dashboard do professor, listagem de aulas por aluno
CREATE INDEX IF NOT EXISTS idx_class_logs_student_date 
ON public.class_logs(student_id, class_date DESC);

COMMENT ON INDEX public.idx_class_logs_student_date IS
'Índice composto para queries que filtram por aluno e ordenam por data';

-- Índice composto: teacher_id + class_date
-- Usado em: Dashboard do professor vendo TODAS as suas aulas
CREATE INDEX IF NOT EXISTS idx_class_logs_teacher_date 
ON public.class_logs(teacher_id, class_date DESC) 
WHERE teacher_id IS NOT NULL;

COMMENT ON INDEX public.idx_class_logs_teacher_date IS
'Índice composto para queries do professor filtrando suas aulas';

-- Índice composto: student_id + status
-- Usado em: Financeiro, filtrar cobranças pendentes de um aluno
CREATE INDEX IF NOT EXISTS idx_financial_student_status 
ON public.financial_records(student_id, status, due_date DESC);

COMMENT ON INDEX public.idx_financial_student_status IS
'Índice composto para queries de cobranças por aluno e status';

-- Índice composto: teacher_id + status (via students)
-- Usado em: Dashboard do professor, ver alunos ativos
CREATE INDEX IF NOT EXISTS idx_students_teacher_status 
ON public.students(teacher_id, status) 
WHERE teacher_id IS NOT NULL;

COMMENT ON INDEX public.idx_students_teacher_status IS
'Índice composto para queries de alunos por professor e status';

-- Índice composto: student_id + attendance
-- Usado em: Estatísticas de presença
CREATE INDEX IF NOT EXISTS idx_class_logs_student_attendance_date 
ON public.class_logs(student_id, attendance, class_date DESC);

COMMENT ON INDEX public.idx_class_logs_student_attendance_date IS
'Índice composto para estatísticas de presença por aluno';

-- Índice para queries de cobrança atrasada (comum em dashboards)
CREATE INDEX IF NOT EXISTS idx_financial_overdue 
ON public.financial_records(student_id, due_date, status) 
WHERE status = 'pendente';

COMMENT ON INDEX public.idx_financial_overdue IS
'Índice otimizado para buscar cobranças pendentes e atrasadas';

-- ============================================================
-- PARTE 2: SOFT DELETE EM STUDENTS
-- ============================================================

-- Adicionar coluna deleted_at para soft delete
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.students 
        ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
        
        COMMENT ON COLUMN public.students.deleted_at IS 
        'Data/hora em que o aluno foi "deletado" (soft delete). NULL = ativo';
    END IF;
END $$;

-- Índice para filtrar alunos não deletados
CREATE INDEX IF NOT EXISTS idx_students_not_deleted 
ON public.students(id) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX public.idx_students_not_deleted IS
'Índice para queries que filtram apenas alunos não deletados';

-- ============================================================
-- PARTE 3: VIEW DE STUDENTS ATIVOS (NÃO DELETADOS)
-- ============================================================

CREATE OR REPLACE VIEW public.students_active AS
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

COMMENT ON VIEW public.students_active IS
'View que retorna apenas alunos não deletados (soft delete)';

-- View mascarada para LGPD (apenas alunos ativos)
CREATE OR REPLACE VIEW public.students_active_masked AS
SELECT 
    s.id,
    s.name,
    -- CPF: mascarado se não for admin
    CASE 
        WHEN public.is_admin() THEN s.cpf
        ELSE public.mask_cpf(s.cpf)
    END AS cpf,
    -- Phone: mascarado se não for admin
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

COMMENT ON VIEW public.students_active_masked IS
'View que retorna alunos ativos com CPF/telefone mascarados para não-admins';

-- ============================================================
-- PARTE 4: FUNÇÃO PARA SOFT DELETE
-- ============================================================

CREATE OR REPLACE FUNCTION public.soft_delete_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Marcar aluno como deletado
    UPDATE public.students
    SET 
        deleted_at = NOW(),
        status = 'inativo'  -- Também marcar como inativo
    WHERE id = p_student_id
    AND deleted_at IS NULL;  -- Apenas se ainda não foi deletado
    
    -- Verificar se foi atualizado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aluno não encontrado ou já foi deletado';
    END IF;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_student(UUID) IS
'Soft delete de aluno. Marca deleted_at e muda status para inativo.
Uso: SELECT soft_delete_student(''uuid-do-aluno'');';

-- ============================================================
-- PARTE 5: FUNÇÃO PARA RESTAURAR ALUNO DELETADO
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Restaurar aluno deletado
    UPDATE public.students
    SET 
        deleted_at = NULL,
        status = 'ativo'  -- Reativar
    WHERE id = p_student_id
    AND deleted_at IS NOT NULL;  -- Apenas se foi deletado
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aluno não encontrado ou não está deletado';
    END IF;
END;
$$;

COMMENT ON FUNCTION public.restore_student(UUID) IS
'Restaura aluno soft-deletado. Remove deleted_at e ativa.
Uso: SELECT restore_student(''uuid-do-aluno'');';

-- ============================================================
-- PARTE 6: ATUALIZAR VIEWS EXISTENTES PARA CONSIDERAR SOFT DELETE
-- ============================================================

-- Atualizar student_complete_balance para excluir deletados
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
    -- Dados financeiros
    COALESCE(fb.total_paid, 0) AS total_paid,
    COALESCE(fb.total_pending, 0) AS total_pending,
    COALESCE(fb.total_overdue, 0) AS total_overdue,
    COALESCE(fb.total_unpaid, 0) AS total_unpaid,
    COALESCE(fb.count_paid, 0) AS count_paid,
    COALESCE(fb.count_pending, 0) AS count_pending,
    COALESCE(fb.count_overdue, 0) AS count_overdue,
    -- Dados de aulas
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
    s.deleted_at IS NULL;  -- ⚠️ IMPORTANTE: Excluir alunos deletados

COMMENT ON VIEW public.student_complete_balance IS 
'View consolidada com todos os dados do aluno + saldo + stats. Exclui alunos deletados (soft delete).';

-- ============================================================
-- PARTE 7: GRANTS E PERMISSÕES
-- ============================================================

GRANT SELECT ON public.students_active TO authenticated;
GRANT SELECT ON public.students_active_masked TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_student(UUID) TO authenticated;

-- ============================================================
-- PARTE 8: ESTATÍSTICAS PARA O QUERY PLANNER
-- ============================================================

-- Analisar tabelas para atualizar estatísticas do query planner
ANALYZE public.students;
ANALYZE public.class_logs;
ANALYZE public.financial_records;

-- ============================================================
-- DOCUMENTAÇÃO E TESTES
-- ============================================================

/*
BENEFÍCIOS DOS ÍNDICES COMPOSTOS:

1. Query de aulas por aluno (ANTES):
   SELECT * FROM class_logs WHERE student_id = 'uuid' ORDER BY class_date DESC;
   → Usa idx_class_logs_student_id + sort separado (lento)

2. Query de aulas por aluno (DEPOIS):
   SELECT * FROM class_logs WHERE student_id = 'uuid' ORDER BY class_date DESC;
   → Usa idx_class_logs_student_date (rápido, sem sort adicional)

3. Query de cobranças pendentes (ANTES):
   SELECT * FROM financial_records 
   WHERE student_id = 'uuid' AND status = 'pendente' 
   ORDER BY due_date DESC;
   → Usa idx_financial_records_student_id + filtro status + sort (lento)

4. Query de cobranças pendentes (DEPOIS):
   SELECT * FROM financial_records 
   WHERE student_id = 'uuid' AND status = 'pendente' 
   ORDER BY due_date DESC;
   → Usa idx_financial_student_status (rápido, tudo no índice)

SOFT DELETE - POR QUE É IMPORTANTE:

❌ ANTES (Hard Delete):
DELETE FROM students WHERE id = 'uuid';
→ Postgres executa CASCADE
→ Deleta TODOS os class_logs desse aluno (histórico perdido!)
→ Deleta TODOS os financial_records (receita perdida dos relatórios!)
→ Professor fica sem saber quanto ganhou com aquele aluno

✅ DEPOIS (Soft Delete):
SELECT soft_delete_student('uuid');
→ Apenas marca deleted_at = NOW()
→ class_logs preservados (histórico intacto)
→ financial_records preservados (receita nos relatórios)
→ Aluno não aparece mais nas listagens (filtered by deleted_at IS NULL)
→ Pode ser restaurado se necessário!

TESTES:

-- 1. Testar soft delete
SELECT soft_delete_student('uuid-de-teste');

-- 2. Verificar que aluno não aparece mais
SELECT * FROM students_active WHERE id = 'uuid-de-teste';
-- (deve retornar vazio)

-- 3. Verificar que dados históricos estão preservados
SELECT COUNT(*) FROM class_logs WHERE student_id = 'uuid-de-teste';
SELECT COUNT(*) FROM financial_records WHERE student_id = 'uuid-de-teste';
-- (deve retornar contagens > 0)

-- 4. Restaurar aluno
SELECT restore_student('uuid-de-teste');

-- 5. Verificar que voltou
SELECT * FROM students_active WHERE id = 'uuid-de-teste';
-- (deve retornar o aluno)

PERFORMANCE ESPERADA:

Com 1000 alunos e 10.000 aulas:
- Query "aulas de um aluno": ~50ms → ~5ms (10x mais rápido)
- Query "cobranças pendentes": ~80ms → ~8ms (10x mais rápido)
- Dashboard do professor: ~200ms → ~30ms (7x mais rápido)
*/

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
