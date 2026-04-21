/**
 * Seletores centralizados para os testes E2E
 * Facilita manutenção quando a UI muda
 */

export const SELECTORS = {
  // Auth
  auth: {
    emailInput: 'input[name="email"], input[type="email"]',
    passwordInput: 'input[name="password"], input[type="password"]',
    submitButton: 'button[type="submit"]',
    logoutButton: '[data-testid="logout-button"], button:has-text("Sair")',
  },

  // Students
  students: {
    list: '[data-testid="students-list"]',
    row: '[data-testid="student-row"]',
    newButton: '[data-testid="new-student-button"], button:has-text("Novo Aluno")',
    nameInput: 'input[name="name"]',
    emailInput: 'input[name="email"]',
    phoneInput: 'input[name="phone"]',
    saveButton: 'button[type="submit"], button:has-text("Salvar")',
  },

  // Teachers
  teachers: {
    list: '[data-testid="teachers-list"]',
    row: '[data-testid="teacher-row"]',
    newButton: '[data-testid="new-teacher-button"], button:has-text("Novo Professor")',
    nameInput: 'input[name="name"]',
    emailInput: 'input[name="email"]',
    pixInput: 'input[name="pix_key"]',
    saveButton: 'button[type="submit"], button:has-text("Salvar")',
  },

  // Financial Records
  financial: {
    list: '[data-testid="financial-list"]',
    row: '[data-testid="financial-row"]',
    newButton: '[data-testid="new-financial-button"], button:has-text("Nova Cobrança")',
    studentSelect: 'select[name="student_id"]',
    amountInput: 'input[name="amount"]',
    dueDateInput: 'input[name="due_date"]',
    descriptionInput: 'input[name="description"], textarea[name="description"]',
    saveButton: 'button[type="submit"], button:has-text("Salvar")',
    markAsPaidButton: '[data-testid="mark-as-paid"], button:has-text("Marcar como Pago")',
  },

  // Activities
  activities: {
    list: '[data-testid="activities-list"]',
    row: '[data-testid="activity-row"]',
    newButton: '[data-testid="new-activity-button"], button:has-text("Nova Atividade")',
    studentSelect: 'select[name="student_id"]',
    titleInput: 'input[name="title"]',
    descriptionInput: 'textarea[name="description"]',
    dueDateInput: 'input[name="due_date"]',
    saveButton: 'button[type="submit"], button:has-text("Salvar")',
    deliverButton: '[data-testid="deliver-button"], button:has-text("Entregar")',
    statusBadge: '[data-testid="activity-status"]',
  },

  // Class Logs
  classLogs: {
    list: '[data-testid="class-logs-list"]',
    row: '[data-testid="class-log-row"]',
    newButton: '[data-testid="new-class-log-button"], button:has-text("Registrar Aula")',
    studentSelect: 'select[name="student_id"]',
    dateInput: 'input[name="class_date"]',
    notesInput: 'textarea[name="notes"]',
    gradeInput: 'input[name="grade"]',
    saveButton: 'button[type="submit"], button:has-text("Salvar")',
  },

  // Toast/Notifications
  toast: {
    success: '[data-testid="toast-success"], .toast-success, [role="status"]:has-text("sucesso")',
    error: '[data-testid="toast-error"], .toast-error, [role="alert"]',
    message: '[data-testid="toast-message"]',
  },

  // Common
  common: {
    loading: '[data-testid="loading"], .loading, [aria-busy="true"]',
    modal: '[data-testid="modal"], [role="dialog"]',
    confirmButton: '[data-testid="confirm-button"], button:has-text("Confirmar")',
    cancelButton: '[data-testid="cancel-button"], button:has-text("Cancelar")',
    deleteButton: '[data-testid="delete-button"], button:has-text("Excluir")',
  },
};
