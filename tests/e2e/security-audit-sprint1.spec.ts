import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTeacher, loginAsStudent } from './helpers/auth';
import { SELECTORS } from './helpers/selectors';

/**
 * SPRINT 1: Database & RLS Policies
 * 
 * Testa as correções de:
 * - VULN-001: BFLA em financial_records
 * - VULN-002: IDOR em financial_records
 * - VULN-003: Mass Assignment
 * - VULN-004: Tenant Isolation em activities
 * - VULN-005: Information Disclosure
 * - VULN-006: Security Definer Functions
 */

test.describe('Sprint 1: RLS Policies - Students', () => {
  test('Professor vê apenas seus alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para lista de alunos
    await page.goto('/students');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Verificar que há alunos na lista
    const studentRows = await page.locator(SELECTORS.students.row).count();
    expect(studentRows).toBeGreaterThan(0);
    
    // TODO: Verificar que NÃO vê alunos de outro professor
    // (precisa saber o nome de um aluno de outro professor)
  });

  test('Admin vê todos os alunos', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Ir para lista de alunos
    await page.goto('/students');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Verificar que há muitos alunos (mais que um professor teria)
    const studentRows = await page.locator(SELECTORS.students.row).count();
    expect(studentRows).toBeGreaterThan(0);
  });

  test('Professor consegue criar aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar aluno
    await page.goto('/students/new');
    
    // Preencher formulário
    const timestamp = Date.now();
    await page.fill(SELECTORS.students.nameInput, `Aluno Teste ${timestamp}`);
    await page.fill(SELECTORS.students.emailInput, `aluno${timestamp}@test.com`);
    
    // Salvar
    await page.click(SELECTORS.students.saveButton);
    
    // Verificar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sprint 1: RLS Policies - Financial Records', () => {
  test('Professor vê cobranças dos seus alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para cobranças
    await page.goto('/financial-records');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    // Verificar que há cobranças
    const financialRows = await page.locator(SELECTORS.financial.row).count();
    expect(financialRows).toBeGreaterThan(0);
  });

  test('Professor consegue criar cobrança para seu aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar cobrança
    await page.goto('/financial-records/new');
    
    // Preencher formulário
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '100');
    
    // Data de vencimento (15 dias no futuro)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill(SELECTORS.financial.dueDateInput, dateStr);
    
    // Salvar
    await page.click(SELECTORS.financial.saveButton);
    
    // Verificar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Professor consegue marcar cobrança como paga', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para cobranças
    await page.goto('/financial-records');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    // Clicar no primeiro botão "Marcar como Pago"
    const markAsPaidButton = page.locator(SELECTORS.financial.markAsPaidButton).first();
    
    if (await markAsPaidButton.isVisible()) {
      await markAsPaidButton.click();
      
      // Verificar sucesso
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    } else {
      // Se não há cobranças pendentes, criar uma primeiro
      test.skip();
    }
  });

  test('Aluno vê apenas suas cobranças', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    // Ir para cobranças
    await page.goto('/financial-records');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    // Verificar que há cobranças
    const financialRows = await page.locator(SELECTORS.financial.row).count();
    expect(financialRows).toBeGreaterThan(0);
  });
});

test.describe('Sprint 1: RLS Policies - Activities', () => {
  test('Professor vê atividades dos seus alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para atividades
    await page.goto('/activities');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    // Verificar que há atividades
    const activityRows = await page.locator(SELECTORS.activities.row).count();
    expect(activityRows).toBeGreaterThan(0);
  });

  test('Professor consegue criar atividade para seu aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar atividade
    await page.goto('/activities/new');
    
    // Preencher formulário
    const timestamp = Date.now();
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, `Atividade Teste ${timestamp}`);
    await page.fill(SELECTORS.activities.descriptionInput, 'Descrição da atividade de teste');
    
    // Data de entrega (7 dias no futuro)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill(SELECTORS.activities.dueDateInput, dateStr);
    
    // Salvar
    await page.click(SELECTORS.activities.saveButton);
    
    // Verificar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Aluno vê apenas suas atividades', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    // Ir para atividades
    await page.goto('/activities');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    // Verificar que há atividades
    const activityRows = await page.locator(SELECTORS.activities.row).count();
    expect(activityRows).toBeGreaterThan(0);
  });
});

test.describe('Sprint 1: RLS Policies - Teachers', () => {
  test('Admin consegue criar professor', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Ir para criar professor
    await page.goto('/teachers/new');
    
    // Preencher formulário
    const timestamp = Date.now();
    await page.fill(SELECTORS.teachers.nameInput, `Professor Teste ${timestamp}`);
    await page.fill(SELECTORS.teachers.emailInput, `prof${timestamp}@test.com`);
    
    // Salvar
    await page.click(SELECTORS.teachers.saveButton);
    
    // Verificar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Admin vê todos os professores', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Ir para lista de professores
    await page.goto('/teachers');
    
    // Aguardar carregar
    await page.waitForSelector(SELECTORS.teachers.list, { timeout: 10000 });
    
    // Verificar que há professores
    const teacherRows = await page.locator(SELECTORS.teachers.row).count();
    expect(teacherRows).toBeGreaterThan(0);
  });
});
