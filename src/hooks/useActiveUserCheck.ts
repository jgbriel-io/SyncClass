import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook que verifica se o usuário está ativo (active = true).
 * Se o usuário for desativado (active = false), faz logout automático.
 * 
 * CONTEXTO: O trigger de invalidação de sessões está desabilitado,
 * então precisamos verificar manualmente no frontend.
 */
export function useActiveUserCheck() {
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);

  useEffect(() => {
    // Só verifica se tiver usuário logado e profile carregado
    if (!user || !profile) return;

    // Verificar se o profile tem o campo active
    const isActive = (profile as { active?: boolean }).active;

    // Se active for explicitamente false, fazer logout
    if (isActive === false) {
      toast.error("Sua conta foi desativada. Entre em contato com o administrador.");
      
      // Fazer logout
      signOut();
    }
  }, [user, profile, signOut]);
}
