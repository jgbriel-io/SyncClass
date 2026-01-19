-- Permitir que usuários criem seu próprio perfil durante signup
CREATE POLICY "Usuários podem criar seu próprio perfil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários recebam sua role durante signup
CREATE POLICY "Usuários podem receber sua própria role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);