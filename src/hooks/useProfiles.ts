import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { toast } from "sonner";

export interface ProfileWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  student_id: string | null;
  created_at: string | null;
  student_name?: string | null;
}

// Fetch all profiles (users) that are students without linked student records
export function useUnlinkedProfiles() {
  return useQuery({
    queryKey: [QK.PROFILES, "unlinked"],
    queryFn: async () => {
      // Get profiles that don't have a student_id linked
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, student_id, created_at")
        .is("student_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return profiles as ProfileWithRole[];
    },
  });
}

// Fetch all profiles with their linked student info
export function useAllProfiles() {
  return useQuery({
    queryKey: [QK.PROFILES, "all"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, student_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch student names for linked profiles
      const linkedProfiles = profiles?.filter((p) => p.student_id) || [];
      const studentIds = linkedProfiles
        .map((p) => p.student_id)
        .filter(Boolean);

      let studentMap: Record<string, string> = {};
      if (studentIds.length > 0) {
        // Use students_masked para garantir mascaramento LGPD
        // (não afeta esta query pois só seleciona id e name)
        const { data: students } = await supabase
          .from("students_masked")
          .select("id, name")
          .in("id", studentIds as string[]);

        studentMap = (students || []).reduce(
          (acc, s) => {
            acc[s.id] = s.name;
            return acc;
          },
          {} as Record<string, string>
        );
      }

      return (profiles || []).map((profile) => ({
        ...profile,
        student_name: profile.student_id
          ? studentMap[profile.student_id] || null
          : null,
      })) as ProfileWithRole[];
    },
  });
}

// Link a profile to a student
export function useLinkStudentToProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      studentId,
    }: {
      profileId: string;
      studentId: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ student_id: studentId })
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      toast.success("Usuário vinculado ao aluno com sucesso.");
    },
    onError: () => {
      toast.error("Não foi possível vincular o usuário ao aluno.");
    },
  });
}

// Unlink a profile from a student
export function useUnlinkStudentFromProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ student_id: null })
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      toast.success("Vínculo entre usuário e aluno removido.");
    },
    onError: () => {
      toast.error("Não foi possível remover o vínculo.");
    },
  });
}
