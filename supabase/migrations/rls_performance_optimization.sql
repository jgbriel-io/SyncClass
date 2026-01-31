-- ============================================================
-- RLS Performance Optimization
-- ============================================================
-- 1. Auth RLS: (select auth.uid()) para avaliar 1x por query
-- 2. Consolidação: Menos políticas = menos overhead
-- 3. Índices: Remover redundantes em financial_records
-- ============================================================

-- ============================================================
-- PARTE 1: REMOVER ÍNDICES REDUNDANTES
-- ============================================================
-- A constraint UNIQUE(class_log_id) já cria índice. Os índices
-- explícitos idx_* são redundantes.

DROP INDEX IF EXISTS public.idx_financial_records_class_log_id;
DROP INDEX IF EXISTS public.idx_financial_records_class_log;

-- ============================================================
-- PARTE 2: user_roles - Otimizar auth.uid() e consolidar
-- ============================================================

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role and admins can read all roles" ON public.user_roles;

CREATE POLICY "user_roles_select"
    ON public.user_roles FOR SELECT
    USING (
        user_id = (SELECT auth.uid())
        OR (SELECT auth.role()) = 'service_role'
        OR (SELECT public.is_admin())
    );

DROP POLICY IF EXISTS "Usuários podem receber sua própria role" ON public.user_roles;

CREATE POLICY "user_roles_insert"
    ON public.user_roles FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar todas as roles" ON public.user_roles;

CREATE POLICY "user_roles_admin_all"
    ON public.user_roles FOR ALL
    USING ((SELECT public.is_admin()));

-- ============================================================
-- PARTE 3: profiles - Otimizar e consolidar
-- ============================================================

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;

CREATE POLICY "profiles_select"
    ON public.profiles FOR SELECT
    USING (
        user_id = (SELECT auth.uid())
        OR (SELECT auth.role()) = 'service_role'
        OR (SELECT public.is_admin())
    );

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

CREATE POLICY "profiles_update"
    ON public.profiles FOR UPDATE
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;

CREATE POLICY "profiles_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (
        (SELECT auth.role()) = 'service_role'
        OR user_id = (SELECT auth.uid())
    );

CREATE POLICY "profiles_admin_all"
    ON public.profiles FOR ALL
    USING ((SELECT public.is_admin()));

-- ============================================================
-- PARTE 4: students - Otimizar (get_my_* já usa auth internamente)
-- ============================================================
-- get_my_student_id() e get_my_teacher_id() são SECURITY DEFINER.
-- O ganho vem de (SELECT fn()) para avaliar 1x por query.

DROP POLICY IF EXISTS "Admins podem gerenciar alunos" ON public.students;
DROP POLICY IF EXISTS "Alunos podem ver seus próprios dados" ON public.students;
DROP POLICY IF EXISTS "Professores podem ver seus próprios alunos" ON public.students;

CREATE POLICY "students_admin_all"
    ON public.students FOR ALL
    USING ((SELECT public.is_admin()));

CREATE POLICY "students_select"
    ON public.students FOR SELECT
    USING (
        id = (SELECT public.get_my_student_id())
        OR teacher_id = (SELECT public.get_my_teacher_id())
    );

-- ============================================================
-- PARTE 5: financial_records - Consolidar e otimizar
-- ============================================================

DROP POLICY IF EXISTS "Admins podem gerenciar registros financeiros" ON public.financial_records;
DROP POLICY IF EXISTS "Alunos podem ver seus próprios registros financeiros" ON public.financial_records;
DROP POLICY IF EXISTS "Professores podem gerenciar registros financeiros dos seus alunos" ON public.financial_records;

-- SELECT: aluno vê próprio OU admin OU professor dos seus alunos
CREATE POLICY "financial_records_select"
    ON public.financial_records FOR SELECT
    USING (
        student_id = (SELECT public.get_my_student_id())
        OR (SELECT public.is_admin())
        OR student_id IN (
            SELECT id FROM public.students
            WHERE teacher_id = (SELECT public.get_my_teacher_id())
        )
    );

-- ALL: admin OU professor dos seus alunos
CREATE POLICY "financial_records_admin_teacher_all"
    ON public.financial_records FOR ALL
    USING (
        (SELECT public.is_admin())
        OR student_id IN (
            SELECT id FROM public.students
            WHERE teacher_id = (SELECT public.get_my_teacher_id())
        )
    )
    WITH CHECK (
        (SELECT public.is_admin())
        OR student_id IN (
            SELECT id FROM public.students
            WHERE teacher_id = (SELECT public.get_my_teacher_id())
        )
    );

-- ============================================================
-- PARTE 6: class_logs - Consolidar e otimizar
-- ============================================================

DROP POLICY IF EXISTS "Admins podem gerenciar registros de aula" ON public.class_logs;
DROP POLICY IF EXISTS "Alunos podem ver seus próprios registros de aula" ON public.class_logs;
DROP POLICY IF EXISTS "Professores podem gerenciar registros de aula dos seus alunos" ON public.class_logs;

-- SELECT: aluno OU admin OU professor dos seus alunos
CREATE POLICY "class_logs_select"
    ON public.class_logs FOR SELECT
    USING (
        student_id = (SELECT public.get_my_student_id())
        OR (SELECT public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = class_logs.student_id
            AND s.teacher_id = (SELECT public.get_my_teacher_id())
        )
    );

-- ALL: admin OU professor dos seus alunos
CREATE POLICY "class_logs_admin_teacher_all"
    ON public.class_logs FOR ALL
    USING (
        (SELECT public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = class_logs.student_id
            AND s.teacher_id = (SELECT public.get_my_teacher_id())
        )
    )
    WITH CHECK (
        (SELECT public.is_admin())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = class_logs.student_id
            AND s.teacher_id = (SELECT public.get_my_teacher_id())
        )
    );

-- ============================================================
-- PARTE 7: teachers - Otimizar
-- ============================================================

DROP POLICY IF EXISTS "Admins podem gerenciar professores" ON public.teachers;
DROP POLICY IF EXISTS "Professores podem ver seus próprios dados" ON public.teachers;

CREATE POLICY "teachers_admin_all"
    ON public.teachers FOR ALL
    USING ((SELECT public.is_admin()));

CREATE POLICY "teachers_select"
    ON public.teachers FOR SELECT
    USING (
        id = (SELECT public.get_my_teacher_id())
        OR (SELECT public.is_admin())
    );
