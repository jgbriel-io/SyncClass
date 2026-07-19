import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { financial_record_id, reason } = body as {
      financial_record_id?: string;
      reason?: string;
    };

    if (!financial_record_id) {
      return json({ error: "financial_record_id é obrigatório" }, 400);
    }

    // Resolve teacher_id from caller's profile
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("teacher_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.teacher_id) {
      return json(
        { error: "Apenas professores podem solicitar reembolsos" },
        403
      );
    }

    // Fetch record + student's teacher_id for ownership check
    const { data: record, error: recordError } = await serviceClient
      .from("financial_records")
      .select(
        "id, status, external_payment_id, payment_provider, students!inner(teacher_id)"
      )
      .eq("id", financial_record_id)
      .single();

    if (recordError || !record)
      return json({ error: "Cobrança não encontrada" }, 404);

    const student = record.students as { teacher_id: string | null };
    if (student.teacher_id !== profile.teacher_id) {
      return json({ error: "Não autorizado" }, 403);
    }

    if (
      record.payment_provider !== "abacate_pay" ||
      !record.external_payment_id
    ) {
      return json(
        {
          error:
            "Esta cobrança não suporta reembolso automático via AbacatePay",
        },
        400
      );
    }

    if (record.status !== "pago") {
      return json(
        { error: "Apenas cobranças pagas podem ser reembolsadas" },
        400
      );
    }

    // Fetch teacher's AbacatePay API key
    const { data: teacher, error: teacherError } = await serviceClient
      .from("teachers")
      .select("abacate_pay_api_key")
      .eq("id", profile.teacher_id)
      .single();

    if (teacherError || !teacher?.abacate_pay_api_key) {
      return json({ error: "Credenciais AbacatePay não configuradas" }, 400);
    }

    const { data: decryptedKey, error: decryptError } = await serviceClient.rpc(
      "decrypt_sensitive_data",
      { encrypted_input: teacher.abacate_pay_api_key }
    );
    if (decryptError || !decryptedKey) {
      return json(
        { error: "Erro ao processar credenciais. Tente novamente." },
        500
      );
    }

    // Call AbacatePay refund API
    const refundBody: Record<string, string> = {
      id: record.external_payment_id,
    };
    if (reason?.trim()) refundBody.reason = reason.trim();

    const abacateRes = await fetch(
      "https://api.abacatepay.com/v2/transparents/refund",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decryptedKey}`,
        },
        body: JSON.stringify(refundBody),
      }
    );

    const abacateData = await abacateRes.json();
    if (!abacateRes.ok) {
      console.error("AbacatePay refund error:", JSON.stringify(abacateData));
      const errorMsg =
        abacateData?.error === "INSUFFICIENT_FUNDS"
          ? "Saldo insuficiente na conta AbacatePay para processar o reembolso."
          : "Falha ao processar reembolso. Verifique se o pagamento está em estado válido na AbacatePay.";
      return json({ error: errorMsg }, 502);
    }

    const refundPublicId: string = abacateData.data.refundPublicId;

    // Guard: only update if record is still pago (idempotency)
    const { error: updateError } = await serviceClient
      .from("financial_records")
      .update({ status: "extornado" })
      .eq("id", financial_record_id)
      .eq("status", "pago");

    if (updateError) throw updateError;

    return json({ refundPublicId });
  } catch (err) {
    console.error(
      "refund-abacate-payment error:",
      err instanceof Error ? err.message : err
    );
    return json({ error: "Erro interno" }, 500);
  }
});
