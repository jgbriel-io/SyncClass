import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 10;

export type StudentsListFilters = {
  teacherId?: string;
  status?: "all" | "ativo" | "inativo";
  sortBy?: "name_asc" | "name_desc" | "created_desc" | "last_payment_asc" | "last_payment_desc";
  /** Busca por nome ou e-mail (ilike no backend); dígitos (CPF/telefone) continuam no filtro client-side */
  search?: string;
};

export type Student = Tables<"students">;
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;
type ProfileUpdate = TablesUpdate<"profiles">;

interface PostgresError {
  code?: string;
  message?: string;
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_active_masked")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Student[];
    },
  });
}

export interface UseStudentsPaginatedOptions {
  pageSize?: number;
  filters?: StudentsListFilters;
}

export interface UseStudentsPaginatedResult {
  data: Student[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useStudentsPaginated(options?: UseStudentsPaginatedOptions): UseStudentsPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["students_paginated", page, pageSize, filters],
    queryFn: async () => {
      // Usar students_with_stats para ter estatísticas calculadas
      let q = supabase
        .from("students_with_stats")
        .select("*", { count: "exact" });

      if (filters?.teacherId && filters.teacherId !== "all") {
        q = q.eq("teacher_id", filters.teacherId);
      }
      if (filters?.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }

      const searchTerm = filters?.search?.trim().replace(/,/g, " ");
      if (searchTerm) {
        const escaped = searchTerm.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
        const pattern = `%${escaped}%`;
        q = q.or(`name.ilike.${pattern},email.ilike.${pattern}`);
      }

      const sortBy = filters?.sortBy ?? "name_asc";
      const orderCol = sortBy === "name_asc" || sortBy === "name_desc" ? "name" : "created_at";
      const ascending = sortBy === "name_asc";
      q = q.order(orderCol, { ascending: orderCol === "name" ? ascending : false });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;
      return { list: (data ?? []) as Student[], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as Student[];
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

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { validateCpfPhonePlatform } = await import("@/lib/validate-cpf-phone-platform");
      const err = await validateCpfPhonePlatform(supabase, student);
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
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      toast.success("Aluno cadastrado com sucesso!");
    },
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as PostgresError);
      toast.error(friendly || "Erro ao cadastrar aluno. Tente novamente.");
    },
  });
}

/** Remove cpf/phone do update se parecerem mascarados (evita sobrescrever dados reais com ***) */
function sanitizeStudentUpdateForEdit(updates: Record<string, unknown>): Record<string, unknown> {
  const out = { ...updates };
  if (typeof out.cpf === "string" && out.cpf.includes("*")) {
    delete out.cpf;
  }
  if (typeof out.phone === "string" && out.phone.includes("*")) {
    delete out.phone;
  }
  return out;
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: StudentUpdate & { id: string }) => {
      const safeUpdates = sanitizeStudentUpdateForEdit(updates as Record<string, unknown>) as StudentUpdate;
      
      // Verifica se pay_day foi alterado
      const payDayChanged = 'pay_day' in updates && updates.pay_day !== undefined;
      let oldPayDay: number | null = null;
      const newPayDay: number | null = updates.pay_day ?? null;
      
      if (payDayChanged) {
        // Busca o pay_day antigo
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

      if (error) {
        throw error;
      }

      // Synchronize profiles, user_roles and active flag for linked users
      const updatedStudent = data as Student;
      const fullName = updatedStudent.name;
      const rawEmail = updatedStudent.email;
      const normalizedEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
      const isActive = updatedStudent.status === "ativo";

      const { data: linkedProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("student_id", updatedStudent.id);

      if (profileError) {
        throw profileError;
      }

      if (linkedProfiles && linkedProfiles.length > 0) {
        for (const profile of linkedProfiles) {
          const profileUpdate: ProfileUpdate = {
            role: "student",
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
              p_role: "student",
              p_full_name: fullName ?? null,
              p_email: normalizedEmail,
            });
            if (roleError) throw roleError;
          }
        }
      }
      
      // ✅ NOVO: Atualizar vencimentos usando RPC atômica
      if (payDayChanged && oldPayDay !== newPayDay && newPayDay !== null) {
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'update_student_payment_day',
            {
              p_student_id: id,
              p_new_pay_day: newPayDay,
            }
          );

          if (rpcError) {
            console.error('Erro ao atualizar vencimentos:', rpcError);
            toast.warning('Aluno atualizado, mas não foi possível atualizar os vencimentos das cobranças.');
          } else if (rpcResult) {
            const updatedCount = rpcResult.updated_count || 0;
            if (updatedCount > 0) {
              console.log(`✅ MIGRATION_SUCCESS: update_student_payment_day moved to RPC`, {
                migration_date: '2026-02-14',
                old_method: 'loop_updates',
                new_method: 'rpc',
                updated_count: updatedCount,
              });
            }
          }
        } catch (error) {
          console.error('Erro ao chamar RPC update_student_payment_day:', error);
          // Não falha a operação principal se a atualização de cobranças falhar
        }
      }

      /* ❌ ANTIGO: Loop de updates (DEPRECATED - remover em 2026-03-01)
      if (payDayChanged && oldPayDay !== newPayDay && newPayDay !== null) {
        try {
          const { data: pendingRecords, error: fetchError } = await supabase
            .from("financial_records")
            .select("id, due_date")
            .eq("student_id", id)
            .eq("status", "pendente");
          
          if (fetchError) throw fetchError;

          if (pendingRecords && pendingRecords.length > 0) {
            const updates = [];
            for (const record of pendingRecords) {
              if (record.due_date) {
                const dueDate = new Date(record.due_date + "T00:00:00");
                const year = dueDate.getFullYear();
                const month = dueDate.getMonth() + 1;
                const lastDay = new Date(year, month, 0).getDate();
                const newDay = Math.min(newPayDay, lastDay);
                const newDueDate = `${year}-${String(month).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;

                const { error: updateError } = await supabase
                  .from("financial_records")
                  .update({ due_date: newDueDate })
                  .eq("id", record.id);
                
                if (!updateError) updates.push(record.id);
              }
            }
          }
        } catch {
          // Não falha a operação principal se a atualização de cobranças falhar
        }
      }
      */

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Aluno atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      const pgErr = error as PostgresError;
      const friendly = getDuplicateErrorMessage(pgErr);
      const msg = pgErr?.message || (error as Error)?.message;
      toast.error(friendly || msg || "Erro ao atualizar aluno. Tente novamente.");
    },
  });
}

/**
 * @deprecated Use useSoftDeleteStudent() instead to preserve data history
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("students")
        .update({ status: "inativo" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Also mark linked profiles as inactive
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("student_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno arquivado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao arquivar aluno. Tente novamente.");
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

      // Also mark linked profiles as inactive
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("student_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno arquivado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao arquivar aluno. Tente novamente.");
    },
  });
}

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
    mutationFn: async (id: string) => {
      // 1) Check if there's a linked auth user via profiles
      const { data: linkedProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("student_id", id)
        .maybeSingle();

      // 2) Delete the student record (CASCADE removes class_logs + financial_records)
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 3) If there's a linked user, hard-delete the auth account too
      if (linkedProfile?.user_id) {
        const { data, error: fnError } = await supabase.functions.invoke("admin-delete-user", {
          body: { userId: linkedProfile.user_id },
        });
        // Edge Function may return { error: "..." } in body
        const msg = (data as { error?: string } | null)?.error;
        if (fnError || msg) {
          toast.warning("Aluno removido. A conta de acesso vinculada não pôde ser excluída — remova manualmente se necessário.");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles_linked_ids"] });
      toast.success("Aluno excluído definitivamente.");
    },
    onError: () => {
      toast.error("Erro ao excluir aluno definitivamente. Tente novamente.");
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
      const { error } = await supabase.rpc("restore_student", {
        p_student_id: id,
      });

      if (error) {
        throw error;
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
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno restaurado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao restaurar aluno. Tente novamente.");
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
    mutationFn: async ({ studentId, newPayDay }: { studentId: string; newPayDay: number }) => {
      if (newPayDay < 1 || newPayDay > 31) {
        throw new Error("Dia de pagamento deve estar entre 1 e 31");
      }

      const { data, error } = await supabase.rpc("update_student_payment_day", {
        p_student_id: studentId,
        p_new_pay_day: newPayDay,
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
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      
      toast.success(data.message || "Dia de pagamento atualizado com sucesso!");
    },
    onError: (error) => {
      const err = error as Error;
      toast.error(err.message || "Erro ao atualizar dia de pagamento");
    },
  });
}
