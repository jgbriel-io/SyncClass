-- Allow admins to manage roles for all users and still let users receive their own role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_roles'
      AND policyname = 'Admins podem gerenciar todas as roles'
  ) THEN
    CREATE POLICY "Admins podem gerenciar todas as roles"
      ON public.user_roles FOR ALL
      USING (public.is_admin());
  END IF;
END $$;
