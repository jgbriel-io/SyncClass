import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 10;

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
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Mask CPF only (keep last 4 digits visible)
      const maskedData = (data ?? []).map(teacher => ({
        ...teacher,
        cpf: teacher.cpf ? teacher.cpf.slice(0, -4).replace(/\d/g, '*') + teacher.cpf.slice(-4) : null,
      }));
      
      return maskedData as Teacher[];
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
      // Use teachers table directly instead of view to avoid cache issues
      let q = supabase.from("teachers").select("*", { count: "exact" });

      if (filters?.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }

      const ascending = filters?.sortBy === "name_asc";
      q = q.order("name", { ascending });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;
      
      // Mask CPF only (keep last 4 digits visible)
      const maskedData = (data ?? []).map(teacher => ({
        ...teacher,
        cpf: teacher.cpf ? teacher.cpf.slice(0, -4).replace(/\d/g, '*') + teacher.cpf.slice(-4) : null,
      }));
      
      return { list: maskedData as Teacher[], count: count ?? 0 };
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
      toast.error(friendly || "Não foi possível cadastrar o professor. Por favor, tente novamente.");
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
      queryClient.invalidateQueries({ queryKey: ["teachers_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as { code?: string; message?: string });
      toast.error(friendly || "Não foi possível atualizar o professor. Por favor, tente novamente.");
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: mark teacher as inativo instead of removing row
      const status: TeacherStatus = "inativo";
      const { data, error } = await supabase
        .from("teachers")
        .update({ status })
        .eq("id", id)
        .select();

      if (error) throw error;

      // Also mark linked profiles as inactive
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("teacher_id", id);

      if (profilesError) {
        throw profilesError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor arquivado com sucesso!");
    },
    onError: () => {
      toast.error("Não foi possível arquivar o professor. Por favor, tente novamente.");
    },
  });
}

/**
 * Hard delete teacher — physically removes from DB.
 * FK CASCADE removes class_logs linked to this teacher.
 * If there's a linked auth user (via profiles), also deletes the auth user
 * via the admin-delete-user Edge Function (which cascades profile + user_roles).
 * Admin-only.
 */
export function useHardDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
      // 1) Verificar se há aulas futuras agendadas (a menos que force = true)
      if (!force) {
        const today = new Date().toISOString().split("T")[0];
        const { data: futureClasses, error: futureError } = await supabase
          .from("class_logs")
          .select("id, class_date, start_at, students(name)")
          .eq("teacher_id", id)
          .gte("class_date", today)
          .order("class_date", { ascending: true });

        if (futureError) throw futureError;

        if (futureClasses && futureClasses.length > 0) {
          // Formatar lista de aulas para mostrar no erro
          const classList = futureClasses.slice(0, 5).map((c: { class_date: string; start_at: string | null; students: { name: string } | null }) => {
            const [y, m, d] = c.class_date.split("-");
            const date = `${d}/${m}/${y}`;
            const time = c.start_at || "";
            const student = c.students?.name || "Aluno desconhecido";
            return `${date} ${time} - ${student}`;
          }).join("\n");

          const remaining = futureClasses.length > 5 ? `\n... e mais ${futureClasses.length - 5} aula(s)` : "";

          throw new Error(
            `Este professor tem ${futureClasses.length} aula(s) agendada(s):\n\n${classList}${remaining}\n\nTodas as aulas serão perdidas permanentemente. Tem certeza?`
          );
        }
      }

      // 2) Check if there's a linked auth user via profiles
      const { data: linkedProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("teacher_id", id)
        .maybeSingle();

      // 3) Delete the teacher record (CASCADE removes class_logs)
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 4) If there's a linked user, hard-delete the auth account too
      if (linkedProfile?.user_id) {
        const { data, error: fnError } = await supabase.functions.invoke("admin-delete-user", {
          body: { userId: linkedProfile.user_id },
        });
        const msg = (data as { error?: string } | null)?.error;
        if (fnError || msg) {
          toast.warning("Professor removido. A conta de acesso vinculada não pôde ser excluída — remova manualmente se necessário.");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles_linked_ids"] });
      toast.success("Professor excluído definitivamente.");
    },
    onError: () => {
      toast.error("Não foi possível excluir o professor definitivamente. Por favor, tente novamente.");
    },
  });
}
