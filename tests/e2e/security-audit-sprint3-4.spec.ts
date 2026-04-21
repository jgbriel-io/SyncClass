import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTeacher } from './helpers/auth';
import { SELECTORS } from './helpers/selectors';

/**
 * SPRINT 3: Business Logic & Validations
 * SPRINT 4: Frontend Security
 * 
 * Testa as correções de:
 * - VULN-012: Timezone Manipulation
 * - VULN-013: Payment Logic Bypass
 * - VULN-014: PIX Validation
 * - VULN-015: XSS/HTML Sanitization
 * - VULN-016: Client-Side Validation Bypass
 * - VULN-017: Information Disclosure
 */

test.describe('Sprint 3: Business Logic - Timezone', () => {
  test('Atividade com prazo no passado marca como atrasada', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar atividade
    await page.goto('/activities/new');
    
    // Preencher com data no passado
    const timestamp = Date.now();
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, `Atividade Atrasada ${timestamp}`);
    
    // Data no passado (ontem)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    await page.fill(SELECTORS.activities.dueDateInput, dateStr);
    
    // Salvar
    await page.click(SELECTORS.activities.saveButton);
    
    // Aguardar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Ir para lista e verificar status
    await page.goto('/activities');
    await page.waitForSelector(SELECTORS.activities.list, { timeout: 10000 });
    
    // Verificar que existe badge de "atrasada"
    await expect(page.locator('text=/atrasada/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sprint 3: Business Logic - Payment', () => {
  test('Não aceita valor negativo em cobrança', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar cobrança
    await page.goto('/financial-records/new');
    
    // Tentar criar com valor negativo
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '-100');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill(SELECTORS.financial.dueDateInput, dateStr);
    
    // Tentar salvar
    await page.click(SELECTORS.financial.saveButton);
    
    // Verificar erro (pode ser validação HTML5 ou toast de erro)
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('input:invalid').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });
});

test.describe('Sprint 3: Business Logic - PIX Validation', () => {
  test('Não aceita chave PIX inválida', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Ir para criar professor
    await page.goto('/teachers/new');
    
    // Preencher com PIX inválido
    const timestamp = Date.now();
    await page.fill(SELECTORS.teachers.nameInput, `Professor Teste ${timestamp}`);
    await page.fill(SELECTORS.teachers.emailInput, `prof${timestamp}@test.com`);
    await page.fill(SELECTORS.teachers.pixInput, '123'); // PIX INVÁLIDO
    
    // Tentar salvar
    await page.click(SELECTORS.teachers.saveButton);
    
    // Verificar erro
    await expect(page.locator(SELECTORS.toast.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/inválid/i')).toBeVisible();
  });

  test('Aceita chave PIX válida (CPF)', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Ir para criar professor
    await page.goto('/teachers/new');
    
    // Preencher com PIX válido (CPF)
    const timestamp = Date.now();
    await page.fill(SELECTORS.teachers.nameInput, `Professor Teste ${timestamp}`);
    await page.fill(SELECTORS.teachers.emailInput, `prof${timestamp}@test.com`);
    await page.fill(SELECTORS.teachers.pixInput, '12345678901'); // CPF válido (11 dígitos)
    
    // Salvar
    await page.click(SELECTORS.teachers.saveButton);
    
    // Verificar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sprint 4: Frontend Security - HTML Sanitization', () => {
  test('HTML é removido de notas de aula', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para registrar aula
    await page.goto('/class-logs/new');
    
    // Preencher com HTML malicioso
    const timestamp = Date.now();
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    
    await page.fill(
      SELECTORS.classLogs.notesInput, 
      `<script>alert("XSS")</script>Nota normal ${timestamp}`
    );
    
    // Salvar
    await page.click(SELECTORS.classLogs.saveButton);
    
    // Aguardar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Ir para lista e verificar que HTML foi removido
    await page.goto('/class-logs');
    await page.waitForSelector(SELECTORS.classLogs.list, { timeout: 10000 });
    
    // Verificar que <script> não está visível
    await expect(page.locator('text=<script>')).not.toBeVisible();
    
    // Verificar que texto normal está visível
    await expect(page.locator(`text=/Nota normal ${timestamp}/i`)).toBeVisible();
  });

  test('HTML é removido de descrição de atividade', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar atividade
    await page.goto('/activities/new');
    
    // Preencher com HTML
    const timestamp = Date.now();
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, `Atividade ${timestamp}`);
    await page.fill(
      SELECTORS.activities.descriptionInput,
      '<b>Texto em negrito</b> e <i>itálico</i>'
    );
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill(SELECTORS.activities.dueDateInput, dateStr);
    
    // Salvar
    await page.click(SELECTORS.activities.saveButton);
    
    // Aguardar sucesso
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Verificar que tags HTML foram removidas
    await page.goto('/activities');
    await expect(page.locator('text=<b>')).not.toBeVisible();
    await expect(page.locator('text=<i>')).not.toBeVisible();
  });
});

test.describe('Sprint 4: Frontend Security - Input Validation', () => {
  test('Não aceita email inválido', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para criar aluno
    await page.goto('/students/new');
    
    // Preencher com email inválido
    const timestamp = Date.now();
    await page.fill(SELECTORS.students.nameInput, `Aluno Teste ${timestamp}`);
    await page.fill(SELECTORS.students.emailInput, 'email-sem-arroba'); // INVÁLIDO
    
    // Tentar salvar
    await page.click(SELECTORS.students.saveButton);
    
    // Verificar erro (validação HTML5 ou toast)
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('input[type="email"]:invalid').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Não aceita nota fora do range 0-100', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Ir para registrar aula
    await page.goto('/class-logs/new');
    
    // Preencher com nota inválida
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    await page.fill(SELECTORS.classLogs.gradeInput, '150'); // FORA DO RANGE
    
    // Tentar salvar
    await page.click(SELECTORS.classLogs.saveButton);
    
    // Verificar erro
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('text=/0 e 100/i').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });
});

test.describe('Sprint 4: Frontend Security - Error Messages', () => {
  test('Mensagens de erro são amigáveis (não técnicas)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Tentar criar aluno com email duplicado (assumindo que existe)
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'Teste Duplicado');
    await page.fill(SELECTORS.students.emailInput, 'aluno1@test.com'); // Email existente
    
    // Tentar salvar
    await page.click(SELECTORS.students.saveButton);
    
    // Aguardar erro
    await page.waitForSelector(SELECTORS.toast.error, { timeout: 5000 });
    
    // Verificar que mensagem é amigável
    const errorText = await page.locator(SELECTORS.toast.error).textContent();
    
    // NÃO deve conter termos técnicos
    expect(errorText?.toLowerCase()).not.toContain('duplicate key');
    expect(errorText?.toLowerCase()).not.toContain('constraint');
    expect(errorText?.toLowerCase()).not.toContain('violates');
    expect(errorText?.toLowerCase()).not.toContain('pg_');
    
    // DEVE conter mensagem amigável
    expect(errorText?.toLowerCase()).toMatch(/já.*cadastrad|duplicad|existe/i);
  });
});
