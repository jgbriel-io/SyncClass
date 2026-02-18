import type { SupabaseClient } from "@supabase/supabase-js";
import { MSG_CPF_PLATFORM, MSG_PHONE_PLATFORM } from "./duplicate-messages";

function normalizeDigits(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/\D/g, "");
}

/**
 * Valida se CPF ou telefone já existe em students OU teachers (platform-wide).
 * Retorna mensagem de erro ou null se OK.
 * CPF e telefone são opcionais (para alunos estrangeiros).
 */
export async function validateCpfPhonePlatform(
  supabase: SupabaseClient,
  data: { cpf?: string; phone?: string } | undefined
): Promise<string | null> {
  if (!data) return null;
  const cpf = normalizeDigits(data.cpf);
  const phone = normalizeDigits(data.phone);
  
  // CPF é opcional - só valida se foi preenchido
  if (cpf && cpf.length > 0) {
    // Validar comprimento do CPF (deve ter exatamente 11 dígitos)
    if (cpf.length !== 11) {
      return "CPF deve ter exatamente 11 dígitos";
    }
    
    // Verificar duplicação
    const { data: exists, error } = await supabase.rpc("check_cpf_exists_platform", { p_cpf_digits: cpf });
    if (error) throw new Error("Erro ao validar CPF. Execute a migration check_cpf_phone_platform_wide.");
    if (exists === true) return MSG_CPF_PLATFORM;
  }
  
  // Telefone é opcional - só valida se foi preenchido
  if (phone && phone.length > 0) {
    // Validar comprimento do telefone
    // Brasileiro: 10-11 dígitos
    // Internacional: 8-15 dígitos
    if (phone.length < 8) {
      return "Telefone deve ter pelo menos 8 dígitos";
    }
    
    if (phone.length > 15) {
      return "Telefone deve ter no máximo 15 dígitos";
    }
    
    // Só verificar duplicação se for número brasileiro (10 ou 11 dígitos)
    if (phone.length >= 10 && phone.length <= 11) {
      const { data: exists, error } = await supabase.rpc("check_phone_exists_platform", { p_phone_digits: phone });
      if (error) throw new Error("Erro ao validar telefone. Execute a migration check_cpf_phone_platform_wide.");
      if (exists === true) return MSG_PHONE_PLATFORM;
    }
  }
  
  return null;
}
