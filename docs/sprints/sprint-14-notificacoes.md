# Sprint 14 — Notificações em Tempo Real
**Período:** Abril–Maio 2026
**Status:** ⬜ Pendente
**Estimativa:** ~3h

## Objetivo
Implementar sistema de notificações usando Supabase Realtime (já configurado no projeto), com sino na UI e marcação de lidas.

## Tarefas

### 14.1 — Tabela `notifications` no banco
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cobranca_vencendo', 'atividade_entregue', 'comprovante_enviado', 'aula_hoje')),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

---

### 14.2 — Hook `useNotifications`
**Arquivo:** `src/hooks/useNotifications.ts`
- Query para buscar notificações não lidas
- Mutation `useMarkAsRead`
- Subscription Realtime para novas notificações

---

### 14.3 — Componente `NotificationBell`
**Arquivo:** `src/components/layout/NotificationBell.tsx`
- Ícone de sino com badge de contagem
- Dropdown com lista de notificações
- Marcar como lida ao clicar
- Adicionar no `AdminLayout`, `TeacherLayout` e `StudentLayout`

---

### 14.4 — Triggers para gerar notificações
Criar triggers no banco para os eventos principais:
- Cobrança vencendo em 3 dias → notifica aluno
- Aluno envia comprovante → notifica professor
- Aluno entrega atividade → notifica professor

## Critério de Conclusão
- Sino aparece nos 3 layouts com contagem de não lidas
- Notificações chegam em tempo real sem refresh
- Marcar como lida funciona
