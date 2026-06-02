import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage, logError } from "@/lib/security/errorHandler";
import { pickAnonSegment } from "@/lib/utils/anonymize";
import {
  teachers as teachersContent,
  layout as layoutContent,
} from "@/content";
import { QK } from "./queryKeys";

const DEFAULT_PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TeachersListFilters = {
  status?: "all" | "ativo" | "inativo";
  sortBy?: "name_asc" | "name_desc";
};

export type Teacher = Tables<"teachers">;
export type TeacherInsert = TablesInsert<"teachers">;
export type TeacherUpdate = TablesUpdate<"teachers">;
type TeacherStatus = Enums<"teacher_status">;
type ProfileUpdate = TablesUpdate<"profiles">;

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

function maskCpf(teacher: Teacher): Teacher {
  return {
    ...teacher,
    cpf: teacher.cpf
      ? teacher.cpf.slice(0, -4).replace(/\d/g, "*") + teacher.cpf.slice(-4)
      : null,
  };
}

async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(maskCpf) as Teacher[];
}

async function fetchTeachersPaginated(
  page: number,
  pageSize: number,
  filters: TeachersListFilters | undefined
): Promise<{ list: Teacher[]; count: number }> {
  let q = supabase
    .from("teachers")
    .select("*", { count: "exact" })
    .eq("is_deleted", false);
  if (filters?.status && filters.status !== "all")
    q = q.eq("status", filters.status);
  q = q.order("name", { ascending: filters?.sortBy === "name_asc" });
  const from = page * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  return { list: (data ?? []).map(maskCpf) as Teacher[], count: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTeachers() {
  return useQuery({
    queryKey: [QK.TEACHERS],
    queryFn: fetchTeachers,
    staleTime: 5 * 60_000,
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

export function useTeachersPaginated(
  options?: UseTeachersPaginatedOptions
): UseTeachersPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: [QK.TEACHERS_PAGINATED, page, pageSize, filters],
    queryFn: () => fetchTeachersPaginated(page, pageSize, filters),
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as Teacher[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  useEffect(() => {
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

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacher: TeacherInsert) => {
      const { validatePhonePlatform } =
        await import("@/hooks/validatePhonePlatformService");
      const err = await validatePhonePlatform(supabase, teacher);
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
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS] });
      toast.success(teachersContent.toasts.created);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "create_teacher" });
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

      const updatedTeacher = data as Teacher;
      const fullName = updatedTeacher.name;
      const rawEmail = updatedTeacher.email;
      const normalizedEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
      const isActive = updatedTeacher.status === "ativo";

      const { data: linkedProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("teacher_id", updatedTeacher.id);

      if (profileError) throw profileError;

      if (linkedProfiles && linkedProfiles.length > 0) {
        for (const profile of linkedProfiles) {
          const profileUpdate: ProfileUpdate = {
            role: "teacher",
            active: isActive,
            ...(isActive && { deleted_at: null }),
          };
          if (fullName) profileUpdate.full_name = fullName;
          if (normalizedEmail) profileUpdate.email = normalizedEmail;

          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update(profileUpdate)
            .eq("id", profile.id);

          if (profileUpdateError) throw profileUpdateError;

          if (profile.user_id) {
            if (fullName) {
              const { error: nameAuthError } = await supabase.rpc(
                "admin_update_auth_display_name",
                { p_user_id: profile.user_id, p_full_name: fullName }
              );
              if (nameAuthError) throw nameAuthError;
            }
            if (normalizedEmail) {
              const { error: emailAuthError } = await supabase.rpc(
                "admin_update_auth_email",
                { p_user_id: profile.user_id, p_email: normalizedEmail }
              );
              if (emailAuthError) throw emailAuthError;
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS] });
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      toast.success(teachersContent.toasts.updated);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "update_teacher" });
    },
  });
}

export function useSoftDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const status: TeacherStatus = "inativo";
      const { data, error } = await supabase
        .from("teachers")
        .update({ status })
        .eq("id", id)
        .select();

      if (error) throw error;

      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("teacher_id", id);

      if (profilesError) throw profilesError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS] });
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      toast.success(teachersContent.toasts.archived);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "soft_delete_teacher" });
    },
  });
}

export function useTeacherUserId(teacherId: string | undefined) {
  return useQuery({
    queryKey: [QK.TEACHER_USER_ID, teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("teacher_id", teacherId)
        .maybeSingle();
      if (error) throw error;
      return data?.user_id ?? null;
    },
    enabled: !!teacherId,
  });
}

export function useTeacherAbacatePayConfig(teacherId: string | undefined) {
  return useQuery({
    queryKey: [QK.TEACHER_ABACATE_PAY_CONFIG, teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from("teachers")
        .select("abacate_pay_api_key, abacate_pay_webhook_secret")
        .eq("id", teacherId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      let apiKey: string | null = null;
      if (data.abacate_pay_api_key) {
        const { data: decrypted, error: decryptError } = await supabase.rpc(
          "decrypt_sensitive_data",
          { encrypted_input: data.abacate_pay_api_key }
        );
        if (decryptError) {
          logError(decryptError as Error, {
            context: "decrypt_abacate_pay_api_key",
          });
        } else {
          apiKey = decrypted;
        }
      }

      return {
        abacate_pay_api_key: apiKey,
        abacate_pay_webhook_secret: data.abacate_pay_webhook_secret,
      };
    },
    enabled: !!teacherId,
  });
}

export function useUpdateTeacherAbacatePayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherId,
      apiKey,
      existingWebhookSecret,
    }: {
      teacherId: string;
      apiKey: string | null;
      existingWebhookSecret?: string | null;
    }) => {
      let encryptedKey: string | null = null;
      if (apiKey) {
        const { data: encrypted, error: encryptError } = await supabase.rpc(
          "encrypt_sensitive_data",
          { data_input: apiKey }
        );
        if (encryptError) throw encryptError;
        encryptedKey = encrypted;
      }

      // sempre rotaciona — secret antigo fica inválido ao trocar a API key
      const webhookSecret = crypto.randomUUID();
      const { error } = await supabase
        .from("teachers")
        .update({
          abacate_pay_api_key: encryptedKey,
          abacate_pay_webhook_secret: apiKey ? webhookSecret : null,
        })
        .eq("id", teacherId);
      if (error) throw error;
      return { webhookSecret: apiKey ? webhookSecret : null };
    },
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({
        queryKey: [QK.TEACHER_ABACATE_PAY_CONFIG, teacherId],
      });
      toast.success(layoutContent.settings.payments.toasts.success);
    },
    onError: (error: unknown) => {
      toast.error(sanitizeErrorMessage(error));
      logError(error as Error, { context: "update_abacate_pay_config" });
    },
  });
}

export const useDeleteTeacher = useSoftDeleteTeacher;

export function useHardDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      force = false,
    }: {
      id: string;
      force?: boolean;
    }) => {
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
          const classList = futureClasses
            .slice(0, 5)
            .map(
              (c: {
                class_date: string;
                start_at: string | null;
                students: { name: string } | null;
              }) => {
                const [y, m, d] = c.class_date.split("-");
                const date = `${d}/${m}/${y}`;
                const time = c.start_at ? c.start_at.slice(11, 16) : "";
                const student = c.students?.name || "Aluno desconhecido";
                return time
                  ? `${date} ${time} - ${student}`
                  : `${date} - ${student}`;
              }
            )
            .join("\n");

          const remaining =
            futureClasses.length > 5
              ? `\n... e mais ${futureClasses.length - 5} aula(s)`
              : "";

          throw new Error(
            `Este professor tem ${futureClasses.length} aula(s) agendada(s):\n\n${classList}${remaining}\n\nTodas as aulas serão perdidas permanentemente. Tem certeza?`
          );
        }
      }

      const { data: linkedProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("teacher_id", id)
        .maybeSingle();

      const anonymizedName = `Professor ${pickAnonSegment(id)}`;
      const { error } = await supabase
        .from("teachers")
        .update({
          is_deleted: true,
          anonymized_at: new Date().toISOString(),
          name: anonymizedName,
          email: null,
          phone: null,
          pix_key: null,
        })
        .eq("id", id);

      if (error) throw error;

      if (linkedProfile?.user_id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            deleted_at: new Date().toISOString(),
            active: false,
            teacher_id: null,
            full_name: `Usuário ${pickAnonSegment(linkedProfile.user_id)}`,
            email: null,
            avatar_url: null,
          })
          .eq("user_id", linkedProfile.user_id);

        if (profileError) throw profileError;

        const { data, error: fnError } = await supabase.functions.invoke(
          "admin-delete-user",
          {
            body: { userId: linkedProfile.user_id },
          }
        );
        const msg = (data as { error?: string } | null)?.error;
        if (fnError || msg) {
          toast.warning(
            "Professor removido. A conta de acesso vinculada não pôde ser excluída — remova manualmente se necessário."
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS] });
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES_LINKED_IDS] });
      toast.success(teachersContent.toasts.deleted);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "hard_delete_teacher" });
    },
  });
}
