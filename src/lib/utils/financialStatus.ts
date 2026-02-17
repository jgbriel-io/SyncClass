/**
 * Utilitários centralizados para status financeiro.
 * Evita duplicação e garante consistência em toda a aplicação.
 */

export type FinancialStatus = "pago" | "pendente" | "atrasado" | "validando" | "abonado" | "extornado" | "cancelado";

/** Verifica se due_date (YYYY-MM-DD) já passou (locale-safe) */
export function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T12:00:00");
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Calcula o status real de uma cobrança a partir de due_date e comprovante.
 * O banco guarda "pendente"; "atrasado" é derivado de due_date < hoje.
 * Se houver comprovante pendente, mostra "aguardando_confirmacao".
 * Status finais (pago, abonado, extornado, cancelado) não mudam.
 */
export function getFinancialActualStatus(record: {
  status: string | null;
  due_date: string;
  payment_proof_status?: string | null;
}): FinancialStatus {
  // Status finais que não mudam
  if (record.status === "pago") return "pago";
  if (record.status === "abonado") return "abonado";
  if (record.status === "extornado") return "extornado";
  if (record.status === "cancelado") return "cancelado";
  
  // Se tem comprovante pendente, mostra "validando"
  if (record.payment_proof_status === "pending") {
    return "validando";
  }
  
  // Status pendente pode virar atrasado baseado na data
  return isOverdue(record.due_date) ? "atrasado" : "pendente";
}
