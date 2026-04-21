import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * Foco: Validar correções do Security Audit
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout por teste
  timeout: 30 * 1000,
  
  // Configuração de expect
  expect: {
    timeout: 5000,
  },
  
  // Executar testes em paralelo
  fullyParallel: true,
  
  // Falhar build se houver testes com .only
  forbidOnly: !!process.env.CI,
  
  // Retry em caso de falha (útil em CI)
  retries: process.env.CI ? 2 : 0,
  
  // Workers (testes em paralelo)
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Configurações compartilhadas
  use: {
    // Base URL da aplicação
    baseURL: 'http://localhost:8080',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot apenas em falhas
    screenshot: 'only-on-failure',
    
    // Vídeo apenas em falhas
    video: 'retain-on-failure',
    
    // Timeout para ações
    actionTimeout: 10 * 1000,
    
    // Timeout para navegação
    navigationTimeout: 15 * 1000,
    
  },

  // Projetos (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Descomente para testar em outros browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Dev server (inicia automaticamente se não estiver rodando)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true, // Mudado para true - reutiliza servidor se já estiver rodando
    timeout: 120 * 1000,
  },
});
