-- Vincular alunos a professores (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'students'
      AND column_name  = 'teacher_id'
  ) THEN
    ALTER TABLE public.students
    ADD COLUMN teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'students'
      AND indexname  = 'idx_students_teacher_id'
  ) THEN
    CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
  END IF;
END $$;

-- Professores podem ver apenas seus próprios alunos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'students'
      AND policyname = 'Professores podem ver seus próprios alunos'
  ) THEN
    CREATE POLICY "Professores podem ver seus próprios alunos"
        ON public.students FOR SELECT
        USING (
          teacher_id = public.get_my_teacher_id()
          OR public.is_admin()
        );
  END IF;
END $$;

-- Professores podem gerenciar (CRUD) registros de aula dos seus alunos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'class_logs'
      AND policyname = 'Professores podem gerenciar registros de aula dos seus alunos'
  ) THEN
    CREATE POLICY "Professores podem gerenciar registros de aula dos seus alunos"
        ON public.class_logs FOR ALL
        USING (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = class_logs.student_id
              AND s.teacher_id = public.get_my_teacher_id()
          )
          OR public.is_admin()
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = class_logs.student_id
              AND s.teacher_id = public.get_my_teacher_id()
          )
          OR public.is_admin()
        );
  END IF;
END $$;

-- Professores podem gerenciar (CRUD) registros financeiros dos seus alunos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'financial_records'
      AND policyname = 'Professores podem gerenciar registros financeiros dos seus alunos'
  ) THEN
    CREATE POLICY "Professores podem gerenciar registros financeiros dos seus alunos"
        ON public.financial_records FOR ALL
        USING (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = financial_records.student_id
              AND s.teacher_id = public.get_my_teacher_id()
          )
          OR public.is_admin()
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = financial_records.student_id
              AND s.teacher_id = public.get_my_teacher_id()
          )
          OR public.is_admin()
        );
  END IF;
END $$;
