/**
 * Edge Function: Webhook de Pagamento Seguro
 * 
 * Valida assinatura HMAC e processa pagamentos
 * Implementa rate limiting e timeout handling
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface WebhookPayload {
  event_type: string;
  payment_id: string;
  amount: number;
  status: 'approved' | 'rejected';
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIp,
      p_endpoint: '/webhook-payment',
      p_max_requests: 100,
      p_window_minutes: 1,
    });

    if (!rateLimitCheck?.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retry_after: rateLimitCheck.retry_after,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Validação de Assinatura HMAC
    const signature = req.headers.get('x-signature');
    const rawBody = await req.text();

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: isValid } = await supabase.rpc('validate_webhook_signature', {
      p_provider: 'payment_gateway',
      p_payload: rawBody,
      p_signature: signature,
    });

    if (!isValid) {
      // Log webhook inválido
      await supabase.rpc('log_webhook', {
        p_provider: 'payment_gateway',
        p_event_type: 'unknown',
        p_payload: JSON.parse(rawBody),
        p_signature: signature,
        p_signature_valid: false,
      });

      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse e Valida Payload
    const payload: WebhookPayload = JSON.parse(rawBody);

    if (!payload.event_type || !payload.payment_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Log Webhook Válido
    const { data: logId } = await supabase.rpc('log_webhook', {
      p_provider: 'payment_gateway',
      p_event_type: payload.event_type,
      p_payload: payload,
      p_signature: signature,
      p_signature_valid: true,
    });

    // 5. Processa Pagamento (com timeout de 50s)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 50000)
    );

    const processPromise = processPayment(supabase, payload);

    const result = await Promise.race([processPromise, timeoutPromise]);

    // 6. Marca webhook como processado
    await supabase
      .from('webhook_logs')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', logId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed',
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Processa pagamento de forma idempotente
 */
async function processPayment(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload
) {
  if (payload.status !== 'approved') {
    return { skipped: true, reason: 'Payment not approved' };
  }

  // Usa RPC idempotente
  const { data, error } = await supabase.rpc('confirm_payment_idempotent', {
    p_record_id: payload.payment_id,
    p_idempotency_key: `webhook_${payload.payment_id}_${payload.event_type}`,
  });

  if (error) {
    throw new Error(`Failed to confirm payment: ${error.message}`);
  }

  return data;
}
