-- Corrige RLS de activities: admin deve usar is_admin() (user_roles), não profiles.role
-- Assim o admin consegue ver todas as atividades na aba Atividades.

DROP POLICY IF EXISTS "admins_all_activities" ON public.activities;
CREATE POLICY "admins_all_activities"
  ON public.activities
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Storage: mesma correção para admin ver/gerenciar arquivos de atividades
DROP POLICY IF EXISTS "admins_all_activities_storage" ON storage.objects;
CREATE POLICY "admins_all_activities_storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'activities' AND (SELECT public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'activities' AND (SELECT public.is_admin())
  );
