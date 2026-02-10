-- Permitir que alunos façam upload de arquivos de resposta
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

-- Permitir que alunos atualizem seus próprios arquivos de resposta
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

-- Permitir que alunos deletem seus próprios arquivos de resposta
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
