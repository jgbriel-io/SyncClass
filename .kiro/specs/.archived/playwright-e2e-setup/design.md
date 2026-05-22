# Design Document — Playwright E2E Setup

## Overview

Este documento descreve a implementação de testes end-to-end (E2E) com Playwright para validar 8 fluxos críticos da plataforma SyncClass. O objetivo é garantir que correções de 46 problemas identificados (Sprint 18) não introduzam regressões, além de estabelecer baseline de qualidade para futuras features.

### Contexto

A plataforma SyncClass possui:

- 3 roles (admin, teacher, student) com permissões distintas
- 8 fluxos críticos: autenticação, CRUD aluno, lançamento de aulas, pagamento de cobranças, reset de senha, atividades, admin e student portal
- Stack: React 18 + TypeScript + Vite + Supabase
- Vitest já configurado para testes unitários (não conflita com Playwright)

### Objetivos

1. **Validação de fluxos críticos**: 8 specs E2E cobrindo autenticação, CRUD, timezone, RLS e Edge Functions
2. **Prevenção de regressões**: CI pipeline bloqueando PRs com testes falhando
3. **Determinismo**: Testes isolados, seed fixo, sem flaky tests
4. **Manutenibilidade**: Page Objects, fixtures reutilizáveis, documentação clara

### Escopo

**Incluído:**

- Setup Playwright 1.40+ com TypeScript
- 8 specs E2E (autenticação, CRUD aluno, aulas, pagamentos, reset senha, atividades, admin, student)
- Page Objects para páginas principais (login, dashboard, students, classes, financial, activities)
- Fixtures de autenticação (loginAsAdmin, loginAsTeacher, loginAsStudent)
- Seed de dados de teste (1 admin, 2 teachers, 4 students, 10 classes, 8 financial records, 4 activities)
- CI pipeline (GitHub Actions)
- Documentação (README, troubleshooting)

**Excluído:**

- Testes de performance/carga
- Testes de acessibilidade (WCAG)
- Testes visuais/screenshot comparison
- Testes mobile (apenas desktop Chromium)
- Testes de integração com serviços externos (Sentry, Supabase Storage)

## Architecture

### Estrutura de Diretórios

```
tests/
├── e2e/
│   ├── specs/                    # Test specs (8 arquivos)
│   │   ├── auth.spec.ts
│   │   ├── students-crud.spec.ts
│   │   ├── classes.spec.ts
│   │   ├── financial.spec.ts
│   │   ├── password-reset.spec.ts
│   │   ├── activities.spec.ts
│   │   ├── admin.spec.ts
│   │   └── student-portal.spec.ts
│   ├── fixtures/                 # Fixtures reutilizáveis
│   │   ├── auth.ts              # loginAsAdmin, loginAsTeacher, loginAsStudent
│   │   └── index.ts
│   ├── page-objects/            # Page Object Model
│   │   ├── LoginPage.ts
│   │   ├── AdminDashboardPage.ts
│   │   ├── TeacherHomePage.ts
│   │   ├── StudentHomePage.ts
│   │   ├── StudentsPage.ts
│   │   ├── ClassesPage.ts
│   │   ├── FinancialPage.ts
│   │   ├── ActivitiesPage.ts
│   │   └── index.ts
│   ├── seed/                    # Seed de dados de teste
│   │   ├── seed.ts              # Script principal
│   │   ├── data.ts              # Dados fixos
│   │   └── reset.ts             # Reset DB
│   └── utils/                   # Helpers
│       ├── wait.ts              # waitForNetworkIdle, waitForElement
│       └── assertions.ts        # Custom assertions
├── playwright.config.ts         # Configuração Playwright
└── README.md                    # Documentação
```

### Fluxo de Execução

```
CI Trigger (push/PR)
  ↓
Setup Node + Dependencies
  ↓
Install Playwright Browsers
  ↓
Start Vite Dev Server (background)
  ↓
Run Seed Script (reset DB + insert data)
  ↓
Run Playwright Tests (parallel, 4 workers)
  ↓
Generate HTML Report
  ↓
Upload Report (if failure)
  ↓
Block PR (if failure)
```

### Camadas

1. **Specs**: Testes de alto nível, linguagem de negócio
2. **Page Objects**: Encapsulam interações com páginas
3. **Fixtures**: Setup reutilizável (auth, dados)
4. **Seed**: Dados de teste consistentes
5. **Utils**: Helpers genéricos (waits, assertions)

## Components and Interfaces

### Page Objects

#### LoginPage

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Senha").fill(password);
    await this.page.getByRole("button", { name: "Entrar" }).click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
```

#### StudentsPage

```typescript
export class StudentsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/teacher/students");
  }

  async createStudent(data: {
    name: string;
    email: string;
    phone: string;
    payDay: number;
    hourlyRate: number;
  }) {
    await this.page.getByRole("button", { name: "Novo Aluno" }).click();
    await this.page.getByLabel("Nome").fill(data.name);
    await this.page.getByLabel("Email").fill(data.email);
    await this.page.getByLabel("Telefone").fill(data.phone);
    await this.page.getByLabel("Dia de Pagamento").fill(String(data.payDay));
    await this.page.getByLabel("Valor/Hora").fill(String(data.hourlyRate));
    await this.page.getByRole("button", { name: "Salvar" }).click();
  }

  async expectStudentVisible(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async archiveStudent(name: string) {
    const row = this.page.getByRole("row", { name: new RegExp(name) });
    await row.getByRole("button", { name: "Arquivar" }).click();
    await this.page.getByRole("button", { name: "Confirmar" }).click();
  }

  async expectStudentNotVisible(name: string) {
    await expect(this.page.getByText(name)).not.toBeVisible();
  }
}
```

### Fixtures

#### Auth Fixture

```typescript
export type AuthFixtures = {
  loginAsAdmin: () => Promise<void>;
  loginAsTeacher: (teacherEmail?: string) => Promise<void>;
  loginAsStudent: (studentEmail?: string) => Promise<void>;
};

export const authFixtures: Fixtures<AuthFixtures> = {
  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login("admin@test.com", "Admin123!");
      await page.waitForURL("/admin/dashboard");
    };
    await use(login);
  },

  loginAsTeacher: async ({ page }, use) => {
    const login = async (email = "teacher1@test.com") => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, "Teacher123!");
      await page.waitForURL("/teacher/home");
    };
    await use(login);
  },

  loginAsStudent: async ({ page }, use) => {
    const login = async (email = "student1@test.com") => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, "Student123!");
      await page.waitForURL("/student/home");
    };
    await use(login);
  },
};
```

### Seed Data Structure

```typescript
export const SEED_DATA = {
  admin: {
    email: "admin@test.com",
    password: "Admin123!",
    name: "Admin Test",
  },
  teachers: [
    {
      email: "teacher1@test.com",
      password: "Teacher123!",
      name: "Teacher One",
      pix_key: "11999999999",
    },
    {
      email: "teacher2@test.com",
      password: "Teacher123!",
      name: "Teacher Two",
      pix_key: "11988888888",
    },
  ],
  students: [
    {
      email: "student1@test.com",
      password: "Student123!",
      name: "Student One",
      teacher_email: "teacher1@test.com",
      pay_day: 5,
      hourly_rate: 80,
    },
    {
      email: "student2@test.com",
      password: "Student123!",
      name: "Student Two",
      teacher_email: "teacher1@test.com",
      pay_day: 10,
      hourly_rate: 100,
    },
    {
      email: "student3@test.com",
      password: "Student123!",
      name: "Student Three",
      teacher_email: "teacher2@test.com",
      pay_day: 15,
      hourly_rate: 90,
    },
    {
      email: "student4@test.com",
      password: "Student123!",
      name: "Student Four",
      teacher_email: "teacher2@test.com",
      pay_day: 20,
      hourly_rate: 110,
    },
  ],
  classLogs: [
    // 10 class logs com mix de completed/pending
    // 5 para teacher1, 5 para teacher2
    // Datas: ontem (concluída), hoje (pendente), amanhã (agendada)
  ],
  financialRecords: [
    // 8 financial records com mix de paid/pending
    // 4 para teacher1, 4 para teacher2
    // Due dates: passado (atrasada), hoje, futuro
  ],
  activities: [
    // 4 activities com mix de delivered/pending
    // 2 para teacher1, 2 para teacher2
    // Deadlines: passado (atrasada), futuro
  ],
};
```

## Data Models

### Test User

```typescript
type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "teacher" | "student";
};
```

### Test Student

```typescript
type TestStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  teacher_id: string;
  pay_day: number;
  hourly_rate: number;
  is_archived: boolean;
};
```

### Test Class Log

```typescript
type TestClassLog = {
  id: string;
  teacher_id: string;
  student_id: string;
  class_date: string; // YYYY-MM-DD
  start_at: string; // ISO timestamp
  end_at: string; // ISO timestamp
  duration: number; // minutes
  attendance: boolean | null;
  status: "Concluída" | "Pendente" | "Agendada";
};
```

### Test Financial Record

```typescript
type TestFinancialRecord = {
  id: string;
  teacher_id: string;
  student_id: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  status: "Pago" | "Pendente" | "Atrasada";
  payment_proof_url?: string;
  payment_proof_status?: "pending" | "approved" | "rejected";
};
```

### Test Activity

```typescript
type TestActivity = {
  id: string;
  teacher_id: string;
  student_id: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  status: "Entregue" | "Pendente" | "Atrasada";
  delivery_url?: string;
  grade?: number;
  feedback?: string;
};
```

## Testing Strategy

### Approach

Este projeto **NÃO** é adequado para property-based testing (PBT). Razões:

1. **E2E tests são integration tests**: Testam fluxos completos através de UI, banco de dados e Edge Functions. PBT é mais adequado para testes unitários de funções puras.

2. **Custo de execução**: Cada iteração de E2E test leva 5-30 segundos (navegação, interações, waits). 100 iterações seriam inviáveis (8+ minutos por property).

3. **Determinismo necessário**: E2E tests precisam de dados fixos e previsíveis para validar UI corretamente. Dados aleatórios dificultam assertions (ex: "verificar que aluno X aparece na lista").

4. **Flaky tests**: Randomização aumenta chance de flaky tests (timeouts, race conditions, elementos não encontrados).

### Test Strategy

**Unit Tests (Vitest):**

- Funções puras (formatters, validators, helpers)
- Hooks isolados (com mocks do Supabase)
- Componentes isolados (com mocks de hooks)
- Cobertura: 70%+ (configurar threshold no vitest.config.ts)

**E2E Tests (Playwright):**

- Fluxos críticos end-to-end (8 specs)
- Validação de integração (UI + banco + Edge Functions)
- Validação de RLS policies
- Validação de timezone handling
- Validação de idempotência

**Integration Tests (Supabase):**

- RLS policies (pgTAP)
- RPCs (pgTAP)
- Triggers (pgTAP)

### E2E Test Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./tests/e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 4,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Test Isolation

**Estratégia:**

1. **Reset DB antes de cada run**: Script `tests/e2e/seed/reset.ts` trunca todas as tabelas
2. **Seed fixo**: Dados idênticos em cada run (não randomizar)
3. **Parallel execution**: Testes não compartilham estado (cada worker tem contexto isolado)
4. **Cleanup**: Não necessário (reset no início do próximo run)

**Seed Script:**

```typescript
// tests/e2e/seed/seed.ts
export async function seedDatabase() {
  // 1. Reset DB (truncate all tables)
  await resetDatabase();

  // 2. Create admin
  const admin = await createUser(SEED_DATA.admin, "admin");

  // 3. Create teachers
  const teachers = await Promise.all(
    SEED_DATA.teachers.map((t) => createUser(t, "teacher"))
  );

  // 4. Create students
  const students = await Promise.all(
    SEED_DATA.students.map((s) => createStudent(s, teachers))
  );

  // 5. Create class logs
  await createClassLogs(teachers, students);

  // 6. Create financial records
  await createFinancialRecords(teachers, students);

  // 7. Create activities
  await createActivities(teachers, students);

  console.log("✅ Seed completed");
}
```

### Determinism

**Waits explícitos:**

```typescript
// ❌ Arbitrary timeout
await page.waitForTimeout(2000);

// ✅ Wait for specific condition
await page.waitForSelector('[data-testid="student-list"]');
await page.waitForLoadState("networkidle");
```

**Retry logic:**

```typescript
// playwright.config.ts
use: {
  actionTimeout: 10000, // 10s para ações (click, fill)
  navigationTimeout: 30000, // 30s para navegação
},
retries: process.env.CI ? 2 : 0, // Retry 2x no CI
```

**Fixed dates:**

```typescript
// ❌ Datas relativas (hoje, ontem)
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

// ✅ Datas fixas no seed
const classLogs = [
  { class_date: "2024-01-15", status: "Concluída" },
  { class_date: "2024-01-20", status: "Pendente" },
  { class_date: "2024-01-25", status: "Agendada" },
];
```

## Error Handling

### Test Failures

**Captura de contexto:**

- Screenshot automático (on failure)
- Video recording (retain on failure)
- Trace (on first retry)
- Console logs (capturados automaticamente)

**Retry strategy:**

- 0 retries localmente (fail fast)
- 2 retries no CI (tolerar flakiness temporária)

### Seed Failures

```typescript
try {
  await seedDatabase();
} catch (error) {
  console.error("❌ Seed failed:", error);
  // Log detalhado para debug
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
  process.exit(1); // Falhar CI
}
```

### Network Failures

```typescript
// Retry automático do Playwright
await page.goto("/login", {
  waitUntil: "networkidle",
  timeout: 30000,
});

// Fallback para waits explícitos
await page.waitForSelector('[data-testid="login-form"]', {
  timeout: 10000,
});
```

### Assertion Failures

```typescript
// ✅ Mensagens descritivas
await expect(page.getByText("Student One")).toBeVisible({
  timeout: 5000,
});

// ✅ Soft assertions (continuar após falha)
await expect.soft(page.getByText("Total: R$ 1.000,00")).toBeVisible();
await expect.soft(page.getByText("Pago: R$ 500,00")).toBeVisible();
```

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          npm run dev &
          npx wait-on http://localhost:5173
          npm run test:e2e:seed
          npm run test:e2e

      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### NPM Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:seed": "tsx tests/e2e/seed/seed.ts",
    "test:e2e:reset": "tsx tests/e2e/seed/reset.ts"
  }
}
```

## Documentation

### README Structure

````markdown
# E2E Tests — SyncClass

## Setup

1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install chromium`
3. Configure environment variables (`.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (para seed)

## Running Tests

### Locally

```bash
# Start dev server
npm run dev

# Seed database (em outro terminal)
npm run test:e2e:seed

# Run all tests
npm run test:e2e

# Run specific test
npm run test:e2e -- auth.spec.ts

# Debug mode
npm run test:e2e:debug

# UI mode (interactive)
npm run test:e2e:ui
```
````

### CI

Tests run automatically on:

- Push to `main`
- Pull requests

## Test Structure

- `tests/e2e/specs/` — Test specs (8 arquivos)
- `tests/e2e/fixtures/` — Auth fixtures
- `tests/e2e/page-objects/` — Page Object Model
- `tests/e2e/seed/` — Seed scripts

## Troubleshooting

### Test timeout

**Causa:** Vite dev server não iniciou ou seed não rodou.

**Fix:**

```bash
# Verificar se dev server está rodando
curl http://localhost:5173

# Rodar seed manualmente
npm run test:e2e:seed
```

### Element not found

**Causa:** Seletor mudou ou elemento não renderizou.

**Fix:**

1. Inspecionar página com `--debug`
2. Verificar se seed rodou corretamente
3. Adicionar wait explícito: `await page.waitForSelector('[data-testid="..."]')`

### Flaky test

**Causa:** Race condition, timeout insuficiente.

**Fix:**

1. Adicionar `waitForLoadState('networkidle')`
2. Aumentar timeout: `{ timeout: 10000 }`
3. Usar retry: `await expect.poll(() => ...).toBeTruthy()`

### RLS error

**Causa:** Seed não criou usuário ou role incorreto.

**Fix:**

1. Verificar logs do seed
2. Verificar RLS policies no Supabase
3. Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurado

````

### Extending Tests

```markdown
## Adding New Test

1. Create spec file: `tests/e2e/specs/my-feature.spec.ts`
2. Import fixtures: `import { test } from '../fixtures'`
3. Use Page Objects: `const studentsPage = new StudentsPage(page)`
4. Write test:

```typescript
test('should create student', async ({ page, loginAsTeacher }) => {
  await loginAsTeacher();

  const studentsPage = new StudentsPage(page);
  await studentsPage.goto();
  await studentsPage.createStudent({
    name: 'New Student',
    email: 'new@test.com',
    phone: '11999999999',
    payDay: 5,
    hourlyRate: 80,
  });

  await studentsPage.expectStudentVisible('New Student');
});
````

## Adding New Page Object

1. Create file: `tests/e2e/page-objects/MyPage.ts`
2. Implement class:

```typescript
export class MyPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/my-route");
  }

  async doAction() {
    await this.page.getByRole("button", { name: "Action" }).click();
  }

  async expectResult() {
    await expect(this.page.getByText("Success")).toBeVisible();
  }
}
```

3. Export in `index.ts`

````

## Implementation Plan

### Phase 1: Setup (2h)

1. Install Playwright: `npm install -D @playwright/test`
2. Create `playwright.config.ts`
3. Create directory structure
4. Configure TypeScript paths
5. Add npm scripts

### Phase 2: Fixtures & Page Objects (3h)

1. Implement auth fixtures (loginAsAdmin, loginAsTeacher, loginAsStudent)
2. Implement LoginPage
3. Implement StudentsPage
4. Implement ClassesPage
5. Implement FinancialPage
6. Implement ActivitiesPage
7. Implement AdminDashboardPage
8. Implement TeacherHomePage
9. Implement StudentHomePage

### Phase 3: Seed (2h)

1. Implement reset script (truncate tables)
2. Implement seed script (create users, students, classes, financial, activities)
3. Test seed locally
4. Document seed data structure

### Phase 4: Test Specs (8h)

1. `auth.spec.ts` — 7 acceptance criteria (1h)
2. `students-crud.spec.ts` — 7 acceptance criteria (1h)
3. `classes.spec.ts` — 7 acceptance criteria (1h)
4. `financial.spec.ts` — 7 acceptance criteria (1h)
5. `password-reset.spec.ts` — 5 acceptance criteria (1h)
6. `activities.spec.ts` — 7 acceptance criteria (1h)
7. `admin.spec.ts` — 6 acceptance criteria (1h)
8. `student-portal.spec.ts` — 5 acceptance criteria (1h)

### Phase 5: CI (1h)

1. Create `.github/workflows/e2e.yml`
2. Configure secrets (Supabase credentials)
3. Test CI pipeline
4. Configure PR blocking

### Phase 6: Documentation (2h)

1. Write `tests/e2e/README.md`
2. Document troubleshooting
3. Document how to extend tests
4. Update root `README.md` with E2E section

**Total: 18h**

## Dependencies

### New Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "tsx": "^4.7.0",
    "wait-on": "^7.2.0"
  }
}
````

### Existing Dependencies (no changes)

- React 18
- TypeScript 5.8
- Vite 5.4
- Vitest 3.2 (não conflita)
- Supabase 2.90

## Risks and Mitigations

### Risk 1: Flaky Tests

**Probabilidade:** Média  
**Impacto:** Alto (bloqueia CI)

**Mitigação:**

- Waits explícitos (não arbitrary timeouts)
- Retry strategy (2x no CI)
- Seed fixo (não randomizar)
- Network idle waits

### Risk 2: Seed Lento

**Probabilidade:** Baixa  
**Impacto:** Médio (CI timeout)

**Mitigação:**

- Seed otimizado (batch inserts)
- Timeout de 30s (requirement 4.8)
- Paralelizar criação de dados

### Risk 3: CI Timeout

**Probabilidade:** Baixa  
**Impacto:** Alto (bloqueia PRs)

**Mitigação:**

- Timeout de 15min no workflow
- Parallel execution (4 workers)
- Requirement: CI completa em <10min

### Risk 4: Conflito com Vitest

**Probabilidade:** Muito Baixa  
**Impacto:** Baixo

**Mitigação:**

- Playwright usa porta 5173 (mesma do Vite)
- Vitest usa jsdom (não conflita)
- Scripts separados (`test` vs `test:e2e`)

## Success Metrics

1. **Cobertura de fluxos críticos**: 8/8 specs implementados
2. **Determinismo**: 0 flaky tests em 10 runs consecutivos
3. **Performance CI**: <10min por run (requirement 13.6)
4. **Manutenibilidade**: Page Objects reutilizáveis, fixtures documentados
5. **Prevenção de regressões**: CI bloqueando PRs com testes falhando

## References

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD](https://playwright.dev/docs/ci)
- [Sprint 18 — Consolidação de Problemas](../../../docs/sprints/sprint-18-consolidacao-problemas-identificados.md)
- [Requirements Document](.kiro/specs/playwright-e2e-setup/requirements.md)
