/**
 * Utilitários para lógica de horário de aulas.
 * Usado para: botão Avaliar (liberar só após fim da aula), status no dashboard, etc.
 */

interface ClassLogSlot {
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
}

export const CLASS_OVERLAP_MESSAGE =
  "Já existe outra aula neste horário para este professor. Escolha outro intervalo.";

export function isClassOverlapError(error: unknown): boolean {
  const err = error as Error & { code?: string };
  const msg = (err?.message || "").toLowerCase();
  return (
    (err as { code?: string })?.code === "23P01" ||
    msg.includes("neste horário") ||
    msg.includes("sobreposição") ||
    msg.includes("sobrepõem") ||
    msg.includes("overlap") ||
    msg.includes("class_logs_no_overlap") ||
    msg.includes("exclusion constraint") ||
    msg.includes("conflicting key") ||
    msg.includes("agendada em") ||
    msg.includes("duas aulas")
  );
}

export function validateNoOverlap(
  items: Array<{ classLog: ClassLogSlot }>
): void {
  if (items.length <= 1) return;
  const byDate = new Map<string, Array<{ classLog: ClassLogSlot }>>();
  items.forEach((item) => {
    const date = item.classLog.class_date;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(item);
  });
  byDate.forEach((dayItems, date) => {
    if (dayItems.length <= 1) return;
    const sorted = dayItems.sort((a, b) =>
      (a.classLog.start_at || "").localeCompare(b.classLog.start_at || "")
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i].classLog;
      const next = sorted[i + 1].classLog;
      if ((current.end_at || "") > (next.start_at || "")) {
        const [yr, mo, dy] = date.split("-");
        throw new Error(
          `Aulas se sobrepõem no dia ${dy}/${mo}/${yr}: ${current.start_at}-${current.end_at} e ${next.start_at}-${next.end_at}`
        );
      }
    }
  });
}

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
  const effectiveEnd = item.end_at
    ? new Date(item.end_at)
    : endOfDay(item.class_date);
  return now < effectiveEnd;
}

/**
 * Status da aula para exibição (dashboard, lista de aulas, etc.).
 * Considera class_date e start_at/end_at: Agendada, Em andamento, Pendente, Concluída.
 */
export function getClassStatusWithTime(
  item: ClassTimeInput & { attendance?: boolean | null }
): {
  label: string;
  variant: "success" | "info" | "warning";
} {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const classDate = new Date(item.class_date + "T12:00:00");
  classDate.setHours(0, 0, 0, 0);

  if (item.attendance != null)
    return { label: "Concluída", variant: "success" };
  if (classDate > today) return { label: "Agendada", variant: "info" };

  const startAt = item.start_at ? new Date(item.start_at) : null;
  const endAt = item.end_at ? new Date(item.end_at) : null;

  if (startAt && startAt > now) return { label: "Agendada", variant: "info" };
  if (endAt && now < endAt) return { label: "Em andamento", variant: "info" };

  return { label: "Pendente", variant: "warning" };
}

/**
 * Status da aula quando só temos class_date e attendance (ex.: extrato / view).
 * Usado em UnifiedStatementCard e qualquer lista que não tenha start_at/end_at.
 */
export function getClassStatusFromDate(
  class_date: string,
  attendance: boolean | null
): { label: string; variant: "success" | "info" | "warning" } {
  if (attendance != null) return { label: "Concluída", variant: "success" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(class_date + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  if (d > today) return { label: "Agendada", variant: "info" };
  return { label: "Pendente", variant: "warning" };
}
