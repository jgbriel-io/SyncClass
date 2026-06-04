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
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { financial_record_id, cpf, cellphone } = body as {
      financial_record_id?: string;
      cpf?: string;
      cellphone?: string;
    };

    if (!financial_record_id || !cpf) {
      return json({ error: "financial_record_id e cpf são obrigatórios" }, 400);
    }

    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      return json({ error: "CPF inválido" }, 400);
    }

    const { data: rateOk, error: rateError } = await userClient.rpc(
      "check_rate_limit",
      { p_operation: "create_abacate_payment", p_max_requests: 10, p_window_minutes: 1 }
    );
    if (rateError || !rateOk) {
      return json({ error: "Muitas requisições. Aguarde um momento." }, 429);
    }

    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("student_id, full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.student_id) {
      return json({ error: "Apenas alunos podem gerar pagamentos PIX" }, 403);
    }

    const { data: record, error: recordError } = await serviceClient
      .from("financial_records")
      .select("id, student_id, amount, description, status, pix_code, pix_expires_at, external_payment_id")
      .eq("id", financial_record_id)
      .single();

    if (recordError || !record) return json({ error: "Cobrança não encontrada" }, 404);
    if (record.student_id !== profile.student_id) return json({ error: "Não autorizado" }, 403);
    if (record.status === "pago") return json({ error: "Cobrança já paga" }, 400);

    if (record.pix_code && record.pix_expires_at) {
      if (new Date(record.pix_expires_at) > new Date()) {
        return json({ brCode: record.pix_code, expiresAt: record.pix_expires_at });
      }
    }

    const { data: student, error: studentError } = await serviceClient
      .from("students")
      .select("teacher_id")
      .eq("id", profile.student_id)
      .single();

    if (studentError || !student?.teacher_id) {
      return json({ error: "Professor não encontrado" }, 404);
    }

    const { data: teacher, error: teacherError } = await serviceClient
      .from("teachers")
      .select("abacate_pay_api_key")
      .eq("id", student.teacher_id)
      .single();

    if (teacherError || !teacher?.abacate_pay_api_key) {
      return json({ error: "Seu professor ainda não configurou o pagamento PIX automático." }, 400);
    }

    const { data: decryptedKey, error: decryptError } = await serviceClient.rpc(
      "decrypt_sensitive_data",
      { encrypted_input: teacher.abacate_pay_api_key }
    );
    if (decryptError || !decryptedKey) {
      return json({ error: "Erro ao processar credenciais. Tente novamente." }, 500);
    }

    const abacateRes = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(record.amount) * 100),
        description: record.description || "Aula de inglês",
        customer: {
          name: profile.full_name || user.email,
          email: user.email || profile.email,
          taxId: cpfClean,
          cellphone: cellphone ? cellphone.replace(/\D/g, "") : "",
        },
      }),
    });

    const abacateData = await abacateRes.json();
    if (!abacateRes.ok) {
      console.error("AbacatePay error:", JSON.stringify(abacateData));
      return json({ error: "Falha ao gerar PIX. Tente novamente." }, 502);
    }

    const brCode: string = abacateData.data.brCode;
    const externalId: string = abacateData.data.id;
    const expiresAt: string =
      abacateData.data.expiresAt ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await serviceClient
      .from("financial_records")
      .update({ pix_code: brCode, external_payment_id: externalId, pix_expires_at: expiresAt, payment_provider: "abacate_pay" })
      .eq("id", financial_record_id);

    if (updateError) throw updateError;

    return json({ brCode, expiresAt });
  } catch (err) {
    console.error("create-abacate-payment error:", err instanceof Error ? err.message : err);
    return json({ error: "Erro interno" }, 500);
  }
});
