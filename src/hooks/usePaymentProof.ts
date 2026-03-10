import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubmitPaymentProofParams {
  financialRecordId: string;
  file: File;
}

interface ReviewPaymentProofParams {
  financialRecordId: string;
  approved: boolean;
  rejectionReason?: string;
}

/**
 * Hook para aluno enviar comprovante de pagamento
 */
export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ financialRecordId, file }: SubmitPaymentProofParams) => {
      // 1. Buscar student_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("student_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.student_id) throw new Error("Student ID não encontrado");

      // 2. Upload do arquivo para storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.student_id}/${financialRecordId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 3. Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      // 4. Chamar RPC para registrar comprovante
      const { data, error } = await supabase.rpc("submit_payment_proof", {
        p_financial_record_id: financialRecordId,
        p_proof_url: publicUrl,
        p_proof_filename: file.name,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      toast.success("Comprovante enviado! Aguarde a confirmação do professor.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar comprovante: ${error.message}`);
    },
  });
}

/**
 * Hook para professor aprovar/rejeitar comprovante
 */
export function useReviewPaymentProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ financialRecordId, approved, rejectionReason }: ReviewPaymentProofParams) => {
      const { data, error } = await supabase.rpc("review_payment_proof", {
        p_financial_record_id: financialRecordId,
        p_approved: approved,
        p_rejection_reason: rejectionReason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["student_financial_records"] });
      
      if (variables.approved) {
        toast.success("Pagamento confirmado com sucesso!");
      } else {
        toast.success("Comprovante rejeitado.");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao revisar comprovante: ${error.message}`);
    },
  });
}

/**
 * Obter URL assinada para visualizar comprovante
 */
export async function getPaymentProofUrl(proofUrl: string): Promise<string> {
  // Extrair o path do arquivo da URL pública
  const urlParts = proofUrl.split("/payment-proofs/");
  if (urlParts.length < 2) throw new Error("URL inválida");
  
  const filePath = urlParts[1];

  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(filePath, 3600); // 1 hora

  if (error) throw error;
  if (!data?.signedUrl) throw new Error("Erro ao gerar URL assinada");

  return data.signedUrl;
}
