# Sprint 16 — Integração com Google Calendar
**Período:** Maio–Junho 2026
**Status:** ⬜ Pendente
**Estimativa:** ~6h

## Objetivo
Sincronizar aulas registradas no SyncClass com o Google Calendar do professor e do aluno.

## Tarefas

### 16.1 — OAuth Google no Supabase
- Habilitar provider Google no Supabase Auth
- Solicitar scope `https://www.googleapis.com/auth/calendar.events`
- Armazenar `google_access_token` e `google_refresh_token` em `profiles`

---

### 16.2 — Edge Function `sync-calendar`
**Arquivo:** `supabase/functions/sync-calendar/`
- Recebe `class_log_id` e `action` (create/update/delete)
- Cria/atualiza/remove evento no Google Calendar via API
- Usa o token do usuário armazenado em `profiles`

---

### 16.3 — Trigger no banco
Após INSERT/UPDATE em `class_logs`, chamar a Edge Function via `pg_net` (extensão do Supabase):
```sql
-- Trigger que dispara sync após salvar aula
CREATE TRIGGER sync_class_to_calendar
  AFTER INSERT OR UPDATE ON class_logs
  FOR EACH ROW EXECUTE FUNCTION notify_calendar_sync();
```

---

### 16.4 — UI — toggle de sincronização
**Arquivo:** `src/components/layout/SettingsModal.tsx`
- Toggle "Sincronizar com Google Calendar"
- Botão de conectar conta Google
- Status da última sincronização

## Critério de Conclusão
- Aula criada no SyncClass aparece no Google Calendar
- Aula editada/deletada reflete no Calendar
- Professor pode desativar a sincronização

## Riscos
- Token expira — precisa de refresh automático
- Rate limit da Google Calendar API (10.000 req/dia — suficiente)
