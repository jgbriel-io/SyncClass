# Implementation Plan: Playwright E2E Setup

## Overview

Implementação de testes end-to-end com Playwright para validar 8 fluxos críticos da plataforma SyncClass. Cobertura de 3 roles (admin, teacher, student) com validação de autenticação, CRUD, timezone, RLS e Edge Functions. Testes determinísticos com seed fixo, Page Objects reutilizáveis e CI pipeline integrado.

## Tasks

- [ ] 1. Setup inicial do Playwright
  - Install `@playwright/test@^1.40.0`, `tsx@^4.7.0`, `wait-on@^7.2.0`
  - Create `playwright.config.ts` with TypeScript support, Chromium browser, 4 workers, base URL `http://localhost:5173`
  - Create directory structure: `tests/e2e/{specs,fixtures,page-objects,seed,utils}`
  - Configure TypeScript path alias `@/*` in `tsconfig.json` for test files
  - Add npm scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:debug`, `test:e2e:seed`, `test:e2e:reset`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 2. Implementar fixtures de autenticação
  - [ ] 2.1 Create `tests/e2e/fixtures/auth.ts` with auth fixtures
    - Implement `loginAsAdmin()` fixture that authenticates admin and waits for `/admin/dashboard`
    - Implement `loginAsTeacher()` fixture that authenticates teacher and waits for `/teacher/home`
    - Implement `loginAsStudent()` fixture that authenticates student and waits for `/student/home`
    - Accept optional credentials parameter for custom test users
    - Store auth state in browser context for reuse
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

  - [ ] 2.2 Create `tests/e2e/fixtures/index.ts` and export all fixtures
    - Export auth fixtures with proper TypeScript types
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Implementar Page Objects
  - [ ] 3.1 Create `tests/e2e/page-objects/LoginPage.ts`
    - Implement `goto()`, `login(email, password)`, `expectErrorMessage(message)`
    - Use data-testid selectors when available, fallback to accessible roles
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 3.2 Create `tests/e2e/page-objects/StudentsPage.ts`
    - Implement `goto()`, `createStudent(data)`, `editStudent(name, newData)`, `archiveStudent(name)`, `restoreStudent(name)`, `expectStudentVisible(name)`, `expectStudentNotVisible(name)`
    - Handle loading states and wait for elements automatically
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.3 Create `tests/e2e/page-objects/ClassesPage.ts`
    - Implement `goto()`, `createClass(data)`, `markAttendance(className)`, `expectClassVisible(className)`, `expectClassStatus(className, status)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.4 Create `tests/e2e/page-objects/FinancialPage.ts`
    - Implement `goto()`, `markAsPaid(chargeName)`, `uploadPaymentProof(chargeName, file)`, `approvePaymentProof(chargeName)`, `expectChargeStatus(chargeName, status)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.5 Create `tests/e2e/page-objects/ActivitiesPage.ts`
    - Implement `goto()`, `sendActivity(data)`, `deliverActivity(activityName, file)`, `correctActivity(activityName, grade, feedback)`, `expectActivityStatus(activityName, status)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.6 Create `tests/e2e/page-objects/AdminDashboardPage.ts`
    - Implement `goto()`, `createTeacher(data)`, `inviteTeacher(email)`, `hardDeleteUser(email)`, `expectTeacherVisible(name)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.7 Create `tests/e2e/page-objects/TeacherHomePage.ts`
    - Implement `goto()`, `expectWelcomeMessage()`, `navigateToStudents()`, `navigateToClasses()`, `navigateToFinancial()`, `navigateToActivities()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.8 Create `tests/e2e/page-objects/StudentHomePage.ts`
    - Implement `goto()`, `expectWelcomeMessage()`, `navigateToFinancial()`, `navigateToActivities()`, `navigateToHistory()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.9 Create `tests/e2e/page-objects/index.ts` and export all Page Objects
    - Export all Page Objects with proper TypeScript types
    - _Requirements: 3.1_

- [ ] 4. Implementar seed de dados de teste
  - [ ] 4.1 Create `tests/e2e/seed/data.ts` with fixed seed data
    - Define 1 admin user (`admin@test.com`)
    - Define 2 teacher users (`teacher1@test.com`, `teacher2@test.com`)
    - Define 4 student users (2 per teacher)
    - Define 10 class logs with mix of completed/pending/scheduled status
    - Define 8 financial records with mix of paid/pending/overdue status
    - Define 4 activities with mix of delivered/pending/overdue status
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 4.2 Create `tests/e2e/seed/reset.ts` with database reset logic
    - Truncate all tables in correct order (respect foreign keys)
    - Use Supabase service role key for admin access
    - _Requirements: 4.7_

  - [ ] 4.3 Create `tests/e2e/seed/seed.ts` with seed execution logic
    - Call reset script first
    - Create admin user with Supabase Auth
    - Create teacher users with Supabase Auth
    - Create student users with Supabase Auth
    - Insert class logs, financial records, activities using batch inserts
    - Complete execution in less than 30 seconds
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 5. Checkpoint - Validar setup base
  - Run seed script locally and verify data is created
  - Run `npm run test:e2e:ui` and verify Playwright UI opens
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Implementar spec E2E — Autenticação
  - [ ] 6.1 Create `tests/e2e/specs/auth.spec.ts`
    - Test admin login redirects to `/admin/dashboard`
    - Test teacher login redirects to `/teacher/home`
    - Test student login redirects to `/student/home`
    - Test logout redirects to `/login`
    - Test invalid credentials show error message
    - Test auth token is stored in localStorage after login
    - Test auth token is removed from localStorage after logout
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 7. Implementar spec E2E — CRUD Aluno
  - [ ] 7.1 Create `tests/e2e/specs/students-crud.spec.ts`
    - Test teacher creates student and student appears in list
    - Test teacher edits student name and updated name is displayed
    - Test teacher archives student and student is removed from active list
    - Test teacher restores archived student and student reappears in active list
    - Test teacher views student details and all fields are displayed correctly
    - Test RLS prevents teacher from viewing other teacher's students
    - Test form validation errors are displayed for invalid inputs
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 8. Implementar spec E2E — Lançamento de Aulas
  - [ ] 8.1 Create `tests/e2e/specs/classes.spec.ts`
    - Test teacher creates class and class appears in list with correct date
    - Test class with yesterday date shows status "Concluída"
    - Test class with tomorrow date shows status "Agendada"
    - Test class with today date and past time shows status "Pendente"
    - Test teacher marks attendance and status changes to "Concluída"
    - Test timezone handling is consistent (BRT/UTC-3)
    - Test overlapping classes are prevented with error message
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 9. Implementar spec E2E — Pagamento de Cobranças
  - [ ] 9.1 Create `tests/e2e/specs/financial.spec.ts`
    - Test teacher marks charge as paid and status changes to "Pago"
    - Test charge with past due date shows status badge "Atrasada"
    - Test teacher marks same charge as paid twice and verify idempotency
    - Test student uploads payment proof and proof appears for teacher approval
    - Test teacher approves payment proof and status changes to "Pago"
    - Test timezone handling for due date calculation (BRT/UTC-3)
    - Test RLS prevents student from viewing other student's charges
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 10. Implementar spec E2E — Reset de Senha
  - [ ] 10.1 Create `tests/e2e/specs/password-reset.spec.ts`
    - Test teacher resets student password and success toast is displayed
    - Test student logs in with new password and login succeeds
    - Test student tries old password and login fails
    - Test RLS prevents teacher from resetting other teacher's student password
    - Test Edge Function `reset-password` is called with correct parameters
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Implementar spec E2E — Atividades
  - [ ] 11.1 Create `tests/e2e/specs/activities.spec.ts`
    - Test teacher sends activity and activity appears in student's list
    - Test student delivers activity and status changes to "Entregue"
    - Test teacher corrects activity and grade/feedback are displayed
    - Test activity with past deadline and not delivered shows status "Atrasada"
    - Test RLS prevents student from viewing other student's activities
    - Test file upload works for activity attachment
    - Test file upload works for student delivery
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12. Implementar spec E2E — Admin
  - [ ] 12.1 Create `tests/e2e/specs/admin.spec.ts`
    - Test admin creates teacher and teacher appears in list
    - Test admin invites teacher and Edge Function `invite-user` is called
    - Test admin hard deletes user and user is permanently removed
    - Test RLS prevents race condition in user creation (BACK-001)
    - Test admin can view all teachers and students
    - Test non-admin cannot access admin routes
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 13. Implementar spec E2E — Student Portal
  - [ ] 13.1 Create `tests/e2e/specs/student-portal.spec.ts`
    - Test student views financial records and all charges are displayed
    - Test student views class history and all classes are displayed
    - Test student views activities and pending/delivered activities are shown
    - Test RLS prevents student from viewing other student's data
    - Test student cannot access teacher or admin routes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 14. Checkpoint - Validar todos os specs
  - Run all E2E tests locally with `npm run test:e2e`
  - Verify all 8 specs pass without flaky failures
  - Run tests 3 times consecutively to ensure determinism
  - Ensure all tests pass, ask the user if questions arise

- [ ] 15. Implementar CI pipeline
  - [ ] 15.1 Create `.github/workflows/e2e.yml` with GitHub Actions workflow
    - Configure workflow to run on push to main and pull requests
    - Setup Node.js 20 with npm cache
    - Install dependencies with `npm ci`
    - Install Playwright browsers with `npx playwright install --with-deps chromium`
    - Start Vite dev server in background
    - Wait for `http://localhost:5173` to be ready
    - Run seed script with `npm run test:e2e:seed`
    - Run E2E tests with `npm run test:e2e`
    - Upload Playwright report as artifact on failure
    - Configure Supabase credentials from GitHub Secrets
    - Set timeout to 15 minutes
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 16. Implementar utils e helpers
  - [ ] 16.1 Create `tests/e2e/utils/wait.ts` with wait helpers
    - Implement `waitForNetworkIdle(page)` helper
    - Implement `waitForElement(page, selector, timeout)` helper
    - _Requirements: 14.3, 14.5_

  - [ ] 16.2 Create `tests/e2e/utils/assertions.ts` with custom assertions
    - Implement retry logic for assertions (up to 3 times with 1 second delay)
    - _Requirements: 14.4_

- [ ] 17. Implementar documentação
  - [ ] 17.1 Create `tests/e2e/README.md` with comprehensive documentation
    - Document setup instructions (install dependencies, install browsers, configure env vars)
    - Document how to run tests locally (all tests, specific test, debug mode, UI mode)
    - Document CI behavior (when tests run, how to view reports)
    - Document test structure (specs, fixtures, page-objects, seed)
    - Document troubleshooting guide (test timeout, element not found, flaky test, RLS error)
    - Document how to extend tests (adding new test, adding new Page Object)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 17.2 Update root `README.md` with E2E section
    - Add section linking to `tests/e2e/README.md`
    - Document npm scripts for E2E tests
    - _Requirements: 15.1, 15.3_

- [ ] 18. Checkpoint final - Validar CI e documentação
  - Push changes to feature branch
  - Open pull request and verify CI runs E2E tests
  - Verify CI completes in less than 10 minutes
  - Verify CI blocks PR if tests fail
  - Review documentation and ensure all steps are clear
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Testes E2E não usam property-based testing — abordagem determinística com seed fixo
- Seed data é idêntico em cada run para garantir determinismo
- Parallel execution com 4 workers — testes não compartilham estado
- Retry strategy: 0 retries localmente, 2 retries no CI
- Screenshots, videos e traces capturados automaticamente em falhas
- Page Objects encapsulam interações — testes usam linguagem de negócio
- Fixtures de auth reutilizáveis — evitam duplicação de código de login
- CI pipeline bloqueia PRs com testes falhando — prevenção de regressões
