# Requirements Document — Playwright E2E Setup

## Introduction

Setup completo de testes end-to-end com Playwright para validar 8 fluxos críticos da plataforma SyncClass. Objetivo: garantir que correções de 46 problemas identificados (Sprint 18) não introduzam regressões. Testes cobrem 3 roles (admin, teacher, student) e validam autenticação, CRUD, timezone, RLS e Edge Functions.

## Glossary

- **E2E_Test_Suite**: Conjunto de testes automatizados que simulam interações reais de usuário
- **Page_Object**: Padrão de design que encapsula interações com uma página específica
- **Fixture**: Helper reutilizável para setup de testes (auth, dados)
- **Playwright**: Framework de automação de testes para aplicações web
- **CI_Pipeline**: GitHub Actions workflow que executa testes automaticamente
- **Test_Isolation**: Garantia de que testes não interferem entre si (reset DB)
- **Flaky_Test**: Teste que falha intermitentemente sem mudanças no código
- **Seed_Data**: Dados de teste pré-carregados no banco antes da execução

## Requirements

### Requirement 1: Configuração Base do Playwright

**User Story:** Como desenvolvedor, quero configurar Playwright no projeto, para que eu possa escrever testes E2E com TypeScript.

#### Acceptance Criteria

1. THE E2E_Test_Suite SHALL install Playwright version 1.40 or higher
2. THE E2E_Test_Suite SHALL configure TypeScript support with path alias `@/*`
3. THE E2E_Test_Suite SHALL use Chromium browser for test execution
4. THE E2E_Test_Suite SHALL enable parallel execution with 4 workers
5. THE E2E_Test_Suite SHALL set base URL to `http://localhost:5173`
6. THE E2E_Test_Suite SHALL configure test timeout of 30 seconds
7. THE E2E_Test_Suite SHALL store test files in `tests/e2e/specs/`
8. THE E2E_Test_Suite SHALL generate HTML report in `playwright-report/`

### Requirement 2: Fixtures de Autenticação

**User Story:** Como desenvolvedor, quero helpers de login para cada role, para que eu possa autenticar usuários nos testes sem duplicação de código.

#### Acceptance Criteria

1. THE Fixture SHALL provide `loginAsAdmin()` function that authenticates admin user
2. THE Fixture SHALL provide `loginAsTeacher()` function that authenticates teacher user
3. THE Fixture SHALL provide `loginAsStudent()` function that authenticates student user
4. WHEN login succeeds, THE Fixture SHALL wait for navigation to role-specific dashboard
5. WHEN login fails, THE Fixture SHALL throw descriptive error with failure reason
6. THE Fixture SHALL accept optional credentials parameter for custom test users
7. THE Fixture SHALL store auth state in browser context for reuse

### Requirement 3: Page Objects Pattern

**User Story:** Como desenvolvedor, quero abstrair interações com páginas em Page Objects, para que testes sejam mais legíveis e manuteníveis.

#### Acceptance Criteria

1. THE Page_Object SHALL encapsulate all interactions with a specific page
2. THE Page_Object SHALL expose methods with business-domain names (not technical selectors)
3. THE Page_Object SHALL use data-testid selectors when available, fallback to accessible roles
4. THE Page_Object SHALL include assertion methods prefixed with `expect` (e.g., `expectStudentVisible`)
5. THE Page_Object SHALL handle loading states and wait for elements automatically
6. THE Page_Object SHALL throw descriptive errors when elements are not found within timeout

### Requirement 4: Seed de Dados de Teste

**User Story:** Como desenvolvedor, quero dados de teste pré-carregados, para que testes tenham estado inicial consistente.

#### Acceptance Criteria

1. THE Seed_Data SHALL create 1 admin user with email `admin@test.com`
2. THE Seed_Data SHALL create 2 teacher users with emails `teacher1@test.com` and `teacher2@test.com`
3. THE Seed_Data SHALL create 4 student users (2 per teacher)
4. THE Seed_Data SHALL create 10 class logs with mix of completed and pending status
5. THE Seed_Data SHALL create 8 financial records with mix of paid and pending status
6. THE Seed_Data SHALL create 4 activities with mix of delivered and pending status
7. WHEN seed runs, THE Seed_Data SHALL reset database to clean state before inserting
8. THE Seed_Data SHALL complete execution in less than 30 seconds

### Requirement 5: Fluxo E2E — Autenticação

**User Story:** Como desenvolvedor, quero validar autenticação de 3 roles, para que eu garanta que login/logout funcionam corretamente.

#### Acceptance Criteria

1. WHEN admin logs in, THE E2E_Test_Suite SHALL verify redirect to `/admin/dashboard`
2. WHEN teacher logs in, THE E2E_Test_Suite SHALL verify redirect to `/teacher/home`
3. WHEN student logs in, THE E2E_Test_Suite SHALL verify redirect to `/student/home`
4. WHEN user logs out, THE E2E_Test_Suite SHALL verify redirect to `/login`
5. WHEN invalid credentials are provided, THE E2E_Test_Suite SHALL verify error message is displayed
6. THE E2E_Test_Suite SHALL verify auth token is stored in localStorage after successful login
7. THE E2E_Test_Suite SHALL verify auth token is removed from localStorage after logout

### Requirement 6: Fluxo E2E — CRUD Aluno

**User Story:** Como desenvolvedor, quero validar CRUD de alunos, para que eu garanta que criação, edição, visualização e arquivamento funcionam corretamente.

#### Acceptance Criteria

1. WHEN teacher creates student, THE E2E_Test_Suite SHALL verify student appears in list
2. WHEN teacher edits student name, THE E2E_Test_Suite SHALL verify updated name is displayed
3. WHEN teacher archives student, THE E2E_Test_Suite SHALL verify student is removed from active list
4. WHEN teacher restores archived student, THE E2E_Test_Suite SHALL verify student reappears in active list
5. WHEN teacher views student details, THE E2E_Test_Suite SHALL verify all fields are displayed correctly
6. THE E2E_Test_Suite SHALL verify RLS prevents teacher from viewing other teacher's students
7. THE E2E_Test_Suite SHALL verify form validation errors are displayed for invalid inputs

### Requirement 7: Fluxo E2E — Lançamento de Aulas

**User Story:** Como desenvolvedor, quero validar lançamento de aulas, para que eu garanta que criação, timezone e status funcionam corretamente.

#### Acceptance Criteria

1. WHEN teacher creates class, THE E2E_Test_Suite SHALL verify class appears in list with correct date
2. WHEN class date is yesterday, THE E2E_Test_Suite SHALL verify status is "Concluída"
3. WHEN class date is tomorrow, THE E2E_Test_Suite SHALL verify status is "Agendada"
4. WHEN class date is today and time is past, THE E2E_Test_Suite SHALL verify status is "Pendente"
5. WHEN teacher marks attendance, THE E2E_Test_Suite SHALL verify status changes to "Concluída"
6. THE E2E_Test_Suite SHALL verify timezone handling is consistent (BRT/UTC-3)
7. THE E2E_Test_Suite SHALL verify overlapping classes are prevented with error message

### Requirement 8: Fluxo E2E — Pagamento de Cobranças

**User Story:** Como desenvolvedor, quero validar pagamento de cobranças, para que eu garanta que marcar como pago, timezone e idempotência funcionam corretamente.

#### Acceptance Criteria

1. WHEN teacher marks charge as paid, THE E2E_Test_Suite SHALL verify status changes to "Pago"
2. WHEN charge due date is past, THE E2E_Test_Suite SHALL verify status badge shows "Atrasada"
3. WHEN teacher marks same charge as paid twice, THE E2E_Test_Suite SHALL verify idempotency (no duplicate)
4. WHEN student uploads payment proof, THE E2E_Test_Suite SHALL verify proof appears for teacher approval
5. WHEN teacher approves payment proof, THE E2E_Test_Suite SHALL verify status changes to "Pago"
6. THE E2E_Test_Suite SHALL verify timezone handling for due date calculation (BRT/UTC-3)
7. THE E2E_Test_Suite SHALL verify RLS prevents student from viewing other student's charges

### Requirement 9: Fluxo E2E — Reset de Senha

**User Story:** Como desenvolvedor, quero validar reset de senha, para que eu garanta que Edge Function e RLS funcionam corretamente.

#### Acceptance Criteria

1. WHEN teacher resets student password, THE E2E_Test_Suite SHALL verify success toast is displayed
2. WHEN student logs in with new password, THE E2E_Test_Suite SHALL verify login succeeds
3. WHEN student tries old password, THE E2E_Test_Suite SHALL verify login fails
4. THE E2E_Test_Suite SHALL verify RLS prevents teacher from resetting other teacher's student password
5. THE E2E_Test_Suite SHALL verify Edge Function `reset-password` is called with correct parameters

### Requirement 10: Fluxo E2E — Atividades

**User Story:** Como desenvolvedor, quero validar atividades, para que eu garanta que envio, entrega e correção funcionam corretamente.

#### Acceptance Criteria

1. WHEN teacher sends activity, THE E2E_Test_Suite SHALL verify activity appears in student's list
2. WHEN student delivers activity, THE E2E_Test_Suite SHALL verify status changes to "Entregue"
3. WHEN teacher corrects activity, THE E2E_Test_Suite SHALL verify grade and feedback are displayed
4. WHEN activity deadline is past and not delivered, THE E2E_Test_Suite SHALL verify status is "Atrasada"
5. THE E2E_Test_Suite SHALL verify RLS prevents student from viewing other student's activities
6. THE E2E_Test_Suite SHALL verify file upload works for activity attachment
7. THE E2E_Test_Suite SHALL verify file upload works for student delivery

### Requirement 11: Fluxo E2E — Admin

**User Story:** Como desenvolvedor, quero validar operações de admin, para que eu garanta que criar teacher e hard delete funcionam corretamente.

#### Acceptance Criteria

1. WHEN admin creates teacher, THE E2E_Test_Suite SHALL verify teacher appears in list
2. WHEN admin invites teacher, THE E2E_Test_Suite SHALL verify Edge Function `invite-user` is called
3. WHEN admin hard deletes user, THE E2E_Test_Suite SHALL verify user is permanently removed
4. THE E2E_Test_Suite SHALL verify RLS prevents race condition in user creation (BACK-001)
5. THE E2E_Test_Suite SHALL verify admin can view all teachers and students
6. THE E2E_Test_Suite SHALL verify non-admin cannot access admin routes

### Requirement 12: Fluxo E2E — Student Portal

**User Story:** Como desenvolvedor, quero validar portal do aluno, para que eu garanta que visualização de cobranças e histórico funcionam corretamente.

#### Acceptance Criteria

1. WHEN student views financial records, THE E2E_Test_Suite SHALL verify all charges are displayed
2. WHEN student views class history, THE E2E_Test_Suite SHALL verify all classes are displayed
3. WHEN student views activities, THE E2E_Test_Suite SHALL verify pending and delivered activities are shown
4. THE E2E_Test_Suite SHALL verify RLS prevents student from viewing other student's data
5. THE E2E_Test_Suite SHALL verify student cannot access teacher or admin routes

### Requirement 13: Integração com CI

**User Story:** Como desenvolvedor, quero testes E2E rodando no CI, para que eu garanta que PRs não quebram fluxos críticos.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL run E2E tests on every push to main branch
2. THE CI_Pipeline SHALL run E2E tests on every pull request
3. WHEN tests fail, THE CI_Pipeline SHALL upload Playwright report as artifact
4. WHEN tests fail, THE CI_Pipeline SHALL block PR merge
5. THE CI_Pipeline SHALL execute seed setup before running tests
6. THE CI_Pipeline SHALL complete E2E execution in less than 10 minutes
7. THE CI_Pipeline SHALL use Supabase credentials from GitHub Secrets

### Requirement 14: Test Isolation e Determinismo

**User Story:** Como desenvolvedor, quero testes determinísticos, para que eu evite flaky tests e falsos positivos.

#### Acceptance Criteria

1. THE E2E_Test_Suite SHALL reset database to clean state before each test run
2. THE E2E_Test_Suite SHALL use fixed seed data (no random generation)
3. THE E2E_Test_Suite SHALL wait for network idle before assertions
4. THE E2E_Test_Suite SHALL retry failed assertions up to 3 times with 1 second delay
5. THE E2E_Test_Suite SHALL use explicit waits (not arbitrary timeouts)
6. THE E2E_Test_Suite SHALL clean up test data after execution
7. WHEN test fails, THE E2E_Test_Suite SHALL capture screenshot and trace for debugging

### Requirement 15: Documentação de Testes

**User Story:** Como desenvolvedor, quero documentação de como rodar testes, para que eu possa executar localmente e debugar falhas.

#### Acceptance Criteria

1. THE E2E_Test_Suite SHALL provide README with setup instructions
2. THE E2E_Test_Suite SHALL document required environment variables
3. THE E2E_Test_Suite SHALL provide npm scripts for common tasks (run, debug, ui)
4. THE E2E_Test_Suite SHALL document Page Object pattern and how to extend
5. THE E2E_Test_Suite SHALL document seed data structure and how to modify
6. THE E2E_Test_Suite SHALL provide troubleshooting guide for common errors
7. THE E2E_Test_Suite SHALL document CI configuration and how to debug failures
