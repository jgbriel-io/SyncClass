# Sprint 19 — Integração com Pagamento Real (Stripe / Pix API)

**Período:** Junho 2026  
**Status:** ⬜ Planejada  
**Estimativa:** ~8h  
**Tipo:** Feature (MVP Extension)

---

## Problem Statement

### Contexto

Atualmente, o fluxo de pagamento é manual:

1. Aluno recebe cobrança no sistema
2. Aluno faz transferência/Pix manualmente
3. Aluno envia comprovante via upload
4. Professor valida comprovante manualmente
5. Professor marca como pago no sistema

Este fluxo tem problemas:

- Alto atrito para o aluno (múltiplos passos)
- Trabalho manual para o professor (validar comprovantes)
- Risco de fraude (comprovantes falsos ou editados)
- Atraso na confirmação de pagamento

### Impacto

- Taxa de inadimplência mais alta devido ao atrito
- Tempo do professor desperdiçado validando comprovantes
- Experiência de usuário inferior comparada a concorrentes
- Falta de automação financeira

### Objetivo

Substituir fluxo manual por pagamento real via Stripe (cartão internacional) ou API de Pix brasileira (EfiBank/Asaas), com confirmação automática via webhook.

---

## Requirements

### Functional Requirements

- **FR-19.1:** Aluno pode pagar cobrança via Pix (QR Code ou Pix Copia e Cola)
- **FR-19.2:** Aluno pode pagar cobrança via cartão de crédito (Stripe)
- **FR-19.3:** Pagamento confirmado automaticamente via webhook
- **FR-19.4:** Professor recebe notificação de pagamento confirmado
- **FR-19.5:** Fluxo manual de comprovante mantido como fallback
- **FR-19.6:** Histórico de transações visível para professor e aluno

### Non-Functional Requirements

- **NFR-19.1:** Webhook deve processar pagamento em até 10 segundos
- **NFR-19.2:** Webhook deve validar assinatura para evitar fraude
- **NFR-19.3:** Idempotência garantida (mesmo pagamento não processado 2x)
- **NFR-19.4:** Dados de pagamento armazenados de forma segura (PCI DSS)
- **NFR-19.5:** Taxa de sucesso de pagamento > 95%

### Out of Scope

- Pagamento recorrente (assinatura)
- Split de pagamento (marketplace)
- Boleto bancário
- Integração com múltiplos gateways simultaneamente
- Reembolso automático

---

## Background

### Opções de Gateway de Pagamento

| Gateway          | Pix | Cartão | Taxa          | Sandbox     | Complexidade |
| ---------------- | --- | ------ | ------------- | ----------- | ------------ |
| **Stripe**       | ❌  | ✅     | 3.9% + R$0.40 | ✅ Completo | Baixa        |
| **EfiBank**      | ✅  | ✅     | 1.99% (Pix)   | ✅ Gratuito | Média        |
| **Asaas**        | ✅  | ✅     | 1.49% (Pix)   | ✅ Gratuito | Média        |
| **Mercado Pago** | ✅  | ✅     | 4.99%         | ✅ Completo | Baixa        |

**Recomendação:** EfiBank para Pix (menor taxa, API brasileira) + Stripe para cartão internacional (melhor SDK).

### Fluxo de Pagamento com Webhook

```
Aluno clica "Pagar"
  ↓
Edge Function cria cobrança na API do gateway
  ↓
Gateway retorna URL de pagamento ou QR Code
  ↓
Aluno paga via app do banco
  ↓
Gateway envia webhook para Supabase
  ↓
Edge Function valida webhook e confirma pagamento
  ↓
Notificação enviada para professor
```

### Idempotência

Usar `idempotency_keys` para garantir que mesmo pagamento não seja processado 2x. Já implementado em `confirm_payment_idempotent()`.

---

## Proposed Solution

### Arquitetura

```
Frontend → Edge Function `create-payment`
  ↓
Gateway API (EfiBank/Stripe)
  ↓
Retorna URL/QR Code
  ↓
Aluno paga
  ↓
Gateway → Webhook → Edge Function `payment-webhook`
  ↓
Valida assinatura + chama `confirm_payment_idempotent()`
  ↓
Notificação criada em `notifications`
```

### Schema de Pagamento

```sql
ALTER TABLE financial_records
  ADD COLUMN payment_provider TEXT CHECK (payment_provider IN ('stripe', 'efibank', 'asaas', 'manual')),
  ADD COLUMN external_payment_id TEXT, -- ID da transação no gateway
  ADD COLUMN payment_url TEXT, -- URL de checkout ou QR Code
  ADD COLUMN payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'manual')),
  ADD COLUMN payment_confirmed_at TIMESTAMPTZ;

CREATE INDEX idx_financial_external_payment ON financial_records(external_payment_id)
  WHERE external_payment_id IS NOT NULL;
```

### Armazenamento de Credenciais

```sql
-- Credenciais do gateway armazenadas em profiles (apenas professores)
ALTER TABLE profiles
  ADD COLUMN efibank_client_id TEXT,
  ADD COLUMN efibank_client_secret TEXT,
  ADD COLUMN stripe_secret_key TEXT;
```

**Nota:** Credenciais devem ser criptografadas usando `pgcrypto`.

---

## Task Breakdown

### Task 19.1 — Criar migration para campos de pagamento

**Estimativa:** 15min  
**Responsável:** Backend  
**Dependências:** Nenhuma

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_add_payment_fields.sql`

**Descrição:**
Adicionar colunas de pagamento em `financial_records` e `profiles`.

**Implementação:**

```sql
-- Campos de pagamento em financial_records
ALTER TABLE financial_records
  ADD COLUMN payment_provider TEXT CHECK (payment_provider IN ('stripe', 'efibank', 'asaas', 'manual')),
  ADD COLUMN external_payment_id TEXT,
  ADD COLUMN payment_url TEXT,
  ADD COLUMN payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'manual')),
  ADD COLUMN payment_confirmed_at TIMESTAMPTZ;

CREATE INDEX idx_financial_external_payment ON financial_records(external_payment_id)
  WHERE external_payment_id IS NOT NULL;

-- Credenciais de gateway em profiles
ALTER TABLE profiles
  ADD COLUMN efibank_client_id TEXT,
  ADD COLUMN efibank_client_secret TEXT,
  ADD COLUMN stripe_secret_key TEXT;
```

**Acceptance Criteria:**

- Migration aplicada sem erros
- Índice criado para otimizar busca por `external_payment_id`
- Constraints de CHECK funcionando

---

### Task 19.2 — Edge Function `create-payment` (EfiBank Pix)

**Estimativa:** 2h  
**Responsável:** Backend  
**Dependências:** 19.1

**Arquivo:** `supabase/functions/create-payment/index.ts`

**Descrição:**
Edge Function que cria cobrança Pix via EfiBank API.

**Implementação:**

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EFIBANK_API = "https://api-pix.gerencianet.com.br/v2";

Deno.serve(async (req) => {
  const { financial_record_id } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar registro financeiro e credenciais do professor
  const { data: record, error: recordError } = await supabase
    .from("financial_records")
    .select("*, students(*, profiles(*)), teachers:teacher_id(profiles(*))")
    .eq("id", financial_record_id)
    .single();

  if (recordError) throw recordError;

  const teacherProfile = record.teachers.profiles;
  const clientId = teacherProfile.efibank_client_id;
  const clientSecret = teacherProfile.efibank_client_secret;

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: "Professor não configurou credenciais EfiBank" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Obter access token
  const tokenResponse = await fetch(`${EFIBANK_API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Falha ao obter token EfiBank");
  }

  const { access_token } = await tokenResponse.json();

  // Criar cobrança Pix
  const txid = crypto.randomUUID().replace(/-/g, "").substring(0, 32);

  const chargeResponse = await fetch(`${EFIBANK_API}/cob/${txid}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      calendario: {
        expiracao: 86400, // 24 horas
      },
      devedor: {
        nome: record.students.profiles.full_name,
        cpf: record.students.cpf || "00000000000",
      },
      valor: {
        original: record.amount.toFixed(2),
      },
      chave: teacherProfile.pix_key, // Chave Pix do professor
      solicitacaoPagador: `Pagamento - ${record.description}`,
    }),
  });

  if (!chargeResponse.ok) {
    const error = await chargeResponse.json();
    throw new Error(`EfiBank API error: ${JSON.stringify(error)}`);
  }

  const charge = await chargeResponse.json();

  // Gerar QR Code
  const qrCodeResponse = await fetch(
    `${EFIBANK_API}/loc/${charge.loc.id}/qrcode`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  const qrCode = await qrCodeResponse.json();

  // Atualizar registro financeiro
  await supabase
    .from("financial_records")
    .update({
      payment_provider: "efibank",
      external_payment_id: txid,
      payment_url: qrCode.imagemQrcode, // Base64 do QR Code
      payment_method: "pix",
    })
    .eq("id", financial_record_id);

  return new Response(
    JSON.stringify({
      txid,
      qrcode: qrCode.qrcode, // Pix Copia e Cola
      qrcode_image: qrCode.imagemQrcode, // Base64 da imagem
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

**Acceptance Criteria:**

- Edge Function cria cobrança Pix via EfiBank
- Retorna QR Code e Pix Copia e Cola
- Atualiza `financial_records` com `external_payment_id`
- Trata erros de API corretamente

---

### Task 19.3 — Edge Function `payment-webhook`

**Estimativa:** 1h 30min  
**Responsável:** Backend  
**Dependências:** 19.2

**Arquivo:** `supabase/functions/payment-webhook/index.ts`

**Descrição:**
Edge Function que recebe webhook do gateway e confirma pagamento.

**Implementação:**

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validar assinatura do webhook (EfiBank)
  const signature = req.headers.get("x-gerencianet-signature");
  const body = await req.text();

  // Buscar credenciais do professor (assumindo que webhook inclui teacher_id)
  const payload = JSON.parse(body);
  const txid = payload.pix[0].txid;

  const { data: record } = await supabase
    .from("financial_records")
    .select("*, teachers:teacher_id(profiles(*))")
    .eq("external_payment_id", txid)
    .single();

  if (!record) {
    return new Response(JSON.stringify({ error: "Registro não encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const clientSecret = record.teachers.profiles.efibank_client_secret;

  // Validar assinatura
  const expectedSignature = createHmac("sha256", clientSecret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Confirmar pagamento (idempotente)
  const { error } = await supabase.rpc("confirm_payment_idempotent", {
    p_financial_record_id: record.id,
    p_idempotency_key: txid,
  });

  if (error) throw error;

  // Criar notificação para professor
  await supabase.from("notifications").insert({
    user_id: record.teacher_id,
    type: "pagamento_confirmado",
    title: "Pagamento confirmado",
    body: `${record.students.profiles.full_name} - R$ ${record.amount.toFixed(2)}`,
    related_id: record.id,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Acceptance Criteria:**

- Webhook valida assinatura corretamente
- Pagamento confirmado via `confirm_payment_idempotent()`
- Notificação criada para professor
- Idempotência garantida (mesmo webhook não processa 2x)

---

### Task 19.4 — Componente `PaymentButton`

**Estimativa:** 1h  
**Responsável:** Frontend  
**Dependências:** 19.2

**Arquivo:** `src/components/financial/PaymentButton.tsx`

**Descrição:**
Botão que inicia fluxo de pagamento e exibe QR Code Pix.

**Implementação:**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";

interface PaymentButtonProps {
  financialRecordId: string;
  amount: number;
}

export const PaymentButton = ({
  financialRecordId,
  amount,
}: PaymentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<{
    qrcode: string;
    qrcode_image: string;
  } | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: { financial_record_id: financialRecordId },
        }
      );

      if (error) throw error;

      setQrCode(data);
      setIsOpen(true);
    } catch (error) {
      toast.error("Erro ao gerar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode!.qrcode);
    toast.success("Código Pix copiado!");
  };

  return (
    <>
      <Button onClick={handlePayment} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            Gerando...
          </>
        ) : (
          `Pagar R$ ${amount.toFixed(2)}`
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar com Pix</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCode?.qrcode_image}
                alt="QR Code Pix"
                className="w-64 h-64"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ou copie o código Pix:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrCode?.qrcode || ""}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              O pagamento será confirmado automaticamente em alguns segundos.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

**Acceptance Criteria:**

- Botão exibe valor a pagar
- Dialog mostra QR Code e Pix Copia e Cola
- Botão de copiar funciona
- Loading state durante geração

---

### Task 19.5 — Integrar `PaymentButton` no portal do aluno

**Estimativa:** 20min  
**Responsável:** Frontend  
**Dependências:** 19.4

**Arquivo:** `src/pages/student/StudentFinancial.tsx`

**Descrição:**
Substituir fluxo de comprovante por botão de pagamento.

**Implementação:**

```tsx
import { PaymentButton } from "@/components/financial/PaymentButton";

// Na tabela de cobranças
{
  record.status === "pending" && (
    <PaymentButton financialRecordId={record.id} amount={record.amount} />
  );
}
```

**Acceptance Criteria:**

- Botão visível apenas em cobranças pendentes
- Fluxo de comprovante mantido como fallback (link "Enviar comprovante")

---

### Task 19.6 — Configurar webhook URL no EfiBank

**Estimativa:** 15min  
**Responsável:** DevOps  
**Dependências:** 19.3

**Descrição:**
Configurar URL do webhook no painel do EfiBank.

**Passos:**

1. Fazer deploy da Edge Function `payment-webhook`
2. Obter URL pública: `https://<project-ref>.supabase.co/functions/v1/payment-webhook`
3. Configurar no painel EfiBank → Webhooks → Adicionar URL
4. Testar webhook com transação de teste

**Acceptance Criteria:**

- Webhook URL configurada no EfiBank
- Teste de webhook bem-sucedido
- Logs de webhook visíveis no Supabase

---

### Task 19.7 — Testes end-to-end

**Estimativa:** 1h 30min  
**Responsável:** QA  
**Dependências:** 19.1-19.6

**Cenários de Teste:**

1. **Pagamento via Pix (sandbox):**
   - Login como aluno
   - Abrir cobrança pendente
   - Clicar "Pagar"
   - Verificar QR Code gerado
   - Simular pagamento no sandbox EfiBank
   - Verificar que status muda para "Pago" automaticamente

2. **Notificação de pagamento:**
   - Após pagamento confirmado
   - Login como professor
   - Verificar notificação de pagamento

3. **Idempotência:**
   - Simular webhook duplicado (enviar 2x)
   - Verificar que pagamento não é processado 2x

4. **Webhook com assinatura inválida:**
   - Enviar webhook com assinatura errada
   - Verificar que retorna 401 Unauthorized

5. **Fallback para comprovante manual:**
   - Aluno sem acesso a Pix
   - Verificar que link "Enviar comprovante" ainda funciona

**Acceptance Criteria:**

- Todos os cenários passam
- Pagamento confirmado em < 10s após webhook
- Sem erros no console ou logs

---

## Implementation Details

### Tecnologias Utilizadas

- **EfiBank API:** Geração de cobranças Pix
- **Supabase Edge Functions:** Criação de pagamento e processamento de webhook
- **shadcn/ui:** Componentes `Dialog`, `Button`

### Padrões de Código

- Edge Functions seguem padrão de outras functions do projeto
- Componente `PaymentButton` usa design tokens
- Validação de webhook com HMAC SHA-256

### Considerações de Segurança

- **Credenciais:** Armazenar criptografadas com `pgcrypto`
- **Webhook:** Validar assinatura para evitar fraude
- **Idempotência:** Usar `confirm_payment_idempotent()` para evitar duplicação
- **PCI DSS:** Não armazenar dados de cartão (se usar Stripe)

---

## Files to Create

### Migrations

- `supabase/migrations/YYYYMMDDHHMMSS_add_payment_fields.sql`

### Backend

- `supabase/functions/create-payment/index.ts`
- `supabase/functions/payment-webhook/index.ts`

### Frontend

- `src/components/financial/PaymentButton.tsx`

---

## Files to Modify

### Frontend

- `src/pages/student/StudentFinancial.tsx` — adicionar `<PaymentButton />`

---

## Testing & Validation

### Unit Tests

- `create-payment.test.ts` — testar criação de cobrança
- `payment-webhook.test.ts` — testar validação de assinatura

### Integration Tests

- Testar fluxo completo em sandbox EfiBank
- Testar idempotência de webhook

### Manual Testing

- Testar com múltiplos alunos simultaneamente
- Verificar notificações em tempo real
- Testar fallback para comprovante manual

---

## Results & Impact (Esperado)

### Métricas de Sucesso

- **Taxa de conversão:** Aumento de 40% em pagamentos no prazo
- **Redução de trabalho manual:** 80% menos comprovantes para validar
- **Satisfação:** Feedback positivo sobre facilidade de pagamento

### Impacto no Usuário

- Alunos pagam em 1 clique (vs 5 passos manuais)
- Professores não precisam validar comprovantes
- Confirmação automática em segundos

---

## Technical Debt

### Débitos Conhecidos

- Credenciais não criptografadas (risco de vazamento)
- Sem retry automático em caso de falha de webhook
- Sem suporte para reembolso
- Sem dashboard de transações

### Melhorias Futuras

- Criptografar credenciais com `pgcrypto`
- Implementar retry com backoff exponencial
- Adicionar suporte para Stripe (cartão internacional)
- Adicionar dashboard de transações para professor
- Implementar reembolso automático

---

## Next Steps

### Sprint 20 — Gamificação do Portal do Aluno

Adicionar badges, streak de presença e barra de progresso para aumentar engajamento com atividades e frequência nas aulas.

---

## References

### Documentação

- [EfiBank API](https://dev.efipay.com.br/docs)
- [Stripe API](https://stripe.com/docs/api)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Código Relacionado

- `supabase/functions/invite-user/` — padrão de Edge Function
- `src/hooks/useFinancialRecords.ts` — hook de registros financeiros
- `confirm_payment_idempotent()` — RPC de confirmação idempotente
