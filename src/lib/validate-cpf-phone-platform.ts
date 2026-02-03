import type { SupabaseClient } from "@supabase/supabase-js";
import { MSG_CPF_PLATFORM, MSG_PHONE_PLATFORM } from "./duplicate-messages";

function normalizeDigits(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/\D/g, "");
}

/**
 * Valida se CPF ou telefone já existe em students OU teachers (platform-wide).
 * Retorna mensagem de erro ou null se OK.
 */
export async function validateCpfPhonePlatform(
  supabase: SupabaseClient,
  data: { cpf?: string; phone?: string } | undefined
): Promise<string | null> {
  if (!data) return null;
  const cpf = normalizeDigits(data.cpf);
  const phone = normalizeDigits(data.phone);
  if (cpf.length === 11) {
    const { data: exists, error } = await supabase.rpc("check_cpf_exists_platform", { p_cpf_digits: cpf });
    if (error) throw new Error("Erro ao validar CPF. Execute a migration check_cpf_phone_platform_wide.");
    if (exists === true) return MSG_CPF_PLATFORM;
  }
  if (phone.length >= 10) {
    const { data: exists, error } = await supabase.rpc("check_phone_exists_platform", { p_phone_digits: phone });
    if (error) throw new Error("Erro ao validar telefone. Execute a migration check_cpf_phone_platform_wide.");
    if (exists === true) return MSG_PHONE_PLATFORM;
  }
  return null;
}
