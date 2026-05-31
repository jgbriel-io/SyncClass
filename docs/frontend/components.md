# Componentes

Estrutura, convenções, shadcn/ui e componentes de domínio.

## Índice

- [Quando usar](#quando-usar)
- [shadcn/ui](#shadcnui)
- [Componentes de domínio](#componentes-de-domínio)
- [Layouts](#layouts)
- [Auth](#auth)
- [Convenções de criação](#convenções-de-criação)
- [Ver também](#ver-também)

## Quando usar

**Use componente quando:**

- UI reutilizável (botão, input, dialog)
- Lógica de apresentação (formatação, estilo)
- Composição de componentes menores

**Não use quando:**

- Lógica de negócio (mover para hook)
- Data fetching (mover para hook com TanStack Query)
- Estado global (usar context ou TanStack Query cache)

## shadcn/ui

**Localização:** `src/components/ui/`

**Componentes base (40+):**

- `button.tsx` — botões com variants (default, destructive, outline, ghost, link)
- `input.tsx` — inputs de texto
- `textarea.tsx` — textarea
- `select.tsx` — select dropdown
- `checkbox.tsx` — checkbox
- `radio-group.tsx` — radio buttons
- `switch.tsx` — toggle switch
- `dialog.tsx` — modal dialog
- `sheet.tsx` — lateral sheet
- `card.tsx` — card container
- `table.tsx` — tabela
- `badge.tsx` — badge com variants (default, secondary, destructive, outline)
- `toast.tsx` — toast notifications (via Sonner)
- `skeleton.tsx` — loading skeleton
- `separator.tsx` — linha separadora
- `avatar.tsx` — avatar com fallback
- `dropdown-menu.tsx` — dropdown menu
- `popover.tsx` — popover
- `tooltip.tsx` — tooltip
- `tabs.tsx` — tabs
- `accordion.tsx` — accordion
- `alert.tsx` — alert box
- `progress.tsx` — progress bar
- `slider.tsx` — slider
- `calendar.tsx` — date picker
- `command.tsx` — command palette
- `context-menu.tsx` — context menu
- `hover-card.tsx` — hover card
- `menubar.tsx` — menubar
- `navigation-menu.tsx` — navigation menu
- `scroll-area.tsx` — scroll area
- `toggle.tsx` — toggle button
- `toggle-group.tsx` — toggle group

**Customizados:**

- `loading-button.tsx` — botão com loading state
- `empty-state.tsx` — estado vazio com ilustração
- `page-container.tsx` — container de página com padding
- `table-skeleton.tsx` — skeleton para tabelas
- `dashboard-skeleton.tsx` — skeleton para dashboards

**Instalação:**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
```

**Customização:**
Componentes são copiados para `src/components/ui/` — editar diretamente sem override complexo.

**Primitivos customizados (além do shadcn/ui):**

| Componente                    | Responsabilidade                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ConfirmArchiveDialog.tsx`    | Modal genérico de archive/reactivate — aceita `title`, `description`, `onConfirm`, `variant` (`destructive`\|`default`) |
| `ConfirmHardDeleteDialog.tsx` | Modal genérico de hard delete — título sempre `text-destructive`; suporta bloco `warning` opcional                      |

Usados como base por `StudentDeleteDialog`, `TeacherStatusDialog`, `TeacherHardDeleteDialog` e `DeleteUserDialog`.

## Componentes de domínio

### Students

**Localização:** `src/components/students/`

| Componente                | Responsabilidade                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `StudentFormDialog.tsx`   | Form criar/editar aluno (Dialog)                                                               |
| `StudentDetailSheet.tsx`  | Detalhes do aluno (Sheet lateral)                                                              |
| `StudentDeleteDialog.tsx` | Confirmação de exclusão                                                                        |
| `StudentCard.tsx`         | Card de aluno (mobile)                                                                         |
| `StudentsListView.tsx`    | Lista de alunos (tabela); props: `showHardDelete`, `showAnonymizedFilter`, `showTeacherFilter` |
| `StudentsTableRow.tsx`    | Linha da tabela; prop `isAnonymized`: exibe badge vermelho + oculta dropdown de ações          |

### Financial

**Localização:** `src/components/financial/`

| Componente                  | Responsabilidade                          |
| --------------------------- | ----------------------------------------- |
| `FinancialFormDialog.tsx`   | Form criar/editar cobrança                |
| `FinancialDetailSheet.tsx`  | Detalhes da cobrança                      |
| `FinancialDeleteDialog.tsx` | Confirmação de exclusão                   |
| `FinancialCard.tsx`         | Card de cobrança (mobile)                 |
| `FinancialView.tsx`         | Lista de cobranças (tabela)               |
| `PaymentProofUpload.tsx`    | Upload de comprovante                     |
| `PaymentProofReview.tsx`    | Revisão de comprovante (aprovar/rejeitar) |

### Activities

**Localização:** `src/components/activities/`

| Componente                         | Responsabilidade              |
| ---------------------------------- | ----------------------------- |
| `ActivityFormDialog.tsx`           | Form criar/editar atividade   |
| `ActivityDetailSheet.tsx`          | Detalhes da atividade         |
| `ActivityDeleteDialog.tsx`         | Confirmação de exclusão       |
| `ActivityCard.tsx`                 | Card de atividade (mobile)    |
| `ActivitiesView.tsx`               | Lista de atividades (tabela)  |
| `DeliverActivityDialog.tsx`        | Entrega de atividade (aluno)  |
| `ActivityCorrectionFormInline.tsx` | Correção inline (professor)   |
| `AddCorrectionDialog.tsx`          | Adicionar correção            |
| `ActivityFileSourceField.tsx`      | Campo de arquivo (upload/URL) |

### Classes

**Localização:** `src/components/classes/`

| Componente               | Responsabilidade                   |
| ------------------------ | ---------------------------------- |
| `ClassFormDialog.tsx`    | Form criar/editar aula             |
| `ClassDetailSheet.tsx`   | Detalhes da aula                   |
| `ClassDeleteDialog.tsx`  | Confirmação de exclusão            |
| `ClassCard.tsx`          | Card de aula (mobile)              |
| `ClassesView.tsx`        | Lista de aulas (tabela)            |
| `PostClassDialog.tsx`    | Registrar aula (attendance, notas) |
| `ClassPackageDialog.tsx` | Criar pacote de aulas              |

### Teachers

**Localização:** `src/components/teachers/`

| Componente                | Responsabilidade              |
| ------------------------- | ----------------------------- |
| `TeacherFormDialog.tsx`   | Form criar/editar professor   |
| `TeacherDetailSheet.tsx`  | Detalhes do professor         |
| `TeacherDeleteDialog.tsx` | Confirmação de exclusão       |
| `TeacherCard.tsx`         | Card de professor (mobile)    |
| `TeachersView.tsx`        | Lista de professores (tabela) |

### Users

**Localização:** `src/components/users/`

| Componente             | Responsabilidade                    |
| ---------------------- | ----------------------------------- |
| `UserFormDialog.tsx`   | Form criar/editar usuário           |
| `UserDetailSheet.tsx`  | Detalhes do usuário                 |
| `DeleteUserDialog.tsx` | Confirmação de exclusão (soft/hard) |
| `UserCard.tsx`         | Card de usuário (mobile)            |
| `UsersView.tsx`        | Lista de usuários (tabela)          |
| `UserLinksDialog.tsx`  | Vincular usuário a student/teacher  |

## Layouts

**Localização:** `src/components/layout/`

### AdminShell

**Responsabilidade:** Layout para admin (sidebar, header, content).

**Arquivo:** `src/components/layout/AdminShell.tsx`

**Estrutura:**

```tsx
<AdminShell>
  <Sidebar>
    <NavLink to="/admin">Dashboard</NavLink>
    <NavLink to="/admin/students">Alunos</NavLink>
    <NavLink to="/admin/teachers">Professores</NavLink>
    <NavLink to="/admin/financial">Financeiro</NavLink>
    <NavLink to="/admin/classes">Aulas</NavLink>
    <NavLink to="/admin/activities">Atividades</NavLink>
    <NavLink to="/admin/users">Usuários</NavLink>
  </Sidebar>
  <Header>
    <UserMenu />
  </Header>
  <Content>
    <Outlet /> {/* React Router outlet */}
  </Content>
</AdminShell>
```

### TeacherShell

**Responsabilidade:** Layout para professor (sidebar, header, content).

**Arquivo:** `src/components/layout/TeacherShell.tsx`

**Estrutura:** Similar a AdminShell, mas com links diferentes.

### StudentShell

**Responsabilidade:** Layout para aluno (bottom nav mobile-first).

**Arquivo:** `src/components/layout/StudentShell.tsx`

**Estrutura:**

```tsx
<StudentShell>
  <Header>
    <UserMenu />
  </Header>
  <Content>
    <Outlet />
  </Content>
  <BottomNav>
    <NavLink to="/student">Início</NavLink>
    <NavLink to="/student/financial">Financeiro</NavLink>
    <NavLink to="/student/activities">Atividades</NavLink>
    <NavLink to="/student/history">Histórico</NavLink>
  </BottomNav>
</StudentShell>
```

### SettingsPerfilTab

**Responsabilidade:** Aba de perfil nas configurações do usuário — avatar, nome, email, chave Pix (professor), exportar dados (LGPD).

**Arquivo:** `src/components/layout/SettingsPerfilTab.tsx`

**Props:**

| Prop          | Tipo             | Descrição                                     |
| ------------- | ---------------- | --------------------------------------------- |
| `userId`      | `string`         | UUID do usuário autenticado                   |
| `displayName` | `string`         | Nome exibido                                  |
| `email`       | `string`         | Email atual                                   |
| `avatarUrl`   | `string`         | URL do avatar                                 |
| `teacherId`   | `string \| null` | ID do professor (exibe campo Pix se presente) |
| `isTeacher`   | `boolean`        | Se `true`, nome e email ficam read-only       |

**Regra de negócio:** Nome e email de professor são gerenciados exclusivamente pelo admin. `isTeacher = true` esconde os botões Editar nesses campos. Alunos e admin mantêm edição livre.

---

## Auth

**Localização:** `src/components/auth/`

### ProtectedRoute

**Responsabilidade:** Proteger rotas por role (admin, teacher, student).

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

**Uso:**

```tsx
<Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
  <Route index element={<AdminHome />} />
  <Route path="students" element={<AdminStudents />} />
</Route>
```

**Fluxo:**

1. Verifica se usuário está autenticado
2. Verifica se role está em `allowedRoles`
3. Se não autenticado → redireciona para `/login`
4. Se autenticado mas role errado → redireciona para home do role correto

### AuthRedirect

**Responsabilidade:** Redirecionar usuário autenticado para home do role.

**Arquivo:** `src/components/auth/AuthRedirect.tsx`

**Uso:**

```tsx
<Route
  path="/login"
  element={
    <AuthRedirect>
      <Login />
    </AuthRedirect>
  }
/>
```

**Fluxo:**

1. Se usuário autenticado → redireciona para `/admin`, `/teacher` ou `/student`
2. Se não autenticado → renderiza children (Login)

### ChangePasswordDialog

**Responsabilidade:** Forçar troca de senha (must_change_password=true).

**Arquivo:** `src/components/auth/ChangePasswordDialog.tsx`

**Uso:**

```tsx
<ChangePasswordDialog
  open={profile?.must_change_password}
  onSuccess={() => refetch()}
/>
```

**Fluxo:**

1. Abre automaticamente se `must_change_password=true`
2. Usuário digita nova senha
3. Atualiza senha via `supabase.auth.updateUser()`
4. Marca `must_change_password=false` no profile
5. Fecha dialog

## Convenções de criação

### Estrutura de componente

```tsx
// src/components/students/StudentFormDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { students } from "@/content";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  onSuccess?: () => void;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: student || {},
  });

  const mutation = useCreateStudent();

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{students.form.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Input
            {...form.register("name")}
            placeholder={students.placeholders.name}
          />
          <Input
            {...form.register("email")}
            placeholder={students.placeholders.email}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? students.buttons.saving
              : students.buttons.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Regras

1. **Props tipadas** — sempre interface ou type
2. **Strings centralizadas** — importar de `@/content`
3. **Formulários com Zod** — validação type-safe
4. **Loading states** — `isPending`, `isLoading`
5. **Error handling** — toast de erro via `onError`
6. **Callbacks opcionais** — `onSuccess?`, `onError?`
7. **Componentes controlados** — `open`, `onOpenChange`

### Anti-patterns

- ❌ Lógica de negócio no componente (mover para hook)
- ❌ Data fetching no componente (usar TanStack Query hook)
- ❌ Strings hardcoded (centralizar em `@/content`)
- ❌ `any` explícito (usar tipos corretos)
- ❌ Componentes >150 linhas (extrair subcomponentes)

## Ver também

- [Frontend Overview](./overview.md) — Visão geral do frontend
- [Design Tokens](./design-tokens.md) — Typography, spacing, icons
- [Content](./content.md) — Centralização de strings
- [Hooks](./hooks.md) — TanStack Query, mutations
