import { test, expect } from '@playwright/test';

test('Debug: Verificar página de login', async ({ page }) => {
  await page.goto('/login');
  
  // Aguardar a página carregar
  await page.waitForLoadState('networkidle');
  
  // Tirar screenshot
  await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
  
  // Listar todos os inputs da página
  const inputs = await page.locator('input').all();
  console.log(`\n📋 Total de inputs encontrados: ${inputs.length}\n`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const id = await input.getAttribute('id');
    const placeholder = await input.getAttribute('placeholder');
    
    console.log(`Input ${i + 1}:`);
    console.log(`  - type: ${type}`);
    console.log(`  - name: ${name}`);
    console.log(`  - id: ${id}`);
    console.log(`  - placeholder: ${placeholder}\n`);
  }
  
  // Verificar se existe botão de submit
  const buttons = await page.locator('button').all();
  console.log(`\n🔘 Total de botões encontrados: ${buttons.length}\n`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const type = await button.getAttribute('type');
    const text = await button.textContent();
    
    console.log(`Botão ${i + 1}:`);
    console.log(`  - type: ${type}`);
    console.log(`  - text: ${text?.trim()}\n`);
  }
  
  // Verificar URL atual
  console.log(`\n🌐 URL atual: ${page.url()}\n`);
});
