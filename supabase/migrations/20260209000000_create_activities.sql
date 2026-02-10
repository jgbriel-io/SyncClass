-- Tabela de atividades (envio de material e correção)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada', 'entregue', 'corrigida')),
  feedback TEXT,
  correction_file_url TEXT,
  correction_file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  corrected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activities_student_id ON public.activities(student_id);
CREATE INDEX IF NOT EXISTS idx_activities_teacher_id ON public.activities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Professores podem ver e gerenciar atividades de seus alunos
DROP POLICY IF EXISTS "teachers_select_own_students_activities" ON public.activities;
CREATE POLICY "teachers_select_own_students_activities"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (
      SELECT teacher_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teachers_insert_own_students_activities" ON public.activities;
CREATE POLICY "teachers_insert_own_students_activities"
  ON public.activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id IN (
      SELECT teacher_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teachers_update_own_students_activities" ON public.activities;
CREATE POLICY "teachers_update_own_students_activities"
  ON public.activities
  FOR UPDATE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT teacher_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teachers_delete_own_students_activities" ON public.activities;
CREATE POLICY "teachers_delete_own_students_activities"
  ON public.activities
  FOR DELETE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT teacher_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- Alunos podem ver suas próprias atividades e marcar como entregue
DROP POLICY IF EXISTS "students_select_own_activities" ON public.activities;
CREATE POLICY "students_select_own_activities"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT student_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "students_update_own_activities_status" ON public.activities;
CREATE POLICY "students_update_own_activities_status"
  ON public.activities
  FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT student_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Alunos só podem mudar status de 'enviada' para 'entregue'
    status = 'entregue' AND delivered_at IS NOT NULL
  );

-- Admins têm acesso total
DROP POLICY IF EXISTS "admins_all_activities" ON public.activities;
CREATE POLICY "admins_all_activities"
  ON public.activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Storage bucket para atividades (se ainda não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('activities', 'activities', false, 52428800, ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit, 
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de storage para atividades
DROP POLICY IF EXISTS "teachers_upload_activities" ON storage.objects;
CREATE POLICY "teachers_upload_activities"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND teacher_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "students_upload_responses" ON storage.objects;
CREATE POLICY "students_upload_responses"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND student_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "teachers_view_activities" ON storage.objects;
CREATE POLICY "teachers_view_activities"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND teacher_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "students_view_own_activities" ON storage.objects;
CREATE POLICY "students_view_own_activities"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND student_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "students_update_own_responses" ON storage.objects;
CREATE POLICY "students_update_own_responses"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND student_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "students_delete_own_responses" ON storage.objects;
CREATE POLICY "students_delete_own_responses"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND student_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "admins_all_activities_storage" ON storage.objects;
CREATE POLICY "admins_all_activities_storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
