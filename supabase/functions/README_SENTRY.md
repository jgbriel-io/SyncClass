# 🔔 Configuração do Sentry para Edge Functions

## Visão Geral

As Edge Functions `cleanup-old-records` e `cleanup-storage` possuem integração opcional com Sentry para captura de erros críticos e alertas.

## Status Atual

✅ Código preparado para Sentry (comentado)  
⏸️ Sentry SDK não instalado (opcional)  
📝 Configuração manual necessária

## Como Habilitar

### 1. Instalar Sentry SDK (Opcional)

Descomente os imports nas Edge Functions:

```typescript
// De:
// import * as Sentry from "https://deno.land/x/sentry/index.mjs";

// Para:
import * as Sentry from "https://deno.land/x/sentry/index.mjs";
```

### 2. Configurar DSN do Sentry

```bash
# Via Supabase CLI
supabase secrets set SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Opcional: Definir ambiente
supabase secrets set ENVIRONMENT="production"
```

### 3. Descomentar Código do Sentry

Nas funções `captureException()`:

```typescript
// De:
// Sentry.captureException(error, {
//   tags: { function: "cleanup-old-records", ...context },
//   level: "error",
// });

// Para:
Sentry.captureException(error, {
  tags: { function: "cleanup-old-records", ...context },
  level: "error",
});
```

### 4. Deploy das Edge Functions

```bash
supabase functions deploy cleanup-old-records
supabase functions deploy cleanup-storage
```

## Eventos Capturados

### cleanup-old-records
- Falha ao limpar audit_logs (após 3 tentativas)
- Falha ao limpar idempotency_keys (após 3 tentativas)
- Erros inesperados durante execução

### cleanup-storage
- Falha ao buscar arquivos órfãos
- Falha ao deletar arquivos do Storage
- Falha ao marcar atividades como limpas
- Falha no hard delete de atividades antigas

## Contexto dos Erros

Cada erro capturado inclui:

```typescript
{
  tags: {
    function: "cleanup-old-records" | "cleanup-storage",
    operation: "nome-da-operacao",
    critical: true,
    maxRetries: 3
  },
  level: "error"
}
```

## Verificar Configuração

```bash
# Verificar se SENTRY_DSN está configurado
supabase secrets list

# Testar Edge Function
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-old-records \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

## Alternativas ao Sentry

Se não quiser usar Sentry, as Edge Functions já possuem:

✅ Logs detalhados no console  
✅ Retry automático (3 tentativas)  
✅ Resposta HTTP com status de erro  
✅ Estatísticas de execução

Você pode monitorar via:
- Supabase Dashboard > Edge Functions > Logs
- Supabase CLI: `supabase functions logs cleanup-old-records --tail`

## Custos

- Sentry Free Tier: 5.000 eventos/mês
- Sentry Team: $26/mês (50.000 eventos)
- Alternativa gratuita: Logs do Supabase

## Próximos Passos

1. Decidir se quer usar Sentry (opcional)
2. Se sim, criar conta no Sentry.io
3. Criar projeto e obter DSN
4. Seguir passos de configuração acima
5. Testar captura de erros

---

**Nota:** O sistema funciona perfeitamente SEM Sentry. A integração é apenas para alertas proativos em caso de falhas críticas.
