import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "./helpers.ts";

export async function rollbackAuthUser(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  try {
    await admin.auth.admin.deleteUser(userId);
    log("Rollback: auth user deleted", { userId });
  } catch (e) {
    log("Rollback failed to delete auth user", {
      userId,
      error: (e as Error).message,
    });
  }
}

export async function waitForProfile(
  userId: string,
  admin: ReturnType<typeof createClient>,
  maxAttempts = 8
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return;
    await new Promise((r) => setTimeout(r, 150 + i * 100));
  }
  throw new Error("Perfil não foi criado a tempo. Tente novamente.");
}
