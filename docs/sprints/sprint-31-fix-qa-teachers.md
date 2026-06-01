# Sprint 31 — Fix: Correções encontradas durante QA (Teachers)

**Período:** 01/06/2026
**Status:** ✅ Concluída
**Tipo:** Fix
**Prioridade:** 🔴 Alta

## Problem Statement

Sprint 28 (QA manual) identificou falhas no fluxo de redefinição de senha da aba `/admin/teachers`. O botão "Redefinir Senha" exibia erro `"Este professor não possui conta de acesso vinculada."` mesmo para professores com conta ativa no banco. Adicionalmente, o modal da aba teachers tinha UI diferente dos dialogs equivalentes em `/admin/students` e `/admin/users`, quebrando a consistência da plataforma.

**Root causes identificados:**

1. **`useTeacherUserId` retornava `null` via RLS** — O hook fazia `SELECT user_id FROM profiles WHERE teacher_id = ?` usando o JWT do usuário logado (client-side). Embora o admin tenha acesso via `is_admin()`, a query retornava null em certos contextos de cache/timing.

2. **Edge Function `reset-password` sem suporte a `teacherId`** — O frontend precisava resolver o `user_id` client-side antes de chamar a Edge Function. Para alunos, a Edge Function recebia `studentId` e resolvia internamente via `supabaseAdmin`. Teachers não tinham o mesmo caminho.

3. **`.maybeSingle()` com múltiplas linhas** — `profiles WHERE teacher_id = teacherId` retornava 3 linhas: o próprio professor + alunos vinculados a ele (campo `profiles.teacher_id` é usado tanto para o teacher quanto para seus students). `.maybeSingle()` falha com erro quando recebe múltiplas linhas.

4. **UI inconsistente no `TeacherResetPasswordDialog`** — Requisitos de senha de 6 chars (vs 8 em students), sem bloco de requisitos visíveis, gerador de senha inline customizado (vs `generateRandomPassword(12)` compartilhado), sem validação de força.

5. **Texto do botão inconsistente** — Teachers exibia "Redefinir senha do professor", Students exibia "Redefinir senha do aluno", Users exibia hardcoded "Redefinir senha". Três variações sem necessidade.

## Bugs Corrigidos

### BUG-031-001 — `reset-password` Edge Function sem suporte a `teacherId`

**Rota:** `/admin/teachers` → dropdown → "Redefinir senha"
**Sintoma:** `{"error":"Este professor não possui conta de acesso vinculada."}` mesmo com conta existente.
**Root cause:** Edge Function só suportava `studentId` e `userId`. Teacher path fazia lookup client-side via `useTeacherUserId` que retornava `null` por causa do `.maybeSingle()` com múltiplos resultados (profiles de alunos também têm `teacher_id`).
**Severidade:** 🔴 Crítica (feature completamente quebrada)
**Correção:**

- Adicionado branch `teacherId` na Edge Function: `supabaseAdmin.from("profiles").select("user_id").eq("teacher_id", teacherId).eq("role", "teacher").maybeSingle()`
- `.eq("role", "teacher")` garante retorno de única linha (apenas o profile do professor, não dos alunos)
- Removido `useTeacherUserId` do `TeacherResetPasswordDialog` — dialog passa `teacherId: teacher.id` direto
  **Arquivos:**
- `supabase/functions/reset-password/reset-password.ts` — branch `teacherId` adicionado (deploy v11)
- `src/hooks/useUserAuthMutations.ts` — `teacherId?: string` adicionado ao tipo do param
- `src/components/teachers/TeacherResetPasswordDialog.tsx` — removido `useTeacherUserId`; passa `teacherId` direto

---

### BUG-031-002 — `TeacherResetPasswordDialog` UI inconsistente

**Rota:** `/admin/teachers` → dropdown → "Redefinir senha"
**Sintoma:** Modal sem bloco de requisitos de senha, validação fraca (6 chars), gerador diferente do padrão.
**Severidade:** 🟡 Média (UX inconsistente vs students e users)
**Correção:** `TeacherResetPasswordDialog` reescrito para ser idêntico ao `StudentResetPasswordDialog`:

- Bloco de requisitos visível (`auth.resetPassword.requirements.*`)
- Validação 8 chars + uppercase + lowercase + number + special
- `generateRandomPassword(12)` do serviço compartilhado
- Toasts de validação via `auth.resetPassword.toasts.*`
  **Arquivos:**
- `src/components/teachers/TeacherResetPasswordDialog.tsx` — reescrito
- `src/content/teachers.ts` — description atualizada para "A senha deve atender aos requisitos abaixo"

---

### BUG-031-003 — Texto do botão "Redefinir senha" inconsistente nas 3 abas

**Rotas:** `/admin/teachers`, `/admin/students`, `/admin/users`
**Sintoma:** Cada aba exibia texto diferente no item do dropdown (com sufixo "do professor", "do aluno", ou hardcoded).
**Severidade:** 🟢 Baixa (UX inconsistente, sem impacto funcional)
**Correção:** Centralizado em `common.actions.resetPassword = "Redefinir senha"`. Todas as 3 telas usam o mesmo string.
**Arquivos:**

- `src/content/common.ts` — `resetPassword: "Redefinir senha"` adicionado em `actions`
- `src/components/students/StudentsTableRow.tsx`
- `src/components/teachers/TeachersTableRow.tsx`
- `src/components/users/UsersTableRow.tsx`

---

## Edge Functions — Deploy realizado

| Function         | Versão após fix |
| ---------------- | --------------- |
| `reset-password` | v11             |

## Testing & Validation

- [x] `npm run type-check` — zero erros
- [x] `/admin/teachers` → redefinir senha → modal com bloco de requisitos visível
- [x] Redefinir senha via aba teachers → funciona (senha atualizada, modal de nova senha exibido)
- [x] Modal idêntico ao de alunos em requisitos e validação
- [x] Botão "Redefinir senha" idêntico nas 3 abas (students/teachers/users)

## References

- Sprint 28: `docs/sprints/sprint-28-testes-manuais.md` — QA que gerou estes bugs
- Sprint 29: `docs/sprints/sprint-29-fix-correcoes-painel-admin.md` — precedente de fixes pós-QA
