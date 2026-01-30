-- ============================================================
-- FIX P0-SEC-01: Reforço da Policy de financial_records
-- ============================================================
-- Esta migration corrige a policy de RLS para garantir que
-- professores só podem acessar registros financeiros de
-- estudantes que realmente pertencem a eles
-- ============================================================

-- Remove a policy atual
DROP POLICY IF EXISTS "Professores podem gerenciar registros financeiros dos seus alunos" 
    ON public.financial_records;

-- Cria a nova policy com verificação segura usando IN + subquery
CREATE POLICY "Professores podem gerenciar registros financeiros dos seus alunos"
    ON public.financial_records FOR ALL
    USING (
        -- Professores só veem registros de seus próprios alunos
        student_id IN (
            SELECT id 
            FROM public.students 
            WHERE teacher_id = public.get_my_teacher_id()
        )
        -- Admins podem ver tudo
        OR public.is_admin()
    )
    WITH CHECK (
        -- Professores só podem criar/atualizar registros de seus próprios alunos
        student_id IN (
            SELECT id 
            FROM public.students 
            WHERE teacher_id = public.get_my_teacher_id()
        )
        -- Admins podem fazer tudo
        OR public.is_admin()
    );

-- ============================================================
-- Comentário explicativo
-- ============================================================
COMMENT ON POLICY "Professores podem gerenciar registros financeiros dos seus alunos" 
    ON public.financial_records IS 
    'Policy segura que garante que professores só podem acessar registros financeiros de estudantes vinculados a eles através da tabela students. A subquery IN valida explicitamente a relação teacher_id antes de conceder acesso.';
