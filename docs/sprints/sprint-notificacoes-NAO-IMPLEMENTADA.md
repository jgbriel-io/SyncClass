# Sprint 16 — Notificações em Tempo Real

**Período:** Abril–Maio 2026  
**Status:** ⬜ Planejada  
**Estimativa:** ~3h  
**Tipo:** Feature (MVP Extension)

---

## Problem Statement

### Contexto

Atualmente, usuários precisam fazer refresh manual ou navegar entre páginas para descobrir eventos importantes:

- Alunos não sabem quando uma cobrança está vencendo
- Professores não são notificados quando aluno envia comprovante ou entrega atividade
- Não há feedback visual de eventos em tempo real

### Impacto

- Baixo engajamento com eventos críticos (pagamentos atrasados, atividades pendentes)
- Experiência de usuário fragmentada — falta de feedback imediato
- Professores perdem tempo verificando manualmente se há novidades

### Objetivo

Implementar sistema de notificações em tempo real usando Supabase Realtime, com sino na UI, badge de contagem e marcação de lidas.

---

## Requirements

### Functional Requirements

- **FR-16.1:** Sistema deve criar notificações automaticamente para eventos críticos
- **FR-16.2:** Usuários devem ver sino com badge de contagem de não lidas
- **FR-16.3:** Notificações devem chegar em tempo real sem refresh
- **FR-16.4:** Usuários podem marcar notificações como lidas
- **FR-16.5:** Notificações devem ter tipos distintos (cobrança, atividade, comprovante, aula)

### Non-Functional Requirements

- **NFR-16.1:** Latência < 2s entre evento e notificação
- **NFR-16.2:** RLS deve garantir que usuário só vê suas próprias notificações
- **NFR-16.3:** Subscription Realtime deve limpar no cleanup (evitar memory leak)
- **NFR-16.4:** UI deve ser consistente nos 3 layouts (admin, teacher, student)

### Out of Scope

- Notificações push no mobile (PWA)
- Email de notificações
- Configuração de preferências de notificação
- Histórico de notificações antigas (> 30 dias)

---

## Background

### Supabase Realtime

Supabase Realtime já está configurado no projeto. Permite subscriptions a mudanças em tabelas via WebSocket.

```ts
const channel = supabase
  .channel("notifications")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    handleNewNotification
  )
  .subscribe();
```

### Tipos de Notificação Planejados

- `cobranca_vencendo` → aluno, 3 dias antes do vencimento
- `atividade_entregue` → professor, quando aluno entrega
- `comprovante_enviado` → professor, quando aluno envia comprovante
- `aula_hoje` → aluno, no dia da aula agendada

---

## Proposed Solution

### Arquitetura

```
Evento no banco (INSERT/UPDATE)
  ↓
Trigger SQL cria registro em `notifications`
  ↓
Supabase Realtime notifica frontend via WebSocket
  ↓
Hook `useNotifications` atualiza estado
  ↓
Componente `NotificationBell` re-renderiza com nova contagem
```

### Schema da Tabela

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'cobranca_vencendo',
    'atividade_entregue',
    'comprovante_enviado',
    'aula_hoje'
  )),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- ID do registro relacionado (financial_record, activity, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### RLS Policies

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

---

## Task Breakdown

### Task 16.1 — Criar tabela `notifications` e RLS

**Estimativa:** 20min  
**Responsável:** Backend  
**Dependências:** Nenhuma

**Descrição:**
Criar migration com tabela `notifications`, índices e policies RLS.

**Acceptance Criteria:**

- Migration aplicada sem erros
- RLS habilitado e testado (usuário A não vê notificações de B)
- Índices criados para otimizar queries por `user_id` e `read`

---

### Task 16.2 — Criar triggers para gerar notificações

**Estimativa:** 40min  
**Responsável:** Backend  
**Dependências:** 16.1

**Descrição:**
Criar triggers SQL que inserem em `notifications` quando:

- Cobrança vence em 3 dias → notifica aluno
- Aluno envia comprovante → notifica professor
- Aluno entrega atividade → notifica professor

**Exemplo de Trigger:**

```sql
CREATE OR REPLACE FUNCTION notify_payment_due()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date = CURRENT_DATE + INTERVAL '3 days' AND NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, body, related_id)
    SELECT s.user_id, 'cobranca_vencendo',
           'Cobrança vencendo em 3 dias',
           'Valor: R$ ' || NEW.amount::TEXT,
           NEW.id
    FROM students s WHERE s.id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_due
  AFTER INSERT OR UPDATE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION notify_payment_due();
```

**Acceptance Criteria:**

- Trigger de cobrança vencendo funciona
- Trigger de comprovante enviado funciona
- Trigger de atividade entregue funciona
- Notificações criadas com `user_id` correto

---

### Task 16.3 — Hook `useNotifications`

**Estimativa:** 30min  
**Responsável:** Frontend  
**Dependências:** 16.1

**Arquivo:** `src/hooks/useNotifications.ts`

**Descrição:**
Hook que busca notificações não lidas e subscreve a novos eventos via Realtime.

**Implementação:**

```ts
export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["notifications", userId],
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, queryClient]);

  return { notifications, isLoading, unreadCount: notifications.length };
};
```

**Acceptance Criteria:**

- Query busca apenas notificações não lidas do usuário
- Subscription Realtime invalida query ao receber nova notificação
- Cleanup remove channel corretamente
- `unreadCount` retorna número correto

---

### Task 16.4 — Mutation `useMarkAsRead`

**Estimativa:** 15min  
**Responsável:** Frontend  
**Dependências:** 16.3

**Arquivo:** `src/hooks/useNotifications.ts` (adicionar ao hook existente)

**Implementação:**

```ts
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
```

**Acceptance Criteria:**

- Marcar como lida atualiza banco
- Query de notificações é invalidada após sucesso
- Contagem de não lidas diminui imediatamente

---

### Task 16.5 — Componente `NotificationBell`

**Estimativa:** 40min  
**Responsável:** Frontend  
**Dependências:** 16.3, 16.4

**Arquivo:** `src/components/layout/NotificationBell.tsx`

**Descrição:**
Componente de sino com badge de contagem e dropdown de notificações.

**Implementação:**

```tsx
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useMarkAsRead } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.id);
  const markAsRead = useMarkAsRead();

  const handleNotificationClick = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id)}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
            >
              <div className="font-medium">{notif.title}</div>
              {notif.body && (
                <div className="text-sm text-muted-foreground">
                  {notif.body}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notif.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

**Acceptance Criteria:**

- Sino exibe badge com contagem de não lidas
- Dropdown mostra lista de notificações
- Clicar em notificação marca como lida
- Formatação de data em português
- Badge desaparece quando `unreadCount === 0`

---

### Task 16.6 — Integrar `NotificationBell` nos layouts

**Estimativa:** 15min  
**Responsável:** Frontend  
**Dependências:** 16.5

**Arquivos:**

- `src/components/layout/AdminShell.tsx`
- `src/components/layout/TeacherShell.tsx`
- `src/components/layout/StudentShell.tsx`

**Descrição:**
Adicionar `<NotificationBell />` no header de cada layout, ao lado do menu de usuário.

**Implementação:**

```tsx
// Em cada layout
import { NotificationBell } from "./NotificationBell";

// No header, antes do UserMenu
<div className="flex items-center gap-2">
  <NotificationBell />
  <UserMenu />
</div>;
```

**Acceptance Criteria:**

- Sino visível nos 3 layouts
- Posicionamento consistente (antes do UserMenu)
- Responsivo em mobile

---

### Task 16.7 — Criar job de limpeza de notificações antigas

**Estimativa:** 20min  
**Responsável:** Backend  
**Dependências:** 16.1

**Descrição:**
Criar Edge Function que deleta notificações lidas com mais de 30 dias.

**Arquivo:** `supabase/functions/cleanup-old-notifications/index.ts`

**Implementação:**

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("read", true)
    .lt("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Acceptance Criteria:**

- Edge Function deleta notificações lidas > 30 dias
- Não deleta notificações não lidas
- Configurar cron job no Supabase para rodar diariamente

---

### Task 16.8 — Testes manuais end-to-end

**Estimativa:** 30min  
**Responsável:** QA  
**Dependências:** 16.1-16.7

**Cenários de Teste:**

1. **Notificação de cobrança vencendo:**
   - Criar cobrança com vencimento em 3 dias
   - Verificar que aluno recebe notificação
   - Badge de contagem aumenta

2. **Notificação de comprovante enviado:**
   - Aluno envia comprovante
   - Professor recebe notificação em tempo real
   - Clicar marca como lida

3. **Notificação de atividade entregue:**
   - Aluno entrega atividade
   - Professor recebe notificação
   - Badge atualiza corretamente

4. **Isolamento de tenant:**
   - Professor A não vê notificações de Professor B
   - Aluno não vê notificações de outro aluno

**Acceptance Criteria:**

- Todos os cenários passam
- Latência < 2s entre evento e notificação
- Sem memory leaks (verificar DevTools)

---

## Implementation Details

### Tecnologias Utilizadas

- **Supabase Realtime:** WebSocket para notificações em tempo real
- **TanStack Query:** Cache e invalidação de queries
- **shadcn/ui:** Componentes `DropdownMenu`, `Button`
- **date-fns:** Formatação de datas em português

### Padrões de Código

- Hook `useNotifications` segue padrão de outros hooks do projeto
- Componente `NotificationBell` usa design tokens (`iconSize`, `typography`)
- Triggers SQL seguem convenção `notify_*` para funções

### Considerações de Performance

- Query de notificações limitada a 20 registros
- Índice em `(user_id, read)` otimiza busca de não lidas
- Subscription Realtime apenas invalida query (não busca dados diretamente)

---

## Files to Create

### Migrations

- `supabase/migrations/YYYYMMDDHHMMSS_create_notifications_table.sql`

### Frontend

- `src/hooks/useNotifications.ts`
- `src/components/layout/NotificationBell.tsx`

### Backend

- `supabase/functions/cleanup-old-notifications/index.ts`

---

## Files to Modify

### Frontend

- `src/components/layout/AdminShell.tsx` — adicionar `<NotificationBell />`
- `src/components/layout/TeacherShell.tsx` — adicionar `<NotificationBell />`
- `src/components/layout/StudentShell.tsx` — adicionar `<NotificationBell />`

### Database

- Triggers em `financial_records`, `activities`, `class_logs`

---

## Testing & Validation

### Unit Tests

- `useNotifications.test.ts` — testar query e subscription
- `useMarkAsRead.test.ts` — testar mutation

### Integration Tests

- Testar triggers SQL (criar cobrança → notificação gerada)
- Testar RLS (usuário A não acessa notificações de B)

### Manual Testing

- Verificar latência de notificações em tempo real
- Testar em 3 roles (admin, teacher, student)
- Verificar responsividade em mobile

---

## Results & Impact (Esperado)

### Métricas de Sucesso

- **Latência:** < 2s entre evento e notificação
- **Engajamento:** Aumento de 30% em pagamentos no prazo
- **Satisfação:** Feedback positivo de professores sobre notificações de atividades

### Impacto no Usuário

- Alunos não perdem prazos de pagamento
- Professores respondem mais rápido a entregas de atividades
- Experiência mais fluida e moderna

---

## Technical Debt

### Débitos Conhecidos

- Notificações push no mobile (PWA) não implementadas
- Sem configuração de preferências (usuário não pode desativar tipos específicos)
- Histórico de notificações antigas não acessível (deletadas após 30 dias)

### Melhorias Futuras

- Adicionar filtro por tipo de notificação
- Implementar "marcar todas como lidas"
- Adicionar som/vibração ao receber notificação

---

## Next Steps

### Sprint 17 — Exportação de Relatórios em PDF

Permitir que professores exportem extrato financeiro e histórico de aulas em PDF usando `jspdf`.

### Sprint 18 — Integração com Google Calendar

Sincronizar aulas registradas no SyncClass com Google Calendar do professor e aluno.

---

## References

### Documentação

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [TanStack Query - Invalidation](https://tanstack.com/query/latest/docs/react/guides/query-invalidation)
- [shadcn/ui - Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)

### Código Relacionado

- `src/hooks/useStudents.ts` — padrão de hook com TanStack Query
- `src/components/layout/UserMenu.tsx` — padrão de dropdown no header
- `supabase/functions/cleanup-old-records/` — padrão de Edge Function de limpeza
