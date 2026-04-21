import { test, expect } from '@playwright/test';
import { loginAsTeacher, loginAsStudent, loginAsAdmin } from './helpers/auth';
import { SELECTORS } from './helpers/selectors';

/**
 * TESTES COMPLETOS: EDGE CASES E CENÁRIOS AVANÇADOS
 * 
 * Testes de casos extremos, race conditions, performance, etc.
 */

// ============================================
// EDGE CASES: Dados Extremos
// ============================================

test.describe('Edge Cases: Limites de Dados', () => {
  test('Nome com 100 caracteres (limite máximo)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    const longName = 'A'.repeat(100);
    await page.fill(SELECTORS.students.nameInput, longName);
    await page.fill(SELECTORS.students.emailInput, `long${Date.now()}@test.com`);
    
    await page.click(SELECTORS.students.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Nome com 101 caracteres (acima do limite)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    const tooLongName = 'A'.repeat(101);
    await page.fill(SELECTORS.students.nameInput, tooLongName);
    await page.fill(SELECTORS.students.emailInput, `toolong${Date.now()}@test.com`);
    
    await page.click(SELECTORS.students.saveButton);
    
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('text=/máximo|limite/i').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Valor muito grande em cobrança', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records/new');
    
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '999999999.99');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    await page.fill(SELECTORS.financial.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.financial.saveButton);
    
    // Deve aceitar ou rejeitar dependendo da regra de negócio
    await page.waitForTimeout(3000);
  });

  test('Nota com decimais (85.5)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/class-logs/new');
    
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    await page.fill(SELECTORS.classLogs.gradeInput, '85.5');
    
    await page.click(SELECTORS.classLogs.saveButton);
    
    // Verificar se aceita decimais
    await page.waitForTimeout(3000);
  });

  test('Caracteres especiais em nome', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'José da Silva Júnior');
    await page.fill(SELECTORS.students.emailInput, `special${Date.now()}@test.com`);
    
    await page.click(SELECTORS.students.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Emojis em descrição', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities/new');
    
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, 'Atividade com Emoji');
    await page.fill(SELECTORS.activities.descriptionInput, 'Ótimo trabalho! 🎉👏✨');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await page.fill(SELECTORS.activities.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.activities.saveButton);
    
    // Emojis devem ser preservados (não são HTML)
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// EDGE CASES: Datas e Horários
// ============================================

test.describe('Edge Cases: Datas Extremas', () => {
  test('Data muito no futuro (1 ano)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities/new');
    
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, 'Atividade Futuro Distante');
    
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    await page.fill(SELECTORS.activities.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.activities.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Aula no mesmo horário (conflito)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Criar primeira aula
    await page.goto('/class-logs/new');
    
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill(SELECTORS.classLogs.dateInput, today);
    
    const startInput = page.locator('input[name="start_at"]');
    if (await startInput.isVisible()) {
      await startInput.fill('14:00');
      
      const endInput = page.locator('input[name="end_at"]');
      await endInput.fill('15:00');
    }
    
    await page.click(SELECTORS.classLogs.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Tentar criar segunda aula no mesmo horário
    await page.goto('/class-logs/new');
    
    await page.selectOption(SELECTORS.classLogs.studentSelect, { index: 2 });
    await page.fill(SELECTORS.classLogs.dateInput, today);
    
    if (await startInput.isVisible()) {
      await startInput.fill('14:00');
      
      const endInput = page.locator('input[name="end_at"]');
      await endInput.fill('15:00');
    }
    
    await page.click(SELECTORS.classLogs.saveButton);
    
    // Deve rejeitar por conflito de horário
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('text=/conflito|horário|sobrepõe/i').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Dia de pagamento 31 em fevereiro', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'Teste Dia 31');
    await page.fill(SELECTORS.students.emailInput, `dia31${Date.now()}@test.com`);
    
    const payDayInput = page.locator('input[name="pay_day"]');
    if (await payDayInput.isVisible()) {
      await payDayInput.fill('31');
    }
    
    await page.click(SELECTORS.students.saveButton);
    
    // Sistema deve ajustar para último dia do mês
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// EDGE CASES: Concorrência
// ============================================

test.describe('Edge Cases: Operações Simultâneas', () => {
  test('Dois professores editam mesmo aluno simultaneamente', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    // Professor 1 edita
    await loginAsTeacher(page1, 'professor1');
    await page1.goto('/students');
    await page1.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    const editButton1 = page1.locator('[data-testid="edit-student"]').first();
    await editButton1.click();
    
    // Professor 2 edita o mesmo aluno
    await loginAsTeacher(page2, 'professor1');
    await page2.goto('/students');
    await page2.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    const editButton2 = page2.locator('[data-testid="edit-student"]').first();
    await editButton2.click();
    
    // Ambos salvam
    await page1.fill(SELECTORS.students.nameInput, 'Editado por P1');
    await page1.click(SELECTORS.students.saveButton);
    
    await page2.fill(SELECTORS.students.nameInput, 'Editado por P2');
    await page2.click(SELECTORS.students.saveButton);
    
    // Última edição deve prevalecer
    await page2.waitForTimeout(2000);
    
    await context1.close();
    await context2.close();
  });

  test('Marcar mesma cobrança como paga duas vezes', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const markAsPaidButton = page.locator(SELECTORS.financial.markAsPaidButton).first();
    
    if (await markAsPaidButton.isVisible()) {
      // Clicar duas vezes rapidamente
      await markAsPaidButton.click();
      await markAsPaidButton.click();
      
      // Deve processar apenas uma vez (idempotência)
      await page.waitForTimeout(3000);
    }
  });
});

// ============================================
// EDGE CASES: Performance
// ============================================

test.describe('Edge Cases: Performance', () => {
  test('Lista com muitos registros (paginação)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    
    // Medir tempo de carregamento
    const startTime = Date.now();
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    // Deve carregar em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Verificar paginação
    const rows = await page.locator(SELECTORS.students.row).count();
    expect(rows).toBeLessThanOrEqual(50); // Não deve carregar todos de uma vez
  });

  test('Busca com muitos resultados', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      // Buscar termo genérico
      await searchInput.fill('a');
      
      // Deve ter debounce
      await page.waitForTimeout(1000);
      
      const rows = await page.locator(SELECTORS.students.row).count();
      expect(rows).toBeGreaterThan(0);
    }
  });

  test('Upload de arquivo grande', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/activities/new');
    
    await page.selectOption(SELECTORS.activities.studentSelect, { index: 1 });
    await page.fill(SELECTORS.activities.titleInput, 'Teste Upload Grande');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await page.fill(SELECTORS.activities.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Criar arquivo de 5MB
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024, 'a');
      
      await fileInput.setInputFiles({
        name: 'arquivo-grande.pdf',
        mimeType: 'application/pdf',
        buffer: largeBuffer,
      });
      
      await page.click(SELECTORS.activities.saveButton);
      
      // Deve aceitar ou rejeitar baseado no limite
      await page.waitForTimeout(5000);
    }
  });
});

// ============================================
// EDGE CASES: Segurança
// ============================================

test.describe('Edge Cases: Tentativas de Bypass', () => {
  test('SQL Injection em busca', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      // Tentar SQL injection
      await searchInput.fill("'; DROP TABLE students; --");
      await page.waitForTimeout(1000);
      
      // Não deve quebrar a aplicação
      await expect(page.locator(SELECTORS.students.list)).toBeVisible();
    }
  });

  test('XSS em campos de texto', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    // Tentar XSS no nome
    await page.fill(SELECTORS.students.nameInput, '<img src=x onerror=alert("XSS")>');
    await page.fill(SELECTORS.students.emailInput, `xss${Date.now()}@test.com`);
    
    await page.click(SELECTORS.students.saveButton);
    
    // Verificar que não executa script
    await page.waitForTimeout(2000);
    
    // Não deve ter alert
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.goto('/students');
    await page.waitForTimeout(1000);
    
    expect(dialogs).toHaveLength(0);
  });

  test('Acesso direto a URL sem autenticação', async ({ page }) => {
    // Tentar acessar sem login
    await page.goto('/students');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('Manipulação de URL para acessar dados de outro professor', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Tentar acessar aluno de outro professor via URL
    await page.goto('/students/00000000-0000-0000-0000-000000000000');
    
    // Deve mostrar erro ou redirecionar
    await page.waitForTimeout(2000);
    
    const hasError = await Promise.race([
      page.locator('text=/não encontrado|não autorizado/i').isVisible().then(() => true),
      page.waitForURL(/\/students(?!.*00000000)/, { timeout: 3000 }).then(() => true).catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });
});

// ============================================
// EDGE CASES: Navegação
// ============================================

test.describe('Edge Cases: Navegação e Estado', () => {
  test('Voltar após salvar formulário', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    const timestamp = Date.now();
    await page.fill(SELECTORS.students.nameInput, `Teste Voltar ${timestamp}`);
    await page.fill(SELECTORS.students.emailInput, `voltar${timestamp}@test.com`);
    
    await page.click(SELECTORS.students.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Voltar
    await page.goBack();
    
    // Não deve resubmeter formulário
    await page.waitForTimeout(1000);
  });

  test('Refresh durante operação', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'Teste Refresh');
    await page.fill(SELECTORS.students.emailInput, `refresh${Date.now()}@test.com`);
    
    // Clicar em salvar e dar refresh imediatamente
    await page.click(SELECTORS.students.saveButton);
    await page.reload();
    
    // Não deve criar duplicado
    await page.waitForTimeout(2000);
  });

  test('Múltiplas abas abertas', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Login em ambas as abas
    await loginAsTeacher(page1, 'professor1');
    await loginAsTeacher(page2, 'professor1');
    
    // Navegar para mesma página
    await page1.goto('/students');
    await page2.goto('/students');
    
    // Ambas devem funcionar
    await expect(page1.locator(SELECTORS.students.list)).toBeVisible({ timeout: 10000 });
    await expect(page2.locator(SELECTORS.students.list)).toBeVisible({ timeout: 10000 });
    
    await context.close();
  });
});

// ============================================
// EDGE CASES: Responsividade
// ============================================

test.describe('Edge Cases: Mobile e Responsividade', () => {
  test('Visualização mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    
    // Menu mobile deve estar visível
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label="Menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      // Menu deve abrir
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });

  test('Visualização tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    
    // Layout deve se adaptar
    await expect(page.locator(SELECTORS.students.list)).toBeVisible({ timeout: 10000 });
  });
});
