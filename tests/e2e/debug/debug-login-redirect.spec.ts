import { test, expect } from '@playwright/test';

test('Debug: Verificar redirecionamento após login', async ({ page }) => {
  // Capturar logs do console
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
  });
  
  // Capturar erros de rede
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  await page.goto('/login');
  
  // Preencher e submeter
  await page.fill('#email', 'professor1@test.com');
  await page.fill('#password', 'prof123');
  
  console.log('\n🔐 Fazendo login...\n');
  console.log(`URL antes do click: ${page.url()}\n`);
  
  // Clicar no botão
  await page.click('button[type="submit"]');
  
  // Aguardar um pouco para ver o que acontece
  await page.waitForTimeout(5000);
  
  // Ver URL final
  const finalUrl = page.url();
  console.log(`\n✅ URL após login: ${finalUrl}\n`);
  
  // Tirar screenshot
  await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
  
  // Verificar se há erros visíveis
  const errorMessages = await page.locator('[role="alert"], .error, .alert-error, .text-red-500, .text-destructive').all();
  if (errorMessages.length > 0) {
    console.log(`\n⚠️  Encontrados ${errorMessages.length} elementos de erro:\n`);
    for (const error of errorMessages) {
      const text = await error.textContent();
      if (text && text.trim()) {
        console.log(`  - ${text.trim()}\n`);
      }
    }
  } else {
    console.log('\n✅ Nenhum erro visível na página\n');
  }
  
  // Verificar elementos visíveis na página
  const h1 = await page.locator('h1').first().textContent().catch(() => 'N/A');
  const h2 = await page.locator('h2').first().textContent().catch(() => 'N/A');
  
  console.log(`\n📄 Conteúdo da página:`);
  console.log(`  - H1: ${h1}`);
  console.log(`  - H2: ${h2}\n`);
});
