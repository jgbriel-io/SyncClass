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

  console.log("abacate-webhook event:", body.event, "data keys:", Object.keys(body.data || {}));

  if (
    body.event === "billing.paid" ||
    body.event === "pixQrCode.paid" ||
    body.event === "transparent.paid" ||
    body.event === "transparent.completed"
  ) {
    const billingId: string | undefined =
      body.data?.pixQrCode?.id ||
      body.data?.transparent?.id ||
      body.data?.billing?.id ||
      body.data?.id;

    console.log("billingId extracted:", billingId, "| data.id:", body.data?.id, "| data.pixQrCode?.id:", body.data?.pixQrCode?.id, "| data.transparent?.id:", body.data?.transparent?.id);

    if (billingId) {
      const { data: record, error: recordLookupError } = await supabase
        .from("financial_records")
        .select("id, status")
        .eq("external_payment_id", billingId)
        .maybeSingle();

      console.log("record lookup:", record?.id ?? "not found", "| lookupError:", recordLookupError?.message ?? "none");

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
        } else {
          console.log("financial_record updated to pago:", record.id);
        }
      } else if (record?.status === "pago") {
        console.log("record already pago:", record.id);
      }
    } else {
      console.error("billingId not found in payload. Full data:", JSON.stringify(body.data));
    }
  } else {
    console.log("unhandled event type, skipping:", body.event);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
