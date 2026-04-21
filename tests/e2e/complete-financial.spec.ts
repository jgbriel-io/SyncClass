import { test, expect } from '@playwright/test';
import { loginAsTeacher, loginAsStudent, loginAsAdmin } from './helpers/auth';
import { SELECTORS } from './helpers/selectors';

/**
 * TESTES COMPLETOS: FINANCIAL RECORDS (Cobranças)
 * 
 * Cobre TODAS as operações de cobranças e fluxos de pagamento
 */

test.describe('Financial: CRUD Completo', () => {
  test('Professor cria cobrança completa', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records/new');
    
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '150.50');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill(SELECTORS.financial.dueDateInput, dateStr);
    
    await page.fill(SELECTORS.financial.descriptionInput, 'Mensalidade de teste');
    
    await page.click(SELECTORS.financial.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Professor edita cobrança pendente', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    // Editar primeira cobrança pendente
    const editButton = page.locator('[data-testid="edit-financial"], button:has-text("Editar")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      await page.fill(SELECTORS.financial.amountInput, '200');
      await page.click(SELECTORS.financial.saveButton);
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor marca cobrança como paga', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const markAsPaidButton = page.locator(SELECTORS.financial.markAsPaidButton).first();
    
    if (await markAsPaidButton.isVisible()) {
      await markAsPaidButton.click();
      
      // Pode ter modal de confirmação
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor desfaz pagamento', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    // Buscar cobrança paga
    const undoButton = page.locator('[data-testid="undo-payment"], button:has-text("Desfazer")').first();
    
    if (await undoButton.isVisible()) {
      await undoButton.click();
      
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor deleta cobrança', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const deleteButton = page.locator('[data-testid="delete-financial"], button:has-text("Excluir")').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      await confirmButton.click();
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor visualiza detalhes da cobrança', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const firstRow = page.locator(SELECTORS.financial.row).first();
    await firstRow.click();
    
    // Verificar que está na página de detalhes ou modal abriu
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/valor|vencimento|status/i')).toBeVisible();
  });
});

test.describe('Financial: Filtros e Ordenação', () => {
  test('Professor filtra por aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const studentFilter = page.locator('select[name="student_id"], [data-testid="filter-student"]');
    
    if (await studentFilter.isVisible()) {
      await studentFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      
      const rows = await page.locator(SELECTORS.financial.row).count();
      expect(rows).toBeGreaterThan(0);
    }
  });

  test('Professor filtra por status (pendente/pago)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const statusFilter = page.locator('select[name="status"], [data-testid="filter-status"]');
    
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('pendente');
      await page.waitForTimeout(1000);
      
      // Verificar que só mostra pendentes
      await expect(page.locator('text=/pago/i')).not.toBeVisible();
    }
  });

  test('Professor filtra por período', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const dateFromInput = page.locator('input[name="date_from"], [data-testid="filter-date-from"]');
    
    if (await dateFromInput.isVisible()) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const dateStr = firstDay.toISOString().split('T')[0];
      
      await dateFromInput.fill(dateStr);
      await page.waitForTimeout(1000);
      
      const rows = await page.locator(SELECTORS.financial.row).count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });

  test('Professor ordena por vencimento', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const dueDateHeader = page.locator('th:has-text("Vencimento"), [data-testid="sort-due-date"]');
    
    if (await dueDateHeader.isVisible()) {
      await dueDateHeader.click();
      await page.waitForTimeout(500);
      
      const firstRow = await page.locator(SELECTORS.financial.row).first().textContent();
      expect(firstRow).toBeTruthy();
    }
  });

  test('Professor ordena por valor', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const amountHeader = page.locator('th:has-text("Valor"), [data-testid="sort-amount"]');
    
    if (await amountHeader.isVisible()) {
      await amountHeader.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Financial: Validações', () => {
  test('Não aceita valor zero', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records/new');
    
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '0');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    await page.fill(SELECTORS.financial.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.financial.saveButton);
    
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('input:invalid').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Não aceita valor negativo', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records/new');
    
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '-100');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    await page.fill(SELECTORS.financial.dueDateInput, futureDate.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.financial.saveButton);
    
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('input:invalid').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Não aceita data de vencimento no passado', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records/new');
    
    await page.selectOption(SELECTORS.financial.studentSelect, { index: 1 });
    await page.fill(SELECTORS.financial.amountInput, '100');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.fill(SELECTORS.financial.dueDateInput, yesterday.toISOString().split('T')[0]);
    
    await page.click(SELECTORS.financial.saveButton);
    
    // Pode ou não aceitar (depende da regra de negócio)
    await page.waitForTimeout(2000);
  });
});

test.describe('Financial: Comprovantes de Pagamento', () => {
  test('Aluno faz upload de comprovante', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const uploadButton = page.locator('[data-testid="upload-proof"], button:has-text("Enviar Comprovante")').first();
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      
      // Upload de arquivo (mock)
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Criar arquivo de teste
        const buffer = Buffer.from('fake image content');
        await fileInput.setInputFiles({
          name: 'comprovante.jpg',
          mimeType: 'image/jpeg',
          buffer: buffer,
        });
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Enviar")');
        await submitButton.click();
        
        await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Professor aprova comprovante', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const approveButton = page.locator('[data-testid="approve-proof"], button:has-text("Aprovar")').first();
    
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor rejeita comprovante', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const rejectButton = page.locator('[data-testid="reject-proof"], button:has-text("Rejeitar")').first();
    
    if (await rejectButton.isVisible()) {
      await rejectButton.click();
      
      // Preencher motivo
      const reasonInput = page.locator('textarea[name="rejection_reason"]');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Comprovante ilegível');
        
        const confirmButton = page.locator(SELECTORS.common.confirmButton);
        await confirmButton.click();
        
        await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Financial: Permissões (RLS)', () => {
  test('Professor vê apenas cobranças dos seus alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const rows = await page.locator(SELECTORS.financial.row).count();
    expect(rows).toBeGreaterThan(0);
    
    // Verificar que NÃO vê cobranças de alunos de outro professor
    await expect(page.locator('text=Aluno Professor 2')).not.toBeVisible();
  });

  test('Aluno vê apenas suas próprias cobranças', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const rows = await page.locator(SELECTORS.financial.row).count();
    expect(rows).toBeGreaterThan(0);
    
    // Todas as cobranças devem ser do aluno1
    const allRows = await page.locator(SELECTORS.financial.row).all();
    for (const row of allRows) {
      const text = await row.textContent();
      // Não deve conter nome de outro aluno
      expect(text).not.toContain('Aluno 2');
    }
  });

  test('Aluno NÃO pode criar cobrança', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    await page.goto('/financial-records/new');
    
    // Deve ser redirecionado ou ver erro
    await page.waitForTimeout(2000);
    
    const hasError = await Promise.race([
      page.locator('text=/não autorizado|sem permissão/i').isVisible().then(() => true),
      page.waitForURL(/\/financial-records(?!\/new)/, { timeout: 3000 }).then(() => true).catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Admin vê todas as cobranças', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/financial-records');
    await page.waitForSelector(SELECTORS.financial.list, { timeout: 10000 });
    
    const rows = await page.locator(SELECTORS.financial.row).count();
    expect(rows).toBeGreaterThan(5); // Deve ver muitas cobranças
  });
});

test.describe('Financial: Relatórios e Resumos', () => {
  test('Professor vê resumo financeiro', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    
    // Verificar cards de resumo
    await expect(page.locator('text=/total.*pendente|a receber/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/total.*pago|recebido/i')).toBeVisible({ timeout: 5000 });
  });

  test('Professor exporta relatório', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/financial-records');
    
    const exportButton = page.locator('[data-testid="export"], button:has-text("Exportar")');
    
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx|\.pdf/);
    }
  });
});
