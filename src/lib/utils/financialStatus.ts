/**
 * Utilitários centralizados para status financeiro.
 * Evita duplicação e garante consistência em toda a aplicação.
 */

export type FinancialStatus = "pago" | "pendente" | "atrasado";

/** Verifica se due_date (YYYY-MM-DD) já passou (locale-safe) */
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T12:00:00");
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Calcula o status real de uma cobrança a partir de due_date.
 * O banco guarda "pendente"; "atrasado" é derivado de due_date < hoje.
 */
export function getFinancialActualStatus(record: {
  status: string | null;
  due_date: string;
}): FinancialStatus {
  if (record.status === "pago") return "pago";
  return isOverdue(record.due_date) ? "atrasado" : "pendente";
}
