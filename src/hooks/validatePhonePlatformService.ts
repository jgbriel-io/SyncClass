import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeDigits(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/\D/g, "");
}

export async function validatePhonePlatform(
  supabase: SupabaseClient,
  data: Record<string, unknown> | undefined
): Promise<string | null> {
  if (!data) return null;
  const phone = normalizeDigits(data.phone as string);

  if (phone && phone.length > 0) {
    if (phone.length < 8) return "Telefone deve ter pelo menos 8 dígitos";
    if (phone.length > 15) return "Telefone deve ter no máximo 15 dígitos";
  }

  if (phone.length >= 8) {
    const { data: phoneExists } = await supabase.rpc(
      "check_phone_exists_platform",
      { p_phone_digits: phone }
    );
    if (phoneExists === true) return "Telefone já cadastrado na plataforma";
  }

  return null;
}
