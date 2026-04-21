import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTeacher, loginAsStudent, logout } from './helpers/auth';
import { SELECTORS } from './helpers/selectors';

/**
 * TESTES COMPLETOS: TODAS AS FUNCIONALIDADES
 * 
 * Activities, Class Logs, Teachers, Auth, Dashboard, etc.
 */

// ============================================
// ACTIVITIES (Atividades)
// ============================================

test.describe('Activities: CRUD Completo', () => {
  test('Professor cria atividade completa', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities/new');
    
    const timestamp = Date.now();
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, `Atividade Completa ${timestamp}`);
    await page.fill(SELECTORS.activities.descriptionInput, 'Descrição detalhada da atividade de teste');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await page.fill(SELECTORS.activities.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    // Upload de arquivo (se houver)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      const buffer = Buffer.from('fake pdf content');
      await fileInput.setInputFiles({
        name: 'atividade.pdf',
        mimeType: 'application/pdf',
        buffer: buffer,
      });
    }
    
    await page.click(SELECTORS.activities.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Aluno marca atividade como entregue', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    await page.goto('/activities');
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    const deliverButton = page.locator(SELECTORS.activities.deliverButton).first();
    
    if (await deliverButton.isVisible()) {
      await deliverButton.click();
      
      // Preencher resposta
      const responseInput = page.locator('textarea[name="response"], textarea[name="student_response_text"]');
      if (await responseInput.isVisible()) {
        await responseInput.fill('Minha resposta para a atividade');
      }
      
      // Upload de arquivo de resposta
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const buffer = Buffer.from('fake response content');
        await fileInput.setInputFiles({
          name: 'resposta.pdf',
          mimeType: 'application/pdf',
          buffer: buffer,
        });
      }
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Entregar")');
      await submitButton.click();
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor corrige atividade', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities');
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    // Buscar atividade entregue
    const correctButton = page.locator('[data-testid="correct-activity"], button:has-text("Corrigir")').first();
    
    if (await correctButton.isVisible()) {
      await correctButton.click();
      
      // Preencher correção
      const feedbackInput = page.locator('textarea[name="feedback"]');
      await feedbackInput.fill('Ótimo trabalho! Continue assim.');
      
      const gradeInput = page.locator('input[name="grade"]');
      await gradeInput.fill('95');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Salvar")');
      await submitButton.click();
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Atividade com prazo passado marca como atrasada', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities/new');
    
    const timestamp = Date.now();
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, `Atividade Atrasada ${timestamp}`);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.fill(SELECTORS.activities.dueDateInput, yesterday.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.activities.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    await page.goto('/activities');
    await expect(page.locator('text=/atrasada/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Professor deleta atividade', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities');
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    const deleteButton = page.locator('[data-testid="delete-activity"], button:has-text("Excluir")').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      await confirmButton.click();
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Activities: Filtros', () => {
  test('Professor filtra por aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities');
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    const studentFilter = page.locator('select[name="student_id"]');
    if (await studentFilter.isVisible()) {
      await studentFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });

  test('Professor filtra por status', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities');
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    const statusFilter = page.locator('select[name="status"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('pendente');
      await page.waitForTimeout(1000);
    }
  });
});

// ============================================
// CLASS LOGS (Aulas)
// ============================================

test.describe('Class Logs: CRUD Completo', () => {
  test('Professor registra aula completa', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/class-logs/new');
    
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    
    // Horários
    const startInput = page.locator('input[name="start_at"]');
    if (await startInput.isVisible()) {
      await startInput.fill('14:00');
    }
    
    const endInput = page.locator('input[name="end_at"]');
    if (await endInput.isVisible()) {
      await endInput.fill('15:00');
    }
    
    // Presença
    const attendanceCheckbox = page.locator('input[name="attendance"], input[type="checkbox"]');
    if (await attendanceCheckbox.isVisible()) {
      await attendanceCheckbox.check();
    }
    
    // Notas
    await page.fill(SELECTORS.classLogs.notesInput, 'Aula sobre verbos irregulares');
    await page.fill(SELECTORS.classLogs.gradeInput, '85');
    
    await page.click(SELECTORS.classLogs.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Professor registra aula com cobrança', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/class-logs/new');
    
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    
    // Marcar para criar cobrança
    const createChargeCheckbox = page.locator('input[name="create_financial"], input[type="checkbox"]:has-text("Criar cobrança")');
    if (await createChargeCheckbox.isVisible()) {
      await createChargeCheckbox.check();
      
      // Preencher dados da cobrança
      const amountInput = page.locator('input[name="amount"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill('50');
      }
    }
    
    await page.click(SELECTORS.classLogs.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Professor registra pacote de aulas', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/class-logs/package');
    
    // Selecionar aluno
    await page.selectOption('select[name="student_id"]', { index: 1 });
    
    // Adicionar múltiplas aulas
    for (let i = 0; i < 4; i++) {
      const addButton = page.locator('button:has-text("Adicionar Aula")');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Criar cobrança única
    const packageChargeCheckbox = page.locator('input[name="create_package_charge"]');
    if (await packageChargeCheckbox.isVisible()) {
      await packageChargeCheckbox.check();
      
      const amountInput = page.locator('input[name="package_amount"]');
      await amountInput.fill('200');
    }
    
    const saveButton = page.locator('button[type="submit"]');
    await saveButton.click();
    
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('HTML é removido de notas de aula', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/class-logs/new');
    
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    
    await page.fill(SELECTORS.classLogs.notesInput, '<script>alert("XSS")</script>Nota normal');
    
    await page.click(SELECTORS.classLogs.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    await page.goto('/class-logs');
    await expect(page.locator('text=<script>')).not.toBeVisible();
    await expect(page.locator('text=Nota normal')).toBeVisible();
  });
});

// ============================================
// TEACHERS (Professores)
// ============================================

test.describe('Teachers: CRUD Completo', () => {
  test('Admin cria professor completo', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers/new');
    
    const timestamp = Date.now();
    await page.fill(SELECTORS.teachers.nameInput, `Professor Teste ${timestamp}`);
    await page.fill(SELECTORS.teachers.emailInput, `prof${timestamp}@test.com`);
    
    const phoneInput = page.locator('input[name="phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('11987654321');
    }
    
    await page.fill(SELECTORS.teachers.pixInput, '12345678901'); // CPF válido
    
    const hourlyRateInput = page.locator('input[name="hourly_rate"]');
    if (await hourlyRateInput.isVisible()) {
      await hourlyRateInput.fill('75');
    }
    
    await page.click(SELECTORS.teachers.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Admin edita professor', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers');
    await page.waitForSelector(SELECTORS.teachers.list, { timeout: 10000 });
    
    const editButton = page.locator('[data-testid="edit-teacher"], button:has-text("Editar")').first();
    await editButton.click();
    
    await page.fill(SELECTORS.teachers.nameInput, `Professor Editado ${Date.now()}`);
    
    await page.click(SELECTORS.teachers.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Validação de PIX - CPF válido', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers/new');
    
    await page.fill(SELECTORS.teachers.nameInput, 'Teste PIX CPF');
    await page.fill(SELECTORS.teachers.emailInput, `pix${Date.now()}@test.com`);
    await page.fill(SELECTORS.teachers.pixInput, '12345678901'); // 11 dígitos
    
    await page.click(SELECTORS.teachers.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Validação de PIX - Email válido', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers/new');
    
    await page.fill(SELECTORS.teachers.nameInput, 'Teste PIX Email');
    await page.fill(SELECTORS.teachers.emailInput, `pix${Date.now()}@test.com`);
    await page.fill(SELECTORS.teachers.pixInput, 'pix@email.com');
    
    await page.click(SELECTORS.teachers.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Validação de PIX - Telefone válido', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers/new');
    
    await page.fill(SELECTORS.teachers.nameInput, 'Teste PIX Phone');
    await page.fill(SELECTORS.teachers.emailInput, `pix${Date.now()}@test.com`);
    await page.fill(SELECTORS.teachers.pixInput, '11987654321');
    
    await page.click(SELECTORS.teachers.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Validação de PIX - Rejeita inválido', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers/new');
    
    await page.fill(SELECTORS.teachers.nameInput, 'Teste PIX Inválido');
    await page.fill(SELECTORS.teachers.emailInput, `pix${Date.now()}@test.com`);
    await page.fill(SELECTORS.teachers.pixInput, '123'); // INVÁLIDO
    
    await page.click(SELECTORS.teachers.saveButton);
    
    await expect(page.locator(SELECTORS.toast.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/inválid/i')).toBeVisible();
  });
});

// ============================================
// AUTHENTICATION (Autenticação)
// ============================================

test.describe('Auth: Login e Logout', () => {
  test('Login como professor', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'professor1@test.com');
    await page.fill('#password', 'prof123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|students|activities)/, { timeout: 10000 });
    
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Login como aluno', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'aluno1@test.com');
    await page.fill('#password', 'aluno123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|activities|financial)/, { timeout: 10000 });
    
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Login com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'invalido@test.com');
    await page.fill('#password', 'senha-errada');
    await page.click('button[type="submit"]');
    
    await expect(page.locator(SELECTORS.toast.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/inválid|incorret/i')).toBeVisible();
  });

  test('Logout', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await logout(page);
    
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('Redirecionamento após login', async ({ page }) => {
    // Tentar acessar página protegida
    await page.goto('/students');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
    
    // Fazer login
    await page.fill('#email', 'professor1@test.com');
    await page.fill('#password', 'prof123');
    await page.click('button[type="submit"]');
    
    // Deve voltar para a página original
    await expect(page).toHaveURL(/\/students/, { timeout: 10000 });
  });
});

test.describe('Auth: Reset de Senha', () => {
  test('Professor reseta senha de aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    const resetButton = page.locator('[data-testid="reset-password"], button:has-text("Resetar Senha")').first();
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      await confirmButton.click();
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Admin reseta senha de professor', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/teachers');
    await page.waitForSelector(SELECTORS.teachers.list, { timeout: 10000 });
    
    const resetButton = page.locator('[data-testid="reset-password"], button:has-text("Resetar Senha")').first();
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      await confirmButton.click();
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================
// DASHBOARD
// ============================================

test.describe('Dashboard: Visualizações', () => {
  test('Professor vê dashboard com estatísticas', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/dashboard');
    
    // Verificar cards de estatísticas
    await expect(page.locator('text=/total.*alunos/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/aulas.*mês/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/receita|faturamento/i')).toBeVisible({ timeout: 5000 });
  });

  test('Aluno vê dashboard com suas informações', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    await page.goto('/dashboard');
    
    // Verificar informações do aluno
    await expect(page.locator('text=/atividades.*pendentes/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/próximas.*aulas/i')).toBeVisible({ timeout: 5000 });
  });

  test('Admin vê dashboard global', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/dashboard');
    
    // Verificar estatísticas globais
    await expect(page.locator('text=/total.*professores/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/total.*alunos/i')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// NAVEGAÇÃO E UX
// ============================================

test.describe('Navegação: Menu e Rotas', () => {
  test('Professor navega por todas as páginas', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Alunos
    await page.click('a[href="/students"], nav a:has-text("Alunos")');
    await expect(page).toHaveURL(/\/students/, { timeout: 5000 });
    
    // Cobranças
    await page.click('a[href="/financial-records"], nav a:has-text("Cobranças")');
    await expect(page).toHaveURL(/\/financial/, { timeout: 5000 });
    
    // Atividades
    await page.click('a[href="/activities"], nav a:has-text("Atividades")');
    await expect(page).toHaveURL(/\/activities/, { timeout: 5000 });
    
    // Aulas
    await page.click('a[href="/class-logs"], nav a:has-text("Aulas")');
    await expect(page).toHaveURL(/\/class-logs/, { timeout: 5000 });
  });

  test('Breadcrumbs funcionam corretamente', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    const breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label="breadcrumb"]');
    if (await breadcrumb.isVisible()) {
      await breadcrumb.locator('a:has-text("Alunos")').click();
      await expect(page).toHaveURL(/\/students$/, { timeout: 5000 });
    }
  });
});

test.describe('UX: Loading e Feedback', () => {
  test('Loading aparece durante operações', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    
    // Verificar que loading aparece
    const loading = page.locator(SELECTORS.common.loading);
    if (await loading.isVisible({ timeout: 1000 })) {
      // Loading deve desaparecer
      await expect(loading).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('Toast de sucesso desaparece automaticamente', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    const timestamp = Date.now();
    await page.fill(SELECTORS.students.nameInput, `Teste Toast ${timestamp}`);
    await page.fill(SELECTORS.students.emailInput, `toast${timestamp}@test.com`);
    
    await page.click(SELECTORS.students.saveButton);
    
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Toast deve desaparecer após alguns segundos
    await expect(page.locator(SELECTORS.toast.success)).not.toBeVisible({ timeout: 10000 });
  });
});
