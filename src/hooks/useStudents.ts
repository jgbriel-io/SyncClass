import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 10;

export type StudentsListFilters = {
  teacherId?: string;
  status?: "all" | "ativo" | "inativo";
  sortBy?: "name_asc" | "name_desc" | "created_desc" | "last_payment_asc" | "last_payment_desc";
  /** Busca por nome ou e-mail (ilike no backend); dígitos (CPF/telefone) continuam no filtro client-side */
  search?: string;
};

export type Student = Tables<"students_active_masked">;
export type StudentWithStats = Tables<"students_with_stats"> & { anonymized_at?: string | null };
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
      // IMPORTANTE: Buscar de students_masked (não students_active_masked)
      // para incluir alunos inativos e manter vínculos visíveis
      const { data, error } = await supabase
        .from("students_masked")
        .select("*")
        .order("created_at", { ascending: false});

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
      return { list: (data ?? []) as StudentWithStats[], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as StudentWithStats[];
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

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { validatePhonePlatform } = await import("@/lib/validate-phone-platform");
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
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      toast.success("Aluno cadastrado com sucesso!");
    },
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as PostgresError);
      toast.error(friendly || "Não foi possível cadastrar o aluno. Por favor, tente novamente.");
    },
  });
}

/** Remove phone do update se parecer mascarado (evita sobrescrever dados reais com ***) */
function sanitizeStudentUpdateForEdit(updates: Record<string, unknown>): Record<string, unknown> {
  const out = { ...updates };
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
      
      // Validar telefone se foi alterado
      if (safeUpdates.phone) {
        const { validatePhonePlatform } = await import("@/lib/validate-phone-platform");
        
        // Buscar dados atuais do aluno para comparar
        const { data: currentStudent } = await supabase
          .from("students")
          .select("phone")
          .eq("id", id)
          .single();
        
        // Só validar se telefone foi realmente alterado
        const phoneChanged = safeUpdates.phone && safeUpdates.phone !== currentStudent?.phone;
        
        if (phoneChanged) {
          const dataToValidate = { phone: safeUpdates.phone };
          const err = await validatePhonePlatform(supabase, dataToValidate);
          if (err) throw new Error(err);
        }
      }
      
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

      // Buscar profiles vinculados pelo student_id
      const { data: linkedProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, student_id")
        .eq("student_id", updatedStudent.id);

      if (profileError) {
        throw profileError;
      }

      // Se não encontrou profiles pelo student_id, buscar pelo email (vínculo perdido)
      let profilesToUpdate = linkedProfiles || [];
      if (profilesToUpdate.length === 0 && normalizedEmail) {
        const { data: profilesByEmail } = await supabase
          .from("profiles")
          .select("id, user_id, student_id")
          .eq("email", normalizedEmail)
          .eq("role", "student");
        
        if (profilesByEmail && profilesByEmail.length > 0) {
          profilesToUpdate = profilesByEmail;
        }
      }

      if (profilesToUpdate.length > 0) {
        for (const profile of profilesToUpdate) {
          // CRÍTICO: Sempre manter o student_id, mesmo que já exista
          const profileUpdate: ProfileUpdate = {
            role: "student",
            active: isActive,
            student_id: updatedStudent.id,
          };
          if (fullName) {
            profileUpdate.full_name = fullName;
          }
          if (normalizedEmail) {
            profileUpdate.email = normalizedEmail;
          }

          // Usar RPC para evitar erro de tipo UUID
          const { data: rpcData, error: profileUpdateError } = await supabase.rpc('update_profile_by_id', {
            p_id: profile.id,
            p_role: profileUpdate.role,
            p_active: profileUpdate.active,
            p_student_id: profileUpdate.student_id,
            p_teacher_id: null,
            p_full_name: profileUpdate.full_name || null,
            p_email: profileUpdate.email || null
          });

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
            
            if (roleError) {
              throw roleError;
            }
          }
        }
      }
      
      // Atualizar vencimentos usando RPC atômica
      if (payDayChanged && oldPayDay !== newPayDay && newPayDay !== null) {
        // Validar range antes de chamar RPC
        if (newPayDay < 1 || newPayDay > 31) {
          throw new Error("Dia de pagamento deve estar entre 1 e 31");
        }
        
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'update_student_payment_day',
            {
              p_student_id: id,
              p_pay_day: newPayDay,
            }
          );

          if (rpcError) {
            logger.error(rpcError as Error, { 
              context: 'update_student_payment_day',
              studentId: id,
              newPayDay 
            });
            toast.warning('Aluno atualizado, mas não foi possível atualizar os vencimentos das cobranças.');
          }
        } catch (error) {
          logger.error(error as Error, { 
            context: 'update_student_payment_day_catch',
            studentId: id,
            newPayDay 
          });
          // Não falha a operação principal se a atualização de cobranças falhar
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Aluno atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      const pgErr = error as PostgresError;
      const friendly = getDuplicateErrorMessage(pgErr);
      const msg = pgErr?.message || (error as Error)?.message;
      toast.error(friendly || msg || "Não foi possível atualizar o aluno. Por favor, tente novamente.");
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
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno arquivado com sucesso!");
    },
    onError: () => {
      toast.error("Não foi possível arquivar o aluno. Por favor, tente novamente.");
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
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
      // 1) Verificar se há aulas futuras agendadas (a menos que force = true)
      if (!force) {
        const today = new Date().toISOString().split("T")[0];
        const { data: futureClasses, error: futureError } = await supabase
          .from("class_logs")
          .select("id, class_date, start_at, teachers(name)")
          .eq("student_id", id)
          .gte("class_date", today)
          .order("class_date", { ascending: true});

        if (futureError) throw futureError;

        if (futureClasses && futureClasses.length > 0) {
          // Formatar lista de aulas para mostrar no erro
          const classList = futureClasses.slice(0, 5).map((c: { class_date: string; start_at: string | null; teachers: { name: string } | null }) => {
            const [y, m, d] = c.class_date.split("-");
            const date = `${d}/${m}/${y}`;
            const time = c.start_at || "";
            const teacher = c.teachers?.name || "Professor desconhecido";
            return `${date} ${time} - ${teacher}`;
          }).join("\n");

          const remaining = futureClasses.length > 5 ? `\n... e mais ${futureClasses.length - 5} aula(s)` : "";

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

      // 3) Delete the student record (CASCADE removes class_logs + financial_records)
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 4) If there's a linked user, soft delete the profile instead of hard delete
      if (linkedProfile?.user_id) {
        // Mark profile as deleted (soft delete for audit trail)
        // Limpar email para permitir reutilização em novos cadastros
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            deleted_at: new Date().toISOString(),
            active: false,
            student_id: null, // Remove link
            email: null // Limpar email para permitir reutilização
          })
          .eq("user_id", linkedProfile.user_id);

        if (profileError) {
          toast.warning("Aluno removido. O perfil de usuário não pôde ser marcado como deletado.");
        }

        // Delete auth account
        const { data, error: fnError } = await supabase.functions.invoke("admin-delete-user", {
          body: { userId: linkedProfile.user_id },
        });
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
      toast.error("Não foi possível excluir o aluno definitivamente. Por favor, tente novamente.");
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
      toast.error("Não foi possível restaurar o aluno. Por favor, tente novamente.");
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
      toast.error(err.message || "Não foi possível atualizar o dia de pagamento");
    },
  });
}
