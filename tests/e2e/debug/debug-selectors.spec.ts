import { test } from '@playwright/test';
import { login } from './helpers/auth';

test('Debug: Mapear seletores reais da aplicação', async ({ page }) => {
  await login(page, 'professor1@test.com', 'prof123');
  await page.waitForTimeout(2000);

  await page.goto('/teacher/students', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'debug-students-page.png', fullPage: true });

  const html = await page.content();
  console.log('\n=== HTML DA PÁGINA ===');
  console.log(html.substring(0, 3000));
});
