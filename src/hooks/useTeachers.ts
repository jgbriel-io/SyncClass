import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 20;

export type TeachersListFilters = {
  status?: "all" | "ativo" | "inativo";
  sortBy?: "name_asc" | "name_desc";
};

export type Teacher = Tables<"teachers">;
export type TeacherInsert = TablesInsert<"teachers">;
export type TeacherUpdate = TablesUpdate<"teachers">;
type TeacherStatus = Enums<"teacher_status">;
type ProfileUpdate = TablesUpdate<"profiles">;

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers_masked")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Teacher[];
    },
  });
}

export interface UseTeachersPaginatedOptions {
  pageSize?: number;
  filters?: TeachersListFilters;
}

export interface UseTeachersPaginatedResult {
  data: Teacher[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useTeachersPaginated(options?: UseTeachersPaginatedOptions): UseTeachersPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["teachers_paginated", page, pageSize, filters],
    queryFn: async () => {
      let q = supabase.from("teachers_masked").select("*", { count: "exact" });

      if (filters?.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }

      const ascending = filters?.sortBy === "name_asc";
      q = q.order("name", { ascending });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;
      return { list: (data ?? []) as Teacher[], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as Teacher[];
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

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacher: TeacherInsert) => {
      const { validateCpfPhonePlatform } = await import("@/lib/validate-cpf-phone-platform");
      const err = await validateCpfPhonePlatform(supabase, teacher);
      if (err) throw new Error(err);
      const { data, error } = await supabase
        .from("teachers")
        .insert(teacher)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor cadastrado com sucesso!");
    },
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as { code?: string; message?: string });
      toast.error(friendly || "Erro ao cadastrar professor. Tente novamente.");
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TeacherUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("teachers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Synchronize profiles, user_roles and active flag for linked users
      const updatedTeacher = data as Teacher;
      const fullName = updatedTeacher.name;
      const rawEmail = updatedTeacher.email;
      const normalizedEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
      const isActive = updatedTeacher.status === "ativo";

      const { data: linkedProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("teacher_id", updatedTeacher.id);

      if (profileError) {
        throw profileError;
      }

      if (linkedProfiles && linkedProfiles.length > 0) {
        for (const profile of linkedProfiles) {
          const profileUpdate: ProfileUpdate = {
            role: "teacher",
            active: isActive,
          };
          if (fullName) {
            profileUpdate.full_name = fullName;
          }
          if (normalizedEmail) {
            profileUpdate.email = normalizedEmail;
          }

          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update(profileUpdate)
            .eq("id", profile.id);

          if (profileUpdateError) {
            throw profileUpdateError;
          }

          if (profile.user_id) {
            const { error: roleError } = await supabase.rpc("upsert_user_role_safe", {
              p_user_id: profile.user_id,
              p_role: "teacher",
              p_full_name: fullName ?? null,
              p_email: normalizedEmail,
            });
            if (roleError) throw roleError;
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as { code?: string; message?: string });
      toast.error(friendly || "Erro ao atualizar professor. Tente novamente.");
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: mark teacher as inativo instead of removing row
      const status: TeacherStatus = "inativo";
      const { error } = await supabase
        .from("teachers")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Also mark linked profiles as inactive
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("teacher_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor arquivado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir professor. Tente novamente.");
    },
  });
}
