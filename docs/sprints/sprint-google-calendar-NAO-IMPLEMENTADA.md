# Sprint 18 — Integração com Google Calendar

**Período:** Maio–Junho 2026  
**Status:** ⬜ Planejada  
**Estimativa:** ~6h  
**Tipo:** Feature (MVP Extension)

---

## Problem Statement

### Contexto

Professores e alunos gerenciam suas agendas em ferramentas externas (Google Calendar, Outlook, Apple Calendar). Atualmente, precisam duplicar manualmente cada aula registrada no SyncClass para suas agendas pessoais.

### Impacto

- Duplicação de trabalho — mesma aula registrada em 2 lugares
- Risco de inconsistência — aula editada no SyncClass não reflete no Calendar
- Baixa adoção do sistema — professores preferem usar apenas o Calendar
- Falta de lembretes automáticos de aulas

### Objetivo

Sincronizar automaticamente aulas registradas no SyncClass com Google Calendar do professor e aluno, com criação, edição e deleção bidirecional.

---

## Requirements

### Functional Requirements

- **FR-18.1:** Professor pode conectar sua conta Google via OAuth
- **FR-18.2:** Aula criada no SyncClass é automaticamente criada no Google Calendar
- **FR-18.3:** Aula editada no SyncClass atualiza evento no Google Calendar
- **FR-18.4:** Aula deletada no SyncClass remove evento do Google Calendar
- **FR-18.5:** Professor pode desativar sincronização a qualquer momento
- **FR-18.6:** Aluno pode conectar sua conta Google e receber eventos de suas aulas

### Non-Functional Requirements

- **NFR-18.1:** Sincronização deve ocorrer em até 30 segundos após mudança
- **NFR-18.2:** Tokens OAuth devem ser armazenados de forma segura (criptografados)
- **NFR-18.3:** Refresh token deve renovar automaticamente quando expirar
- **NFR-18.4:** Sistema deve respeitar rate limits da Google Calendar API (10.000 req/dia)
- **NFR-18.5:** Falhas de sincronização não devem bloquear operações no SyncClass

### Out of Scope

- Sincronização bidirecional (Calendar → SyncClass)
- Integração com outros calendários (Outlook, Apple Calendar)
- Sincronização de atividades (apenas aulas)
- Convites automáticos para alunos via Google Calendar

---

## Background

### Google Calendar API

API REST que permite criar, editar e deletar eventos em calendários Google. Requer OAuth 2.0 com scope `https://www.googleapis.com/auth/calendar.events`.

**Exemplo de Requisição:**

```http
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "summary": "Aula de Inglês - João Silva",
  "description": "Aula registrada via SyncClass",
  "start": {
    "dateTime": "2026-05-20T14:00:00-03:00",
    "timeZone": "America/Sao_Paulo"
  },
  "end": {
    "dateTime": "2026-05-20T15:00:00-03:00",
    "timeZone": "America/Sao_Paulo"
  }
}
```

### Supabase OAuth

Supabase Auth suporta OAuth com Google. Após login, tokens são armazenados em `auth.users` e podem ser acessados via `supabase.auth.getSession()`.

### Rate Limits

- **Google Calendar API:** 10.000 requisições/dia por projeto
- **Quota por usuário:** 1.000 requisições/dia
- Para SyncClass com ~50 professores e ~500 alunos, limite é suficiente

---

## Proposed Solution

### Arquitetura

```
Aula criada/editada/deletada no SyncClass
  ↓
Trigger SQL insere evento em `calendar_sync_queue`
  ↓
Edge Function `sync-calendar` processa fila a cada 30s
  ↓
Edge Function chama Google Calendar API
  ↓
Atualiza `calendar_sync_queue` com status (success/error)
```

### Schema de Sincronização

```sql
CREATE TABLE calendar_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_log_id UUID NOT NULL REFERENCES class_logs(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  google_event_id TEXT, -- ID do evento no Google Calendar
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_calendar_sync_pending ON calendar_sync_queue(status, created_at)
  WHERE status = 'pending';
```

### Armazenamento de Tokens

```sql
ALTER TABLE profiles
  ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN google_access_token TEXT,
  ADD COLUMN google_refresh_token TEXT,
  ADD COLUMN google_token_expires_at TIMESTAMPTZ;
```

**Nota:** Tokens devem ser criptografados usando `pgcrypto` extension.

---

## Task Breakdown

### Task 18.1 — Habilitar OAuth Google no Supabase

**Estimativa:** 30min  
**Responsável:** DevOps  
**Dependências:** Nenhuma

**Descrição:**
Configurar Google OAuth no Supabase Auth Dashboard.

**Passos:**

1. Criar projeto no Google Cloud Console
2. Habilitar Google Calendar API
3. Criar OAuth 2.0 Client ID (Web Application)
4. Adicionar redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
5. Copiar Client ID e Client Secret
6. Configurar no Supabase Auth → Providers → Google
7. Adicionar scope: `https://www.googleapis.com/auth/calendar.events`

**Acceptance Criteria:**

- OAuth Google habilitado no Supabase
- Scope de Calendar configurado
- Redirect URI correto

---

### Task 18.2 — Criar migration para `calendar_sync_queue`

**Estimativa:** 20min  
**Responsável:** Backend  
**Dependências:** Nenhuma

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_calendar_sync_queue.sql`

**Descrição:**
Criar tabela de fila de sincronização e adicionar colunas em `profiles`.

**Implementação:**

```sql
-- Tabela de fila
CREATE TABLE calendar_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_log_id UUID NOT NULL REFERENCES class_logs(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  google_event_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_calendar_sync_pending ON calendar_sync_queue(status, created_at)
  WHERE status = 'pending';

-- RLS
ALTER TABLE calendar_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_sync_queue" ON calendar_sync_queue
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Colunas em profiles
ALTER TABLE profiles
  ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN google_access_token TEXT,
  ADD COLUMN google_refresh_token TEXT,
  ADD COLUMN google_token_expires_at TIMESTAMPTZ;
```

**Acceptance Criteria:**

- Migration aplicada sem erros
- RLS habilitado
- Índice criado para otimizar busca de pendentes

---

### Task 18.3 — Criar trigger para enfileirar sincronização

**Estimativa:** 30min  
**Responsável:** Backend  
**Dependências:** 18.2

**Descrição:**
Criar trigger que insere em `calendar_sync_queue` após INSERT/UPDATE/DELETE em `class_logs`.

**Implementação:**

```sql
CREATE OR REPLACE FUNCTION enqueue_calendar_sync()
RETURNS TRIGGER AS $$
DECLARE
  teacher_id UUID;
  student_user_id UUID;
BEGIN
  -- Buscar teacher_id e student_user_id
  SELECT cl.teacher_id, s.user_id INTO teacher_id, student_user_id
  FROM class_logs cl
  JOIN students s ON s.id = cl.student_id
  WHERE cl.id = COALESCE(NEW.id, OLD.id);

  -- Enfileirar para professor (se habilitado)
  INSERT INTO calendar_sync_queue (user_id, class_log_id, action)
  SELECT teacher_id, COALESCE(NEW.id, OLD.id),
         CASE
           WHEN TG_OP = 'INSERT' THEN 'create'
           WHEN TG_OP = 'UPDATE' THEN 'update'
           WHEN TG_OP = 'DELETE' THEN 'delete'
         END
  FROM profiles
  WHERE id = teacher_id AND google_calendar_enabled = TRUE;

  -- Enfileirar para aluno (se habilitado)
  INSERT INTO calendar_sync_queue (user_id, class_log_id, action)
  SELECT student_user_id, COALESCE(NEW.id, OLD.id),
         CASE
           WHEN TG_OP = 'INSERT' THEN 'create'
           WHEN TG_OP = 'UPDATE' THEN 'update'
           WHEN TG_OP = 'DELETE' THEN 'delete'
         END
  FROM profiles
  WHERE id = student_user_id AND google_calendar_enabled = TRUE;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calendar_sync
  AFTER INSERT OR UPDATE OR DELETE ON class_logs
  FOR EACH ROW EXECUTE FUNCTION enqueue_calendar_sync();
```

**Acceptance Criteria:**

- Trigger cria registros em `calendar_sync_queue` para professor e aluno
- Apenas enfileira se `google_calendar_enabled = TRUE`
- Ação correta (create/update/delete) baseada em TG_OP

---

### Task 18.4 — Edge Function `sync-calendar`

**Estimativa:** 2h  
**Responsável:** Backend  
**Dependências:** 18.2, 18.3

**Arquivo:** `supabase/functions/sync-calendar/index.ts`

**Descrição:**
Edge Function que processa fila de sincronização e chama Google Calendar API.

**Implementação:**

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar itens pendentes (limite 50 por execução)
  const { data: queue, error: queueError } = await supabase
    .from("calendar_sync_queue")
    .select("*, class_logs(*), profiles(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (queueError) throw queueError;

  const results = [];

  for (const item of queue) {
    try {
      // Verificar se token expirou
      const tokenExpired =
        new Date(item.profiles.google_token_expires_at) < new Date();
      if (tokenExpired) {
        // Refresh token
        const newToken = await refreshGoogleToken(
          item.profiles.google_refresh_token
        );
        await supabase
          .from("profiles")
          .update({
            google_access_token: newToken.access_token,
            google_token_expires_at: new Date(
              Date.now() + newToken.expires_in * 1000
            ),
          })
          .eq("id", item.user_id);
        item.profiles.google_access_token = newToken.access_token;
      }

      // Executar ação
      let googleEventId = item.google_event_id;

      if (item.action === "create") {
        googleEventId = await createCalendarEvent(
          item.profiles.google_access_token,
          item.class_logs
        );
      } else if (item.action === "update") {
        await updateCalendarEvent(
          item.profiles.google_access_token,
          googleEventId,
          item.class_logs
        );
      } else if (item.action === "delete") {
        await deleteCalendarEvent(
          item.profiles.google_access_token,
          googleEventId
        );
      }

      // Marcar como sucesso
      await supabase
        .from("calendar_sync_queue")
        .update({
          status: "success",
          google_event_id: googleEventId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      results.push({ id: item.id, status: "success" });
    } catch (error) {
      // Marcar como erro
      await supabase
        .from("calendar_sync_queue")
        .update({
          status: "error",
          error_message: error.message,
          processed_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      results.push({ id: item.id, status: "error", error: error.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function createCalendarEvent(accessToken: string, classLog: any) {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Aula de Inglês - ${classLog.student_name}`,
        description: `Aula registrada via SyncClass\nDuração: ${classLog.duration}h`,
        start: {
          dateTime: new Date(classLog.class_date).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: new Date(
            new Date(classLog.class_date).getTime() +
              classLog.duration * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Calendar API error: ${error.error.message}`);
  }

  const event = await response.json();
  return event.id;
}

async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  classLog: any
) {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Aula de Inglês - ${classLog.student_name}`,
        description: `Aula registrada via SyncClass\nDuração: ${classLog.duration}h`,
        start: {
          dateTime: new Date(classLog.class_date).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: new Date(
            new Date(classLog.class_date).getTime() +
              classLog.duration * 60 * 60 * 1000
          ).toISOString(),
          timeZone: "America/Sao_Paulo",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Calendar API error: ${error.error.message}`);
  }
}

async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(`Google Calendar API error: ${error.error.message}`);
  }
}

async function refreshGoogleToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google token");
  }

  return await response.json();
}
```

**Acceptance Criteria:**

- Edge Function processa até 50 itens por execução
- Refresh token automático quando expirado
- Erros são capturados e registrados em `error_message`
- Rate limit respeitado (delay entre requisições se necessário)

---

### Task 18.5 — Configurar cron job para Edge Function

**Estimativa:** 10min  
**Responsável:** DevOps  
**Dependências:** 18.4

**Descrição:**
Configurar cron job no Supabase para executar `sync-calendar` a cada 30 segundos.

**Configuração:**

```sql
-- No Supabase Dashboard → Database → Cron Jobs
SELECT cron.schedule(
  'sync-calendar',
  '*/30 * * * * *', -- A cada 30 segundos
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/sync-calendar',
    headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb
  );
  $$
);
```

**Acceptance Criteria:**

- Cron job configurado e ativo
- Edge Function executada a cada 30 segundos
- Logs de execução visíveis no Dashboard

---

### Task 18.6 — Componente `GoogleCalendarSettings`

**Estimativa:** 1h  
**Responsável:** Frontend  
**Dependências:** 18.1

**Arquivo:** `src/components/settings/GoogleCalendarSettings.tsx`

**Descrição:**
Componente de configuração de sincronização com Google Calendar.

**Implementação:**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const GoogleCalendarSettings = () => {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(
    profile?.google_calendar_enabled || false
  );
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar.events",
          redirectTo: `${window.location.origin}/settings`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error("Erro ao conectar com Google");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ google_calendar_enabled: checked })
        .eq("id", profile?.id);

      if (error) throw error;

      setEnabled(checked);
      toast.success(
        checked ? "Sincronização ativada" : "Sincronização desativada"
      );
    } catch (error) {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const isConnected = !!profile?.google_access_token;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Google Calendar</h3>
        <p className="text-sm text-muted-foreground">
          Sincronize suas aulas automaticamente com o Google Calendar
        </p>
      </div>

      {!isConnected ? (
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? "Conectando..." : "Conectar com Google"}
        </Button>
      ) : (
        <div className="flex items-center space-x-2">
          <Switch
            id="calendar-sync"
            checked={enabled}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="calendar-sync">
            Sincronizar aulas com Google Calendar
          </Label>
        </div>
      )}

      {isConnected && (
        <p className="text-sm text-muted-foreground">
          ✓ Conta Google conectada
        </p>
      )}
    </div>
  );
};
```

**Acceptance Criteria:**

- Botão "Conectar com Google" abre OAuth flow
- Toggle de sincronização visível após conectar
- Estado persiste no banco
- Feedback visual de sucesso/erro

---

### Task 18.7 — Integrar `GoogleCalendarSettings` em Settings

**Estimativa:** 10min  
**Responsável:** Frontend  
**Dependências:** 18.6

**Arquivo:** `src/pages/Settings.tsx` (ou modal de configurações)

**Descrição:**
Adicionar componente de configuração de Google Calendar na página de settings.

**Implementação:**

```tsx
import { GoogleCalendarSettings } from "@/components/settings/GoogleCalendarSettings";

// Na página de settings
<div className="space-y-6">
  <GoogleCalendarSettings />
  {/* Outras configurações */}
</div>;
```

**Acceptance Criteria:**

- Componente visível na página de settings
- Acessível para professores e alunos

---

### Task 18.8 — Testes end-to-end

**Estimativa:** 1h  
**Responsável:** QA  
**Dependências:** 18.1-18.7

**Cenários de Teste:**

1. **Conectar conta Google:**
   - Abrir settings
   - Clicar "Conectar com Google"
   - Autorizar acesso ao Calendar
   - Verificar que toggle aparece

2. **Criar aula e sincronizar:**
   - Ativar sincronização
   - Criar aula no SyncClass
   - Aguardar 30s
   - Verificar evento no Google Calendar

3. **Editar aula e sincronizar:**
   - Editar data/hora da aula
   - Aguardar 30s
   - Verificar que evento foi atualizado no Calendar

4. **Deletar aula e sincronizar:**
   - Deletar aula no SyncClass
   - Aguardar 30s
   - Verificar que evento foi removido do Calendar

5. **Desativar sincronização:**
   - Desativar toggle
   - Criar nova aula
   - Verificar que evento NÃO foi criado no Calendar

6. **Token expirado:**
   - Simular token expirado (alterar `google_token_expires_at` no banco)
   - Criar aula
   - Verificar que token foi renovado automaticamente

**Acceptance Criteria:**

- Todos os cenários passam
- Sincronização ocorre em até 30s
- Sem erros no console ou logs

---

## Implementation Details

### Tecnologias Utilizadas

- **Google Calendar API v3:** Criação/edição/deleção de eventos
- **Supabase OAuth:** Autenticação com Google
- **Supabase Edge Functions:** Processamento assíncrono da fila
- **pg_cron:** Agendamento de jobs no PostgreSQL

### Padrões de Código

- Edge Function segue padrão de outras functions do projeto
- Componente de settings usa shadcn/ui (`Switch`, `Button`, `Label`)
- Tokens armazenados em `profiles` (considerar criptografia com `pgcrypto`)

### Considerações de Segurança

- **Tokens OAuth:** Armazenar criptografados usando `pgcrypto`
- **Service Role Key:** Apenas em Edge Functions, nunca no frontend
- **RLS:** Garantir que usuário só acessa seus próprios tokens

---

## Files to Create

### Migrations

- `supabase/migrations/YYYYMMDDHHMMSS_create_calendar_sync_queue.sql`

### Backend

- `supabase/functions/sync-calendar/index.ts`

### Frontend

- `src/components/settings/GoogleCalendarSettings.tsx`

---

## Files to Modify

### Frontend

- `src/pages/Settings.tsx` — adicionar `<GoogleCalendarSettings />`

### Database

- Trigger em `class_logs` para enfileirar sincronização

---

## Testing & Validation

### Unit Tests

- `sync-calendar.test.ts` — testar lógica de criação/edição/deleção de eventos
- Mockar Google Calendar API

### Integration Tests

- Testar trigger de enfileiramento
- Testar refresh de token expirado

### Manual Testing

- Testar OAuth flow completo
- Verificar eventos no Google Calendar real
- Testar com múltiplos usuários simultaneamente

---

## Results & Impact (Esperado)

### Métricas de Sucesso

- **Adoção:** 40% dos professores ativam sincronização
- **Redução de duplicação:** 100% das aulas sincronizadas automaticamente
- **Satisfação:** Feedback positivo sobre integração

### Impacto no Usuário

- Professores não precisam duplicar aulas manualmente
- Alunos recebem lembretes automáticos de aulas via Google Calendar
- Maior adoção do SyncClass como ferramenta principal

---

## Technical Debt

### Débitos Conhecidos

- Sincronização unidirecional (SyncClass → Calendar, não o contrário)
- Sem suporte para outros calendários (Outlook, Apple Calendar)
- Tokens não criptografados (risco de vazamento)
- Sem retry automático em caso de falha (apenas marca como erro)

### Melhorias Futuras

- Implementar sincronização bidirecional
- Adicionar suporte para Outlook Calendar
- Criptografar tokens com `pgcrypto`
- Implementar retry com backoff exponencial
- Adicionar dashboard de status de sincronização

---

## Next Steps

### Sprint 19 — Pagamento Real (Stripe / Pix API)

Substituir fluxo manual de comprovante por pagamento real via Stripe (cartão) ou API de Pix (EfiBank/Asaas).

### Sprint 20 — Gamificação do Portal do Aluno

Adicionar badges, streak de presença e barra de progresso para aumentar engajamento.

---

## References

### Documentação

- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Supabase OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)

### Código Relacionado

- `supabase/functions/cleanup-old-records/` — padrão de Edge Function com cron
- `src/components/auth/AuthRedirect.tsx` — padrão de OAuth redirect
