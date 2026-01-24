-- Fix RLS policy for user_roles to ensure users can always read their own role
-- Drop existing policy and recreate with proper permissions

DROP POLICY IF EXISTS "Usuários podem ver suas próprias roles" ON public.user_roles;

-- Allow users to read their own role
CREATE POLICY "Users can read own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Allow service role and admins to read all roles
CREATE POLICY "Service role and admins can read all roles"
    ON public.user_roles FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        public.is_admin()
    );
