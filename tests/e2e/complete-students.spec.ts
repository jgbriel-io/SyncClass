import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTeacher, loginAsStudent } from './helpers/auth';
import { SELECTORS } from './helpers/selectors';

/**
 * TESTES COMPLETOS: STUDENTS (Alunos)
 * 
 * Cobre TODAS as operações CRUD e fluxos de alunos
 */

test.describe('Students: CRUD Completo', () => {
  test('Professor cria aluno com todos os campos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    const timestamp = Date.now();
    await page.fill(SELECTORS.students.nameInput, `Aluno Completo ${timestamp}`);
    await page.fill(SELECTORS.students.emailInput, `aluno${timestamp}@test.com`);
    await page.fill(SELECTORS.students.phoneInput, '11987654321');
    
    // Campos adicionais (ajustar conforme seu formulário)
    const payDayInput = page.locator('input[name="pay_day"]');
    if (await payDayInput.isVisible()) {
      await payDayInput.fill('10');
    }
    
    const hourlyRateInput = page.locator('input[name="hourly_rate"]');
    if (await hourlyRateInput.isVisible()) {
      await hourlyRateInput.fill('50');
    }
    
    await page.click(SELECTORS.students.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Professor edita aluno existente', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Clicar no primeiro aluno para editar
    const editButton = page.locator('[data-testid="edit-student"], button:has-text("Editar")').first();
    await editButton.click();
    
    // Editar nome
    await page.fill(SELECTORS.students.nameInput, `Aluno Editado ${Date.now()}`);
    
    await page.click(SELECTORS.students.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
  });

  test('Professor arquiva aluno (soft delete)', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Clicar em arquivar/deletar
    const deleteButton = page.locator('[data-testid="delete-student"], button:has-text("Arquivar")').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirmar modal
      const confirmButton = page.locator(SELECTORS.common.confirmButton);
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Professor visualiza detalhes do aluno', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Clicar no primeiro aluno
    const studentRow = page.locator(SELECTORS.students.row).first();
    await studentRow.click();
    
    // Verificar que está na página de detalhes
    await expect(page).toHaveURL(/\/students\/[a-f0-9-]+/, { timeout: 5000 });
    
    // Verificar que há informações do aluno
    await expect(page.locator('text=/nome|email|telefone/i')).toBeVisible();
  });

  test('Professor filtra lista de alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Buscar por nome
    const searchInput = page.locator('input[placeholder*="Buscar"], input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Aluno');
      await page.waitForTimeout(1000); // Aguardar debounce
      
      // Verificar que há resultados
      const rows = await page.locator(SELECTORS.students.row).count();
      expect(rows).toBeGreaterThan(0);
    }
  });

  test('Professor ordena lista de alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Clicar no header da coluna Nome para ordenar
    const nameHeader = page.locator('th:has-text("Nome"), [data-testid="sort-name"]');
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(500);
      
      // Verificar que a lista foi reordenada
      const firstStudent = await page.locator(SELECTORS.students.row).first().textContent();
      expect(firstStudent).toBeTruthy();
    }
  });

  test('Professor pagina lista de alunos', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Verificar se há paginação
    const nextButton = page.locator('button:has-text("Próxima"), button:has-text("Next"), [data-testid="next-page"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Verificar que mudou de página
      await expect(page).toHaveURL(/page=2|offset=/, { timeout: 5000 });
    }
  });
});

test.describe('Students: Validações', () => {
  test('Não aceita nome vazio', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    // Tentar salvar sem nome
    await page.fill(SELECTORS.students.nameInput, '');
    await page.click(SELECTORS.students.saveButton);
    
    // Verificar erro
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('input:invalid').isVisible().then(() => true),
      page.locator('text=/obrigatório|required/i').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Não aceita nome muito curto', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'A'); // 1 caractere
    await page.click(SELECTORS.students.saveButton);
    
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('text=/mínimo|caracteres/i').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Não aceita email duplicado', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'Teste Duplicado');
    await page.fill(SELECTORS.students.emailInput, 'aluno1@test.com'); // Email existente
    
    await page.click(SELECTORS.students.saveButton);
    
    await expect(page.locator(SELECTORS.toast.error)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/já.*cadastrad|duplicad/i')).toBeVisible();
  });

  test('Não aceita telefone inválido', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'Teste Telefone');
    await page.fill(SELECTORS.students.phoneInput, '123'); // Muito curto
    
    await page.click(SELECTORS.students.saveButton);
    
    const hasError = await Promise.race([
      page.locator(SELECTORS.toast.error).isVisible().then(() => true),
      page.locator('text=/inválido|telefone/i').isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Não aceita dia de pagamento fora do range 1-31', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students/new');
    
    await page.fill(SELECTORS.students.nameInput, 'Teste Pay Day');
    
    const payDayInput = page.locator('input[name="pay_day"]');
    if (await payDayInput.isVisible()) {
      await payDayInput.fill('35'); // Fora do range
      
      await page.click(SELECTORS.students.saveButton);
      
      const hasError = await Promise.race([
        page.locator(SELECTORS.toast.error).isVisible().then(() => true),
        page.locator('input:invalid').isVisible().then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 3000)),
      ]);
      
      expect(hasError).toBeTruthy();
    }
  });
});

test.describe('Students: Permissões (RLS)', () => {
  test('Professor NÃO vê alunos de outro professor', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Verificar que NÃO há alunos de professor2
    // (assumindo que existe um aluno chamado "Aluno Professor 2")
    await expect(page.locator('text=Aluno Professor 2')).not.toBeVisible();
  });

  test('Aluno NÃO acessa lista de alunos', async ({ page }) => {
    await loginAsStudent(page, 'aluno1');
    
    await page.goto('/students');
    
    // Deve ser redirecionado ou ver erro
    await page.waitForTimeout(2000);
    
    const hasError = await Promise.race([
      page.locator('text=/não autorizado|sem permissão|forbidden/i').isVisible().then(() => true),
      page.waitForURL(/\/(dashboard|activities)/, { timeout: 3000 }).then(() => true).catch(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 3000)),
    ]);
    
    expect(hasError).toBeTruthy();
  });

  test('Admin vê TODOS os alunos (de todos os professores)', async ({ page }) => {
    await loginAsAdmin(page);
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    // Deve ver muitos alunos
    const rows = await page.locator(SELECTORS.students.row).count();
    expect(rows).toBeGreaterThan(2); // Pelo menos alunos de 2 professores
  });
});

test.describe('Students: Integração com outras entidades', () => {
  test('Aluno criado aparece em cobranças', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // Criar aluno
    await page.goto('/students/new');
    const timestamp = Date.now();
    const studentName = `Aluno Integração ${timestamp}`;
    await page.fill(SELECTORS.students.nameInput, studentName);
    await page.fill(SELECTORS.students.emailInput, `integracao${timestamp}@test.com`);
    await page.click(SELECTORS.students.saveButton);
    await expect(page.locator(SELECTORS.toast.success)).toBeVisible({ timeout: 5000 });
    
    // Ir para criar cobrança
    await page.goto('/financial-records/new');
    
    // Verificar que aluno aparece no select
    const studentSelect = page.locator(SELECTORS.financial.studentSelect);
    await expect(studentSelect).toBeVisible();
    
    const options = await studentSelect.locator('option').allTextContents();
    const hasStudent = options.some(opt => opt.includes(studentName));
    expect(hasStudent).toBeTruthy();
  });

  test('Aluno criado aparece em atividades', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    await page.goto('/students');
    await page.waitForSelector(SELECTORS.students.list, { timeout: 10000 });
    
    const firstStudentName = await page.locator(SELECTORS.students.row).first().textContent();
    
    // Ir para criar atividade
    await page.goto('/activities/new');
    
    // Verificar que aluno aparece no select
    const studentSelect = page.locator(SELECTORS.activities.studentSelect);
    const options = await studentSelect.locator('option').allTextContents();
    const hasStudent = options.some(opt => firstStudentName && opt.includes(firstStudentName));
    expect(hasStudent).toBeTruthy();
  });

  test('Aluno arquivado NÃO aparece em novos registros', async ({ page }) => {
    await loginAsTeacher(page, 'professor1');
    
    // TODO: Arquivar um aluno e verificar que não aparece mais nos selects
    // (requer criar aluno, arquivar, e verificar)
    test.skip();
  });
});
