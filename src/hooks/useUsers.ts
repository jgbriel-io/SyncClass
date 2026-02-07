import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

const DEFAULT_PAGE_SIZE = 20;

export type UsersListFilters = {
  role?: "all" | "admin" | "teacher" | "student";
  status?: "all" | "active" | "inactive";
  sortBy?: "created_desc" | "created_asc" | "name_asc" | "name_desc";
};

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
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

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

export interface UseUsersPaginatedOptions {
  pageSize?: number;
  filters?: UsersListFilters;
}

export interface UseUsersPaginatedResult {
  data: CombinedUser[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useUsersPaginated(options?: UseUsersPaginatedOptions): UseUsersPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["users_paginated", page, pageSize, filters],
    queryFn: async () => {
      let q = supabase.from("profiles").select("*", { count: "exact" });

      if (filters?.status === "active") {
        q = q.eq("active", true);
      } else if (filters?.status === "inactive") {
        q = q.eq("active", false);
      }

      const sortBy = filters?.sortBy ?? "created_desc";
      const orderCol = sortBy === "name_asc" || sortBy === "name_desc" ? "full_name" : "created_at";
      const ascending = sortBy === "created_asc" || sortBy === "name_asc";
      q = q.order(orderCol, { ascending, nullsFirst: false });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data: profiles, error: profilesError, count } = await q.range(from, to);

      if (profilesError) throw profilesError;

      const profileRows = (profiles || []) as ProfileRow[];
      const userIds = profileRows.map((p) => p.user_id);
      if (userIds.length === 0) {
        return { list: [] as CombinedUser[], count: count ?? 0 };
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      const list = profileRows.map((profile): CombinedUser => {
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

      return { list, count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as CombinedUser[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  return {
    data: list,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isFetching: query.isFetching,
    page,
    setPage,
    hasMore,
    totalCount,
    refetch: query.refetch,
  };
}

/** Perfil do usuário logado (para avatar, nome, configurações). */
export function useCurrentUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["current_user_profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; user_id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
    },
    enabled: !!userId,
  });
}

/** IDs de alunos e professores já vinculados a algum perfil (para dropdown "vincular") */
export function useLinkedProfileIds() {
  return useQuery({
    queryKey: ["profiles_linked_ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("student_id, teacher_id");
      if (error) throw error;
      const linkedStudentIds = new Set(
        (data ?? []).map((r) => r.student_id).filter((id): id is string => !!id)
      );
      const linkedTeacherIds = new Set(
        (data ?? []).map((r) => r.teacher_id).filter((id): id is string => !!id)
      );
      return { linkedStudentIds, linkedTeacherIds };
    },
  });
}

// Export all mutation hooks from the dedicated mutations file
export {
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserProfile,
  useUpdateMyProfile,
  useUploadAvatar,
  useDeleteUser,
  useHardDeleteUser,
  useAdminResetPassword,
  useLinkUserToStudent,
  useLinkUserToTeacher,
  useCreateAuthUserForStudent,
  useCreateAuthUserForTeacher,
  useInviteStudent,
  useInviteTeacher,
  useTeacherResetPassword,
} from "./useUserMutations";
