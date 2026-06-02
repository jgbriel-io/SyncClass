import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { toast } from "sonner";
import { students as studentsContent } from "@/content";
import { sanitizeErrorMessage, logError } from "@/lib/security/errorHandler";
import { logger } from "@/lib/logger";
import { sanitizeStudentUpdateForEdit } from "@/lib/utils/sanitizeStudentUpdate";
import { pickAnonSegment } from "@/lib/utils/anonymize";
import { QK } from "./queryKeys";

const DEFAULT_PAGE_SIZE = 10;

export type StudentsListFilters = {
  teacherId?: string;
  status?: "all" | "ativo" | "inativo" | "anonimizados";
  sortBy?:
    | "name_asc"
    | "name_desc"
    | "created_desc"
    | "last_payment_asc"
    | "last_payment_desc";
  /** Busca por nome ou e-mail (ilike no backend); dígitos (CPF/telefone) continuam no filtro client-side */
  search?: string;
};

export type Student = Tables<"students_active_masked">;
export type StudentWithStats = Tables<"students_with_stats"> & {
  anonymized_at?: string | null;
};
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;
type ProfileUpdate = TablesUpdate<"profiles">;

interface PostgresError {
  code?: string;
  message?: string;
}

export function useStudents() {
  return useQuery({
    queryKey: [QK.STUDENTS],
    queryFn: async () => {
      // IMPORTANTE: Buscar de students_masked (não students_active_masked)
      // para incluir alunos inativos e manter vínculos visíveis
      const { data, error } = await supabase
        .from("students_masked")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Student[];
    },
    staleTime: 60_000,
  });
}

export interface UseStudentsPaginatedOptions {
  pageSize?: number;
  filters?: StudentsListFilters;
}

export interface UseStudentsPaginatedResult {
  data: StudentWithStats[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useStudentsPaginated(
  options?: UseStudentsPaginatedOptions
): UseStudentsPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: [QK.STUDENTS_PAGINATED, page, pageSize, filters],
    queryFn: async () => {
      const isAnonymizedFilter = filters?.status === "anonimizados";
      let q = supabase
        .from("students_with_stats")
        .select("*", { count: "exact" })
        .eq("is_deleted", isAnonymizedFilter);

      if (filters?.teacherId && filters.teacherId !== "all") {
        q = q.eq("teacher_id", filters.teacherId);
      }
      if (!isAnonymizedFilter && filters?.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }

      const searchTerm = filters?.search?.trim().replace(/,/g, " ");
      if (searchTerm) {
        const escaped = searchTerm
          .replace(/\\/g, "\\\\")
          .replace(/%/g, "\\%")
          .replace(/_/g, "\\_");
        const pattern = `%${escaped}%`;
        q = q.or(`name.ilike.${pattern},email.ilike.${pattern}`);
      }

      const sortBy = filters?.sortBy ?? "name_asc";
      const orderCol =
        sortBy === "name_asc" || sortBy === "name_desc" ? "name" : "created_at";
      const ascending = sortBy === "name_asc";
      q = q.order(orderCol, {
        ascending: orderCol === "name" ? ascending : false,
      });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;
      return { list: (data ?? []) as StudentWithStats[], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as StudentWithStats[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  // Reset para página 0 se a página atual ficou vazia mas há dados
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

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { validatePhonePlatform } =
        await import("@/hooks/validatePhonePlatformService");
      const err = await validatePhonePlatform(supabase, student);
      if (err) throw new Error(err);
      const { data, error } = await supabase
        .from("students")
        .insert(student)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS], exact: false });
      queryClient.invalidateQueries({
        queryKey: [QK.STUDENTS_PAGINATED],
        exact: false,
      });
      toast.success(studentsContent.toasts.created);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "create_student" });
    },
  });
}

async function validateStudentPhone(
  id: string,
  phone: string,
  currentPhone?: string | null
): Promise<void> {
  const { validatePhonePlatform } =
    await import("@/hooks/validatePhonePlatformService");
  let existingPhone: string | null | undefined = currentPhone;
  if (existingPhone === undefined) {
    const { data } = await supabase
      .from("students")
      .select("phone")
      .eq("id", id)
      .single();
    existingPhone = data?.phone;
  }
  if (phone !== existingPhone) {
    const err = await validatePhonePlatform(supabase, { phone });
    if (err) throw new Error(err);
  }
}

async function syncStudentProfiles(student: Student): Promise<void> {
  const fullName = student.name;
  const normalizedEmail = student.email
    ? student.email.trim().toLowerCase()
    : null;
  const isActive = student.status === "ativo";

  const { data: linkedProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, student_id")
    .eq("student_id", student.id);

  if (profileError) throw profileError;

  let profilesToUpdate = linkedProfiles || [];
  if (profilesToUpdate.length === 0 && normalizedEmail) {
    const { data: profilesByEmail } = await supabase
      .from("profiles")
      .select("id, user_id, student_id")
      .eq("email", normalizedEmail)
      .eq("role", "student")
      .limit(1);
    if (profilesByEmail && profilesByEmail.length > 0) {
      profilesToUpdate = profilesByEmail;
    }
  }

  for (const profile of profilesToUpdate) {
    // CRÍTICO: Sempre manter o student_id, mesmo que já exista
    const profileUpdate: ProfileUpdate = {
      role: "student",
      active: isActive,
      student_id: student.id,
    };
    if (fullName) profileUpdate.full_name = fullName;
    if (normalizedEmail) profileUpdate.email = normalizedEmail;

    const { error: profileUpdateError } = await supabase.rpc(
      "update_profile_by_id",
      {
        p_id: profile.id,
        p_role: profileUpdate.role,
        p_active: profileUpdate.active,
        p_student_id: profileUpdate.student_id,
        p_teacher_id: student.teacher_id ?? null,
        p_full_name: profileUpdate.full_name || null,
        p_email: profileUpdate.email || null,
      }
    );
    if (profileUpdateError) throw profileUpdateError;
  }
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      _currentPhone,
      _currentPayDay,
      ...updates
    }: StudentUpdate & {
      id: string;
      _currentPhone?: string | null;
      _currentPayDay?: number | null;
    }) => {
      const safeUpdates = sanitizeStudentUpdateForEdit(
        updates as Record<string, unknown>
      ) as StudentUpdate;

      if (safeUpdates.phone) {
        await validateStudentPhone(id, safeUpdates.phone, _currentPhone);
      }

      const payDayChanged =
        "pay_day" in updates && updates.pay_day !== undefined;
      let oldPayDay: number | null = _currentPayDay ?? null;
      const newPayDay: number | null = updates.pay_day ?? null;

      if (payDayChanged && _currentPayDay === undefined) {
        const { data: currentStudent } = await supabase
          .from("students")
          .select("pay_day")
          .eq("id", id)
          .single();
        oldPayDay = currentStudent?.pay_day ?? null;
      }

      const { data, error } = await supabase
        .from("students")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await syncStudentProfiles(data as Student);

      if (safeUpdates.name) {
        await supabase.rpc("teacher_sync_student_display_name", {
          p_student_id: id,
          p_name: safeUpdates.name,
        });
      }

      if (payDayChanged && oldPayDay !== newPayDay && newPayDay !== null) {
        if (newPayDay < 1 || newPayDay > 31) {
          throw new Error("Dia de pagamento deve estar entre 1 e 31");
        }
        try {
          const { error: rpcError } = await supabase.rpc(
            "update_student_payment_day",
            { p_student_id: id, p_pay_day: newPayDay }
          );
          if (rpcError) {
            logger.error(rpcError as Error, {
              context: "update_student_payment_day",
              studentId: id,
              newPayDay,
            });
            toast.warning(
              "Aluno atualizado, mas não foi possível atualizar os vencimentos das cobranças."
            );
          }
        } catch (error) {
          logger.error(error as Error, {
            context: "update_student_payment_day_catch",
            studentId: id,
            newPayDay,
          });
        }
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        [QK.STUDENT_DETAILS, variables.id],
        (old: Record<string, unknown> | null | undefined) =>
          old ? { ...old, ...data } : old
      );
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS], exact: false });
      queryClient.invalidateQueries({
        queryKey: [QK.STUDENTS_PAGINATED],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: [QK.USERS], exact: false });
      queryClient.invalidateQueries({
        queryKey: [QK.USERS_PAGINATED],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES], exact: false });
      if ("pay_day" in variables && variables.pay_day !== undefined) {
        queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
        queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      }
      toast.success(studentsContent.toasts.updated);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "update_student" });
    },
  });
}

/**
 * Soft delete student - preserves class_logs and financial_records
 * Sets deleted_at timestamp and status to 'inativo'
 */
export function useSoftDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call Supabase function for soft delete
      const { error } = await supabase.rpc("soft_delete_student", {
        p_student_id: id,
      });

      if (error) {
        throw error;
      }

      // Also mark linked profiles as inactive BUT KEEP student_id
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false, student_id: id })
        .eq("student_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS], exact: false });
      queryClient.invalidateQueries({
        queryKey: [QK.STUDENTS_PAGINATED],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: [QK.USERS], exact: false });
      queryClient.invalidateQueries({
        queryKey: [QK.USERS_PAGINATED],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES], exact: false });
      toast.success(studentsContent.toasts.archived);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "soft_delete_student" });
    },
  });
}

export const useDeleteStudent = useSoftDeleteStudent;

/**
 * Hard delete student — physically removes from DB.
 * FK CASCADE removes class_logs and financial_records.
 * If there's a linked auth user (via profiles), also deletes the auth user
 * via the admin-delete-user Edge Function (which cascades profile + user_roles).
 * Admin-only (RLS policy students_admin_all).
 */
export function useHardDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      force = false,
    }: {
      id: string;
      force?: boolean;
    }) => {
      // 1) Verificar se há aulas futuras agendadas (a menos que force = true)
      if (!force) {
        const today = new Date().toISOString().split("T")[0];
        const { data: futureClasses, error: futureError } = await supabase
          .from("class_logs")
          .select("id, class_date, start_at, teachers(name)")
          .eq("student_id", id)
          .gte("class_date", today)
          .order("class_date", { ascending: true });

        if (futureError) throw futureError;

        if (futureClasses && futureClasses.length > 0) {
          // Formatar lista de aulas para mostrar no erro
          const classList = futureClasses
            .slice(0, 5)
            .map(
              (c: {
                class_date: string;
                start_at: string | null;
                teachers: { name: string } | null;
              }) => {
                const [y, m, d] = c.class_date.split("-");
                const date = `${d}/${m}/${y}`;
                const time = c.start_at ? c.start_at.slice(11, 16) : "";
                const teacher = c.teachers?.name || "Professor desconhecido";
                return time
                  ? `${date} ${time} - ${teacher}`
                  : `${date} - ${teacher}`;
              }
            )
            .join("\n");

          const remaining =
            futureClasses.length > 5
              ? `\n... e mais ${futureClasses.length - 5} aula(s)`
              : "";

          throw new Error(
            `Este aluno tem ${futureClasses.length} aula(s) agendada(s):\n\n${classList}${remaining}\n\nTodas as aulas e cobranças serão perdidas permanentemente. Tem certeza?`
          );
        }
      }

      // 2) Check if there's a linked auth user via profiles
      const { data: linkedProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("student_id", id)
        .maybeSingle();

      // 3) Anonymize student data (LGPD) — keeps row so class_logs/activities/financial_records remain linked
      const anonymizedName = `Aluno ${pickAnonSegment(id)}`;
      const { error: anonError } = await supabase
        .from("students")
        .update({
          is_deleted: true,
          anonymized_at: new Date().toISOString(),
          name: anonymizedName,
          email: null,
          phone: null,
          birth_date: null,
          city: null,
          state: null,
          country: null,
        })
        .eq("id", id);

      if (anonError) throw anonError;

      // 4) Soft delete profile + delete auth account
      if (linkedProfile?.user_id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            deleted_at: new Date().toISOString(),
            active: false,
            student_id: null,
            full_name: `Usuário ${pickAnonSegment(linkedProfile.user_id)}`,
            email: null,
            avatar_url: null,
          })
          .eq("user_id", linkedProfile.user_id);

        if (profileError) {
          toast.warning(
            studentsContent.deleteDialog.toasts.warnProfileNotDeleted
          );
        }

        const { data, error: fnError } = await supabase.functions.invoke(
          "admin-delete-user",
          {
            body: { userId: linkedProfile.user_id },
          }
        );
        const msg = (data as { error?: string } | null)?.error;
        if (fnError || msg) {
          toast.warning(
            studentsContent.deleteDialog.toasts.warnAccountNotDeleted
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES_LINKED_IDS] });
      toast.success(studentsContent.toasts.deleted);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "hard_delete_student" });
    },
  });
}

/**
 * Restore soft-deleted student
 * Removes deleted_at timestamp and reactivates student
 */
export function useRestoreStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call Supabase function for restore
      const { data, error } = await supabase.rpc("restore_student", {
        p_student_id: id,
      });

      if (error) {
        throw error;
      }

      // Verificar se retornou erro de anonimização
      const result = data as { success?: boolean; message?: string } | null;
      if (result && !result.success) {
        throw new Error(result.message || "Erro ao restaurar aluno");
      }

      // Also mark linked profiles as active
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: true })
        .eq("student_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      toast.success(studentsContent.toasts.restored);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "restore_student" });
    },
  });
}

/**
 * Hook para atualizar o dia de pagamento de um aluno e recalcular vencimentos de cobranças pendentes.
 * Usa a RPC update_student_payment_day que atualiza atomicamente:
 * - students.pay_day
 * - financial_records.due_date (apenas pendentes)
 * - Registra em audit_logs
 */
export function useUpdateStudentPaymentDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      newPayDay,
    }: {
      studentId: string;
      newPayDay: number;
    }) => {
      if (newPayDay < 1 || newPayDay > 31) {
        throw new Error("Dia de pagamento deve estar entre 1 e 31");
      }

      const { data, error } = await supabase.rpc("update_student_payment_day", {
        p_student_id: studentId,
        p_pay_day: newPayDay,
      });

      if (error) {
        throw error;
      }

      return data as {
        success: boolean;
        message: string;
        old_pay_day: number;
        new_pay_day: number;
        updated_count: number;
        updated_records: Array<{
          id: string;
          old_due_date: string;
          new_due_date: string;
          adjusted_day: number;
        }>;
      };
    },
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });

      toast.success(data.message || studentsContent.toasts.payDayUpdated);
    },
    onError: (error: unknown) => {
      const userMessage = sanitizeErrorMessage(error);
      toast.error(userMessage);
      logError(error as Error, { context: "update_student_payment_day" });
    },
  });
}
