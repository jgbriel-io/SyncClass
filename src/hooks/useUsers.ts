import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { QK } from "./queryKeys";
import React from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

export interface UsersStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export function useUsersStats() {
  return useQuery({
    queryKey: [QK.USERS_STATS],
    queryFn: async (): Promise<UsersStats> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("active, created_at")
        .is("deleted_at", null); // Only count non-deleted profiles

      if (error) throw error;

      const rows = data ?? [];
      const now = new Date();
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

      const total = rows.length;
      const active = rows.filter((r) => r.active === true).length;
      const inactive = rows.filter((r) => r.active === false).length;
      const newThisMonth = rows.filter((r) => {
        if (!r.created_at) return false;
        const createdDate = String(r.created_at).split("T")[0];
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;

      return { total, active, inactive, newThisMonth };
    },
  });
}

const DEFAULT_PAGE_SIZE = 10;

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
  student: Tables<"students"> | null;
  teacher: Tables<"teachers"> | null;
}

// Legacy export for backward compatibility
export type UserWithProfile = CombinedUser;

// Fetch all users with their profiles and roles
export function useUsers() {
  return useQuery({
    queryKey: [QK.USERS],
    queryFn: async (): Promise<CombinedUser[]> => {
      const [
        { data: profiles, error: profilesError },
        { data: roles, error: rolesError },
        { data: students, error: studentsError },
        { data: teachers, error: teachersError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("user_roles").select("*").limit(1000),
        supabase.from("students").select("*").limit(1000),
        supabase.from("teachers").select("*").limit(1000),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      if (studentsError) throw studentsError;
      if (teachersError) throw teachersError;

      return (profiles || []).map((profile: ProfileRow): CombinedUser => {
        const roleRow = (roles || []).find(
          (r: UserRoleRow) => r.user_id === profile.user_id
        );
        const emailFromProfile = profile.email;
        const emailFromRole = roleRow?.email;
        const primaryEmail = emailFromProfile || emailFromRole || "";

        // Buscar student e teacher vinculados
        const student = profile.student_id
          ? (students || []).find((s) => s.id === profile.student_id) || null
          : null;

        const teacher = profile.teacher_id
          ? (teachers || []).find((t) => t.id === profile.teacher_id) || null
          : null;

        const combinedUser: CombinedUser = {
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
          role: roleRow
            ? {
                id: roleRow.id,
                user_id: roleRow.user_id,
                role: roleRow.role,
                full_name: roleRow.full_name,
                email: roleRow.email,
              }
            : null,
          student,
          teacher,
        };

        return combinedUser;
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

export function useUsersPaginated(
  options?: UseUsersPaginatedOptions
): UseUsersPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: [QK.USERS_PAGINATED, page, pageSize, filters],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .is("deleted_at", null); // Only show non-deleted profiles

      if (filters?.status === "active") {
        q = q.eq("active", true);
      } else if (filters?.status === "inactive") {
        q = q.eq("active", false);
      }

      const sortBy = filters?.sortBy ?? "created_desc";
      const orderCol =
        sortBy === "name_asc" || sortBy === "name_desc"
          ? "full_name"
          : "created_at";
      const ascending = sortBy === "created_asc" || sortBy === "name_asc";
      q = q.order(orderCol, { ascending, nullsFirst: false });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const {
        data: profiles,
        error: profilesError,
        count,
      } = await q.range(from, to);

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

      // Buscar students e teachers vinculados (incluindo inativos)
      const studentIds = profileRows
        .map((p) => p.student_id)
        .filter((id): id is string => id != null);

      const teacherIds = profileRows
        .map((p) => p.teacher_id)
        .filter((id): id is string => id != null);

      let students: Tables<"students">[] = [];
      let teachers: Tables<"teachers">[] = [];

      if (studentIds.length > 0) {
        // IMPORTANTE: Buscar TODOS os students, incluindo inativos
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .in("id", studentIds);

        if (studentsError) throw studentsError;
        students = studentsData || [];
      }

      if (teacherIds.length > 0) {
        // IMPORTANTE: Buscar TODOS os teachers, incluindo inativos
        const { data: teachersData, error: teachersError } = await supabase
          .from("teachers")
          .select("*")
          .in("id", teacherIds);

        if (teachersError) throw teachersError;
        teachers = teachersData || [];
      }

      const list = profileRows.map((profile): CombinedUser => {
        const roleRow = (roles || []).find(
          (r: UserRoleRow) => r.user_id === profile.user_id
        );
        const emailFromProfile = profile.email;
        const emailFromRole = roleRow?.email;
        const primaryEmail = emailFromProfile || emailFromRole || "";

        // Buscar student e teacher vinculados
        const student = profile.student_id
          ? students.find((s) => s.id === profile.student_id) || null
          : null;

        const teacher = profile.teacher_id
          ? teachers.find((t) => t.id === profile.teacher_id) || null
          : null;

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
          role: roleRow
            ? {
                id: roleRow.id,
                user_id: roleRow.user_id,
                role: roleRow.role,
                full_name: roleRow.full_name,
                email: roleRow.email,
              }
            : null,
          student,
          teacher,
        };
      });

      return { list, count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as CombinedUser[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  // Reset para página 0 se a página atual ficou vazia mas há dados
  React.useEffect(() => {
    if (!query.isLoading && list.length === 0 && totalCount > 0 && page > 0) {
      setPage(0);
    }
  }, [list.length, totalCount, page, query.isLoading]);

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
    queryKey: [QK.CURRENT_USER_PROFILE, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, user_id, full_name, email, avatar_url, role, teacher_id, student_id, active"
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        user_id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
        role: string | null;
        teacher_id: string | null;
        student_id: string | null;
        active: boolean;
      } | null;
    },
    enabled: !!userId,
  });
}

/** IDs de alunos e professores já vinculados a algum perfil (para dropdown "vincular") */
export function useLinkedProfileIds() {
  return useQuery({
    queryKey: [QK.PROFILES_LINKED_IDS],
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
  useResetPassword,
  useResetOwnPassword,
  useLinkUserToStudent,
  useLinkUserToTeacher,
  useCreateAuthUserForStudent,
  useCreateAuthUserForTeacher,
  useInviteStudent,
  useInviteTeacher,
} from "./useUserMutations";

export {
  useUpdateProfileName,
  useUpdateProfileEmail,
} from "./useUserProfileMutations";
