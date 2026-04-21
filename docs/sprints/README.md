# Sprints — Visão Geral

## Histórico de Desenvolvimento

| Sprint | Período | Foco | Arquivo |
|---|---|---|---|
| Sprint 1 | 19–23 jan 2026 | Fundação | [sprint-01-fundacao.md](./sprint-01-fundacao.md) |
| Sprint 2 | 26–29 jan 2026 | Autenticação & Usuários | [sprint-02-autenticacao-usuarios.md](./sprint-02-autenticacao-usuarios.md) |
| Sprint 3 | 29–30 jan 2026 | Qualidade & Infraestrutura | [sprint-03-qualidade-infra.md](./sprint-03-qualidade-infra.md) |
| Sprint 4 | 31 jan–08 fev 2026 | Features Avançadas | [sprint-04-features-avancadas.md](./sprint-04-features-avancadas.md) |
| Sprint 5 | 09–13 fev 2026 | Estabilização & UX | [sprint-05-estabilizacao-ux.md](./sprint-05-estabilizacao-ux.md) |
| Sprint 6 | 14–18 fev 2026 | Segurança & Correções | [sprint-06-seguranca-correcoes.md](./sprint-06-seguranca-correcoes.md) |
| Sprint 7 | 19 fev–11 mar 2026 | Auditorias & Migrations | [sprint-07-auditorias-migrations.md](./sprint-07-auditorias-migrations.md) |
| Sprint 8 | 10–11 mar 2026 | Reestruturação | [sprint-08-reestruturacao.md](./sprint-08-reestruturacao.md) |
| Sprint 9 | 21 abr 2026 | Restore & TCC | [sprint-09-restore-tcc.md](./sprint-09-restore-tcc.md) |

> Histórico completo com commits em [historico-completo.md](./historico-completo.md)

---

## Sprints Planejadas

### Correções de Código

| Sprint | Foco | Prioridade |
|---|---|---|
| [Sprint 10](./sprint-10-correcao-arquitetura.md) | Supabase direto em componentes/páginas | 🔴 Alta |
| [Sprint 11](./sprint-11-correcao-componentes.md) | Componentes e hooks acima de 500 linhas | 🟠 Média |
| [Sprint 12](./sprint-12-correcao-duplicacao.md) | Lógica duplicada (teacherId query repetida) | 🟡 Baixa |

### Pré-Defesa

| Sprint | Foco | Estimativa |
|---|---|---|
| [Sprint 13](./sprint-13-correcoes-pre-defesa.md) | Bugs críticos (Sentry LGPD, timezone, ErrorBoundary) | ~1h |

### Novas Funcionalidades

| Sprint | Foco | Estimativa |
|---|---|---|
| [Sprint 14](./sprint-14-notificacoes.md) | Notificações em tempo real | ~3h |
| [Sprint 15](./sprint-15-exportacao-pdf.md) | Exportação de relatórios em PDF | ~2h |
| [Sprint 16](./sprint-16-google-calendar.md) | Integração com Google Calendar | ~6h |
| [Sprint 17](./sprint-17-pagamento-real.md) | Integração com pagamento real (Stripe/Pix API) | ~8h |
| [Sprint 18](./sprint-18-gamificacao.md) | Gamificação do portal do aluno | ~5h |

## Problemas Encontrados

### 🔴 Críticos (arquitetura quebrada)

**Supabase chamado diretamente em componentes e páginas** — viola a separação `Components → Hooks → Supabase`:
- `src/pages/teacher/TeacherHome.tsx` — query inline de `profiles`
- `src/pages/teacher/TeacherStudents.tsx` — query inline de `profiles`
- `src/pages/teacher/TeacherClasses.tsx` — query inline de `profiles`
- `src/pages/teacher/TeacherFinancial.tsx` — query inline de `profiles`
- `src/pages/teacher/TeacherOverview.tsx` — query inline de `profiles`
- `src/pages/admin/Teachers.tsx` — lógica de dados inline (805 linhas)
- `src/pages/admin/Users.tsx` — lógica de dados inline (958 linhas)
- `src/components/financial/FinancialView.tsx` — supabase direto
- `src/components/students/StudentsListView.tsx` — supabase direto
- `src/components/layout/TeacherLayout.tsx` — supabase direto
- `src/components/layout/SettingsModal.tsx` — supabase direto
- `src/pages/student/StudentActivities.tsx` — supabase direto
- `src/pages/student/StudentCheckout.tsx` — supabase direto
- `src/pages/admin/Dashboard.tsx` — supabase direto
- `src/components/auth/ChangePasswordDialog.tsx` — supabase direto
- `src/pages/ForgotPassword.tsx` — supabase direto (aceitável, fluxo de auth)
- `src/pages/ResetPassword.tsx` — supabase direto (aceitável, fluxo de auth)

### 🟠 Médios (qualidade/manutenibilidade)

**Arquivos acima de 500 linhas** (limite recomendado ~150 para componentes):
- `src/pages/admin/Users.tsx` — 958 linhas
- `src/pages/admin/Teachers.tsx` — 805 linhas
- `src/hooks/useUserMutations.ts` — 944 linhas (25+ funções)
- `src/components/students/StudentsListView.tsx` — 865 linhas
- `src/components/dashboard/DashboardView.tsx` — 830 linhas
- `src/components/financial/FinancialView.tsx` — 818 linhas
- `src/components/classes/ClassesView.tsx` — 791 linhas
- `src/components/users/UserFormDialog.tsx` — 955 linhas
- `src/components/students/StudentFormDialog.tsx` — 700 linhas
- `src/components/classes/ClassLogFormDialog.tsx` — 759 linhas
- `src/components/classes/PackageClassesDialog.tsx` — 661 linhas
- `src/components/admin/StudentDetailSheet.tsx` — 660 linhas
- `src/hooks/useClassLogs.ts` — 774 linhas
- `src/hooks/useFinancialRecords.ts` — 566 linhas
- `src/hooks/useStudents.ts` — 540 linhas
- `src/components/layout/SettingsModal.tsx` — 515 linhas
- `src/components/ui/sidebar.tsx` — 584 linhas (shadcn, não mexer)

### 🟡 Baixos (duplicação)

**Query de `teacherId` duplicada em todas as páginas teacher** — o mesmo bloco de código aparece em `TeacherHome`, `TeacherStudents`, `TeacherClasses`, `TeacherFinancial`, `TeacherOverview`. Deveria ser um hook `useTeacherId()`.
