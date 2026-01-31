import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

// Type aliases for better readability
type ProfileRow = Tables<"profiles">;
type UserRoleRow = Tables<"user_roles">;
type AppRole = Enums<"app_role">;

// Combined user interface with proper typing
export interface CombinedUser {
  id: string;
  email: string;
  created_at: string;
  profile: {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string | null;
    student_id: string | null;
    teacher_id: string | null;
    role: AppRole | null;
    active: boolean;
    created_at: string | null;
    updated_at: string | null;
  } | null;
  role: {
    id: string;
    user_id: string;
    role: AppRole;
    full_name: string | null;
    email: string | null;
  } | null;
}

// Legacy export for backward compatibility
export type UserWithProfile = CombinedUser;

// Fetch all users with their profiles and roles
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<CombinedUser[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles and roles with proper typing
      return (profiles || []).map((profile: ProfileRow): CombinedUser => {
        const roleRow = (roles || []).find((r: UserRoleRow) => r.user_id === profile.user_id);

        const emailFromProfile = profile.email;
        const emailFromRole = roleRow?.email;
        const primaryEmail = emailFromProfile || emailFromRole || "";

        return {
          id: profile.user_id,
          email: primaryEmail,
          created_at: profile.created_at || "",
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            email: emailFromProfile ?? emailFromRole ?? null,
            student_id: profile.student_id,
            teacher_id: profile.teacher_id,
            active: profile.active,
            role: profile.role,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          },
          role: roleRow ? {
            id: roleRow.id,
            user_id: roleRow.user_id,
            role: roleRow.role,
            full_name: roleRow.full_name,
            email: roleRow.email,
          } : null,
        };
      });
    },
  });
}

// Export all mutation hooks from the dedicated mutations file
export {
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserProfile,
  useDeleteUser,
  useHardDeleteUser,
  useLinkUserToStudent,
  useLinkUserToTeacher,
  useUnlinkUserFromStudent,
  useUnlinkUserFromTeacher,
  useCreateAuthUserForStudent,
  useCreateAuthUserForTeacher,
  useInviteStudent,
  useInviteTeacher,
} from "./useUserMutations";
