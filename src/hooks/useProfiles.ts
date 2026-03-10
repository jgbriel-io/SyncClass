import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
    queryKey: ["profiles", "unlinked"],
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
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, student_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch student names for linked profiles
      const linkedProfiles = profiles?.filter(p => p.student_id) || [];
      const studentIds = linkedProfiles.map(p => p.student_id).filter(Boolean);

      let studentMap: Record<string, string> = {};
      if (studentIds.length > 0) {
        // Use students_masked para garantir mascaramento LGPD
        // (não afeta esta query pois só seleciona id e name)
        const { data: students } = await supabase
          .from("students_masked")
          .select("id, name")
          .in("id", studentIds as string[]);

        studentMap = (students || []).reduce((acc, s) => {
          acc[s.id] = s.name;
          return acc;
        }, {} as Record<string, string>);
      }

      return (profiles || []).map(profile => ({
        ...profile,
        student_name: profile.student_id ? studentMap[profile.student_id] || null : null,
      })) as ProfileWithRole[];
    },
  });
}

// Link a profile to a student
export function useLinkStudentToProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, studentId }: { profileId: string; studentId: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ student_id: studentId })
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Usuário vinculado",
        description: "O usuário foi vinculado ao aluno com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: "Não foi possível vincular o usuário ao aluno.",
      });
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
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Vínculo removido",
        description: "O vínculo entre usuário e aluno foi removido.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao desvincular",
        description: "Não foi possível remover o vínculo.",
      });
    },
  });
}
