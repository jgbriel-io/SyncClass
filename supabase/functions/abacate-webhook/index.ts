import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const webhookSecret = url.searchParams.get("webhookSecret");
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("abacate_pay_webhook_secret", webhookSecret)
    .maybeSingle();

  if (!teacher) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  if (!body || Object.keys(body).length === 0) {
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventId: string = body.id || `abacate-${Date.now()}`;

  const { error: logError } = await supabase
    .from("webhook_processing_log")
    .insert({ event_id: eventId, gateway: "abacate-pay" });

  if (logError) {
    if (logError.code === "23505") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("webhook_processing_log insert error:", logError.message);
  }

  if (body.event === "billing.paid" || body.event === "pixQrCode.paid") {
    const billingId: string | undefined =
      body.data?.pixQrCode?.id || body.data?.id;

    if (billingId) {
      const { data: record } = await supabase
        .from("financial_records")
        .select("id, status")
        .eq("external_payment_id", billingId)
        .maybeSingle();

      if (record && record.status !== "pago") {
        const { error: updateError } = await supabase
          .from("financial_records")
          .update({
            status: "pago",
            paid_at: new Date().toISOString(),
          })
          .eq("id", record.id)
          .neq("status", "pago");

        if (updateError) {
          console.error("financial_records update error:", updateError.message);
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
