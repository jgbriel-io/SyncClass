import { test } from '@playwright/test';

const users = [
  { email: 'admin@test.com', password: 'admin123', role: 'admin' },
  { email: 'professor1@test.com', password: 'prof123', role: 'teacher' },
  { email: 'aluno1@test.com', password: 'aluno123', role: 'student' },
];

for (const user of users) {
  test(`Login: ${user.role} (${user.email})`, async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log(`\n✅ ${user.role}: ${url}\n`);
    await page.screenshot({ path: `debug-${user.role}.png` });
  });
}
