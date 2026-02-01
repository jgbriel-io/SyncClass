/**
 * Utilitários para lógica de horário de aulas.
 * Usado para: botão Avaliar (liberar só após fim da aula), status no dashboard, etc.
 */

export interface ClassTimeInput {
  class_date: string;
  start_at: string | null;
  end_at: string | null;
}

/** Fim do dia em UTC para uma data ISO (YYYY-MM-DD) */
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr + "T23:59:59.999");
  return d;
}

/**
 * Retorna true se a aula ainda não pode ser avaliada (botão deve ficar bloqueado).
 * Libera só quando a hora de fim da aula já passou.
 * - Com end_at: bloqueado até now >= end_at
 * - Sem end_at: usa fim do class_date (23:59:59)
 * - Data futura: sempre bloqueado
 */
export function isClassEvaluationBlocked(item: ClassTimeInput): boolean {
  const now = new Date();
  const classDate = new Date(item.class_date + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  classDate.setHours(0, 0, 0, 0);

  if (classDate > today) return true; // data futura
  if (classDate < today) return false; // data passada, pode avaliar

  // mesmo dia
  const effectiveEnd = item.end_at ? new Date(item.end_at) : endOfDay(item.class_date);
  return now < effectiveEnd;
}

/**
 * Status da aula para exibição (dashboard, lista de aulas, etc.).
 * Considera class_date e start_at/end_at: Agendada, Em andamento, Avaliação pendente, Concluída.
 */
export function getClassStatusWithTime(item: ClassTimeInput & { attendance?: boolean | null }): {
  label: string;
  variant: "success" | "info" | "warning";
} {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const classDate = new Date(item.class_date + "T12:00:00");
  classDate.setHours(0, 0, 0, 0);

  if (item.attendance != null) return { label: "Concluída", variant: "success" };
  if (classDate > today) return { label: "Agendada", variant: "info" };

  const startAt = item.start_at ? new Date(item.start_at) : null;
  const endAt = item.end_at ? new Date(item.end_at) : null;

  if (startAt && startAt > now) return { label: "Agendada", variant: "info" };
  if (endAt && now < endAt) return { label: "Em andamento", variant: "info" };

  return { label: "Avaliação pendente", variant: "warning" };
}
