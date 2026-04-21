# Sprint 17 — Integração com Pagamento Real (Stripe / Pix API)
**Período:** Junho 2026
**Status:** ⬜ Pendente
**Estimativa:** ~8h

## Objetivo
Substituir o fluxo manual de comprovante por pagamento real via Stripe (cartão) ou Pix via API (EfiBank/Asaas).

## Decisão de Tecnologia

| Opção | Prós | Contras |
|---|---|---|
| **Stripe** | SDK excelente, webhooks confiáveis, sandbox completo | Não suporta Pix nativamente |
| **EfiBank (Gerencianet)** | Pix nativo, API brasileira, sandbox gratuito | SDK menos maduro |
| **Asaas** | Pix + boleto + cartão, API simples | Custo por transação maior |

**Recomendação:** EfiBank para Pix (já que o projeto usa QR Code Pix) ou Stripe para cartão internacional.

## Tarefas

### 17.1 — Edge Function `create-payment`
**Arquivo:** `supabase/functions/create-payment/`
- Recebe `financial_record_id`
- Cria cobrança na API escolhida
- Retorna URL de pagamento ou QR Code
- Armazena `external_payment_id` em `financial_records`

---

### 17.2 — Edge Function `payment-webhook`
**Arquivo:** `supabase/functions/payment-webhook/`
- Recebe webhook da API de pagamento
- Valida assinatura do webhook
- Chama `confirm_payment_idempotent()` no banco
- Notifica o professor via tabela `notifications`

---

### 17.3 — Atualizar schema
```sql
ALTER TABLE financial_records
  ADD COLUMN external_payment_id TEXT,
  ADD COLUMN payment_url TEXT,
  ADD COLUMN payment_provider TEXT CHECK (payment_provider IN ('stripe', 'efibank', 'asaas', 'manual'));
```

---

### 17.4 — UI — botão "Pagar agora"
**Arquivo:** `src/pages/student/StudentFinancial.tsx`
- Substituir fluxo de comprovante por botão "Pagar agora"
- Redireciona para URL de pagamento ou exibe QR Code gerado pela API
- Status atualiza automaticamente via Realtime após webhook

## Critério de Conclusão
- Aluno clica "Pagar" e é redirecionado para checkout
- Pagamento confirmado automaticamente via webhook
- Professor recebe notificação de pagamento confirmado
- Fluxo manual de comprovante mantido como fallback

## Riscos
- Webhooks precisam de URL pública — requer deploy em produção para testar
- Compliance financeiro (não somos intermediador, apenas facilitamos)
