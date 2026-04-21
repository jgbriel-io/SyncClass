import { Page } from '@playwright/test';

/**
 * Helper para autenticação nos testes E2E
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
}

// Usuários de teste (ajustar conforme seu banco de dados)
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin' as const,
  },
  professor1: {
    email: 'professor1@test.com',
    password: 'prof123',
    role: 'teacher' as const,
  },
  professor2: {
    email: 'professor2@test.com',
    password: 'prof123',
    role: 'teacher' as const,
  },
  aluno1: {
    email: 'aluno1@test.com',
    password: 'aluno123',
    role: 'student' as const,
  },
  aluno2: {
    email: 'aluno2@test.com',
    password: 'aluno123',
    role: 'student' as const,
  },
};

/**
 * Faz login na aplicação
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  // Preencher formulário usando id (não name)
  await page.fill('#email', email);
  await page.fill('#password', password);
  
  // Submeter
  await page.click('button[type="submit"]');
  
  // Aguardar um pouco para o login processar
  await page.waitForTimeout(3000);
  
  // Se ainda estiver em /login, tentar navegar manualmente para home
  if (page.url().includes('/login')) {
    await page.goto('/');
    await page.waitForTimeout(1000);
  }
}

/**
 * Faz login como admin
 */
export async function loginAsAdmin(page: Page) {
  await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
}

/**
 * Faz login como professor
 */
export async function loginAsTeacher(page: Page, teacherKey: 'professor1' | 'professor2' = 'professor1') {
  const teacher = TEST_USERS[teacherKey];
  await login(page, teacher.email, teacher.password);
}

/**
 * Faz login como aluno
 */
export async function loginAsStudent(page: Page, studentKey: 'aluno1' | 'aluno2' = 'aluno1') {
  const student = TEST_USERS[studentKey];
  await login(page, student.email, student.password);
}

/**
 * Faz logout
 */
export async function logout(page: Page) {
  // Ajustar conforme seu botão de logout
  await page.click('[data-testid="logout-button"], button:has-text("Sair")');
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Verifica se está logado
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Ajustar conforme elementos que só aparecem quando logado
    await page.waitForSelector('[data-testid="user-menu"], [data-testid="logout-button"]', { 
      timeout: 2000 
    });
    return true;
  } catch {
    return false;
  }
}
