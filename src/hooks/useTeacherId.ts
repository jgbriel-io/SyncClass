import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";

/**
 * Encapsula o padrão repetido em todas as páginas teacher:
 * useAuth() + useCurrentUserProfile() → teacher_id + full_name
 */
export function useTeacherId() {
  const { user, role, isLoading: authLoading } = useAuth();
  const {
    data: profile,
    isLoading: profileLoading,
    isError,
  } = useCurrentUserProfile(user?.id);

  return {
    teacherId: profile?.teacher_id ?? null,
    fullName: profile?.full_name ?? null,
    profile,
    isLoading: authLoading || profileLoading,
    isError,
    role,
    user,
  };
}
