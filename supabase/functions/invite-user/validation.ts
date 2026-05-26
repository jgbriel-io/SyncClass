import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeDigits } from "./helpers.ts";

export async function validatePhonePlatform(
  admin: ReturnType<typeof createClient>,
  data: Record<string, unknown> | undefined
): Promise<string | null> {
  if (!data) return null;
  const phone = normalizeDigits(data.phone != null ? String(data.phone) : "");

  if (phone && phone.length > 0) {
    if (phone.length < 8) return "Telefone deve ter pelo menos 8 dígitos";
    if (phone.length > 15) return "Telefone deve ter no máximo 15 dígitos";
  }

  if (phone.length >= 8) {
    const { data: phoneExists } = await admin.rpc(
      "check_phone_exists_platform",
      { p_phone_digits: phone }
    );
    if (phoneExists === true) return "Telefone já cadastrado na plataforma";
  }

  return null;
}
